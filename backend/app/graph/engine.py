import networkx as nx
from typing import Dict, Any, List, Set, Tuple, Optional
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # User, Account, Transaction, Device, IP, Merchant
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str  # owns, performs, uses_device, uses_ip, transacts_with


class ClusterSummary(BaseModel):
    cluster_id: str
    node_count: int
    account_count: int
    shared_devices: List[str]
    shared_ips: List[str]
    accounts: List[str]
    risk_score: float


class FraudGraphEngine:
    def __init__(self):
        self.graph = nx.Graph()

    def reset_graph(self):
        self.graph = nx.Graph()

    def build_graph_from_entities(
        self,
        users: List[Dict[str, Any]],
        accounts: List[Dict[str, Any]],
        transactions: List[Dict[str, Any]],
        devices: List[Dict[str, Any]],
        ips: List[Dict[str, Any]],
        merchants: List[Dict[str, Any]],
        device_links: List[Dict[str, Any]],
        ip_links: List[Dict[str, Any]]
    ):
        self.reset_graph()

        # Add Users
        for u in users:
            self.graph.add_node(f"User:{u['id']}", type="User", label=u.get("name", u["id"]), role=u.get("role", "analyst"))

        # Add Accounts
        for a in accounts:
            self.graph.add_node(f"Account:{a['id']}", type="Account", label=a.get("account_number", a["id"]), user_id=a["user_id"])
            self.graph.add_edge(f"User:{a['user_id']}", f"Account:{a['id']}", relation="owns")

        # Add Devices
        for d in devices:
            self.graph.add_node(f"Device:{d['id']}", type="Device", label=d.get("device_type", "Device"), hash=d.get("device_hash", d["id"]))

        # Add IPs
        for i in ips:
            self.graph.add_node(f"IP:{i['id']}", type="IP", label=i.get("ip_address", i["id"]), country=i.get("country", "Unknown"))

        # Add Merchants
        for m in merchants:
            self.graph.add_node(f"Merchant:{m['id']}", type="Merchant", label=m.get("name", m["id"]), category=m.get("category", "General"))

        # Device Links
        for dl in device_links:
            self.graph.add_edge(f"Account:{dl['account_id']}", f"Device:{dl['device_id']}", relation="uses_device")

        # IP Links
        for il in ip_links:
            self.graph.add_edge(f"Account:{il['account_id']}", f"IP:{il['ip_id']}", relation="uses_ip")

        # Transactions
        for t in transactions:
            txn_node = f"Transaction:{t['id']}"
            self.graph.add_node(txn_node, type="Transaction", label=f"${t['amount']:.2f}", amount=t["amount"], is_fraud=t.get("is_fraud", False))
            self.graph.add_edge(f"Account:{t['account_id']}", txn_node, relation="performs")
            self.graph.add_edge(txn_node, f"Merchant:{t['merchant_id']}", relation="transacts_with")

            if t.get("device_id"):
                self.graph.add_edge(f"Account:{t['account_id']}", f"Device:{t['device_id']}", relation="uses_device")
            if t.get("ip_id"):
                self.graph.add_edge(f"Account:{t['account_id']}", f"IP:{t['ip_id']}", relation="uses_ip")

    def find_linked_accounts(self, account_id: str) -> List[Dict[str, Any]]:
        target_node = f"Account:{account_id}"
        if not self.graph.has_node(target_node):
            return []

        linked_accounts = []
        # Find neighbors (Devices/IPs) and their secondary neighbors (Accounts)
        for neighbor in self.graph.neighbors(target_node):
            n_type = self.graph.nodes[neighbor].get("type")
            if n_type in ["Device", "IP"]:
                for second_neighbor in self.graph.neighbors(neighbor):
                    if second_neighbor != target_node and self.graph.nodes[second_neighbor].get("type") == "Account":
                        linked_acc_id = second_neighbor.split(":", 1)[1]
                        link_reason = f"Shared {n_type.lower()}: {neighbor.split(':', 1)[1]}"
                        linked_accounts.append({
                            "account_id": linked_acc_id,
                            "shared_entity_type": n_type,
                            "shared_entity_id": neighbor.split(":", 1)[1],
                            "reason": link_reason
                        })
        return linked_accounts

    def find_explainable_path(self, account_a: str, account_b: str) -> Optional[List[str]]:
        node_a = f"Account:{account_a}"
        node_b = f"Account:{account_b}"

        if not (self.graph.has_node(node_a) and self.graph.has_node(node_b)):
            return None

        try:
            path = nx.shortest_path(self.graph, source=node_a, target=node_b)
            readable_path = []
            for item in path:
                ntype, nid = item.split(":", 1)
                readable_path.append(f"{ntype}({nid[:8]})")
            return readable_path
        except nx.NetworkXNoPath:
            return None

    def find_suspicious_clusters(self, min_accounts: int = 3) -> List[ClusterSummary]:
        clusters = []
        for idx, component in enumerate(nx.connected_components(self.graph)):
            sub = self.graph.subgraph(component)
            accounts = [n.split(":", 1)[1] for n in sub if self.graph.nodes[n].get("type") == "Account"]
            devices = [n.split(":", 1)[1] for n in sub if self.graph.nodes[n].get("type") == "Device"]
            ips = [n.split(":", 1)[1] for n in sub if self.graph.nodes[n].get("type") == "IP"]

            if len(accounts) >= min_accounts:
                risk_score = min(0.99, 0.50 + (len(accounts) * 0.08) + (len(devices) * 0.05))
                clusters.append(ClusterSummary(
                    cluster_id=f"CLUSTER-{idx+1001}",
                    node_count=len(component),
                    account_count=len(accounts),
                    shared_devices=devices[:5],
                    shared_ips=ips[:5],
                    accounts=accounts[:10],
                    risk_score=round(risk_score, 2)
                ))
        return sorted(clusters, key=lambda c: c.risk_score, reverse=True)

    def get_ego_subgraph(self, transaction_id: str, radius: int = 2) -> Dict[str, Any]:
        txn_node = f"Transaction:{transaction_id}"
        if not self.graph.has_node(txn_node):
            return {"nodes": [], "edges": []}

        sub = nx.ego_graph(self.graph, txn_node, radius=radius)
        nodes = []
        for n in sub.nodes:
            attr = sub.nodes[n]
            nodes.append({
                "id": n,
                "label": attr.get("label", n),
                "type": attr.get("type", "Unknown")
            })

        edges = []
        for u, v in sub.edges:
            relation = sub.edges[u, v].get("relation", "connected")
            edges.append({
                "source": u,
                "target": v,
                "relation": relation
            })

        return {"nodes": nodes, "edges": edges}


graph_engine = FraudGraphEngine()
