import React from 'react';
import { Badge } from '@/components/react/ui/Badge';
import { Button } from '@/components/react/ui/Button';
import type { Seeker } from '../lib/types';

interface SeekerDetailsModalProps {
  seeker: Seeker | null;
  onClose: () => void;
  locale?: 'en' | 'gu';
}

export const SeekerDetailsModal: React.FC<SeekerDetailsModalProps> = ({
  seeker,
  onClose,
  locale = 'en',
}) => {
  if (!seeker) return null;

  const displayName = locale === 'gu' && seeker.first_name_gu
    ? `${seeker.first_name_gu} ${seeker.last_name_gu || seeker.last_name_en}`
    : `${seeker.first_name_en} ${seeker.last_name_en}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-6 bg-[#FFF9F3] border-b border-[#FDEED9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8973A] to-[#F3AA55] flex items-center justify-center text-white font-bold text-lg shadow-xs">
              {seeker.first_name_en[0]}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{displayName}</h3>
              <p className="text-xs text-[#C2741C] font-mono font-semibold">{seeker.seeker_id}</p>
            </div>
          </div>
          <Badge variant={seeker.status === 'active' ? 'sage' : 'gray'}>
            {seeker.status}
          </Badge>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 block mb-0.5">Mobile (WhatsApp)</span>
              <span className="font-semibold text-gray-800">{seeker.mobile || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Email</span>
              <span className="font-semibold text-gray-800">{seeker.email || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Date of Birth</span>
              <span className="font-semibold text-gray-800">{seeker.date_of_birth || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Anniversary Date</span>
              <span className="font-semibold text-gray-800">{seeker.anniversary_date || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Center</span>
              <span className="font-semibold text-gray-800">
                {seeker.centers?.name_en || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Registration Date</span>
              <span className="font-semibold text-gray-800">{seeker.registration_date}</span>
            </div>
          </div>

          {seeker.is_minor && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
              <span className="font-bold text-blue-900 block">Minor Seeker Information</span>
              <p className="text-blue-800">Guardian: {seeker.guardian_name || 'Linked Guardian'}</p>
              {seeker.guardian_relation && (
                <p className="text-blue-700">Relation: {seeker.guardian_relation}</p>
              )}
            </div>
          )}

          <div>
            <span className="text-gray-400 block mb-0.5">Address</span>
            <span className="font-medium text-gray-700">
              {seeker.address_en || seeker.address_gu || seeker.city || 'Bhuj, Gujarat'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-gray-500">
            <span>WhatsApp Notifications:</span>
            <span className={seeker.notification_consent ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {seeker.notification_consent ? '✓ Opted In' : '✗ Opted Out'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <a
            href={`/dashboard/seekers/${seeker.id}/edit`}
            className="text-xs font-semibold text-[#E8973A] hover:underline"
          >
            Edit Seeker Profile →
          </a>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
