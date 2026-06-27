import { prettyJson } from "@/lib/format";

export function JsonBlock({ value, minHeight = "min-h-24" }: { value: unknown; minHeight?: string }) {
    return (
        <pre className={`${minHeight} overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100`}>
            {prettyJson(value)}
        </pre>
    );
}