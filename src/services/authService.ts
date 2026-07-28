import { API_URL as API } from "../config/apiConfig";

async function handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "خطایی رخ داد.");
    }
    return data;
}

export async function register(payload: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
}) {
    const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    return handleResponse(response); // { message, identifier }
}

export async function requestOtp(identifier: string) {
    const response = await fetch(`${API}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
    });
    return handleResponse(response);
}

export async function verifyOtp(identifier: string, code: string) {
    const response = await fetch(`${API}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code })
    });
    return handleResponse(response); // AuthResponse
}

export async function loginWithPassword(identifier: string, password: string) {
    const response = await fetch(`${API}/api/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
    });
    return handleResponse(response); // AuthResponse
}