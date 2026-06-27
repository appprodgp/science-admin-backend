"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/Card";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
    getDiscoverySummary,
    getErrorMessage,
    getHealth,
    getReviewSummary,
    type DiscoverySummary,
    type HealthStatus,
    type ReviewSummary,
} from "@/lib/api";

type LoadResult<T> = { data: T | null; error: string | null; loading: boolean };

const initialLoad = { data: null, error: null, loading: true };
const discoveryKeys = ["license_rejected", "xml_not_found", "extracted", "failed"] as const;
const reviewKeys = ["pending", "needs_revision", "approved", "rejected"] as const;

async function load<T>(promise: Promise<T>): Promise<LoadResult<T>> {
    try {
        return { data: await promise, error: null, loading: false };
    } catch (error) {
        return { data: null, error: getErrorMessage(error), loading: false };
    }
}

function CardStatus<T>({ state, children }: { state: LoadResult<T>; children: (data: T | null) => React.ReactNode }) {
    if (state.loading) return <p className="text-sm text-slate-500">Loading...</p>;
    if (state.error) return <ErrorMessage message={state.error} />;
    return <>{children(state.data)}</>;
}

export function DashboardPageClient() {
    const [health, setHealth] = useState<LoadResult<HealthStatus>>(initialLoad);
    const [discovery, setDiscovery] = useState<LoadResult<DiscoverySummary>>(initialLoad);
    const [review, setReview] = useState<LoadResult<ReviewSummary>>(initialLoad);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            const [healthResult, discoveryResult, reviewResult] = await Promise.all([
                load(getHealth()),
                load(getDiscoverySummary()),
                load(getReviewSummary()),
            ]);

            if (!cancelled) {
                setHealth(healthResult);
                setDiscovery(discoveryResult);
                setReview(reviewResult);
            }
        }

        void loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            <PageHeader
                title="Dashboard"
                description="Pipeline status, review counts, and quick local operations for the science article backend."
            />

            <div className="grid gap-5 lg:grid-cols-3">
                <Card title="Backend health" description="Live health check from FastAPI.">
                    <CardStatus state={health}>
                        {(data) => (
                            <div className="space-y-3">
                                <StatusBadge status={data?.status} />
                                <dl className="space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between gap-4">
                                        <dt>Service</dt>
                                        <dd className="text-right font-medium text-slate-900">{data?.service ?? "—"}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt>Environment</dt>
                                        <dd className="text-right font-medium text-slate-900">{data?.env ?? "—"}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                    </CardStatus>
                </Card>

                <Card title="Discovery status counts" description="Article discovery and extraction states.">
                    <CardStatus state={discovery}>
                        {(data) => (
                            <div className="grid grid-cols-2 gap-3">
                                {discoveryKeys.map((key) => (
                                    <div key={key} className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">{key}</p>
                                        <p className="mt-1 text-2xl font-bold text-slate-950">{data?.[key] ?? 0}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardStatus>
                </Card>

                <Card title="Review counts" description="Human review queue summary.">
                    <CardStatus state={review}>
                        {(data) => (
                            <div className="grid grid-cols-2 gap-3">
                                {reviewKeys.map((key) => (
                                    <div key={key} className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">{key}</p>
                                        <p className="mt-1 text-2xl font-bold text-slate-950">{data?.[key] ?? 0}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardStatus>
                </Card>
            </div>

            <div className="mt-5">
                <Card title="Quick actions" description="Run small, safe local pipeline operations and inspect backend JSON responses.">
                    <DashboardQuickActions />
                </Card>
            </div>
        </div>
    );
}