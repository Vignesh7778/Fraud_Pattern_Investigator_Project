import React, { useState, useEffect } from 'react';
import { Network, Search, X, Zap } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: string;
  risk_level?: string;
  risk_score?: number;
  case_id?: string;
  relationship?: string;
}

interface Link {
  source: string;
  target: string;
  relationship: string;
  confidence?: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
  total_nodes: number;
  total_links: number;
}

export const GraphRelationshipsView: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/api/v1/graph/topology`);
        if (resp.ok) {
          const data = await resp.json();
          setGraphData(data);
        }
      } catch (err) {
        console.error('Failed to fetch graph topology:', err);
      } finally {

        setLoading(false);
      }
    }
    loadGraph();
  }, []);

  const filteredNodes = graphData?.nodes.filter(n =>
    searchQuery === '' || n.id.toLowerCase().includes(searchQuery.toLowerCase()) || n.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors font-mono">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">GRAPH RELATIONSHIPS</h1>
            <span className="bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e37] text-xs px-2.5 py-0.5 rounded-md font-bold font-mono">
              {graphData?.nodes.length || 0} Network Entities
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-sans">
            NetworkX multi-hop graph topology connecting Accounts, Shared Devices, IP Addresses, Transactions, and Merchants.
          </p>
        </div>
      </div>

      {/* Main Graph Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Interactive Node Graph Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2a2e37] pb-3">
            <div className="flex items-center space-x-2 font-mono text-xs">
              <Network className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">Entity Relationship Topology</span>
            </div>
            <div className="relative w-48 font-mono">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-mono text-xs animate-pulse">
              Constructing NetworkX graph relationships from database entities...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 min-h-[360px]">
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isCritical = node.risk_level === 'CRITICAL';
                const isHigh = node.risk_level === 'HIGH';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between font-mono shadow-sm ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 shadow-md scale-105'
                        : isCritical
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 hover:border-rose-600 text-rose-900 dark:text-rose-200'
                        : isHigh
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40 hover:border-orange-600 text-orange-900 dark:text-orange-200'
                        : 'bg-slate-50 dark:bg-[#0f1115] border-slate-200 dark:border-[#2a2e37] hover:border-slate-400 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">{node.type}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-rose-500 animate-pulse' : isHigh ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}></span>
                    </div>

                    <div className="my-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{node.id}</div>
                      {node.relationship && (
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">{node.relationship}</div>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-500 text-right font-bold">
                      {node.risk_level ? `${node.risk_level} RISK` : 'CONNECTED'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Entity Inspector Panel (1 col) */}
        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-4 shadow-sm font-mono flex flex-col justify-between transition-colors">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2a2e37] pb-3">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 font-sans">ENTITY DETAILS</span>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-sans">Entity ID</span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">{selectedNode.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0f1115] p-3 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500">Entity Type</span>
                  <div className="text-teal-700 dark:text-teal-400 font-bold">{selectedNode.type}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Risk Level</span>
                  <div className="text-rose-600 dark:text-rose-400 font-bold">{selectedNode.risk_level || 'HIGH'}</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-sans">Connected Links in Network</span>
                <div className="space-y-2 mt-2 font-mono">
                  {graphData?.links
                    .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((link, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-[#0f1115] p-2.5 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold">
                          <span>{link.source === selectedNode.id ? link.target : link.source}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{(link.confidence || 0.90) * 100}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{link.relationship}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3 font-sans">
              <Zap className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Select any entity node to inspect graph connections</div>
              <div className="text-[10px] text-slate-500 font-mono">Clicking nodes highlights multi-hop relationships and confidence scores.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
