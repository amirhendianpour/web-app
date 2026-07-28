import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { ChatMessage } from '../types/ChatMessage';
import type { GroupMessage } from '../types/GroupMessage';
import { compareByTime } from '../utils/sortMessages';

interface StoredPrivateMessage extends ChatMessage {
    chatPartner: string; // طرف مقابل مکالمه (برای ایندکس‌گذاری)
}

interface ChatDBSchema extends DBSchema {
    privateMessages: {
        key: string;
        value: StoredPrivateMessage;
        indexes: { 'by-partner': string };
    };
    groupMessages: {
        key: string;
        value: GroupMessage;
        indexes: { 'by-group': number };
    };
}

let dbPromise: Promise<IDBPDatabase<ChatDBSchema>> | null = null;
let currentDbUsername: string | null = null;

function getDB(myUsername: string) {
    // اگر کاربر عوض شده (لاگ‌اوت و لاگین با یوزر دیگه روی همین مرورگر)، اتصال قبلی رو دور بریز
    if (dbPromise && currentDbUsername !== myUsername) {
        dbPromise = null;
    }
    currentDbUsername = myUsername;

    if (!dbPromise) {
        dbPromise = openDB<ChatDBSchema>(`chat-history-${myUsername}`, 1, {
            upgrade(db) {
                const privateStore = db.createObjectStore('privateMessages', { keyPath: 'id' });
                privateStore.createIndex('by-partner', 'chatPartner');

                const groupStore = db.createObjectStore('groupMessages', { keyPath: 'id' });
                groupStore.createIndex('by-group', 'groupId');
            }
        });
    }
    return dbPromise;
}

// همیشه یوزرنیم رو مستقیم از localStorage بخون، نه از یک closure قدیمی
function getMyUsername(): string {
    return localStorage.getItem('chat_username') || '';
}

export async function savePrivateMessage(msg: ChatMessage) {
    const myUsername = getMyUsername();
    if (!myUsername) return;
    const db = await getDB(myUsername);
    const chatPartner = msg.sender === myUsername ? msg.recipient : msg.sender;
    await db.put('privateMessages', { ...msg, chatPartner });
}

export async function updatePrivateMessageStatus(messageId: string, status: ChatMessage['status']) {
    const myUsername = getMyUsername();
    if (!myUsername) return;
    const db = await getDB(myUsername);
    const existing = await db.get('privateMessages', messageId);
    if (existing) {
        await db.put('privateMessages', { ...existing, status });
    }
}

export async function getAllPrivateMessages(): Promise<ChatMessage[]> {
    const myUsername = getMyUsername();
    if (!myUsername) return [];
    const db = await getDB(myUsername);
    const all = await db.getAll('privateMessages');
    return all.sort(compareByTime);
}

export async function saveGroupMessage(msg: GroupMessage) {
    const myUsername = getMyUsername();
    if (!myUsername) return;
    const db = await getDB(myUsername);
    await db.put('groupMessages', msg);
}

export async function getAllGroupMessages(): Promise<GroupMessage[]> {
    const myUsername = getMyUsername();
    if (!myUsername) return [];
    const db = await getDB(myUsername);
    const all = await db.getAll('groupMessages');
    return all.sort(compareByTime);
}

// موقع logout صدا زده بشه تا اتصال به DB کاربر قبلی نگه داشته نشه
export function resetChatDBConnection() {
    dbPromise = null;
    currentDbUsername = null;
}