import React, { useState } from 'react';
import { ingestManualCase, ingestFileCase } from '../api/client';
import { InvestigationState } from '../types';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseIngested: (state: InvestigationState) => void;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({
  isOpen,
  onClose,
  onCaseIngested
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    transaction_id: '',
    account_id: 'ACC-MANUAL-101',
    amount: 1250.0,
    merchant_id: 'MERCH-1001',
    device_hash: 'DEV-MANUAL-88',
    ip_address: '192.168.1.100',
    country: 'US',
    user_notes: ''
  });

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const state = await ingestFileCase(selectedFile);
      setLoading(false);
      onCaseIngested(state);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'File upload failed.');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const state = await ingestManualCase({
        transaction_id: formData.transaction_id || undefined,
        account_id: formData.account_id,
        amount: Number(formData.amount),
        merchant_id: formData.merchant_id,
        device_hash: formData.device_hash,
        ip_address: formData.ip_address,
        country: formData.country,
        user_notes: formData.user_notes
      });
      setLoading(false);
      onCaseIngested(state);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Manual entry failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              FRAUD PATTERN INVESTIGATOR — Case Ingestion Engine
            </h2>
            <p className="text-xs text-slate-400">
              Normalize raw transaction files or manual field inputs into the 15-State AI Harness
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-700/80 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📄 Upload Case File (PDF / CSV / JSON / TXT)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📝 Manual Form Case Entry
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'upload' ? (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 text-center bg-slate-800/20 transition-colors">
                <input
                  type="file"
                  id="case-file-input"
                  accept=".json,.csv,.txt,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="case-file-input" className="cursor-pointer space-y-2 block">
                  <div className="text-3xl">📁</div>
                  <div className="text-sm font-medium text-slate-200">
                    {selectedFile ? selectedFile.name : 'Click to select or drag case file here'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Supports JSON, CSV, TXT, or PDF evidence documents
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="text-xs text-cyan-400 bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/30">
                  Selected File: <strong>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-cyan-600/20"
                >
                  {loading ? 'Executing AI Harness...' : 'Upload & Start Investigation'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    placeholder="e.g. TXN-CUSTOM-99"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Account ID</label>
                  <input
                    type="text"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Transaction Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Merchant ID</label>
                  <input
                    type="text"
                    value={formData.merchant_id}
                    onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Device Hash</label>
                  <input
                    type="text"
                    value={formData.device_hash}
                    onChange={(e) => setFormData({ ...formData, device_hash: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">IP Address & Country</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      className="w-2/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Analyst Notes / Context</label>
                <textarea
                  rows={2}
                  value={formData.user_notes}
                  onChange={(e) => setFormData({ ...formData, user_notes: e.target.value })}
                  placeholder="Enter any additional background observation or suspicious context..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-600/20"
                >
                  {loading ? 'Running AI Harness...' : 'Normalize & Execute Harness'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
