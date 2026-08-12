import pytest
from app.rag import rag_engine
from app.tools.policy_tool import SearchPolicyTool


def test_rag_embedding_and_search():
    results = rag_engine.search("device sharing limits across accounts", top_k=3)

    assert len(results) > 0
    top_doc_ids = [r.document_id for r in results]
    assert "POL-DEVICE-001" in top_doc_ids
    assert results[0].relevance_score > 0.0
    assert "source" in results[0].model_dump()



def test_rag_category_filtering():
    results = rag_engine.search("account takeover fraud", top_k=2, category_filter="historical_case")

    assert len(results) > 0
    for r in results:
        assert r.category == "historical_case"


def test_grounded_context_prompt_isolation():
    results = rag_engine.search("velocity transaction limits", top_k=2)
    context_str = rag_engine.format_grounded_context(results)

    assert "BEGIN RETRIEVED KNOWLEDGE (UNTRUSTED DATA)" in context_str
    assert "END RETRIEVED KNOWLEDGE" in context_str
    assert "POL-VELOCITY-002" in context_str


@pytest.mark.asyncio
async def test_search_policy_tool_integration():
    tool = SearchPolicyTool()
    res = await tool.run({"query": "geographic impossibility travel speed"})

    assert res["status"] == "SUCCESS"
    matched = res["output"]["matched_policies"]
    assert len(matched) > 0
    assert matched[0]["document_id"] == "POL-GEO-003"
