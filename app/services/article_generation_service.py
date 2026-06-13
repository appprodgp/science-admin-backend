
from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.article import Article
from app.models.curation_score import CurationScore
from app.models.generated_article import GeneratedArticle
from app.schemas.llm_outputs import GeneratedArticleOutput
from app.services.article_context_service import build_article_context
from app.services.llm_client import call_llm_json, model_for_task


GENERATION_TASK_NAME = "generation"


def _latest_curation_score(db: Session, article_id: UUID) -> CurationScore | None:
    return db.scalar(
        select(CurationScore)
        .where(CurationScore.article_id == article_id)
        .order_by(CurationScore.created_at.desc())
        .limit(1)
    )


def _generation_allowed(db: Session, article: Article) -> bool:
    if article.status == "curated":
        return True
    latest_score = _latest_curation_score(db, article.id)
    return bool(latest_score and latest_score.selected)


def generate_article_for_review(db: Session, article_id: UUID) -> GeneratedArticle:
    """Generate a plain-language article draft and keep it out of review until fact-check."""

    article = db.get(Article, article_id)
    if article is None:
        raise ValueError("Article not found")
    if not _generation_allowed(db, article):
        raise ValueError("Article must be curated or have a selected curation score before generation")

    settings = get_settings()
    context = build_article_context(db, article_id)
    system_prompt = (
        "You are a science writer creating accurate, plain-language explainers for educated "
        "general readers. Be clear and engaging but not sensational. Stay grounded in the "
        "provided source context. Do not invent details. Do not overclaim. Write source-specific "
        "drafts, not generic summaries."
    )
    user_prompt = (
        "Generate a review draft from the source article context. Requirements:\n"
        "- Make the article body source-specific from the first paragraph. Mention the disease, organism, topic, pathway, intervention, or research area clearly when present in the source.\n"
        "- Mention what the researchers tested or compared, using concrete source details rather than generic wording.\n"
        "- Mention the model or system used when present, such as cells, organoids, animals, patient samples, participants, cohorts, datasets, or computational models.\n"
        "- Mention the key finding cautiously and tie it to the source article's actual findings.\n"
        "- Explain what the study does not prove, especially for lab, animal, preclinical, or observational work.\n"
        "- Explain why the study matters, what researchers did, what they found, and what it does not prove.\n"
        "- Mention limitations clearly.\n"
        "- Avoid generic opening lines such as 'This study is significant...' or 'Researchers conducted experiments...'. Start with the specific disease/topic or finding instead.\n"
        "- Avoid hype; do not say 'breakthrough' unless strongly supported by the source.\n"
        "- Do not claim clinical benefit from cell, animal, or lab-only studies.\n"
        "- Do not claim causation from observational data.\n"
        "- Use simple language while preserving scientific accuracy.\n"
        "- Create 5 to 8 difficult_words. Each term must come from the source article or its topic, such as scientific terms, disease names, cell types, pathways, study design terms, measurements, or therapy-related terms.\n"
        "- Each difficult_words item must include word, a simple-language definition, and why_it_matters explaining why the term helps readers understand this specific article.\n"
        "- Create exactly 3 MCQs, each with exactly 4 plausible options. correct_answer must exactly match one option.\n"
        "- Include source attribution using the DOI/license/source URL when available.\n\n"
        f"ARTICLE_CONTEXT_JSON:\n{json.dumps(context, ensure_ascii=False, default=str)}"
    )
    provider = settings.LLM_PRIMARY_PROVIDER
    model = model_for_task(provider, GENERATION_TASK_NAME)
    output = call_llm_json(
        provider=provider,
        model=model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        output_schema=GeneratedArticleOutput,
        task_name=GENERATION_TASK_NAME,
        article_id=article_id,
        db=db,
    )
    if not isinstance(output, GeneratedArticleOutput):
        output = GeneratedArticleOutput.model_validate(output.model_dump())

    llm_provider = getattr(output, "_llm_provider", provider)
    llm_model = getattr(output, "_llm_model", model)
    generated_article = GeneratedArticle(
        article_id=article_id,
        plain_title=output.plain_title,
        subtitle=output.subtitle,
        article_body=output.article_body,
        difficult_words_json=[item.model_dump() for item in output.difficult_words],
        mcqs_json=[item.model_dump() for item in output.mcqs],
        limitations_json=output.limitations,
        source_attribution=output.source_attribution,
        generation_model=f"{llm_provider}:{llm_model}",
        review_status="draft",
    )
    db.add(generated_article)

    # Clean transition: generated text exists but is not in the admin review queue
    # until fact-checking promotes it to review_status="pending".
    article.status = "generation_pending"
    article.error_message = None
    db.commit()
    db.refresh(generated_article)
    return generated_article
