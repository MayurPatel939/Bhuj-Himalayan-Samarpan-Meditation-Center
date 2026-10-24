import React, { useState, useEffect } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import type { Activity, ActivityType, ActivityRegistration } from '../lib/types';
import { ACTIVITY_TYPE_LABELS } from '../lib/types';

interface ActivityManagerProps {
  locale?: 'en' | 'gu';
  centers?: Array<{ id: string; name_en: string; name_gu: string }>;
}

export const ActivityManager: React.FC<ActivityManagerProps> = ({
  locale = 'en',
  centers = [],
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  // Attendee Roster Modal
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [attendees, setAttendees] = useState<ActivityRegistration[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [seekerSearch, setSeekerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingSeeker, setIsSearchingSeeker] = useState(false);

  // New Activity Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    title_en: '',
    title_gu: '',
    activity_type: 'ratri_sadhna' as ActivityType,
    description_en: '',
    venue_en: '',
    center_id: '',
    start_datetime: '',
    max_capacity: 100,
    is_recurring: false,
  });
  const [creating, setCreating] = useState(false);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '30',
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });
      const res = await fetch(`/api/activities?${params}`);
      const data = await res.json();
      if (res.ok) {
        setActivities(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [typeFilter]);

  const openAttendees = async (act: Activity) => {
    setActiveActivity(act);
    setIsLoadingAttendees(true);
    try {
      const res = await fetch(`/api/activities/registrations?activity_id=${act.id}`);
      const data = await res.json();
      if (res.ok) {
        setAttendees(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load attendees:', err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  const searchSeekers = async (q: string) => {
    setSeekerSearch(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingSeeker(true);
    try {
      const res = await fetch(`/api/seekers?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingSeeker(false);
    }
  };

  const handleRegisterSeeker = async (seekerId: string) => {
    if (!activeActivity) return;
    try {
      const res = await fetch('/api/activities/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activeActivity.id,
          seeker_id: seekerId,
        }),
      });

      if (res.ok) {
        setSeekerSearch('');
        setSearchResults([]);
        openAttendees(activeActivity);
        fetchActivities();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to register');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAttendance = async (regId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'attended' ? 'registered' : 'attended';
    try {
      const res = await fetch('/api/activities/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: regId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        if (activeActivity) openAttendees(activeActivity);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });

      if (res.ok) {
        setShowNewModal(false);
        fetchActivities();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create activity');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale === 'gu' ? 'gu-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{locale === 'gu' ? 'પ્રકાર:' : 'Filter type:'}</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="all">{locale === 'gu' ? 'તમામ પ્રવૃત્તિઓ' : 'All Activities'}</option>
            <option value="ratri_sadhna">
              {locale === 'gu' ? ACTIVITY_TYPE_LABELS.ratri_sadhna.gu : ACTIVITY_TYPE_LABELS.ratri_sadhna.en}
            </option>
            <option value="sports">
              {locale === 'gu' ? ACTIVITY_TYPE_LABELS.sports.gu : ACTIVITY_TYPE_LABELS.sports.en}
            </option>
            <option value="community">
              {locale === 'gu' ? ACTIVITY_TYPE_LABELS.community.gu : ACTIVITY_TYPE_LABELS.community.en}
            </option>
          </select>
        </div>

        <Button variant="saffron" size="sm" onClick={() => setShowNewModal(true)}>
          <span>+</span>
          <span>{locale === 'gu' ? 'નવી રાત્રિ સાધના / પ્રવૃત્તિ ઉમેરો' : 'Schedule Activity / Ratri Sadhna'}</span>
        </Button>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🌙</div>
          <h3 className="text-sm font-bold text-gray-900">
            {locale === 'gu' ? 'કોઈ સક્રિય પ્રવૃત્તિ કે રાત્રિ સાધના મળેલ નથી' : 'No activities scheduled yet'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {locale === 'gu' ? 'પૂર્ણિમા રાત્રિ સાધના અથવા સમુદાય પ્રવૃત્તિનું આયોજન કરો' : 'Schedule a Poornima Ratri Sadhna or community seva session.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act) => {
            const label = ACTIVITY_TYPE_LABELS[act.activity_type];
            const title = locale === 'gu' && act.title_gu ? act.title_gu : act.title_en;
            const centerName = locale === 'gu' && act.centers?.name_gu ? act.centers.name_gu : act.centers?.name_en;

            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={label.color}>
                      {locale === 'gu' ? label.gu : label.en}
                    </Badge>
                    {act.is_recurring && (
                      <Badge variant="blue">{locale === 'gu' ? 'પુનરાવર્તિત' : 'Recurring'}</Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    {act.description_en && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {locale === 'gu' && act.description_gu ? act.description_gu : act.description_en}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E8973A]">🕒</span>
                      <span>{formatDateTime(act.start_datetime)}</span>
                    </div>
                    {act.venue_en && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#E8973A]">📍</span>
                        <span className="truncate">{act.venue_en}</span>
                      </div>
                    )}
                    {centerName && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#E8973A]">🏛️</span>
                        <span>{centerName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>👥 {act.registration_count || 0} {locale === 'gu' ? 'નોંધાયેલ સાધકો' : 'registered'}</span>
                    {act.max_capacity && (
                      <span>Max: {act.max_capacity}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-end">
                  <Button variant="secondary" size="sm" onClick={() => openAttendees(act)}>
                    📋 {locale === 'gu' ? 'સાધકો અને હાજરી' : 'Roster & Attendance'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attendees & Check-in Modal */}
      {activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {locale === 'gu' && activeActivity.title_gu ? activeActivity.title_gu : activeActivity.title_en}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {locale === 'gu' ? 'હાજરી ટ્રેકિંગ અને સાધક નોંધણી' : 'Attendee Roster & Attendance Check-in'}
                </p>
              </div>
              <button
                onClick={() => setActiveActivity(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Register Input */}
            <div className="p-4 bg-gray-50/70 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-700 block mb-1">
                {locale === 'gu' ? 'સાધકની ત્વરિત નોંધણી કરો:' : 'Quick register seeker:'}
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={seekerSearch}
                  onChange={(e) => searchSeekers(e.target.value)}
                  placeholder="Search seeker by name or mobile..."
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                />

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto divide-y divide-gray-50">
                    {searchResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleRegisterSeeker(s.id)}
                        className="p-2.5 text-xs cursor-pointer flex items-center justify-between hover:bg-[#FFF9F3]"
                      >
                        <span className="font-semibold text-gray-800">{s.first_name_en} {s.last_name_en}</span>
                        <span className="text-gray-400 text-[10px] font-mono">{s.seeker_id} • {s.mobile}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingAttendees ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  {locale === 'gu' ? 'હજુ સુધી કોઈ સાધક નોંધાયેલ નથી' : 'No seekers registered for this session yet.'}
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2.5 w-10">Attended</th>
                      <th className="px-3 py-2.5">Seeker</th>
                      <th className="px-3 py-2.5">Mobile</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendees.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={reg.status === 'attended'}
                            onChange={() => handleToggleAttendance(reg.id, reg.status)}
                            className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">
                          {reg.seekers?.first_name_en} {reg.seekers?.last_name_en}
                          <span className="block text-[10px] text-gray-400 font-mono">{reg.seekers?.seeker_id}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{reg.seekers?.mobile || '—'}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant={reg.status === 'attended' ? 'sage' : 'gray'}>
                            {reg.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {locale === 'gu' ? 'નવી પ્રવૃત્તિ ઉમેરો' : 'Schedule New Activity'}
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'પ્રવૃત્તિ પ્રકાર' : 'Activity Type'}
                </label>
                <select
                  value={newForm.activity_type}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, activity_type: e.target.value as ActivityType }))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                >
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {locale === 'gu' ? v.gu : v.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'શીર્ષક (English)' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  value={newForm.title_en}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Poornima Ratri Sadhna"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'શીર્ષક (ગુજરાતી)' : 'Title (Gujarati)'}
                </label>
                <input
                  type="text"
                  value={newForm.title_gu}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, title_gu: e.target.value }))}
                  placeholder="દા.ત. પૂર્ણિમા રાત્રિ સાધના"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {locale === 'gu' ? 'તારીખ અને સમય' : 'Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={newForm.start_datetime}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, start_datetime: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {locale === 'gu' ? 'કેન્દ્ર' : 'Center'}
                  </label>
                  <select
                    value={newForm.center_id}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, center_id: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                  >
                    <option value="">General (All Centers)</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === 'gu' ? c.name_gu : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'સ્થળ' : 'Venue'}
                </label>
                <input
                  type="text"
                  value={newForm.venue_en}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, venue_en: e.target.value }))}
                  placeholder="e.g. Madhapar Samarpan Hall"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="saffron" size="sm" disabled={creating}>
                  {creating ? 'Saving...' : 'Create Activity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
