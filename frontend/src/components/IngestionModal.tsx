import React, { useState } from 'react';
import { ingestManualCase, ingestFileCase } from '../api/client';
import { CaseRecord } from '../types';
import { X, Upload, Edit, FileText, AlertCircle } from 'lucide-react';


interface IngestionModalProps {
  onClose: () => void;
  onSuccess?: (caseData: CaseRecord) => void;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    case_title: '',
    transaction_id: '',
    account_id: 'ACC-MANUAL-101',
    amount: 1250.0,
    merchant_id: 'MERCH-1001',
    device_hash: 'DEV-MANUAL-88',
    ip_address: '192.168.1.100',
    country: 'US',
    user_notes: ''
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const caseRecord = await ingestFileCase(selectedFile);
      setLoading(false);
      if (onSuccess) onSuccess(caseRecord);
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
      const caseRecord = await ingestManualCase(formData);
      setLoading(false);
      if (onSuccess) onSuccess(caseRecord);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Manual ingestion failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold font-mono">
              +
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono">DUAL CASE INGESTION SYSTEM</h2>
              <p className="text-xs text-slate-400 font-mono">Upload case evidence file or enter transaction parameters manually.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 font-semibold text-center flex items-center justify-center space-x-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Case File (.json, .csv, .txt)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-4 font-semibold text-center flex items-center justify-center space-x-2 border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Manual Form Entry</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <form onSubmit={handleFileUpload} className="space-y-4 font-mono">
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950 p-8 rounded-2xl text-center space-y-3 transition-colors">
                <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                <div>
                  <div className="text-xs text-slate-200 font-bold">Choose an Evidence File</div>
                  <div className="text-[10px] text-slate-400 mt-1">Supports JSON, CSV, TXT transaction evidence payloads</div>
                </div>
                <input
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs cursor-pointer border border-slate-700"
                >
                  {selectedFile ? selectedFile.name : 'Select File'}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? 'Ingesting Case Payload...' : 'Ingest File & Run AI Investigation'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Case Name / Investigation Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Unauthorized Crypto Transfer Attempt"
                  value={formData.case_title}
                  onChange={(e) => setFormData({ ...formData, case_title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Account ID</label>
                  <input
                    type="text"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Merchant ID</label>
                  <input
                    type="text"
                    value={formData.merchant_id}
                    onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Device Hash</label>
                  <input
                    type="text"
                    value={formData.device_hash}
                    onChange={(e) => setFormData({ ...formData, device_hash: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Analyst Notes</label>
                <textarea
                  placeholder="Context notes regarding this manual transaction alert..."
                  value={formData.user_notes}
                  onChange={(e) => setFormData({ ...formData, user_notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 h-16"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? 'Ingesting Manual Case...' : 'Submit Manual Case & Run AI Harness'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
