import os
import json
import pytest
from evaluation.runners.evaluate_all import run_full_evaluation


@pytest.mark.asyncio
async def test_full_evaluation_pipeline():
    report = await run_full_evaluation()

    assert "ml_metrics" in report
    assert "pattern_metrics" in report
    assert "rag_metrics" in report
    assert "harness_metrics" in report
    assert "llm_metrics" in report
    assert "human_workflow_metrics" in report

    assert report["ml_metrics"]["f1_score"] >= 0.75
    assert report["ml_metrics"]["roc_auc"] > 0.90
    assert report["harness_metrics"]["completion_rate"] == 1.0


    # Verify report file exists
    assert os.path.exists("evaluation/reports/evaluation_summary.json")
