import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { getUsersInfo } from "../services/userService";
import type { UserInfo } from "../types/UserInfo";

interface UserDirectoryContextType {
    // نامی که باید نمایش داده شود؛ تا وقتی اطلاعات لود نشده، خودِ username موقتاً برگردانده می‌شود
    getDisplayName: (username: string) => string;
    getProfilePicture: (username: string) => string | undefined;
    // اطمینان از اینکه اطلاعات این username ها لود شده یا در حال لود شدن است
    ensureLoaded: (usernames: string[]) => void;
    // وقتی از قبل اطلاعات یک کاربر را داریم (مثلاً نتیجه‌ی lookup)، مستقیم در کش قرار می‌دهیم
    setUserInfo: (info: UserInfo) => void;
}

const UserDirectoryContext = createContext<UserDirectoryContextType | null>(null);

export const UserDirectoryProvider = ({ children }: { children: ReactNode }) => {
    const [directory, setDirectory] = useState<Map<string, UserInfo>>(new Map());
    const directoryRef = useRef<Map<string, UserInfo>>(new Map());
    const pendingRef = useRef<Set<string>>(new Set());
    const inFlightRef = useRef(false);

    useEffect(() => {
        directoryRef.current = directory;
    }, [directory]);

    const flush = useCallback(async () => {
        if (inFlightRef.current || pendingRef.current.size === 0) return;
        inFlightRef.current = true;

        const usernames = Array.from(pendingRef.current);
        pendingRef.current.clear();

        try {
            const results = await getUsersInfo(usernames);
            setDirectory(prev => {
                const next = new Map(prev);
                results.forEach(u => next.set(u.username, u));
                return next;
            });
        } catch (err) {
            console.error("خطا در دریافت اطلاعات کاربران:", err);
        } finally {
            inFlightRef.current = false;
            if (pendingRef.current.size > 0) flush();
        }
    }, []);

    const ensureLoaded = useCallback((usernames: string[]) => {
        let added = false;
        usernames.forEach(u => {
            if (u && !directoryRef.current.has(u) && !pendingRef.current.has(u)) {
                pendingRef.current.add(u);
                added = true;
            }
        });
        if (added) setTimeout(flush, 50); // چند فراخوانی پشت‌سرهم را batch می‌کند
    }, [flush]);

    const setUserInfo = useCallback((info: UserInfo) => {
        setDirectory(prev => {
            const next = new Map(prev);
            next.set(info.username, info);
            return next;
        });
    }, []);

    const getDisplayName = useCallback((username: string) => {
        const info = directory.get(username);
        if (!info) return username;
        const full = `${info.firstName} ${info.lastName}`.trim();
        return full || username;
    }, [directory]);

    const getProfilePicture = useCallback((username: string) => {
        return directory.get(username)?.profilePictureUrl;
    }, [directory]);

    return (
        <UserDirectoryContext.Provider value={{ getDisplayName, getProfilePicture, ensureLoaded, setUserInfo }}>
            {children}
        </UserDirectoryContext.Provider>
    );
};

export const useUserDirectory = () => {
    const ctx = useContext(UserDirectoryContext);
    if (!ctx) throw new Error("useUserDirectory must be used within UserDirectoryProvider");
    return ctx;
};