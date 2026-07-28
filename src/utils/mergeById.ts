export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
    const map = new Map<string, T>();
    existing.forEach(item => map.set(item.id, item));
    incoming.forEach(item => {
        if (!map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}