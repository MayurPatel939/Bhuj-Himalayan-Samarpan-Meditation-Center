import React, { useState } from 'react';
import { Search, Plus, Edit, MapPin, User, Users } from 'lucide-react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import type { MeditationCenter } from '../lib/types';

interface CenterTableProps {
  initialCenters: MeditationCenter[];
  locale?: 'en' | 'gu';
  isAdmin?: boolean;
}

export const CenterTable: React.FC<CenterTableProps> = ({
  initialCenters,
  locale = 'en',
  isAdmin = false,
}) => {
  const [centers, setCenters] = useState<MeditationCenter[]>(initialCenters);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCenters = centers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const lower = searchTerm.toLowerCase();
    return (
      c.name_en.toLowerCase().includes(lower) ||
      c.name_gu.toLowerCase().includes(lower) ||
      (c.shanchalak_name && c.shanchalak_name.toLowerCase().includes(lower)) ||
      (c.city && c.city.toLowerCase().includes(lower))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search centers or Shanchalaks..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E8973A] focus:border-transparent"
          />
        </div>

        {isAdmin && (
          <a href="/dashboard/centers/new">
            <Button size="sm" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Meditation Center</span>
            </Button>
          </a>
        )}
      </div>

      {/* Grid of Center Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-100">
            No meditation centers found.
          </div>
        ) : (
          filteredCenters.map((center) => {
            const nameDisplay = locale === 'gu' ? center.name_gu : center.name_en;
            const addressDisplay = locale === 'gu'
              ? center.address_gu || center.address_en
              : center.address_en || center.address_gu;

            return (
              <div
                key={center.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                      {nameDisplay}
                    </h3>
                    <Badge variant={center.is_active ? 'sage' : 'gray'}>
                      {center.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {locale !== 'gu' && center.name_gu && (
                    <p className="text-xs text-gray-400 font-medium mb-3">
                      {center.name_gu}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-[#E8973A] flex-shrink-0 mt-0.5" />
                      <span>{addressDisplay || `${center.city}, Gujarat`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Shanchalak: <strong className="text-gray-800">{center.shanchalak_name || '—'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Registered Seekers: <strong className="text-gray-800">{center.seeker_count ?? 0}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Meditation Days Tags */}
                  {center.meditation_days && center.meditation_days.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {center.meditation_days.map((day, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#FFF9F3] text-[#C2741C] border border-[#FDEED9] rounded-md text-[10px] font-semibold"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <a
                    href={`/dashboard/seekers?center_id=${center.id}`}
                    className="text-xs font-semibold text-[#E8973A] hover:underline"
                  >
                    View Seekers →
                  </a>

                  {isAdmin && (
                    <a
                      href={`/dashboard/centers/${center.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-[#E8973A] hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit Center"
                    >
                      <Edit className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
