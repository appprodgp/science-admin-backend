import { getApiBaseUrl, getErrorMessage, getHealth } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

export async function BackendStatus() {
    let apiBaseUrl: string;

    try {
        apiBaseUrl = getApiBaseUrl();
    } catch (error) {
        return (
            <div className="max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <p className="font-semibold">Backend API URL is not configured.</p>
                <p>{getErrorMessage(error)}</p>
            </div>
        );
    }

    try {
        const health = await getHealth();
        return (
            <div className="flex max-w-3xl flex-wrap items-center justify-end gap-2 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    API: <span className="break-all font-medium text-slate-700">{apiBaseUrl}</span>
                </span>
                <StatusBadge status={health.status} />
                <span className="font-medium text-slate-700">{health.service ?? "Backend"}</span>
                {health.env && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">Env: {health.env}</span>}
            </div>
        );
    } catch (error) {
        return (
            <div className="max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <p className="font-semibold">Backend health check failed.</p>
                <p>
                    API: <span className="break-all font-medium">{apiBaseUrl}</span>
                </p>
                <p>Backend unavailable: {getErrorMessage(error)}</p>
            </div>
        );
    }
}