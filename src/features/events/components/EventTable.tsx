import React, { useState, useEffect } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '../lib/types';
import type { MeditationEvent, EventStatus, EventType } from '../lib/types';

interface EventTableProps {
  locale?: 'en' | 'gu';
}

export const EventTable: React.FC<EventTableProps> = ({ locale = 'en' }) => {
  const [events, setEvents] = useState<MeditationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchEvents = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { event_type: typeFilter }),
      });

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();

      if (res.ok) {
        setEvents(data.data || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, [search, statusFilter, typeFilter]);

  const getStatusBadge = (status: EventStatus) => {
    const label = EVENT_STATUS_LABELS[status];
    const colorMap: Record<string, 'gray' | 'sage' | 'danger' | 'warning' | 'blue' | 'saffron'> = {
      gray: 'gray', blue: 'blue', green: 'sage', amber: 'warning',
      purple: 'blue', emerald: 'sage', red: 'danger',
    };
    return <Badge variant={colorMap[label.color] || 'gray'}>{locale === 'gu' ? label.gu : label.en}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'gu' ? 'gu-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={locale === 'gu' ? 'કાર્યક્રમ શોધો...' : 'Search events...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30 focus:border-[#E8973A]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
        >
          <option value="all">{locale === 'gu' ? 'બધી સ્થિતિ' : 'All Statuses'}</option>
          {Object.entries(EVENT_STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{locale === 'gu' ? val.gu : val.en}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
        >
          <option value="all">{locale === 'gu' ? 'બધા પ્રકાર' : 'All Types'}</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{locale === 'gu' ? val.gu : val.en}</option>
          ))}
        </select>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-sm font-bold text-gray-900">
            {locale === 'gu' ? 'કોઈ કાર્યક્રમ મળ્યો નથી' : 'No events found'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {locale === 'gu' ? 'નવો કાર્યક્રમ બનાવવા માટે ઉપર ક્લિક કરો' : 'Click "Create Event" to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const title = locale === 'gu' && event.title_gu ? event.title_gu : event.title_en;
            const venue = locale === 'gu' && event.venue_gu ? event.venue_gu : event.venue_en;
            const typeLabel = EVENT_TYPE_LABELS[event.event_type];
            const capacityPercent = event.max_capacity
              ? Math.round(((event.registration_count || 0) / event.max_capacity) * 100)
              : null;

            return (
              <a
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-sm hover:border-[#E8973A]/30 transition-all duration-200 group"
              >
                <div className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C2741C] transition-colors truncate">
                        {title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {locale === 'gu' ? typeLabel.gu : typeLabel.en}
                      </span>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                    {venue && (
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="truncate">{venue}</span>
                      </div>
                    )}
                    {event.centers && (
                      <div className="flex items-center gap-1.5">
                        <span>🏛️</span>
                        <span>{locale === 'gu' ? event.centers.name_gu : event.centers.name_en}</span>
                      </div>
                    )}
                  </div>

                  {/* Registration Stats */}
                  <div className="pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        👥 {event.registration_count || 0}
                        {event.max_capacity ? ` / ${event.max_capacity}` : ''} {locale === 'gu' ? 'નોંધાયેલ' : 'registered'}
                      </span>
                      {(event.waitlist_count || 0) > 0 && (
                        <span className="text-amber-600 font-medium">
                          ⏳ {event.waitlist_count} {locale === 'gu' ? 'પ્રતિક્ષામાં' : 'waitlisted'}
                        </span>
                      )}
                    </div>
                    {capacityPercent !== null && (
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-amber-500' : 'bg-[#E8973A]'
                          }`}
                          style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            {locale === 'gu' ? `કુલ ${pagination.total} કાર્યક્રમ` : `${pagination.total} events total`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEvents(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← {locale === 'gu' ? 'પાછળ' : 'Previous'}
            </button>
            <span className="text-xs text-gray-600 font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchEvents(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {locale === 'gu' ? 'આગળ' : 'Next'} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
