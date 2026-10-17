import React, { useState } from 'react';
import { Button } from '@/components/react/ui/Button';
import type { MeditationCenter } from '@/features/centers/lib/types';

interface SeekerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  centers: MeditationCenter[];
  onImportComplete: () => void;
}

export const SeekerImportModal: React.FC<SeekerImportModalProps> = ({
  isOpen,
  onClose,
  centers,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [defaultCenterId, setDefaultCenterId] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setError('CSV file must contain at least a header row and one data row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }

    setParsedRows(rows);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/seekers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: parsedRows,
          default_center_id: defaultCenterId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to import CSV records');
        setIsLoading(false);
        return;
      }

      setResult({
        imported: data.importedCount,
        skipped: data.skippedDuplicates,
      });
      setIsLoading(false);
      onImportComplete();
    } catch {
      setError('Connection or processing error');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
        <div className="p-6 bg-[#FFF9F3] border-b border-[#FDEED9] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Import Seekers from CSV</h3>
            <p className="text-xs text-gray-500 mt-0.5">Bulk upload existing seeker records</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {result ? (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 space-y-2">
              <p className="font-bold text-sm">Import Completed Successfully! 🎉</p>
              <p>Successfully registered: <span className="font-bold">{result.imported}</span> seekers</p>
              <p>Skipped duplicates: <span className="font-bold">{result.skipped}</span> records</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#FDEED9] file:text-[#C2741C] file:font-semibold cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Expected columns: `first_name`, `last_name`, `mobile`, `email`, `date_of_birth`, `gender`, `city`
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Default Center Assignment</label>
                <select
                  value={defaultCenterId}
                  onChange={(e) => setDefaultCenterId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
                >
                  <option value="">-- Auto-detect from CSV or leave unassigned --</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </select>
              </div>

              {parsedRows.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900">
                  Ready to process <span className="font-bold">{parsedRows.length}</span> rows from file: {file?.name}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              size="sm"
              onClick={handleImport}
              isLoading={isLoading}
              disabled={parsedRows.length === 0}
            >
              Start Import ({parsedRows.length} Records)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
