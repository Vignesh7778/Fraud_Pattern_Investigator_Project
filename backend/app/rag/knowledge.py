from app.rag.engine import rag_engine

SEED_POLICIES = [
    {
        "document_id": "POL-DEVICE-001",
        "title": "Shared Device & Account Association Rules",
        "category": "device_risk",
        "content": "Rule 4.1: If a single device hash is observed operating across more than 4 distinct customer accounts within a rolling 24-hour window, all subsequent high-value transactions (> $500) originating from that device must be flagged for manual review.",
        "doc_metadata": {"version": "2.1", "approved_by": "Risk Committee"}
    },
    {
        "document_id": "POL-VELOCITY-002",
        "title": "Transaction Velocity & Frequency Limits",
        "category": "velocity_risk",
        "content": "Rule 3.2: Accounts attempting more than 5 transactions in a 5-minute window or exceeding $2,000 in cumulative value within 1 hour exceed velocity thresholds. Require immediate step-up authentication.",
        "doc_metadata": {"version": "1.4", "approved_by": "Security Operations"}
    },
    {
        "document_id": "POL-GEO-003",
        "title": "Geographic Impossibility & Speed Threshold Policy",
        "category": "geo_risk",
        "content": "Rule 5.3: Physical location change exceeding 800 km/hour equivalent travel speed between consecutive transaction timestamps indicates impossible travel. Flag account for investigation.",
        "doc_metadata": {"version": "3.0", "approved_by": "Fraud Intelligence"}
    },
    {
        "document_id": "POL-NEWACC-004",
        "title": "New Account High-Risk Transaction Policy",
        "category": "account_risk",
        "content": "Rule 2.5: Accounts less than 48 hours old attempting transactions exceeding $1,000 must undergo automated risk scoring and pattern checks before approval.",
        "doc_metadata": {"version": "1.0", "approved_by": "Compliance"}
    }
]

SEED_HISTORICAL_CASES = [
    {
        "document_id": "CASE-2025-0891",
        "title": "Account Takeover Device Pool Attack",
        "category": "historical_case",
        "content": "Historical Investigation Case 891: Shared device pool utilized by compromised account takeover network across 8 user accounts. Pattern identified via shared device and rapid velocity. Resolution: Confirmed Fraud.",
        "doc_metadata": {"resolution": "Confirmed Fraud", "confidence": 0.96}
    },
    {
        "document_id": "CASE-2025-0412",
        "title": "Household Kiosk False Positive Review",
        "category": "historical_case",
        "content": "Historical Investigation Case 412: Shared tablet device used by family members residing at same household address. Low transaction amounts, consistent locations. Resolution: Confirmed Legitimate.",
        "doc_metadata": {"resolution": "Confirmed Legitimate", "confidence": 0.92}
    }
]


def seed_rag_knowledge_base():
    """Seed the RAG vector engine with synthetic policies and historical cases."""
    for p in SEED_POLICIES:
        rag_engine.chunk_and_index_document(
            document_id=p["document_id"],
            title=p["title"],
            category=p["category"],
            content=p["content"],
            source="policy_document",
            doc_metadata=p["doc_metadata"]
        )

    for c in SEED_HISTORICAL_CASES:
        rag_engine.chunk_and_index_document(
            document_id=c["document_id"],
            title=c["title"],
            category=c["category"],
            content=c["content"],
            source="historical_case",
            doc_metadata=c["doc_metadata"]
        )


# Seed RAG knowledge base on import
seed_rag_knowledge_base()
