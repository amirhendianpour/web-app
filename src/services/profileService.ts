import { API_URL as API } from "../config/apiConfig";
import type { UserProfile, ProfileUpdatePayload } from "../types/Profile";

function getAuthHeaders() {
    const token = localStorage.getItem("chat_token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

async function handleResponse(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "خطایی رخ داد.");
    }
    return data;
}

export async function getMyProfile(): Promise<UserProfile> {
    const response = await fetch(`${API}/api/users/me`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    return handleResponse(response);
}

export async function updateMyProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
    const response = await fetch(`${API}/api/users/me`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
}

export async function uploadMyAvatar(file: File): Promise<UserProfile> {
    const token = localStorage.getItem("chat_token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API}/api/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
    return handleResponse(response);
}