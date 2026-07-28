import React, { createContext, useContext, useRef, useState, ReactNode, useEffect } from "react";

import type { IMessage } from "@stomp/stompjs";
import websocketService from "../services/websocketService";
import type { ChatMessage } from "../types/ChatMessage";
import type { Receipt } from "../types/Receipt";
import type { TypingEvent } from "../types/Typing";
import type { GroupMessage } from "../types/GroupMessage";
import type { GroupUpdateEvent } from "../types/GroupUpdateEvent";
import { generateId } from "../utils/generateId";
import { mergeById } from "../utils/mergeById";
import type { CallSignal } from "../types/Call";

import {
    savePrivateMessage,
    updatePrivateMessageStatus,
    getAllPrivateMessages,
    saveGroupMessage,
    getAllGroupMessages
} from "../db/chatDB";

interface ContextType {
    isConnected:boolean;
    messages:ChatMessage[];
    typingUsers:string[];
    groupMessages:GroupMessage[];
    groupUpdateEvent: GroupUpdateEvent | null;
    connect:(token:string)=>void;
    disconnect:()=>void;
    sendMessage(recipient:string,content:string,messageType:"TEXT"|"IMAGE",fileUrl?:string):void;
    sendTyping:(recipient:string,isTyping:boolean)=>void;
    sendReceipt:(receipt:Receipt)=>void;
    sendGroupMessage:(groupId:string|number,content:string)=>void;
    sendCallSignal:(signal:CallSignal)=>void;
    onCallSignal:(cb:(signal:CallSignal)=>void)=>()=>void;
}

const WebSocketContext=createContext<ContextType|null>(null);

export const WebSocketProvider=({children}:{children:ReactNode})=>{
    const [groupUpdateEvent, setGroupUpdateEvent] = useState<GroupUpdateEvent | null>(null);
    const clientRef=useRef(websocketService);
    const [messages,setMessages]=useState<ChatMessage[]>([]);
    const [typingUsers,setTypingUsers]=useState<string[]>([]);
    const [groupMessages,setGroupMessages]=useState<GroupMessage[]>([]);
    const [isConnected,setIsConnected]=useState(false);
    const connectedRef=useRef(false);

    // یک Map از groupId به subscription، تا هم‌زمان به چند گروه وصل باشیم
    const groupSubscriptionsRef=useRef<Map<number,{unsubscribe:()=>void}>>(new Map());
    const username=localStorage.getItem("chat_username")||"";

    const callListenersRef = useRef<Set<(signal: CallSignal) => void>>(new Set());

    const onCallSignal = (cb: (signal: CallSignal) => void) => {
        callListenersRef.current.add(cb);
        return () => callListenersRef.current.delete(cb);
    };

    const sendCallSignal = (signal: CallSignal) => {
        const client = clientRef.current.getClient();
        if (!client?.connected) return;

        const destinationMap: Record<string, string> = {
            OFFER: "/app/call/offer",
            ANSWER: "/app/call/answer",
            ICE_CANDIDATE: "/app/call/ice-candidate",
            END: "/app/call/end",
            REJECT: "/app/call/reject",
            BUSY: "/app/call/reject"
        };

        client.publish({
            destination: destinationMap[signal.type],
            body: JSON.stringify(signal)
        });
    };

    const connect=(token:string)=>{
        if(connectedRef.current)
            return;

        clientRef.current.connect(token);
        const client=clientRef.current.getClient();
        if(!client)
            return;

        client.onConnect = () => {

            connectedRef.current = true;
            setIsConnected(true);
            console.log("WebSocket connected");

            // ۱. پیام‌های خصوصی — این نباید حذف/جایگزین شده باشه
            client.subscribe("/user/queue/messages", (message: IMessage) => {
                const msg: ChatMessage = JSON.parse(message.body);
                setMessages(prev => {
                    const exists = prev.find(m => m.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });

                savePrivateMessage(msg);

                if (msg.sender !== username) {
                    const receipt: Receipt = {
                        messageId: msg.id,
                        recipient: msg.sender,
                        status: "DELIVERED"
                    };
                    client.publish({
                        destination: "/app/chat/receipt",
                        body: JSON.stringify(receipt)
                    });
                }
            });

            // ۲. رسیدها
            client.subscribe("/user/queue/receipts", (message) => {
                const receipt: Receipt = JSON.parse(message.body);
                setMessages(prev =>
                    prev.map(m => m.id === receipt.messageId ? { ...m, status: receipt.status } : m)
                );
                updatePrivateMessageStatus(receipt.messageId, receipt.status);
            });

            // ۳. تایپینگ
            client.subscribe("/user/queue/typing", (message) => {
                const event: TypingEvent = JSON.parse(message.body);
                if (event.typing) {
                    setTypingUsers(prev => prev.includes(event.sender!) ? prev : [...prev, event.sender!]);
                } else {
                    setTypingUsers(prev => prev.filter(x => x !== event.sender));
                }
            });

            // ۴. پیام‌های آفلاین گروه
            client.subscribe("/user/queue/group-history", (message) => {
                const msg: GroupMessage = JSON.parse(message.body);
                setGroupMessages(prev => {
                    const exists = prev.find(m => m.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });
                saveGroupMessage(msg);
            });

            // ۵. پیام‌های لایو گروه (این جدیده)
            client.subscribe("/user/queue/group-messages", (message: IMessage) => {
                const msg: GroupMessage = JSON.parse(message.body);
                setGroupMessages(prev => {
                    const exists = prev.find(m => m.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });
                saveGroupMessage(msg);
            });

            // ۶. اطلاع اضافه‌شدن به گروه جدید (این هم جدیده)
            client.subscribe("/user/queue/group-updates", (message: IMessage) => {
                const event: GroupUpdateEvent = JSON.parse(message.body);
                setGroupUpdateEvent(event);
            });

            client.subscribe("/user/queue/call", (message) => {
                const signal: CallSignal = JSON.parse(message.body);
                callListenersRef.current.forEach(cb => cb(signal));
            });

            client.publish({
                destination: "/app/group/history",
                body: JSON.stringify({})
            });

        };

        client.onDisconnect=()=>{
            connectedRef.current=false;
            setIsConnected(false);
        };
    };

    const disconnect=()=>{
        connectedRef.current=false;
        clientRef.current.disconnect();
        setIsConnected(false);
        groupSubscriptionsRef.current.clear();
    };

    const sendMessage=(recipient:string,content:string,messageType:"TEXT"|"IMAGE"="TEXT",fileUrl?:string)=>{
        const client=clientRef.current.getClient();
        if(!client?.connected)
            return;

        const msg:ChatMessage={
            id:generateId(),
            sender:username,
            recipient,
            content,
            messageType,
            fileUrl,
            timestamp:new Date().toISOString(),
            status:"SENT"
        };

        setMessages(prev=>[...prev,msg]);
        savePrivateMessage(msg);

        client.publish({
            destination:"/app/chat",
            body:JSON.stringify(msg)
        });
    };

    const sendTyping=(recipient:string,isTyping:boolean)=>{
        const client=clientRef.current.getClient();
        if(!client?.connected)
            return;

        client.publish({
            destination:"/app/chat/typing",
            body:JSON.stringify({
                recipient,
                typing:isTyping
            })
        });
    };

    const sendReceipt=(receipt:Receipt)=>{
        const client=clientRef.current.getClient();
        if(!client?.connected)
            return;
        client.publish({
            destination:"/app/chat/receipt",
            body:JSON.stringify(receipt)
        });
    };

    const sendGroupMessage = (groupId: string | number, content: string) => {
        const client = clientRef.current.getClient();
        if (!client?.connected)
            return;

        const msg: GroupMessage = {
            id: generateId(),
            groupId: Number(groupId),
            sender: username,
            content,
            timestamp: new Date().toISOString()
        };

        // چون بک‌اند دیگه پیام رو به خود فرستنده برنمی‌گردونه، همینجا نمایشش می‌دیم
        setGroupMessages(prev => [...prev, msg]);
        saveGroupMessage(msg);

        client.publish({
            destination: "/app/group/chat",
            body: JSON.stringify({
                id: msg.id,
                groupId: msg.groupId,
                content: msg.content
            })
        });
    };

    useEffect(() => {
        if (!username) return;

        (async () => {
            const storedPrivate = await getAllPrivateMessages();
            setMessages(prev => mergeById(prev, storedPrivate));

            const storedGroup = await getAllGroupMessages();
            setGroupMessages(prev => mergeById(prev, storedGroup));
        })();
    }, [username]);

    return(
        <WebSocketContext.Provider
            value={{
                isConnected,
                messages,
                typingUsers,
                groupUpdateEvent,
                groupMessages,
                connect,
                disconnect,
                sendMessage,
                sendTyping,
                sendReceipt,
                sendGroupMessage,
                sendCallSignal,
                onCallSignal
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket=()=>{
    const context=useContext(WebSocketContext);
    if(!context)
        throw new Error("WebSocketContext");
    return context;
};