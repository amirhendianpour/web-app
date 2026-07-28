// مرتب‌سازی بر اساس زمان واقعی؛ اگر دو پیام دقیقاً هم‌زمان بودن، id به‌عنوان تای‌بریکر
export function compareByTime(a: { timestamp?: string; id: string }, b: { timestamp?: string; id: string }): number {
    const ta = a.timestamp || '';
    const tb = b.timestamp || '';
    if (ta !== tb) return ta.localeCompare(tb);
    return a.id.localeCompare(b.id);
}