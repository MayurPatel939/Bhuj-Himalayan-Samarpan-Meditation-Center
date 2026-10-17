import React, { useState, useEffect } from 'react';
import { Search, Plus, Upload, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import { SeekerDetailsModal } from './SeekerDetailsModal';
import { SeekerImportModal } from './SeekerImportModal';
import type { Seeker } from '../lib/types';
import type { MeditationCenter } from '@/features/centers/lib/types';

interface SeekerTableProps {
  initialSeekers: Seeker[];
  centers: MeditationCenter[];
  locale?: 'en' | 'gu';
}

export const SeekerTable: React.FC<SeekerTableProps> = ({
  initialSeekers,
  centers,
  locale = 'en',
}) => {
  const [seekers, setSeekers] = useState<Seeker[]>(initialSeekers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [viewingSeeker, setViewingSeeker] = useState<Seeker | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Seeker | null>(null);

  // Fetch filtered data from API
  const fetchSeekers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCenter !== 'all') params.append('center_id', selectedCenter);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(`/api/seekers?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setSeekers(json.data || []);
      }
    } catch {
      console.error('Failed to fetch filtered seekers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSeekers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCenter, selectedStatus]);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await fetch(`/api/seekers/${archiveTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setArchiveTarget(null);
        fetchSeekers();
      }
    } catch {
      console.error('Failed to archive seeker');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedCenter !== 'all') params.append('center_id', selectedCenter);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    window.location.href = `/api/seekers/export?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or mobile..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8973A] focus:border-transparent"
            />
          </div>

          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
          >
            <option value="all">All Centers / બધા કેન્દ્રો</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'gu' ? c.name_gu : c.name_en}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
          >
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </Button>

          <a href="/dashboard/seekers/new">
            <Button size="sm" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Register Seeker</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Seekers Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-[#FFF9F3] text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3.5">Seeker ID</th>
                <th className="px-4 py-3.5">Full Name</th>
                <th className="px-4 py-3.5">Mobile</th>
                <th className="px-4 py-3.5">Center</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading seekers...
                  </td>
                </tr>
              ) : seekers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No seekers found matching your criteria.
                  </td>
                </tr>
              ) : (
                seekers.map((s) => {
                  const nameDisplay = locale === 'gu' && s.first_name_gu
                    ? `${s.first_name_gu} ${s.last_name_gu || s.last_name_en}`
                    : `${s.first_name_en} ${s.last_name_en}`;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-semibold text-[#C2741C]">
                        {s.seeker_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{nameDisplay}</div>
                        {locale !== 'gu' && s.first_name_gu && (
                          <div className="text-[10px] text-gray-400">{s.first_name_gu} {s.last_name_gu}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-700">
                        {s.mobile || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.centers?.name_en || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.is_minor ? (
                          <Badge variant="blue">Minor</Badge>
                        ) : (
                          <span className="text-gray-400">Adult</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={s.status === 'active' ? 'sage' : 'gray'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingSeeker(s)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={`/dashboard/seekers/${s.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-[#E8973A] hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => setArchiveTarget(s)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Archive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Quick View Modal */}
      <SeekerDetailsModal
        seeker={viewingSeeker}
        onClose={() => setViewingSeeker(null)}
        locale={locale}
      />

      {/* CSV Import Modal */}
      <SeekerImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        centers={centers}
        onImportComplete={fetchSeekers}
      />

      {/* Archive Confirmation Dialog */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-gray-900">Archive Seeker?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to archive <span className="font-bold">{archiveTarget.first_name_en} {archiveTarget.last_name_en}</span> ({archiveTarget.seeker_id})? Their record will be soft-deleted.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setArchiveTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleArchive}>
                Yes, Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
