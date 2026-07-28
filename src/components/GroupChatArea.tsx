import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { GroupInfo } from "../services/groupService";
import { compareByTime } from "../utils/sortMessages";
import { useUserDirectory } from '../context/UserDirectoryContext';
import Avatar from "./Avatar";
import GroupInfoModal from "./GroupInfoModal";

interface Props {
    activeGroup: GroupInfo;
    onBack?: () => void;
    onGroupUpdated: (group: GroupInfo) => void;
    onGroupDeleted: (groupId: number) => void;
}

const GroupChatArea: React.FC<Props> = ({ activeGroup, onBack, onGroupUpdated, onGroupDeleted }) => {
    const { getDisplayName, ensureLoaded } = useUserDirectory();
    const { groupMessages, sendGroupMessage } = useWebSocket();
    const chatMessages = groupMessages
        .filter((msg) => msg.groupId === activeGroup.id)
        .sort(compareByTime);

    const senderKey = Array.from(new Set(chatMessages.map(m => m.sender).filter(Boolean))).join(',');
    useEffect(() => {
        if (senderKey) ensureLoaded(senderKey.split(','));
    }, [senderKey, ensureLoaded]);

    const [text, setText] = useState("");
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const username = localStorage.getItem("chat_username") || "";

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [groupMessages]);

    const handleSend = () => {
        if (!text.trim()) return;
        sendGroupMessage(activeGroup.id, text);
        setText("");
    };

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="flex-1 flex flex-col bg-[#efeae2] h-full" dir="rtl">
            {/* Header */}
            <div className="h-16 bg-white border-b flex items-center justify-between px-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="md:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 text-xl"
                            aria-label="بازگشت به لیست"
                        >
                            →
                        </button>
                    )}

                    <button
                        onClick={() => setShowGroupInfo(true)}
                        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition"
                    >
                        <Avatar
                            name={activeGroup.name}
                            imageUrl={activeGroup.imageUrl}
                            size={40}
                            colorSeed={`group-${activeGroup.id}`}
                        />
                        <span className="font-bold text-gray-800">{activeGroup.name}</span>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {chatMessages.map((msg) => {
                    const mine = msg.sender === username;
                    return (
                        <div key={msg.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 shadow ${
                                    mine
                                        ? "bg-green-100 rounded-2xl rounded-tl-none"
                                        : "bg-white rounded-2xl rounded-tr-none"
                                }`}
                            >
                                {!mine && (
                                    <div className="text-xs font-bold text-blue-600 mb-1">
                                        {getDisplayName(msg.sender || '')}
                                    </div>
                                )}
                                <div>{msg.content}</div>
                                <div className="text-xs text-gray-400 mt-1 text-left">
                                    {formatTime(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-100 flex gap-2 items-center">
                <input
                    className="flex-1 p-3 rounded-full border-none focus:ring-2 focus:ring-blue-400 outline-none"
                    placeholder="پیام خود را بنویسید..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition disabled:bg-blue-300"
                >
                    ارسال
                </button>
            </div>

            {showGroupInfo && (
                <GroupInfoModal
                    group={activeGroup}
                    onClose={() => setShowGroupInfo(false)}
                    onGroupUpdated={onGroupUpdated}
                    onGroupDeleted={onGroupDeleted}
                />
            )}
        </div>
    );
};

export default GroupChatArea;