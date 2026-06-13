from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.generated_article import GeneratedArticle
from app.schemas.llm_outputs import FactCheckOutput
from app.services.article_context_service import build_article_context
from app.services.llm_client import call_llm_json, model_for_task


FACT_CHECK_TASK_NAME = "fact_check"


def _normalized_phrase(value: str) -> str:
    return " ".join(value.strip().lower().strip(".!,;:'\"").split())


def _material_unsupported_claims(output: FactCheckOutput) -> list:
    return [
        claim
        for claim in output.unsupported_claims
        if claim.source_support_status in {"unsupported", "overstated"}
    ]


def _serious_overhype_flags(output: FactCheckOutput) -> list[str]:
    return [flag for flag in output.overhype_flags if _normalized_phrase(flag) != "promising"]


def fact_check_generated_article(db: Session, generated_article_id: UUID) -> GeneratedArticle:
    """Check generated content against source sections before admin review."""

    generated_article = db.get(GeneratedArticle, generated_article_id)
    if generated_article is None:
        raise ValueError("Generated article not found")

    context = build_article_context(db, generated_article.article_id)
    generated_content = {
        "plain_title": generated_article.plain_title,
        "subtitle": generated_article.subtitle,
        "article_body": generated_article.article_body,
        "difficult_words": generated_article.difficult_words_json,
        "mcqs": generated_article.mcqs_json,
        "limitations": generated_article.limitations_json,
        "source_attribution": generated_article.source_attribution,
    }

    settings = get_settings()
    system_prompt = (
        "You are a careful scientific fact-checker. Compare the generated article only against "
        "the provided source article context. Flag only claims that the generated article actually "
        "contains. Do not infer claims from tone, topic, or implications. Do not rewrite the full article."
    )
    user_prompt = (
        "Fact-check the generated content against the source context. Rules:\n"
        "- Add unsupported_claims only when the generated article actually contains the claim.\n"
        "- For every unsupported claim, quote the exact or near-exact generated wording in claim_text.\n"
        "- For every unsupported claim, explain why it is unsupported in reason.\n"
        "- source_support_status must be one of: unsupported, overstated, partially_supported.\n"
        "- Use unsupported for claims absent from the source.\n"
        "- Use overstated for material claims stronger than the source supports.\n"
        "- Use partially_supported only for minor wording issues where the source partly supports the idea.\n"
        "- If the generated article already says findings are lab, animal, or preclinical and says the study does not prove clinical benefit, do not flag it as claiming clinical efficacy.\n"
        "- Overhype flags must be exact words or phrases from the generated article, not inferred tone.\n"
        "- The word 'promising' alone is not serious overhype if the article includes caution and limitations. Put minor wording concerns in suggested_fixes instead.\n"
        "- missing_limitations should include only major limitations missing from the generated article.\n"
        "- accuracy_pass should be false only for material unsupported claims, serious overhype, or missing major limitations.\n"
        "- If only minor wording concerns exist, set accuracy_pass true and include them in suggested_fixes.\n"
        "- Suggest concise fixes, but do not rewrite the full article.\n\n"
        f"SOURCE_ARTICLE_CONTEXT_JSON:\n{json.dumps(context, ensure_ascii=False, default=str)}\n\n"
        f"GENERATED_CONTENT_JSON:\n{json.dumps(generated_content, ensure_ascii=False, default=str)}"
    )
    provider = settings.LLM_PRIMARY_PROVIDER
    model = model_for_task(provider, FACT_CHECK_TASK_NAME)
    output = call_llm_json(
        provider=provider,
        model=model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        output_schema=FactCheckOutput,
        task_name=FACT_CHECK_TASK_NAME,
        article_id=generated_article.article_id,
        db=db,
    )
    if not isinstance(output, FactCheckOutput):
        output = FactCheckOutput.model_validate(output.model_dump())

    fact_check_data = output.model_dump()
    material_unsupported_claims = _material_unsupported_claims(output)
    serious_overhype_flags = _serious_overhype_flags(output)
    accuracy_pass = bool(
        not material_unsupported_claims
        and not serious_overhype_flags
        and not output.missing_limitations
    )
    fact_check_data["accuracy_pass"] = accuracy_pass
    generated_article.fact_check_json = fact_check_data

    if accuracy_pass:
        generated_article.review_status = "pending"
        generated_article.article.status = "pending_review"
    else:
        generated_article.review_status = "needs_revision"
        generated_article.article.status = "generation_failed"

    generated_article.article.error_message = None
    db.commit()
    db.refresh(generated_article)
    return generated_article
