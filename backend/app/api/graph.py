from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.graph import graph_engine
from app.services.case_service import case_service

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


@router.get("/topology", response_model=Dict[str, Any])
async def get_global_graph_topology(case_id: Optional[str] = None):
    """
    Returns NetworkX node and edge relationship topology for visual graph rendering.
    """
    nodes = []
    links = []
    seen_nodes = set()

    cases = case_service.list_cases()
    if case_id:
        cases = [c for c in cases if c.case_id == case_id]

    for c in cases:
        # Add Case / Transaction node
        txn_node_id = c.transaction_id
        if txn_node_id not in seen_nodes:
            seen_nodes.add(txn_node_id)
            nodes.append({
                "id": txn_node_id,
                "label": txn_node_id,
                "type": "Transaction",
                "risk_level": c.risk_level,
                "risk_score": c.risk_score,
                "case_id": c.case_id
            })

        # Add linked entities from case evidence & graph analysis
        for entity in c.current_report.linked_entities if c.current_report else []:
            e_id = entity.entity_id
            if e_id not in seen_nodes:
                seen_nodes.add(e_id)
                nodes.append({
                    "id": e_id,
                    "label": e_id,
                    "type": entity.entity_type,
                    "risk_level": c.risk_level,
                    "relationship": entity.relationship
                })

            links.append({
                "source": txn_node_id,
                "target": e_id,
                "relationship": entity.relationship,
                "confidence": entity.confidence
            })

    # Default baseline network topology nodes if repository is empty
    if not nodes:
        nodes = [
            {"id": "ACC-ATO-1001", "label": "Account ACC-1001", "type": "Account", "risk_level": "CRITICAL"},
            {"id": "DEV-SHARED-POOL-9901", "label": "Device DEV-9901", "type": "Device", "risk_level": "CRITICAL"},
            {"id": "IP-177.0.0.1", "label": "IP 177.0.0.1 (TOR)", "type": "IP", "risk_level": "HIGH"},
            {"id": "MERCH-CRYPTO-GLOBAL", "label": "Merchant Crypto Global", "type": "Merchant", "risk_level": "HIGH"}
        ]
        links = [
            {"source": "ACC-ATO-1001", "target": "DEV-SHARED-POOL-9901", "relationship": "shared_device_link", "confidence": 0.95},
            {"source": "ACC-ATO-1001", "target": "IP-177.0.0.1", "relationship": "rapid_ip_hop", "confidence": 0.90},
            {"source": "ACC-ATO-1001", "target": "MERCH-CRYPTO-GLOBAL", "relationship": "high_val_settlement", "confidence": 0.88}
        ]

    return {
        "nodes": nodes,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links)
    }
