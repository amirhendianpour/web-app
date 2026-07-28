export type MessageType = "TEXT" | "IMAGE";

export type MessageStatus =
    | "SENT"
    | "DELIVERED"
    | "READ";

export interface ChatMessage {

    id: string;

    sender: string;

    recipient: string;

    content: string;

    messageType: MessageType;

    fileUrl?: string;

    timestamp?: string;

    status?: MessageStatus;

}