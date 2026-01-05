
import React, { useState, useRef } from 'react';
import { Order, OrderStatus } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (orders: Order[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setError(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let parsedOrders: Order[] = [];

        if (file.name.endsWith('.json')) {
          parsedOrders = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          const headers = lines[0].split(',');
          parsedOrders = lines.slice(1).filter(line => line.trim()).map((line, index) => {
            const values = line.split(',');
            return {
              id: `UP-${Date.now()}-${index}`,
              customer: values[0] || 'Unknown Customer',
              timestamp: new Date().toISOString(),
              items: parseInt(values[1]) || 1,
              total: parseFloat(values[2]) || 0,
              status: OrderStatus.PENDING,
              latency: Math.floor(Math.random() * 50) + 10,
            };
          });
        } else {
          throw new Error('Unsupported file format. Please use JSON or CSV.');
        }

        onUpload(parsedOrders);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Upload Batch Data</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json,.csv"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-slate-900 font-semibold">Click or drag file to upload</p>
            <p className="text-slate-500 text-sm mt-1">Support for JSON and CSV (max 10MB)</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Formats</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono leading-tight">
                <p className="font-bold text-blue-600 mb-1">CSV:</p>
                Customer,Items,Total<br/>
                John Doe,5,120.50
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono leading-tight">
                <p className="font-bold text-blue-600 mb-1">JSON:</p>
                [{"{"}"customer": "...", "items": 5, "total": 120{"}"}]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
