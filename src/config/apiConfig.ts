// آدرس پایه‌ی بک‌اند از متغیر محیطی خونده می‌شود
// در توسعه از .env و در بیلد نهایی از .env.production خوانده می‌شود
export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:8080";

// آدرس وب‌سوکت از همان آدرس پایه ساخته می‌شود
export const WS_URL: string = `${API_URL}/ws-chat`;