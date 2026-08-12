from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.tools.base import BaseTool
from app.rag import rag_engine


class SearchPolicyInput(BaseModel):
    query: str = Field(description="Fraud rule or policy search query")


class SearchPolicyOutput(BaseModel):
    query: str
    matched_policies: List[Dict[str, Any]] = Field(default_factory=list)


class SearchPolicyTool(BaseTool):
    name = "search_policy"
    description = "Retrieve applicable fraud risk rules and compliance policy documents using RAG vector search"
    input_schema = SearchPolicyInput
    output_schema = SearchPolicyOutput
    required_permission = "analyst"

    async def _execute(self, input_data: SearchPolicyInput) -> Dict[str, Any]:
        results = rag_engine.search(input_data.query, top_k=3)
        matched = [
            {
                "document_id": r.document_id,
                "title": r.title,
                "category": r.category,
                "content": r.content,
                "relevance_score": r.relevance_score
            }
            for r in results
        ]
        return {
            "query": input_data.query,
            "matched_policies": matched
        }

