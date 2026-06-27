
from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.article import Article
from app.models.curation_score import CurationScore
from app.schemas.llm_outputs import CurationOutput
from app.services.article_context_service import build_article_context
from app.services.llm_client import call_llm_json, model_for_task


CURATION_TASK_NAME = "curation"


def _enforced_selected(output: CurationOutput) -> bool:
    return (
        output.public_interest >= 7
        and output.evidence_strength >= 6
        and output.story_potential >= 6
        and output.overhype_risk <= 5
    )


def curate_article(db: Session, article_id: UUID) -> CurationScore:
    """Score whether an extracted source article is worth explaining."""

    settings = get_settings()
    context = build_article_context(db, article_id)
    system_prompt = (
        "You are a careful science editor curating peer-reviewed open-access articles "
        "for educated general science readers. Score the source article conservatively. "
        "Reward clear public relevance, strong evidence, and story potential. Penalize "
        "incremental, weak, niche, or hype-prone work. Do not generate article text."
    )
    user_prompt = (
        "Evaluate whether this article is worth explaining to general science readers. "
        "Use integer scores from 0 to 10 for public_interest, novelty, evidence_strength, "
        "human_relevance, story_potential, and overhype_risk. Include a concise reason. "
        "Set selected based on your judgment; the backend will enforce final selection rules.\n\n"
        f"ARTICLE_CONTEXT_JSON:\n{json.dumps(context, ensure_ascii=False, default=str)}"
    )
    provider = settings.LLM_PRIMARY_PROVIDER
    model = model_for_task(provider, CURATION_TASK_NAME)

    output = call_llm_json(
        provider=provider,
        model=model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        output_schema=CurationOutput,
        task_name=CURATION_TASK_NAME,
        article_id=article_id,
        db=db,
    )
    if not isinstance(output, CurationOutput):
        output = CurationOutput.model_validate(output.model_dump())

    selected = _enforced_selected(output)
    llm_provider = getattr(output, "_llm_provider", provider)
    llm_model = getattr(output, "_llm_model", model)
    curation_score = CurationScore(
        article_id=article_id,
        public_interest=output.public_interest,
        novelty=output.novelty,
        evidence_strength=output.evidence_strength,
        human_relevance=output.human_relevance,
        story_potential=output.story_potential,
        overhype_risk=output.overhype_risk,
        selected=selected,
        reason=output.reason,
        model=f"{llm_provider}:{llm_model}",
    )
    db.add(curation_score)

    article = db.get(Article, article_id)
    if article is None:
        raise ValueError("Article not found")
    article.status = "curated" if selected else "not_selected"
    article.error_message = None
    db.commit()
    db.refresh(curation_score)
    return curation_score
