from __future__ import annotations

import sys
from pathlib import Path

from pydantic import ValidationError


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.schemas.llm_outputs import CurationOutput, FactCheckOutput, GeneratedArticleOutput, MCQ


def main() -> None:
    curation = CurationOutput.model_validate(
        {
            "public_interest": 8,
            "novelty": 7,
            "evidence_strength": 8,
            "human_relevance": 8,
            "story_potential": 7,
            "overhype_risk": 3,
            "selected": True,
            "reason": "Strong evidence and clear reader relevance.",
        }
    )

    generated = GeneratedArticleOutput.model_validate(
        {
            "plain_title": "A Clear Science Story",
            "subtitle": "What the study found and what it does not prove",
            "article_body": "This draft explains the study without hype.",
            "difficult_words": [
                {
                    "word": "cohort",
                    "definition": "A group of people followed in a study.",
                    "why_it_matters": "It helps readers understand the study design.",
                },
                {
                    "word": "biomarker",
                    "definition": "A measurable sign of a biological process or condition.",
                    "why_it_matters": "It helps readers understand how researchers tracked the effect being studied.",
                },
                {
                    "word": "pathway",
                    "definition": "A chain of events inside cells that can change how they behave.",
                    "why_it_matters": "It explains the biological mechanism the article discusses.",
                },
                {
                    "word": "preclinical",
                    "definition": "Research done before testing a treatment in people, often in cells or animals.",
                    "why_it_matters": "It reminds readers not to assume the finding proves a human treatment works.",
                },
                {
                    "word": "immune response",
                    "definition": "How the body's defense system reacts to a threat or signal.",
                    "why_it_matters": "It helps readers follow the article's discussion of biological effects.",
                },
            ],
            "mcqs": [
                {
                    "question": "What is the main purpose of the article?",
                    "options": ["Explain a study", "Sell a product", "Publish data", "Replace doctors"],
                    "correct_answer": "Explain a study",
                    "explanation": "The draft summarizes source research for readers.",
                },
                {
                    "question": "How many options should each MCQ have?",
                    "options": ["One", "Two", "Three", "Four"],
                    "correct_answer": "Four",
                    "explanation": "The schema enforces exactly four options.",
                },
                {
                    "question": "What should the article avoid?",
                    "options": ["Accuracy", "Limitations", "Overclaiming", "Attribution"],
                    "correct_answer": "Overclaiming",
                    "explanation": "Generated content should not exaggerate findings.",
                },
            ],
            "limitations": ["The fake validation example is not a real study."],
            "source_attribution": "Example source attribution.",
        }
    )

    fact_check = FactCheckOutput.model_validate(
        {
            "accuracy_pass": True,
            "unsupported_claims": [
                {
                    "claim_text": "This exact generated wording is only partly supported.",
                    "reason": "The source supports the general idea but not the exact wording.",
                    "source_support_status": "partially_supported",
                }
            ],
            "overhype_flags": [],
            "missing_limitations": [],
            "suggested_fixes": [],
            "final_recommendation": "Ready for human review.",
        }
    )

    try:
        MCQ.model_validate(
            {
                "question": "Invalid MCQ?",
                "options": ["A", "B", "C"],
                "correct_answer": "A",
                "explanation": "This should fail because it has only three options.",
            }
        )
    except ValidationError:
        print("Invalid MCQ with 3 options was correctly rejected.")
    else:
        raise AssertionError("MCQ with 3 options should not validate")

    assert len(generated.mcqs[0].options) == 4
    assert generated.mcqs[0].correct_answer in generated.mcqs[0].options
    assert 5 <= len(generated.difficult_words) <= 8
    print("CurationOutput validated:", curation.selected)
    print("GeneratedArticleOutput validated with", len(generated.mcqs), "MCQs.")
    print("FactCheckOutput validated:", fact_check.accuracy_pass)


if __name__ == "__main__":
    main()
