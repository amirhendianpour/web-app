import React, { useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import MessageInput from "./MessageInput";
import { compareByTime } from "../utils/sortMessages";
import type { CallKind } from "../types/Call";
import { useUserDirectory } from '../context/UserDirectoryContext';
import Avatar from './Avatar';

interface Message {
  id: string;
  sender?: string;
  recipient?: string;
  content?: string;
  messageType?: "TEXT" | "IMAGE";
  fileUrl?: string;
  status?: "SENT" | "DELIVERED" | "READ";
  timestamp?: string;
}

interface ChatAreaProps {
  activeChat: string | null;
  onCallClick: (callType: CallKind) => void;
  onBack?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ activeChat, onCallClick, onBack }) => {
  const { getDisplayName, getProfilePicture, ensureLoaded } = useUserDirectory();

  useEffect(() => {
    if (activeChat) ensureLoaded([activeChat]);
  }, [activeChat, ensureLoaded]);

  const {
    messages,
    sendReceipt,
    typingUsers
  } = useWebSocket();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sentReceiptsRef = useRef<Set<string>>(new Set());

  // اسکرول خودکار مثل واتساپ
  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);


  const chatMessages =
    messages
        .filter((msg:Message)=> msg.sender===activeChat || msg.recipient===activeChat)
        .sort(compareByTime);


  // ارسال رسید تحویل فقط برای پیام‌های دریافتی از طرف مقابلِ چت فعال
  useEffect(() => {

    chatMessages.forEach((msg: Message)=>{

      if(
        msg.sender &&
        msg.sender === activeChat &&
        msg.id &&
        !sentReceiptsRef.current.has(msg.id)
      ){

        sendReceipt({
          messageId: msg.id,
          recipient: msg.sender,
          status:"DELIVERED"
        });

        sentReceiptsRef.current.add(msg.id);

      }

    });


  }, [messages, activeChat]);



  const getTick = (status?: string)=>{

    if(status==="READ"){
      return (
        <span className="text-blue-500 text-sm ml-1">
          ✓✓
        </span>
      );
    }


    if(status==="DELIVERED"){
      return (
        <span className="text-gray-400 text-sm ml-1">
          ✓✓
        </span>
      );
    }


    return (
      <span className="text-gray-400 text-sm ml-1">
        ✓
      </span>
    );

  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  };

  return (

    <div
      className="
      flex-1
      flex
      flex-col
      bg-[#efeae2]
      h-full
      "
      dir="rtl"
    >


      {/* Header */}

      <div className="h-16 bg-white border-b flex items-center justify-between px-5 shadow-sm" >
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
          <Avatar
            name={activeChat ? getDisplayName(activeChat) : "?"}
            imageUrl={activeChat ? getProfilePicture(activeChat) : undefined}
            size={40}
            colorSeed={activeChat || undefined}
          />
          <span className="font-bold text-gray-800">
            {activeChat ? getDisplayName(activeChat) : "یک گفتگو انتخاب کنید"}
          </span>
        </div>
        {activeChat && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCallClick("AUDIO")}
              className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition"
              title="تماس صوتی"
            >
              📞
            </button>
            <button
              onClick={() => onCallClick("VIDEO")}
              className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
              title="تماس تصویری"
            >
              🎥
            </button>
          </div>
        )}
      </div>


      {/* Messages */}

      <div
        className="
        flex-1
        overflow-y-auto
        p-5
        space-y-3
        "
      >


        {
          chatMessages.map(
            (msg:Message)=>{


              const mine =
                msg.recipient===activeChat;



              return (

                <div
                  key={msg.id}
                  className={` flex ${mine ?"justify-start" :"justify-end" } `} >

                  <div
                    className={` max-w-xs lg:max-w-md rounded-xl px-4 py-2 shadow
                    ${ mine ? "bg-green-100" : "bg-white" } `} >



                    {
                      msg.messageType==="IMAGE"
                      &&
                      msg.fileUrl
                      &&

                      <img
                        src={msg.fileUrl}
                        className="
                        rounded-lg
                        mb-2
                        max-w-[250px]
                        "
                      />

                    }



                    {
                      msg.content &&
                      <div>
                        {msg.content}
                      </div>
                    }



                    <div
                      className="
                      flex
                      justify-end
                      items-center
                      mt-1
                      "
                    >

                      <span className="text-xs text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>

                      {
                        mine &&
                        getTick(msg.status)
                      }


                    </div>


                  </div>


                </div>


              )

            }
          )
        }


        <div ref={bottomRef}/>

      </div>



      {/* typing indicator */}

      <div
        className="
        h-8
        px-5
        text-gray-500
        text-sm
        italic
        "
      >

        {
          activeChat &&
          typingUsers.includes(activeChat) &&
          `${activeChat} در حال تایپ است...`
        }

      </div>


      {/* Message Input */}

      {activeChat && <MessageInput activeChat={activeChat} />}


    </div>

  );

};


export default ChatArea;