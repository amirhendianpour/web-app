import type { MessageStatus } from "./ChatMessage";

export interface Receipt {

    messageId: string;

    recipient: string;

    status: MessageStatus;

}