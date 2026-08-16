import React, { useState, useRef } from 'react';
import { CaseRecord } from '../types';
import { ingestManualCase, ingestFileCase } from '../api/client';
import {
  X, FileText, Upload, Edit3, ArrowRight, ShieldCheck, CheckCircle2,
  AlertCircle, FileSpreadsheet, FileCode, Check, RefreshCw
} from 'lucide-react';

interface IngestionModalProps {
  onClose: () => void;
  onSuccess: (caseRecord: CaseRecord) => void;
}

type Mode = 'CHOICE' | 'MANUAL_FORM' | 'FILE_UPLOAD';
type UploadStep = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'EXTRACTING' | 'READY';

export const IngestionModal: React.FC<IngestionModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<Mode>('CHOICE');
  const [step, setStep] = useState<'INPUT' | 'REVIEW'>('INPUT');

  // Manual & Extracted Form Fields State
  const [caseTitle, setCaseTitle] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [accountId, setAccountId] = useState('ACC-MANUAL-101');
  const [amount, setAmount] = useState<number>(1250.00);
  const [merchantId, setMerchantId] = useState('MERCH-1001');
  const [deviceHash, setDeviceHash] = useState('DEV-MANUAL-88');
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [country, setCountry] = useState('US');
  const [userNotes, setUserNotes] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('IDLE');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Loading & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate File (Type, Size <= 10MB)
  const validateFile = (file: File): string | null => {
    const validExtensions = ['.json', '.csv', '.txt', '.pdf', '.docx', '.doc'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      return 'Unsupported file format. Supported formats: PDF, DOCX, JSON, CSV, and TXT.';
    }
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      return 'File size exceeds maximum allowed limit of 10MB.';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    const err = validateFile(file);
    if (err) {
      setUploadError(err);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);

    // Simulate progress states for UX clarity
    setUploadStep('UPLOADING');
    setTimeout(() => {
      setUploadStep('PROCESSING');
      setTimeout(() => {
        setUploadStep('EXTRACTING');
        setTimeout(() => {
          setUploadStep('READY');
          // Format title based on file extension
          const lowerName = file.name.toLowerCase();
          if (lowerName.endsWith('.pdf')) {
            setCaseTitle(`PDF Evidence Document: ${file.name}`);
          } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
            setCaseTitle(`Word Evidence Document: ${file.name}`);
          } else if (lowerName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const parsed = JSON.parse(e.target?.result as string);
                if (parsed.case_title) setCaseTitle(parsed.case_title);
                if (parsed.transaction_id) setTransactionId(parsed.transaction_id);
                if (parsed.account_id) setAccountId(parsed.account_id);
                if (parsed.amount) setAmount(Number(parsed.amount));
                if (parsed.merchant_id) setMerchantId(parsed.merchant_id);
                if (parsed.device_hash) setDeviceHash(parsed.device_hash);
                if (parsed.ip_address) setIpAddress(parsed.ip_address);
                if (parsed.country) setCountry(parsed.country);
                if (parsed.user_notes) setUserNotes(parsed.user_notes);
              } catch (e) {
                // Default title
                setCaseTitle(`JSON Case File: ${file.name}`);
              }
            };
            reader.readAsText(file);
          } else {
            setCaseTitle(`Uploaded File: ${file.name}`);
          }
        }, 300);
      }, 300);
    }, 400);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Proceed from Input/Upload step to Review Step
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'MANUAL_FORM') {
      if (!amount || amount <= 0) {
        setUploadError('Transaction Amount must be greater than 0.');
        return;
      }
    } else if (mode === 'FILE_UPLOAD') {
      if (!selectedFile) {
        setUploadError('Please select or drop a valid file before reviewing.');
        return;
      }
    }
    setUploadError(null);
    setStep('REVIEW');
  };

  // Final Action: Start AI Investigation
  const handleStartInvestigation = async () => {
    setIsSubmitting(true);
    setUploadError(null);
    try {
      let createdCase: CaseRecord;
      if (mode === 'FILE_UPLOAD' && selectedFile) {
        createdCase = await ingestFileCase(selectedFile);
      } else {
        createdCase = await ingestManualCase({
          case_title: caseTitle || undefined,
          transaction_id: transactionId || undefined,
          account_id: accountId,
          amount: Number(amount),
          merchant_id: merchantId,
          device_hash: deviceHash,
          ip_address: ipAddress,
          country: country,
          user_notes: userNotes || undefined
        });
      }
      onSuccess(createdCase);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to initialize case investigation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#2a2e37] flex items-center justify-between bg-slate-50 dark:bg-[#0f1115]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Create New Case</h2>
              <p className="text-xs text-slate-500 font-sans">
                {mode === 'CHOICE' ? 'Select your case ingestion method' : step === 'INPUT' ? 'Enter transaction & network payload details' : 'Review case details before starting AI investigation'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Wizard Indicator */}
        {mode !== 'CHOICE' && (
          <div className="bg-slate-100 dark:bg-[#12151a] px-6 py-2.5 border-b border-slate-200 dark:border-[#2a2e37] flex items-center justify-between text-xs font-sans">
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step === 'INPUT' ? 'bg-teal-600 text-white' : 'bg-emerald-600 text-white'}`}>
                1
              </span>
              <span className={`font-semibold ${step === 'INPUT' ? 'text-teal-700 dark:text-teal-400 font-bold' : 'text-slate-500'}`}>
                {mode === 'MANUAL_FORM' ? '1. Case Input' : '1. File Upload'}
              </span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step === 'REVIEW' ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                2
              </span>
              <span className={`font-semibold ${step === 'REVIEW' ? 'text-teal-700 dark:text-teal-400 font-bold' : 'text-slate-500'}`}>
                2. Data Review
              </span>
            </div>
            <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <span className="text-slate-500 font-semibold">3. AI Investigation</span>
            </div>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Error Alert */}
          {uploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start space-x-2 animate-fade-in font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* MODE 1: CHOICE SELECTION */}
          {mode === 'CHOICE' && (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">How would you like to provide the case?</h3>
                <p className="text-xs text-slate-500">Select manual form input or upload an existing case file (PDF, DOCX, JSON, CSV, TXT).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setMode('MANUAL_FORM');
                    setStep('INPUT');
                  }}
                  className="p-6 bg-slate-50 dark:bg-[#0f1115] hover:bg-teal-50/50 dark:hover:bg-teal-950/30 border-2 border-slate-200 dark:border-[#2a2e37] hover:border-teal-500 rounded-2xl text-left space-y-3 transition-all group shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                        Enter Case Manually
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Fill transaction, account, device, and network attributes in a structured form.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center space-x-1 pt-2">
                    <span>Fill Form</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode('FILE_UPLOAD');
                    setStep('INPUT');
                  }}
                  className="p-6 bg-slate-50 dark:bg-[#0f1115] hover:bg-teal-50/50 dark:hover:bg-teal-950/30 border-2 border-slate-200 dark:border-[#2a2e37] hover:border-teal-500 rounded-2xl text-left space-y-3 transition-all group shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Upload Case File
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload evidence files (PDF, DOCX, JSON, CSV, TXT) for automated parsing.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 pt-2">
                    <span>Upload File</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2A: MANUAL FORM (INPUT STEP) */}
          {mode === 'MANUAL_FORM' && step === 'INPUT' && (
            <form onSubmit={handleProceedToReview} className="space-y-5">
              {/* CASE INFORMATION */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Case Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Case Title <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Account Takeover & Device Sharing"
                      value={caseTitle}
                      onChange={e => setCaseTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">User Notes / Context <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. High risk login after password reset"
                      value={userNotes}
                      onChange={e => setUserNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* TRANSACTION DETAILS */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[#2a2e37]">
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Transaction Payload</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Transaction ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. TXN-1001"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase">Transaction Amount <span className="text-rose-500 font-bold">* Required</span></label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1250.00"
                      required
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Merchant ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. MERCH-1001"
                      value={merchantId}
                      onChange={e => setMerchantId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ACCOUNT & DEVICE */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[#2a2e37]">
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Account & Device Fingerprint</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Account ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="ACC-101"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Device Hash <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="DEV-MANUAL-88"
                      value={deviceHash}
                      onChange={e => setDeviceHash(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">IP Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={ipAddress}
                      onChange={e => setIpAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Country Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="US"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#2a2e37]">
                <button
                  type="button"
                  onClick={() => setMode('CHOICE')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  ← Change Method
                </button>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center space-x-2 shadow-sm"
                >
                  <span>Review Case Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* MODE 2B: FILE UPLOAD (INPUT STEP) */}
          {mode === 'FILE_UPLOAD' && step === 'INPUT' && (
            <div className="space-y-5">
              {/* Drag and Drop Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center space-y-4 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40'
                    : 'border-slate-300 dark:border-[#2a2e37] bg-slate-50 dark:bg-[#0f1115] hover:border-teal-500/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.txt,.pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {selectedFile ? selectedFile.name : 'Upload Case File'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Drag & drop your case file here, or <span className="text-teal-600 font-bold underline">Browse Files</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <FileText className="w-3 h-3 text-rose-500" />
                    <span>PDF</span>
                  </span>
                  <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>DOCX</span>
                  </span>
                  <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <FileCode className="w-3 h-3 text-teal-500" />
                    <span>JSON</span>
                  </span>
                  <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                    <span>CSV</span>
                  </span>
                  <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <FileText className="w-3 h-3 text-amber-500" />
                    <span>TXT</span>
                  </span>
                  <span className="text-slate-500 font-bold">• Max 10MB</span>
                </div>
              </div>

              {/* Upload Progress Status Indicator */}
              {selectedFile && uploadStep !== 'IDLE' && (
                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] p-4 rounded-2xl space-y-2 animate-fade-in font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFile.name}</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold text-[10px]">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full bg-teal-500 transition-all duration-300 ${
                      uploadStep === 'UPLOADING' ? 'w-1/3' : uploadStep === 'PROCESSING' ? 'w-2/3' : uploadStep === 'EXTRACTING' ? 'w-5/6' : 'w-full'
                    }`}></div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-0.5">
                    {uploadStep !== 'READY' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>
                      {uploadStep === 'UPLOADING' && 'Uploading document payload...'}
                      {uploadStep === 'PROCESSING' && 'Parsing file structure...'}
                      {uploadStep === 'EXTRACTING' && 'Extracting evidence attributes...'}
                      {uploadStep === 'READY' && 'Document processed & ready for review.'}
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#2a2e37]">
                <button
                  type="button"
                  onClick={() => setMode('CHOICE')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  ← Change Method
                </button>
                <button
                  disabled={!selectedFile || uploadStep !== 'READY'}
                  onClick={handleProceedToReview}
                  className="bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center space-x-2 shadow-sm"
                >
                  <span>Review Extracted Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRE-INVESTIGATION CASE REVIEW */}
          {step === 'REVIEW' && (
            <div className="space-y-5 animate-fade-in font-sans">
              <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 p-4 rounded-2xl flex items-center space-x-3 text-xs">
                <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">Review Case Data Before AI Investigation</div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    Verify all payload attributes below. Clicking 'Start AI Investigation' triggers the 15-state harness.
                  </div>
                </div>
              </div>

              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] p-4 rounded-2xl space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Case & Transaction</div>
                  <div className="text-slate-800 dark:text-slate-100 font-sans font-bold">{caseTitle || 'Manual Entry Investigation'}</div>
                  <div className="text-slate-500">Txn ID: <strong className="text-slate-800 dark:text-slate-200">{transactionId || 'Auto Generated'}</strong></div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    ${Number(amount).toFixed(2)} USD
                  </div>
                  <div className="text-slate-500">Merchant: <strong className="text-slate-800 dark:text-slate-200">{merchantId}</strong></div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] p-4 rounded-2xl space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Account & Network</div>
                  <div className="text-slate-500">Account ID: <strong className="text-slate-800 dark:text-slate-200">{accountId}</strong></div>
                  <div className="text-slate-500">Device Hash: <strong className="text-slate-800 dark:text-slate-200">{deviceHash}</strong></div>
                  <div className="text-slate-500">IP Address: <strong className="text-slate-800 dark:text-slate-200">{ipAddress} ({country})</strong></div>
                  {userNotes && <div className="text-slate-500 truncate">Notes: {userNotes}</div>}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#2a2e37]">
                <button
                  type="button"
                  onClick={() => setStep('INPUT')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  ← Edit Fields
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={handleStartInvestigation}
                  className="bg-teal-700 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-teal-900/30 transition-all font-mono"
                >
                  {isSubmitting ? (
                    <span>Initializing AI Harness...</span>
                  ) : (
                    <>
                      <span>Start AI Investigation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
