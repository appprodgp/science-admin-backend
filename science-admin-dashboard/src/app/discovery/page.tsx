import { Card } from "@/components/Card";
import { DiscoveryRunForm } from "@/components/DiscoveryRunForm";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { getDiscoverySummary, getErrorMessage, type DiscoverySummary } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DiscoveryPage() {
    let summary: DiscoverySummary | null = null;
    let error: string | null = null;

    try {
        summary = await getDiscoverySummary();
    } catch (caught) {
        error = getErrorMessage(caught);
    }

    return (
        <div>
            <PageHeader title="Discovery" description="Inspect discovery status counts and run article discovery for active journals." />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
                <Card title="Discovery summary" description="Counts grouped by discovery/extraction status.">
                    {error ? (
                        <ErrorMessage message={error} />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(summary ?? {}).map(([key, value]) => (
                                <div key={key} className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">{key}</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-950">{value ?? 0}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Run discovery" description="Default limit_per_journal is 1 for safe local testing.">
                    <DiscoveryRunForm />
                </Card>
            </div>
        </div>
    );
}