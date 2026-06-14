import { Suspense } from "react";

import { ReviewDetailPageClient } from "@/components/pages/ReviewDetailPageClient";

export default function ReviewDetailPage() {
    return (
        <Suspense fallback={<p className="text-sm text-slate-500">Loading review detail...</p>}>
            <ReviewDetailPageClient />
        </Suspense>
    );
}