export const getToken = () => localStorage.getItem("chat_token");
export const getUsername = () => localStorage.getItem("chat_username");
export const getDisplayName = () => localStorage.getItem("chat_display_name");

export function saveAuthSession(token: string, username: string, displayName: string) {
    localStorage.setItem("chat_token", token);
    localStorage.setItem("chat_username", username);
    localStorage.setItem("chat_display_name", displayName);
}

export function updateDisplayName(displayName: string) {
    localStorage.setItem("chat_display_name", displayName);
}