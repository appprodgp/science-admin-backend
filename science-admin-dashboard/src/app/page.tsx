import { Card } from "@/components/Card";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getDiscoverySummary, getErrorMessage, getHealth, getReviewSummary } from "@/lib/api";

export const dynamic = "force-dynamic";

async function load<T>(promise: Promise<T>): Promise<{ data: T | null; error: string | null }> {
    try {
        return { data: await promise, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

const discoveryKeys = ["license_rejected", "xml_not_found", "extracted", "failed"] as const;
const reviewKeys = ["pending", "needs_revision", "approved", "rejected"] as const;

export default async function DashboardPage() {
    const [health, discovery, review] = await Promise.all([
        load(getHealth()),
        load(getDiscoverySummary()),
        load(getReviewSummary()),
    ]);

    return (
        <div>
            <PageHeader
                title="Dashboard"
                description="Pipeline status, review counts, and quick local operations for the science article backend."
            />

            <div className="grid gap-5 lg:grid-cols-3">
                <Card title="Backend health" description="Live health check from FastAPI.">
                    {health.error ? (
                        <ErrorMessage message={health.error} />
                    ) : (
                        <div className="space-y-3">
                            <StatusBadge status={health.data?.status} />
                            <dl className="space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between gap-4">
                                    <dt>Service</dt>
                                    <dd className="text-right font-medium text-slate-900">{health.data?.service ?? "—"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Environment</dt>
                                    <dd className="text-right font-medium text-slate-900">{health.data?.env ?? "—"}</dd>
                                </div>
                            </dl>
                        </div>
                    )}
                </Card>

                <Card title="Discovery status counts" description="Article discovery and extraction states.">
                    {discovery.error ? (
                        <ErrorMessage message={discovery.error} />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {discoveryKeys.map((key) => (
                                <div key={key} className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500">{key}</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-950">{discovery.data?.[key] ?? 0}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Review counts" description="Human review queue summary.">
                    {review.error ? (
                        <ErrorMessage message={review.error} />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {reviewKeys.map((key) => (
                                <div key={key} className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500">{key}</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-950">{review.data?.[key] ?? 0}</p>
                                </div>
                            ))}
                        </div>
                    )}
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