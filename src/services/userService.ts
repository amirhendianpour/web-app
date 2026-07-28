import type { UserInfo } from "../types/UserInfo";

import { API_URL as API } from "../config/apiConfig";

function getAuthHeaders() {
    const token = localStorage.getItem("chat_token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

export async function lookupUser(identifier: string): Promise<UserInfo> {
    const response = await fetch(`${API}/api/users/lookup?identifier=${encodeURIComponent(identifier)}`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "کاربری با این مشخصات یافت نشد.");
    }

    return await response.json();
}

export async function getUsersInfo(usernames: string[]): Promise<UserInfo[]> {
    if (usernames.length === 0) return [];

    const response = await fetch(`${API}/api/users/batch-info`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ usernames })
    });

    if (!response.ok) return [];
    return await response.json();
}