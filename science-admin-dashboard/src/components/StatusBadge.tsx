import { cn } from "@/lib/format";

const toneByStatus: Record<string, string> = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    extracted: "border-sky-200 bg-sky-50 text-sky-700",
    curated: "border-indigo-200 bg-indigo-50 text-indigo-700",
    not_selected: "border-slate-200 bg-slate-50 text-slate-600",
    pending_review: "border-amber-200 bg-amber-50 text-amber-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    generation_failed: "border-rose-200 bg-rose-50 text-rose-700",
    failed: "border-rose-200 bg-rose-50 text-rose-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    needs_revision: "border-orange-200 bg-orange-50 text-orange-700",
    published: "border-violet-200 bg-violet-50 text-violet-700",
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
    const normalized = status || "unknown";
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                toneByStatus[normalized] ?? "border-slate-200 bg-slate-50 text-slate-600",
                className,
            )}
        >
            {normalized.replaceAll("_", " ")}
        </span>
    );
}