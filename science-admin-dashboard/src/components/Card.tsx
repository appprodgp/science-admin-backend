import type { ReactNode } from "react";

import { cn } from "@/lib/format";

type CardProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
};

export function Card({ title, description, actions, children, className }: CardProps) {
    return (
        <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
            {(title || description || actions) && (
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        {title && <h2 className="text-base font-semibold text-slate-950">{title}</h2>}
                        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                    </div>
                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}
            {children}
        </section>
    );
}