import React, { useState } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Input } from '@/components/react/ui/Input';
import type { MeditationCenter } from '../lib/types';

interface CenterFormProps {
  initialData?: Partial<MeditationCenter>;
  isEditing?: boolean;
  locale?: 'en' | 'gu';
}

export const CenterForm: React.FC<CenterFormProps> = ({
  initialData,
  isEditing = false,
  locale = 'en',
}) => {
  const [formData, setFormData] = useState({
    name_en: initialData?.name_en || '',
    name_gu: initialData?.name_gu || '',
    contact_number: initialData?.contact_number || '',
    email: initialData?.email || '',
    address_en: initialData?.address_en || '',
    address_gu: initialData?.address_gu || '',
    city: initialData?.city || 'Bhuj',
    state: initialData?.state || 'Gujarat',
    pincode: initialData?.pincode || '370001',
    shanchalak_name: initialData?.shanchalak_name || '',
    shanchalak_contact: initialData?.shanchalak_contact || '',
    meditation_days: initialData?.meditation_days || ['Monday', 'Wednesday', 'Friday', 'Sunday'],
    instructions_en: initialData?.instructions_en || '',
    instructions_gu: initialData?.instructions_gu || '',
    is_active: initialData?.is_active ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Daily'];

  const handleDayToggle = (day: string) => {
    if (day === 'Daily') {
      setFormData((prev) => ({
        ...prev,
        meditation_days: prev.meditation_days.includes('Daily') ? [] : ['Daily'],
      }));
      return;
    }

    setFormData((prev) => {
      const filtered = prev.meditation_days.filter((d) => d !== 'Daily');
      if (filtered.includes(day)) {
        return { ...prev, meditation_days: filtered.filter((d) => d !== day) };
      } else {
        return { ...prev, meditation_days: [...filtered, day] };
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const endpoint = isEditing ? `/api/centers/${initialData?.id}` : '/api/centers';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save meditation center');
        setIsLoading(false);
        return;
      }

      window.location.href = '/dashboard/centers';
    } catch {
      setError('Network or server error');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Basic Center Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'કેન્દ્રની ઓળખ (Center Identity)' : 'Center Details'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Center Name (English) *"
            name="name_en"
            value={formData.name_en}
            onChange={handleChange}
            required
            placeholder="e.g. Bhuj Main Samarpan Center"
          />
          <Input
            label="કેન્દ્રનું નામ (ગુજરાતી) *"
            name="name_gu"
            value={formData.name_gu}
            onChange={handleChange}
            required
            placeholder="દા.ત. ભુજ મુખ્ય સમર્પણ ધ્યાન કેન્દ્ર"
          />
        </div>
      </div>

      {/* Shanchalak (In-charge) Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'સંચાલકની વિગતો (Shanchalak Details)' : 'Center In-Charge (Shanchalak)'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Shanchalak Name"
            name="shanchalak_name"
            value={formData.shanchalak_name}
            onChange={handleChange}
            placeholder="e.g. Rajesh Patel"
          />
          <Input
            label="Shanchalak Contact Number"
            name="shanchalak_contact"
            value={formData.shanchalak_contact}
            onChange={handleChange}
            placeholder="9825012345"
          />
        </div>
      </div>

      {/* Meditation Days Schedule */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Meditation Days of Week
        </label>
        <div className="flex flex-wrap gap-2">
          {daysOptions.map((day) => {
            const isSelected = formData.meditation_days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#E8973A] border-[#E8973A] text-white shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Address & City */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'સ્થળ અને સરનામું (Location)' : 'Location & Address'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address (English)"
            name="address_en"
            value={formData.address_en}
            onChange={handleChange}
            placeholder="Hall name, landmark, road"
          />
          <Input
            label="સરનામું (ગુજરાતી)"
            name="address_gu"
            value={formData.address_gu}
            onChange={handleChange}
            placeholder="હોલનું નામ, લેન્ડમાર્ક, રોડ"
          />
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Bhuj"
          />
          <Input
            label="Pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="370001"
          />
        </div>
      </div>

      {/* Status Toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
          />
          <span className="text-xs font-semibold text-gray-900">
            Center is active and accepts seekers for regular meditation
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <a
          href="/dashboard/centers"
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <Button type="submit" isLoading={isLoading} size="md">
          {isEditing ? 'Save Changes' : 'Create Center'}
        </Button>
      </div>
    </form>
  );
};
