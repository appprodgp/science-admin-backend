import { Suspense } from "react";

import { ArticleDetailPageClient } from "@/components/pages/ArticleDetailPageClient";

export default function ArticleDetailPage() {
    return (
        <Suspense fallback={<p className="text-sm text-slate-500">Loading article detail...</p>}>
            <ArticleDetailPageClient />
        </Suspense>
    );
}