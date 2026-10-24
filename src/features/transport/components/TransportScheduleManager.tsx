import React, { useState, useEffect } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import type { TransportSchedule, Vehicle, Route, TransportBooking } from '../lib/types';
import { VEHICLE_TYPE_LABELS, BOOKING_STATUS_LABELS } from '../lib/types';

interface TransportScheduleManagerProps {
  locale?: 'en' | 'gu';
  initialVehicles?: Vehicle[];
  initialRoutes?: Route[];
}

export const TransportScheduleManager: React.FC<TransportScheduleManagerProps> = ({
  locale = 'en',
  initialVehicles = [],
  initialRoutes = [],
}) => {
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  // Passenger Modal State
  const [activeSchedule, setActiveSchedule] = useState<TransportSchedule | null>(null);
  const [passengers, setPassengers] = useState<TransportBooking[]>([]);
  const [isLoadingPassengers, setIsLoadingPassengers] = useState(false);

  // Book Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [targetSchedule, setTargetSchedule] = useState<TransportSchedule | null>(null);
  const [seekerSearch, setSeekerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingSeeker, setIsSearchingSeeker] = useState(false);
  const [selectedSeekerId, setSelectedSeekerId] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // New Schedule Modal State
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [newScheduleForm, setNewScheduleForm] = useState({
    vehicle_id: '',
    route_id: '',
    departure_datetime: '',
    available_seats: 30,
    fare_amount: 0,
    is_free: true,
    notes: '',
  });
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '30',
        ...(typeFilter !== 'all' && { vehicle_type: typeFilter }),
      });
      const res = await fetch(`/api/transport/schedules?${params}`);
      const data = await res.json();
      if (res.ok) {
        setSchedules(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [typeFilter]);

  // Load vehicles & routes if not provided
  useEffect(() => {
    if (vehicles.length === 0) {
      fetch('/api/transport/vehicles')
        .then((r) => r.json())
        .then((d) => setVehicles(d.data || []))
        .catch(console.error);
    }
    if (routes.length === 0) {
      fetch('/api/transport/routes')
        .then((r) => r.json())
        .then((d) => setRoutes(d.data || []))
        .catch(console.error);
    }
  }, []);

  const openPassengerList = async (schedule: TransportSchedule) => {
    setActiveSchedule(schedule);
    setIsLoadingPassengers(true);
    try {
      const res = await fetch(`/api/transport/schedules/${schedule.id}`);
      const data = await res.json();
      if (res.ok) {
        setPassengers(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load passengers:', err);
    } finally {
      setIsLoadingPassengers(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(locale === 'gu' ? 'શું તમે આ બુકિંગ રદ કરવા માંગો છો?' : 'Are you sure you want to cancel this seat booking?')) {
      return;
    }

    try {
      const res = await fetch(`/api/transport/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) {
        if (activeSchedule) openPassengerList(activeSchedule);
        fetchSchedules();
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  // Seeker search for booking
  const searchSeekers = async (q: string) => {
    setSeekerSearch(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingSeeker(true);
    try {
      const res = await fetch(`/api/seekers?search=${encodeURIComponent(q)}&limit=8`);
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

  const handleBookSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSchedule || !selectedSeekerId) return;

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      const res = await fetch('/api/transport/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: targetSchedule.id,
          seeker_id: selectedSeekerId,
          pickup_point: pickupPoint || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookingMessage(data.message || 'Booked successfully!');
        fetchSchedules();
        setTimeout(() => {
          setShowBookModal(false);
          setBookingMessage(null);
          setSelectedSeekerId('');
          setSeekerSearch('');
          setSearchResults([]);
        }, 1200);
      } else {
        setBookingMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setBookingMessage(`Error: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSchedule(true);

    try {
      const res = await fetch('/api/transport/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScheduleForm),
      });

      if (res.ok) {
        setShowNewScheduleModal(false);
        fetchSchedules();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Failed to create schedule:', err);
    } finally {
      setCreatingSchedule(false);
    }
  };

  const exportPassengersCSV = () => {
    if (!activeSchedule || passengers.length === 0) return;

    const headers = ['Seeker ID', 'Name', 'Mobile', 'Pickup Point', 'Status', 'Waitlist #', 'Booked At'];
    const rows = passengers.map((p) => [
      p.seekers?.seeker_id || '',
      `"${p.seekers?.first_name_en || ''} ${p.seekers?.last_name_en || ''}"`,
      p.seekers?.mobile || '',
      `"${p.pickup_point || ''}"`,
      p.status,
      p.waitlist_position || '',
      new Date(p.booked_at).toLocaleString('en-IN'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `passengers_${activeSchedule.id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <span className="text-xs text-gray-500">{locale === 'gu' ? 'વાહન પ્રકાર:' : 'Filter vehicle:'}</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="all">{locale === 'gu' ? 'તમામ વાહનો' : 'All Vehicles'}</option>
            <option value="dhyan_rath">
              {locale === 'gu' ? VEHICLE_TYPE_LABELS.dhyan_rath.gu : VEHICLE_TYPE_LABELS.dhyan_rath.en}
            </option>
            <option value="bus">
              {locale === 'gu' ? VEHICLE_TYPE_LABELS.bus.gu : VEHICLE_TYPE_LABELS.bus.en}
            </option>
          </select>
        </div>

        <Button
          variant="saffron"
          size="sm"
          onClick={() => setShowNewScheduleModal(true)}
        >
          <span>+</span>
          <span>{locale === 'gu' ? 'નવો પ્રવાસ સમયપત્રક ઉમેરો' : 'Schedule New Trip'}</span>
        </Button>
      </div>

      {/* Schedules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🚌</div>
          <h3 className="text-sm font-bold text-gray-900">
            {locale === 'gu' ? 'કોઈ સક્રિય વાહન પ્રવાસ મળ્યો નથી' : 'No transport schedules found'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {locale === 'gu' ? 'ધ્યાન રથ અથવા બસ માટે નવો સમયપત્રક ઉમેરો' : 'Schedule a Dhyan Rath route or event bus.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((item) => {
            const vType = item.vehicles?.vehicle_type || 'dhyan_rath';
            const vLabel = VEHICLE_TYPE_LABELS[vType];
            const routeName = locale === 'gu' && item.routes?.name_gu ? item.routes.name_gu : item.routes?.name_en;
            const occupancy = Math.round((item.booked_seats / item.available_seats) * 100);
            const isFull = item.booked_seats >= item.available_seats;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={vType === 'dhyan_rath' ? 'saffron' : 'blue'}>
                      {locale === 'gu' ? vLabel.gu : vLabel.en}
                    </Badge>
                    <Badge variant={item.booking_open ? (isFull ? 'warning' : 'sage') : 'gray'}>
                      {item.booking_open
                        ? isFull
                          ? (locale === 'gu' ? 'સંપૂર્ણ (વેઇટલિસ્ટ)' : 'Full (Waitlist)')
                          : (locale === 'gu' ? 'બુકિંગ શરૂ' : 'Booking Open')
                        : (locale === 'gu' ? 'બુકિંગ બંધ' : 'Closed')}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{routeName || 'Special Route'}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {item.vehicles?.name} {item.vehicles?.registration_number && `(${item.vehicles.registration_number})`}
                    </p>
                  </div>

                  {/* Route & Timing details */}
                  <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E8973A]">📍</span>
                      <span className="truncate">
                        <strong>{item.routes?.origin}</strong> → <strong>{item.routes?.destination}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#E8973A]">🕒</span>
                      <span>{formatDateTime(item.departure_datetime)}</span>
                    </div>
                    {item.vehicles?.driver_name && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>👤</span>
                        <span>{item.vehicles.driver_name} ({item.vehicles.driver_contact || '—'})</span>
                      </div>
                    )}
                  </div>

                  {/* Seat Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">
                        💺 {item.booked_seats} / {item.available_seats} {locale === 'gu' ? 'બેઠકો ભરેલ' : 'Seats booked'}
                      </span>
                      {(item.waitlist_count || 0) > 0 && (
                        <span className="text-amber-600 font-semibold">
                          ⏳ {item.waitlist_count} {locale === 'gu' ? 'પ્રતિક્ષામાં' : 'waitlisted'}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          occupancy >= 100 ? 'bg-red-500' : occupancy >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openPassengerList(item)}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                  >
                    <span>📋</span>
                    <span>{locale === 'gu' ? 'યાત્રી યાદી' : 'Passenger List'}</span>
                  </button>

                  <Button
                    variant="saffron"
                    size="sm"
                    disabled={!item.booking_open}
                    onClick={() => {
                      setTargetSchedule(item);
                      setShowBookModal(true);
                    }}
                  >
                    <span>{locale === 'gu' ? 'બેઠક બુક કરો' : 'Book Seat'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Passenger List Modal */}
      {activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {locale === 'gu' ? 'યાત્રી યાદી (Passenger Roster)' : 'Passenger List'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeSchedule.vehicles?.name} • {formatDateTime(activeSchedule.departure_datetime)}
                </p>
              </div>
              <button
                onClick={() => setActiveSchedule(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingPassengers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : passengers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  {locale === 'gu' ? 'હજુ સુધી કોઈ બેઠક બુક થયેલ નથી' : 'No passengers booked for this trip yet.'}
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2.5">Seeker</th>
                      <th className="px-3 py-2.5">Mobile</th>
                      <th className="px-3 py-2.5">Pickup Point</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {passengers.map((p) => {
                      const st = BOOKING_STATUS_LABELS[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 font-medium text-gray-900">
                            {p.seekers?.first_name_en} {p.seekers?.last_name_en}
                            <span className="block text-[10px] text-gray-400">{p.seekers?.seeker_id}</span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">{p.seekers?.mobile || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{p.pickup_point || 'Default Origin'}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={st?.color || 'gray'}>
                              {locale === 'gu' ? st?.gu : st?.en}
                            </Badge>
                            {p.waitlist_position && (
                              <span className="ml-1 text-xs text-amber-600 font-semibold">#{p.waitlist_position}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {p.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelBooking(p.id)}
                                className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                              >
                                {locale === 'gu' ? 'રદ કરો' : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-3xl">
              <span className="text-xs text-gray-500">
                {passengers.filter((p) => p.status === 'confirmed').length} {locale === 'gu' ? 'મંજૂર યાત્રીઓ' : 'confirmed'}
              </span>
              <Button variant="secondary" size="sm" onClick={exportPassengersCSV} disabled={passengers.length === 0}>
                📥 {locale === 'gu' ? 'CSV ડાઉનલોડ કરો' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Book Seat Modal */}
      {showBookModal && targetSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {locale === 'gu' ? 'સાધક માટે બેઠક બુક કરો' : 'Book Passenger Seat'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {targetSchedule.vehicles?.name} • {targetSchedule.routes?.origin} → {targetSchedule.routes?.destination}
                </p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">
                ✕
              </button>
            </div>

            {bookingMessage && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                {bookingMessage}
              </div>
            )}

            <form onSubmit={handleBookSeat} className="space-y-4">
              {/* Seeker Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'સાધક શોધો (નામ, મોબાઇલ અથવા ID)' : 'Search Seeker (Name, Mobile, or Seeker ID)'}
                </label>
                <input
                  type="text"
                  value={seekerSearch}
                  onChange={(e) => searchSeekers(e.target.value)}
                  placeholder="e.g. 98250 or BHJ-0001"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                />

                {isSearchingSeeker && (
                  <p className="text-[11px] text-gray-400 mt-1">Searching directory...</p>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-gray-50 bg-gray-50/50">
                    {searchResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedSeekerId(s.id);
                          setSeekerSearch(`${s.first_name_en} ${s.last_name_en} (${s.seeker_id})`);
                          setSearchResults([]);
                        }}
                        className={`p-2.5 text-xs cursor-pointer flex items-center justify-between hover:bg-[#FFF9F3] ${
                          selectedSeekerId === s.id ? 'bg-[#FFF9F3] text-[#C2741C] font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span>{s.first_name_en} {s.last_name_en}</span>
                        <span className="font-mono text-gray-400">{s.seeker_id} • {s.mobile}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pickup Point Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'પિકઅપ પોઇન્ટ' : 'Pickup Point / Stop'}
                </label>
                <input
                  type="text"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  placeholder="e.g. Jubilee Circle, Bhuj"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowBookModal(false)}>
                  {locale === 'gu' ? 'રદ કરો' : 'Cancel'}
                </Button>
                <Button type="submit" variant="saffron" size="sm" disabled={!selectedSeekerId || bookingLoading}>
                  {bookingLoading ? 'Booking...' : (locale === 'gu' ? 'બુકિંગ કન્ફર્મ કરો' : 'Confirm Seat Booking')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule New Trip Modal */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {locale === 'gu' ? 'નવો પ્રવાસ સમયપત્રક ઉમેરો' : 'Schedule New Trip'}
              </h3>
              <button onClick={() => setShowNewScheduleModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'વાહન પસંદ કરો' : 'Select Vehicle'}
                </label>
                <select
                  value={newScheduleForm.vehicle_id}
                  onChange={(e) => {
                    const vId = e.target.value;
                    const v = vehicles.find((veh) => veh.id === vId);
                    setNewScheduleForm((prev) => ({
                      ...prev,
                      vehicle_id: vId,
                      available_seats: v?.seat_capacity || 30,
                    }));
                  }}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vehicle_type}) — {v.seat_capacity} seats
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'રૂટ પસંદ કરો' : 'Select Route'}
                </label>
                <select
                  value={newScheduleForm.route_id}
                  onChange={(e) => setNewScheduleForm((prev) => ({ ...prev, route_id: e.target.value }))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                  required
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name_en} ({r.origin} → {r.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {locale === 'gu' ? 'ઉપડવાનો સમય' : 'Departure Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={newScheduleForm.departure_datetime}
                    onChange={(e) => setNewScheduleForm((prev) => ({ ...prev, departure_datetime: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {locale === 'gu' ? 'ઉપલબ્ધ બેઠકો' : 'Available Seats'}
                  </label>
                  <input
                    type="number"
                    value={newScheduleForm.available_seats}
                    onChange={(e) => setNewScheduleForm((prev) => ({ ...prev, available_seats: parseInt(e.target.value) }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewScheduleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="saffron" size="sm" disabled={creatingSchedule}>
                  {creatingSchedule ? 'Creating...' : 'Schedule Trip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
