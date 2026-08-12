import pytest
from app.graph.engine import FraudGraphEngine
from data.synthetic.generator import SyntheticDataGenerator


@pytest.fixture
def populated_graph():
    generator = SyntheticDataGenerator(num_users=30, target_transactions=200)
    data = generator.generate_all()

    engine = FraudGraphEngine()
    engine.build_graph_from_entities(
        users=data["users"],
        accounts=data["accounts"],
        transactions=data["transactions"],
        devices=data["devices"],
        ips=data["ips"],
        merchants=data["merchants"],
        device_links=data["device_account_links"],
        ip_links=data["ip_account_links"]
    )
    return engine, data


def test_graph_construction(populated_graph):
    engine, data = populated_graph
    assert engine.graph.number_of_nodes() > 0
    assert engine.graph.number_of_edges() > 0


def test_find_linked_accounts(populated_graph):
    engine, data = populated_graph
    # Pick account from device links
    sample_acc_id = data["accounts"][0]["id"]
    linked = engine.find_linked_accounts(sample_acc_id)
    assert isinstance(linked, list)


def test_explainable_paths(populated_graph):
    engine, data = populated_graph
    acc1 = data["accounts"][0]["id"]
    acc2 = data["accounts"][1]["id"]

    path = engine.find_explainable_path(acc1, acc2)
    if path:
        assert len(path) >= 2
        assert "Account" in path[0]


def test_suspicious_clusters(populated_graph):
    engine, data = populated_graph
    clusters = engine.find_suspicious_clusters(min_accounts=2)
    assert isinstance(clusters, list)
    if len(clusters) > 0:
        c = clusters[0]
        assert c.node_count >= 2
        assert c.risk_score >= 0.50


def test_ego_subgraph(populated_graph):
    engine, data = populated_graph
    txn_id = data["transactions"][0]["id"]
    subgraph = engine.get_ego_subgraph(txn_id, radius=2)
    assert "nodes" in subgraph
    assert "edges" in subgraph
    assert len(subgraph["nodes"]) > 0
