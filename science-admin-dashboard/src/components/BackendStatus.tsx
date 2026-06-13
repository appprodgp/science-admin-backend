import { getErrorMessage, getHealth } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

export async function BackendStatus() {
    try {
        const health = await getHealth();
        return (
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-500">
                <StatusBadge status={health.status} />
                <span>{health.service ?? "Backend"}</span>
                {health.env && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{health.env}</span>}
            </div>
        );
    } catch (error) {
        return (
            <div className="max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Backend unavailable: {getErrorMessage(error)}
            </div>
        );
    }
}