export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(date);
}

export function formatDateTime(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function formatNumber(value?: number | null): string {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("en").format(value);
}

export function prettyJson(value: unknown): string {
    if (value === undefined) return "undefined";
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}