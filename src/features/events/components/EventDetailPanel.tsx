import React, { useState, useEffect } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import { EVENT_STATUS_LABELS, REGISTRATION_STATUS_LABELS } from '../lib/types';
import type { MeditationEvent, EventRegistration, RegistrationStatus } from '../lib/types';

interface EventDetailPanelProps {
  eventId: string;
  locale?: 'en' | 'gu';
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ eventId, locale = 'en' }) => {
  const [event, setEvent] = useState<MeditationEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [seekerSearch, setSeekerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEventData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setRegistrations(data.registrations || []);
        // Pre-populate attendance map
        const map: Record<string, boolean> = {};
        (data.registrations || []).forEach((r: EventRegistration) => {
          if (r.status === 'registered' || r.status === 'attended') {
            map[r.id] = r.status === 'attended';
          }
        });
        setAttendanceMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const searchSeekers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/seekers?search=${encodeURIComponent(query)}&limit=10&status=active`);
      const data = await res.json();
      if (res.ok) {
        // Filter out already-registered seekers
        const registeredIds = new Set(registrations.filter(r => r.status !== 'cancelled').map(r => r.seeker_id));
        setSearchResults((data.data || []).filter((s: any) => !registeredIds.has(s.id)));
      }
    } catch (err) {
      console.error('Seeker search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const registerSeeker = async (seekerId: string) => {
    setActionLoading(seekerId);
    try {
      const res = await fetch('/api/events/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, seeker_id: seekerId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchEventData();
        setSeekerSearch('');
        setSearchResults([]);
        if (data.wasWaitlisted) {
          alert(`Seeker added to waitlist at position ${data.waitlistPosition}`);
        }
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const updateRegistration = async (registrationId: string, action: 'cancel' | 'attend' | 'no_show') => {
    setActionLoading(registrationId);
    try {
      const res = await fetch(`/api/events/registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchEventData();
        if (data.promotedSeeker) {
          alert(`${data.promotedSeeker.first_name_en} ${data.promotedSeeker.last_name_en} was promoted from waitlist!`);
        }
      } else {
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const submitBulkAttendance = async () => {
    const attendanceEntries = Object.entries(attendanceMap).map(([regId, attended]) => ({
      registration_id: regId,
      attended,
    }));

    setActionLoading('bulk');
    try {
      const res = await fetch('/api/events/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, registrations: attendanceEntries }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setAttendanceMode(false);
        await fetchEventData();
      } else {
        alert(data.error || 'Attendance update failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const sendEventNotification = async () => {
    const registeredSeekerIds = registrations
      .filter(r => ['registered', 'attended'].includes(r.status))
      .map(r => r.seeker_id);

    if (registeredSeekerIds.length === 0) {
      alert('No registered seekers to notify');
      return;
    }

    setActionLoading('notify');
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: 'event_announcement_notice',
          seeker_ids: registeredSeekerIds,
          event_id: eventId,
          custom_params: [
            event?.title_en || '',
            event?.venue_en || '',
            event?.start_date ? new Date(event.start_date).toLocaleDateString('en-IN') : '',
          ],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Notifications sent: ${data.sent} successful, ${data.failed} failed`);
      } else {
        alert(data.error || 'Failed to send notifications');
      }
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-500">Event not found</p>
      </div>
    );
  }

  const statusLabel = EVENT_STATUS_LABELS[event.status];
  const registered = registrations.filter(r => ['registered', 'attended'].includes(r.status));
  const waitlisted = registrations.filter(r => r.status === 'waitlisted');
  const cancelled = registrations.filter(r => r.status === 'cancelled');

  const statusBadgeColor: Record<string, 'gray' | 'sage' | 'danger' | 'warning' | 'blue' | 'saffron'> = {
    gray: 'gray', blue: 'blue', green: 'sage', amber: 'warning',
    purple: 'blue', emerald: 'sage', red: 'danger',
  };

  return (
    <div className="space-y-6">
      {/* Event Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={statusBadgeColor[statusLabel.color] || 'gray'}>
                {locale === 'gu' ? statusLabel.gu : statusLabel.en}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {locale === 'gu' && event.title_gu ? event.title_gu : event.title_en}
            </h1>
            {event.description_en && (
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                {locale === 'gu' && event.description_gu ? event.description_gu : event.description_en}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/dashboard/events/${eventId}/edit`}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ✏️ Edit
            </a>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendEventNotification()}
              isLoading={actionLoading === 'notify'}
            >
              📱 Send WhatsApp
            </Button>
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-50">
          <div>
            <span className="text-xs text-gray-500">📅 Start</span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {new Date(event.start_date).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">📅 End</span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {new Date(event.end_date).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">📍 Venue</span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {locale === 'gu' && event.venue_gu ? event.venue_gu : event.venue_en || '—'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">👥 Capacity</span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {registered.length}{event.max_capacity ? ` / ${event.max_capacity}` : ' (unlimited)'}
            </p>
          </div>
        </div>
      </div>

      {/* Registration Management */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs">
        <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900">
            {locale === 'gu' ? 'નોંધણી સંચાલન' : 'Registration Management'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => setShowRegisterModal(!showRegisterModal)}>
              ➕ {locale === 'gu' ? 'સાધક ઉમેરો' : 'Register Seeker'}
            </Button>
            <Button
              size="sm"
              variant={attendanceMode ? 'primary' : 'outline'}
              onClick={() => {
                if (attendanceMode) {
                  submitBulkAttendance();
                } else {
                  setAttendanceMode(true);
                }
              }}
              isLoading={actionLoading === 'bulk'}
            >
              {attendanceMode ? '✅ Save Attendance' : '📋 Mark Attendance'}
            </Button>
            {attendanceMode && (
              <Button size="sm" variant="ghost" onClick={() => setAttendanceMode(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Seeker Search + Register */}
        {showRegisterModal && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100">
            <div className="relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder={locale === 'gu' ? 'સાધક શોધો (નામ, મોબાઈલ, ID)...' : 'Search seeker (name, mobile, ID)...'}
                value={seekerSearch}
                onChange={(e) => {
                  setSeekerSearch(e.target.value);
                  searchSeekers(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
                {searchResults.map((seeker) => (
                  <div key={seeker.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {locale === 'gu' && seeker.first_name_gu
                          ? `${seeker.first_name_gu} ${seeker.last_name_en}`
                          : `${seeker.first_name_en} ${seeker.last_name_en}`}
                      </p>
                      <p className="text-xs text-gray-500">{seeker.seeker_id} • {seeker.mobile || 'No mobile'}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => registerSeeker(seeker.id)}
                      isLoading={actionLoading === seeker.id}
                    >
                      Register
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isSearching && (
              <p className="text-xs text-gray-400 mt-2">Searching...</p>
            )}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 border-b border-gray-50">
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500">{locale === 'gu' ? 'નોંધાયેલ' : 'Registered'}</p>
            <p className="text-xl font-bold text-green-700 mt-0.5">{registered.length}</p>
          </div>
          <div className="p-4 text-center border-x border-gray-50">
            <p className="text-xs text-gray-500">{locale === 'gu' ? 'પ્રતિક્ષામાં' : 'Waitlisted'}</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{waitlisted.length}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500">{locale === 'gu' ? 'રદ' : 'Cancelled'}</p>
            <p className="text-xl font-bold text-red-600 mt-0.5">{cancelled.length}</p>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                {attendanceMode && <th className="px-4 py-3 text-left w-10">✓</th>}
                <th className="px-4 py-3 text-left">Seeker</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Mobile</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Registered</th>
                {!attendanceMode && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registrations
                .filter(r => r.status !== 'cancelled')
                .map((reg) => {
                  const seeker = reg.seekers;
                  const regStatus = REGISTRATION_STATUS_LABELS[reg.status];
                  const regBadgeColor: Record<string, 'gray' | 'sage' | 'danger' | 'warning' | 'blue' | 'saffron'> = {
                    green: 'sage', amber: 'warning', red: 'danger', emerald: 'sage', gray: 'gray',
                  };

                  return (
                    <tr key={reg.id} className="hover:bg-gray-50/50">
                      {attendanceMode && (
                        <td className="px-4 py-3">
                          {['registered', 'attended'].includes(reg.status) && (
                            <input
                              type="checkbox"
                              checked={attendanceMap[reg.id] || false}
                              onChange={(e) =>
                                setAttendanceMap((prev) => ({
                                  ...prev,
                                  [reg.id]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {seeker
                          ? locale === 'gu' && seeker.first_name_gu
                            ? `${seeker.first_name_gu} ${seeker.last_name_en}`
                            : `${seeker.first_name_en} ${seeker.last_name_en}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{seeker?.seeker_id || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{seeker?.mobile || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={regBadgeColor[regStatus.color] || 'gray'}>
                          {locale === 'gu' ? regStatus.gu : regStatus.en}
                        </Badge>
                        {reg.waitlist_position && (
                          <span className="ml-1 text-xs text-amber-600">#{reg.waitlist_position}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(reg.registered_at).toLocaleDateString('en-IN')}
                      </td>
                      {!attendanceMode && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {reg.status === 'registered' && (
                              <button
                                onClick={() => updateRegistration(reg.id, 'cancel')}
                                disabled={actionLoading === reg.id}
                                className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50 transition-colors"
                                title="Cancel Registration"
                              >
                                ✕ Cancel
                              </button>
                            )}
                            {reg.status === 'waitlisted' && (
                              <button
                                onClick={() => updateRegistration(reg.id, 'cancel')}
                                disabled={actionLoading === reg.id}
                                className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50 transition-colors"
                                title="Remove from Waitlist"
                              >
                                ✕ Remove
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {registrations.filter(r => r.status !== 'cancelled').length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-gray-400">
                {locale === 'gu' ? 'કોઈ નોંધણી નથી' : 'No registrations yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
