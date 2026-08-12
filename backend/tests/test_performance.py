import pytest
from app.core.performance import performance_benchmark, policy_cache
from app.llm.provider import MockLocalProvider
from app.domain import InvestigationState


@pytest.mark.asyncio
async def test_concurrent_investigation_performance():
    res = await performance_benchmark.measure_concurrent_investigations(num_concurrent=5)

    assert res["num_concurrent"] == 5

    assert res["success_rate"] == 1.0
    assert res["total_duration_seconds"] < 10.0


def test_policy_cache_lru():
    policy_cache.put("shared device rules", [{"doc": "POL-001"}])
    cached = policy_cache.get("shared device rules")

    assert cached is not None
    assert cached[0]["doc"] == "POL-001"


@pytest.mark.asyncio
async def test_graceful_degradation_llm_fallback():
    provider = MockLocalProvider()
    state = InvestigationState(transaction_id="TXN-DEGRADE-TEST")
    state.risk_score = 0.85
    state.risk_level = "HIGH"

    # Fallback provider returns completed report despite offline LLM server
    report = await provider.generate_report(state)
    assert report is not None
    assert report.transaction_id == "TXN-DEGRADE-TEST"
    assert "Generated via local synthesis fallback" in report.limitations[0]
