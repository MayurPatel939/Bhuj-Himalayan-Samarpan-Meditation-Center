import React, { useState } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Input } from '@/components/react/ui/Input';
import type { MeditationCenter } from '@/features/centers/lib/types';

interface EventFormProps {
  initialData?: any;
  centers: MeditationCenter[];
  isEditing?: boolean;
  locale?: 'en' | 'gu';
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  centers,
  isEditing = false,
  locale = 'en',
}) => {
  const [formData, setFormData] = useState({
    title_en: initialData?.title_en || '',
    title_gu: initialData?.title_gu || '',
    description_en: initialData?.description_en || '',
    description_gu: initialData?.description_gu || '',
    event_type: initialData?.event_type || 'local',
    status: initialData?.status || 'draft',
    venue_en: initialData?.venue_en || '',
    venue_gu: initialData?.venue_gu || '',
    venue_address: initialData?.venue_address || '',
    center_id: initialData?.center_id || '',
    start_date: initialData?.start_date?.slice(0, 16) || '',
    end_date: initialData?.end_date?.slice(0, 16) || '',
    registration_start: initialData?.registration_start?.slice(0, 16) || '',
    registration_end: initialData?.registration_end?.slice(0, 16) || '',
    max_capacity: initialData?.max_capacity || '',
    requires_transport: initialData?.requires_transport || false,
    is_public: initialData?.is_public || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      ...formData,
      max_capacity: formData.max_capacity ? parseInt(String(formData.max_capacity)) : null,
      center_id: formData.center_id || null,
      registration_start: formData.registration_start || null,
      registration_end: formData.registration_end || null,
    };

    const endpoint = isEditing ? `/api/events/${initialData?.id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save event');
        setIsLoading(false);
        return;
      }

      window.location.href = '/dashboard/events';
    } catch {
      setError('Network or server error');
      setIsLoading(false);
    }
  };

  const eventTypes = [
    { value: 'local', label: locale === 'gu' ? 'સ્થાનિક કાર્યક્રમ' : 'Local Event' },
    { value: 'outstation', label: locale === 'gu' ? 'બહારગામ પ્રવાસ' : 'Outstation Trip' },
    { value: 'meditation_program', label: locale === 'gu' ? 'ધ્યાન કાર્યક્રમ' : 'Meditation Program' },
    { value: 'special', label: locale === 'gu' ? 'વિશેષ કાર્યક્રમ' : 'Special Program' },
    { value: 'other', label: locale === 'gu' ? 'અન્ય' : 'Other' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'registration_open', label: 'Registration Open' },
    { value: 'registration_closed', label: 'Registration Closed' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Event Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'કાર્યક્રમ વિગતો (Event Details)' : 'Event Details'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Event Title (English) *"
            name="title_en"
            value={formData.title_en}
            onChange={handleChange}
            required
            placeholder="e.g. Bhuj Dhyan Sadhna Camp"
          />
          <Input
            label="કાર્યક્રમ શીર્ષક (ગુજરાતી)"
            name="title_gu"
            value={formData.title_gu}
            onChange={handleChange}
            placeholder="દા.ત. ભુજ ધ્યાન સાધના શિબિર"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {locale === 'gu' ? 'કાર્યક્રમ પ્રકાર' : 'Event Type'} *
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (English)</label>
            <textarea
              name="description_en"
              value={formData.description_en}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A] resize-y"
              placeholder="Describe the event..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">વર્ણન (ગુજરાતી)</label>
            <textarea
              name="description_gu"
              value={formData.description_gu}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A] resize-y"
              placeholder="કાર્યક્રમ વિશે લખો..."
            />
          </div>
        </div>
      </div>

      {/* Section 2: Venue & Center */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'સ્થળ અને કેન્દ્ર (Venue & Center)' : 'Venue & Center'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Venue Name (English)"
            name="venue_en"
            value={formData.venue_en}
            onChange={handleChange}
            placeholder="e.g. Samarpan Bhavan, Bhuj"
          />
          <Input
            label="સ્થળ નામ (ગુજરાતી)"
            name="venue_gu"
            value={formData.venue_gu}
            onChange={handleChange}
            placeholder="દા.ત. સમર્પણ ભવન, ભુજ"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Address"
            name="venue_address"
            value={formData.venue_address}
            onChange={handleChange}
            placeholder="Street, area, city"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {locale === 'gu' ? 'સંબંધિત કેન્દ્ર' : 'Associated Center'}
            </label>
            <select
              name="center_id"
              value={formData.center_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              <option value="">-- {locale === 'gu' ? 'કેન્દ્ર પસંદ કરો' : 'Select Center'} --</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'gu' ? c.name_gu : c.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Dates & Capacity */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'તારીખ અને ક્ષમતા (Dates & Capacity)' : 'Schedule & Capacity'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date & Time *"
            name="start_date"
            type="datetime-local"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
          <Input
            label="End Date & Time *"
            name="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Registration Opens"
            name="registration_start"
            type="datetime-local"
            value={formData.registration_start}
            onChange={handleChange}
            helperText="When seekers can start registering"
          />
          <Input
            label="Registration Closes"
            name="registration_end"
            type="datetime-local"
            value={formData.registration_end}
            onChange={handleChange}
            helperText="Last date to register"
          />
          <Input
            label="Maximum Capacity"
            name="max_capacity"
            type="number"
            value={formData.max_capacity}
            onChange={handleChange}
            placeholder="e.g. 100"
            helperText="Leave empty for unlimited"
          />
        </div>
      </div>

      {/* Section 4: Options */}
      <div className="space-y-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">
          {locale === 'gu' ? 'વિકલ્પો (Options)' : 'Additional Options'}
        </h3>

        <div className="flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="requires_transport"
              checked={formData.requires_transport}
              onChange={handleChange}
              className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
            />
            <span className="text-sm text-gray-700">
              {locale === 'gu' ? 'વાહન વ્યવસ્થા જરૂરી છે' : 'Requires transportation arrangement'}
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
            />
            <span className="text-sm text-gray-700">
              {locale === 'gu' ? 'સાર્વજનિક દૃશ્યતા (બિન-લૉગઇન)' : 'Publicly visible on homepage'}
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <a
          href="/dashboard/events"
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <Button type="submit" isLoading={isLoading} size="md">
          {isEditing ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};
