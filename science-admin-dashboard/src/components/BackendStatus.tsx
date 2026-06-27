"use client";

import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/StatusBadge";
import { getApiBaseUrl, getErrorMessage, getHealth, type HealthStatus } from "@/lib/api";

type BackendStatusState =
    | { status: "loading" }
    | { status: "ready"; apiBaseUrl: string; health: HealthStatus }
    | { status: "error"; title: string; message: string; apiBaseUrl?: string };

export function BackendStatus() {
    const [state, setState] = useState<BackendStatusState>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;

        async function loadStatus() {
            let apiBaseUrl: string;

            try {
                apiBaseUrl = getApiBaseUrl();
            } catch (error) {
                if (!cancelled) {
                    setState({
                        status: "error",
                        title: "Backend API URL is not configured.",
                        message: getErrorMessage(error),
                    });
                }
                return;
            }

            try {
                const health = await getHealth();
                if (!cancelled) setState({ status: "ready", apiBaseUrl, health });
            } catch (error) {
                if (!cancelled) {
                    setState({
                        status: "error",
                        title: "Backend health check failed.",
                        message: `Backend unavailable: ${getErrorMessage(error)}`,
                        apiBaseUrl,
                    });
                }
            }
        }

        void loadStatus();

        return () => {
            cancelled = true;
        };
    }, []);

    if (state.status === "loading") {
        return (
            <div className="max-w-xl rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Checking backend status...
            </div>
        );
    }

    if (state.status === "error") {
        return (
            <div className="max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <p className="font-semibold">{state.title}</p>
                {state.apiBaseUrl && (
                    <p>
                        API: <span className="break-all font-medium">{state.apiBaseUrl}</span>
                    </p>
                )}
                <p>{state.message}</p>
            </div>
        );
    }

    return (
        <div className="flex max-w-3xl flex-wrap items-center justify-end gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                API: <span className="break-all font-medium text-slate-700">{state.apiBaseUrl}</span>
            </span>
            <StatusBadge status={state.health.status} />
            <span className="font-medium text-slate-700">{state.health.service ?? "Backend"}</span>
            {state.health.env && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">Env: {state.health.env}</span>}
        </div>
    );
}