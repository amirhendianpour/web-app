import React, { useState, useRef, useEffect } from "react";

import { uploadMedia } from "../services/uploadService";

import { useWebSocket } from "../context/WebSocketContext";

interface Props {

    activeChat: string;

}

const MessageInput: React.FC<Props> = ({

    activeChat

}) => {

    const {

        sendMessage,

        sendTyping

    } = useWebSocket();

    const [text, setText] = useState("");

    const [file, setFile] = useState<File | null>(null);

    const [isUploading, setIsUploading] = useState(false);

    const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {

        return () => {

            clearTimeout(typingTimeout.current);

            sendTyping(activeChat, false);

        };

    }, [activeChat]);

    const handleTyping = (value: string) => {

        setText(value);

        sendTyping(activeChat, true);

        clearTimeout(typingTimeout.current);

        typingTimeout.current = setTimeout(() => {

            sendTyping(activeChat, false);

        }, 1200);

    };

    const handleSend = async () => {

        if (!text.trim() && !file)
            return;

        clearTimeout(typingTimeout.current);

        sendTyping(activeChat, false);

        if (file) {

            try {

                setIsUploading(true);

                const result = await uploadMedia(file);

                sendMessage(

                    activeChat,

                    text,

                    "IMAGE",

                    result.fileUrl

                );

            } catch (err) {

                console.error("خطا در آپلود فایل:", err);

            } finally {

                setIsUploading(false);

            }

            setFile(null);

        }

        else {

            sendMessage(

                activeChat,

                text,

                "TEXT"

            );

        }

        setText("");

        if (fileInputRef.current)
            fileInputRef.current.value = "";

    };

    return (

        <div className="bg-gray-100">

            {file &&
                <div className="text-sm text-gray-500 px-4 pt-3 bg-gray-100">
                    📷 {file.name}
                </div>
            }

            <div className="p-4 flex gap-2 items-center">

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                        if (e.target.files?.length) {
                            setFile(e.target.files[0]);
                        }
                    }}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2 text-gray-500 hover:text-gray-700 text-xl"
                >
                    📎
                </button>

                <input
                    className="flex-1 p-3 rounded-full border-none focus:ring-2 focus:ring-blue-400 outline-none"
                    value={text}
                    placeholder="پیام خود را بنویسید..."
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSend();
                        }
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={isUploading || (!text.trim() && !file)}
                    className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition disabled:bg-blue-300"
                >
                    {isUploading ? "..." : "ارسال"}
                </button>

            </div>

        </div>

    );

};

export default MessageInput;