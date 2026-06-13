import { notFound } from "next/navigation";

import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { ReviewEditor } from "@/components/ReviewEditor";
import { getErrorMessage, getGeneratedArticle } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: { generatedArticleId: string } }) {
    try {
        const generatedArticle = await getGeneratedArticle(params.generatedArticleId);

        return (
            <div>
                <PageHeader
                    title="Review generated article"
                    description="Edit draft content, inspect fact checks, and record approve/revision/reject decisions."
                />
                <ReviewEditor initialArticle={generatedArticle} />
            </div>
        );
    } catch (error) {
        const message = getErrorMessage(error);
        if (message.toLowerCase().includes("not found")) notFound();
        return <ErrorMessage message={message} />;
    }
}