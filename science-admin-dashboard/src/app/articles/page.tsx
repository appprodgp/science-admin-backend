import { Suspense } from "react";

import { ArticlesPageClient } from "@/components/pages/ArticlesPageClient";

export default function ArticlesPage() {
    return (
        <Suspense fallback={<p className="text-sm text-slate-500">Loading articles...</p>}>
            <ArticlesPageClient />
        </Suspense>
    );
}