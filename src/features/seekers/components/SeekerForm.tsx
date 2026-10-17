import React, { useState } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Input } from '@/components/react/ui/Input';
import type { Seeker } from '../lib/types';
import type { MeditationCenter } from '@/features/centers/lib/types';

interface SeekerFormProps {
  initialData?: Partial<Seeker>;
  centers: MeditationCenter[];
  isEditing?: boolean;
  locale?: 'en' | 'gu';
}

export const SeekerForm: React.FC<SeekerFormProps> = ({
  initialData,
  centers,
  isEditing = false,
  locale = 'en',
}) => {
  const [formData, setFormData] = useState({
    first_name_en: initialData?.first_name_en || '',
    last_name_en: initialData?.last_name_en || '',
    first_name_gu: initialData?.first_name_gu || '',
    last_name_gu: initialData?.last_name_gu || '',
    mobile: initialData?.mobile || '',
    email: initialData?.email || '',
    date_of_birth: initialData?.date_of_birth || '',
    anniversary_date: initialData?.anniversary_date || '',
    gender: initialData?.gender || 'male',
    address_en: initialData?.address_en || '',
    address_gu: initialData?.address_gu || '',
    city: initialData?.city || 'Bhuj',
    pincode: initialData?.pincode || '',
    center_id: initialData?.center_id || '',
    is_minor: initialData?.is_minor || false,
    guardian_name: initialData?.guardian_name || '',
    guardian_relation: initialData?.guardian_relation || 'Father',
    guardian_consent: initialData?.guardian_consent ?? true,
    notification_consent: initialData?.notification_consent ?? true,
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);

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
    setDuplicateWarning(null);

    const payload = {
      ...formData,
      allow_duplicate: allowDuplicate,
    };

    const endpoint = isEditing ? `/api/seekers/${initialData?.id}` : '/api/seekers';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.error === 'duplicate_found') {
        setDuplicateWarning(data.message);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Failed to save seeker profile');
        setIsLoading(false);
        return;
      }

      window.location.href = '/dashboard/seekers';
    } catch {
      setError('Network or server error');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <p className="font-bold">Duplicate Seeker Alert</p>
              <p className="mt-0.5">{duplicateWarning}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-amber-200/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAllowDuplicate(true);
                // Trigger submit with duplicate allowed
                setTimeout(() => {
                  const submitBtn = document.getElementById('seeker-submit-btn');
                  submitBtn?.click();
                }, 50);
              }}
            >
              Proceed Anyway
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDuplicateWarning(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'મૂળભૂત માહિતી (Basic Information)' : 'Basic Information'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name (English) *"
            name="first_name_en"
            value={formData.first_name_en}
            onChange={handleChange}
            required
            placeholder="e.g. Rajesh"
          />
          <Input
            label="Last Name (English) *"
            name="last_name_en"
            value={formData.last_name_en}
            onChange={handleChange}
            required
            placeholder="e.g. Patel"
          />
          <Input
            label="પ્રથમ નામ (ગુજરાતી)"
            name="first_name_gu"
            value={formData.first_name_gu}
            onChange={handleChange}
            placeholder="દા.ત. રાજેશભાઈ"
          />
          <Input
            label="અટક (ગુજરાતી)"
            name="last_name_gu"
            value={formData.last_name_gu}
            onChange={handleChange}
            placeholder="દા.ત. પટેલ"
          />
        </div>
      </div>

      {/* Section 2: Contact & Demographics */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'સંપર્ક અને વિગતો (Contact & Details)' : 'Contact & Demographics'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mobile Number (WhatsApp)"
            name="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="9825012345"
            helperText="10-digit number used for WhatsApp greetings"
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="seeker@example.com"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              <option value="male">Male / પુરુષ</option>
              <option value="female">Female / સ્ત્રી</option>
              <option value="other">Other / અન્ય</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            helperText="For automated birthday greetings"
          />
          <Input
            label="Marriage Anniversary"
            name="anniversary_date"
            type="date"
            value={formData.anniversary_date}
            onChange={handleChange}
            helperText="For automated anniversary wishes"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Meditation Center</label>
            <select
              name="center_id"
              value={formData.center_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              <option value="">-- Select Center --</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'gu' ? c.name_gu : c.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Minor Guardian Details */}
      <div className="space-y-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="is_minor"
            checked={formData.is_minor}
            onChange={handleChange}
            className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
          />
          <span className="text-sm font-semibold text-gray-900">
            This seeker is a minor (under 18 years old)
          </span>
        </label>

        {formData.is_minor && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Guardian Full Name *"
              name="guardian_name"
              value={formData.guardian_name}
              onChange={handleChange}
              required={formData.is_minor}
              placeholder="e.g. Ramesh Patel"
            />
            <Input
              label="Relationship with Minor"
              name="guardian_relation"
              value={formData.guardian_relation}
              onChange={handleChange}
              placeholder="Father / Mother / Guardian"
            />
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="guardian_consent"
                  checked={formData.guardian_consent}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
                />
                <span className="text-xs text-gray-700">
                  Guardian has granted consent for meditation center registration and event participation
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Address & Notification Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          {locale === 'gu' ? 'સરનામું અને સંમતિ (Address & Consent)' : 'Address & Preferences'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address (English)"
            name="address_en"
            value={formData.address_en}
            onChange={handleChange}
            placeholder="Street address, area"
          />
          <Input
            label="સરનામું (ગુજરાતી)"
            name="address_gu"
            value={formData.address_gu}
            onChange={handleChange}
            placeholder="શેરી, સોસાયટી, વિસ્તાર"
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

        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="notification_consent"
              checked={formData.notification_consent}
              onChange={handleChange}
              className="w-4 h-4 text-[#E8973A] rounded border-gray-300 focus:ring-[#E8973A]"
            />
            <span className="text-xs text-gray-700 font-medium">
              Consent received to send event reminders, birthday greetings, and announcements via WhatsApp
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <a
          href="/dashboard/seekers"
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <Button id="seeker-submit-btn" type="submit" isLoading={isLoading} size="md">
          {isEditing ? 'Save Changes' : 'Register Seeker'}
        </Button>
      </div>
    </form>
  );
};
