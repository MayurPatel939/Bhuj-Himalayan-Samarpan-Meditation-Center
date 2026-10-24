import React, { useState, useEffect } from 'react';
import { Button } from '@/components/react/ui/Button';
import { Badge } from '@/components/react/ui/Badge';
import { WHATSAPP_TEMPLATES } from '@/lib/whatsapp/templates';

interface NotificationJob {
  id: string;
  template_id?: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  notification_templates?: {
    name: string;
    template_type: string;
    content_en: string;
  };
}

interface NotificationManagerProps {
  locale?: 'en' | 'gu';
  centers?: Array<{ id: string; name_en: string; name_gu: string }>;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  locale = 'en',
  centers = [],
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'templates' | 'broadcast'>('jobs');
  const [jobs, setJobs] = useState<NotificationJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Broadcast state
  const [selectedTemplate, setSelectedTemplate] = useState('event_announcement_notice');
  const [targetType, setTargetType] = useState<'all' | 'center'>('all');
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const params = new URLSearchParams({
        limit: '25',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const res = await fetch(`/api/notifications/jobs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setJobs(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notification jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setBroadcastMessage(null);

    try {
      // 1. Fetch eligible seekers
      const queryParams = new URLSearchParams({ limit: '200' });
      if (targetType === 'center' && selectedCenterId) {
        queryParams.set('center_id', selectedCenterId);
      }

      const seekersRes = await fetch(`/api/seekers?${queryParams}`);
      const seekersData = await seekersRes.json();

      if (!seekersRes.ok || !seekersData.data || seekersData.data.length === 0) {
        setBroadcastMessage({
          type: 'error',
          text: locale === 'gu' ? 'કોઈ સાધકો મળ્યા નથી' : 'No seekers found matching the target criteria.',
        });
        setIsSending(false);
        return;
      }

      const seekerIds = seekersData.data.map((s: any) => s.id);

      // 2. Queue notification
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: selectedTemplate,
          seeker_ids: seekerIds,
        }),
      });

      const resData = await res.json();

      if (res.ok) {
        setBroadcastMessage({
          type: 'success',
          text: locale === 'gu'
            ? `સંદેશ સફળતાપૂર્વક મોકલવામાં આવ્યો! કુલ: ${resData.total_recipients || seekerIds.length}`
            : `Notification queued successfully for ${resData.total_recipients || seekerIds.length} seekers!`,
        });
        fetchJobs();
      } else {
        setBroadcastMessage({
          type: 'error',
          text: resData.error || (locale === 'gu' ? 'સંદેશ મોકલવામાં નિષ્ફળતા' : 'Failed to send notification.'),
        });
      }
    } catch (err: any) {
      setBroadcastMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: NotificationJob['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="sage">{locale === 'gu' ? 'પૂર્ણ' : 'Completed'}</Badge>;
      case 'processing':
        return <Badge variant="blue">{locale === 'gu' ? 'ચાલુ છે' : 'Processing'}</Badge>;
      case 'failed':
        return <Badge variant="danger">{locale === 'gu' ? 'નિષ્ફળ' : 'Failed'}</Badge>;
      case 'cancelled':
        return <Badge variant="gray">{locale === 'gu' ? 'રદ' : 'Cancelled'}</Badge>;
      default:
        return <Badge variant="warning">{locale === 'gu' ? 'પ્રતીક્ષામાં' : 'Pending'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'jobs'
              ? 'border-[#E8973A] text-[#C2741C]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {locale === 'gu' ? 'મેસેજ ઇતિહાસ અને લોગ' : 'Delivery History & Logs'}
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'broadcast'
              ? 'border-[#E8973A] text-[#C2741C]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {locale === 'gu' ? 'નવો સંદેશ મોકલો' : 'Send WhatsApp Broadcast'}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'templates'
              ? 'border-[#E8973A] text-[#C2741C]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {locale === 'gu' ? 'ટેમ્પ્લેટ્સ યાદી' : 'Approved Templates'}
        </button>
      </div>

      {/* Tab 1: Delivery History & Logs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{locale === 'gu' ? 'સ્થિતિ:' : 'Filter status:'}</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
              >
                <option value="all">{locale === 'gu' ? 'બધી સ્થિતિ' : 'All Statuses'}</option>
                <option value="completed">{locale === 'gu' ? 'પૂર્ણ' : 'Completed'}</option>
                <option value="processing">{locale === 'gu' ? 'ચાલુ છે' : 'Processing'}</option>
                <option value="pending">{locale === 'gu' ? 'પ્રતીક્ષામાં' : 'Pending'}</option>
                <option value="failed">{locale === 'gu' ? 'નિષ્ફળ' : 'Failed'}</option>
              </select>
            </div>

            <Button variant="secondary" size="sm" onClick={fetchJobs} disabled={isLoadingJobs}>
              🔄 {locale === 'gu' ? 'રીફ્રેશ' : 'Refresh Logs'}
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-3 border-[#E8973A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-semibold text-gray-700">
                  {locale === 'gu' ? 'હજુ સુધી કોઈ સંદેશ મોકલવામાં આવ્યો નથી' : 'No notification jobs dispatched yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'gu' ? 'ઉપર "નવો સંદેશ મોકલો" પર ક્લિક કરો' : 'Click "Send WhatsApp Broadcast" to send announcements.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">{locale === 'gu' ? 'તારીખ' : 'Date & Time'}</th>
                      <th className="px-4 py-3">{locale === 'gu' ? 'ટેમ્પ્લેટ' : 'Template'}</th>
                      <th className="px-4 py-3">{locale === 'gu' ? 'પ્રકાર' : 'Type'}</th>
                      <th className="px-4 py-3">{locale === 'gu' ? 'પ્રાપ્તકર્તા' : 'Recipients'}</th>
                      <th className="px-4 py-3">{locale === 'gu' ? 'મોકલાયેલ / નિષ્ફળ' : 'Sent / Failed'}</th>
                      <th className="px-4 py-3">{locale === 'gu' ? 'સ્થિતિ' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-600 font-mono">
                          {new Date(job.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {job.notification_templates?.name || 'WhatsApp Announcement'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{job.job_type}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{job.total_recipients}</td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-600 font-medium">{job.sent_count} sent</span>
                          {job.failed_count > 0 && (
                            <span className="text-red-500 ml-1.5 font-medium">({job.failed_count} failed)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Broadcast Announcement */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {locale === 'gu' ? 'વોટ્સએપ સંદેશ બ્રોડકાસ્ટ કરો' : 'Send WhatsApp Announcement'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {locale === 'gu'
                ? 'સંમતિ આપેલ સાધકોને સત્તાવાર મેટા ક્લાઉડ API દ્વારા સીધો સંદેશ મોકલો.'
                : 'Broadcast notifications to seekers who have opted into WhatsApp alerts.'}
            </p>
          </div>

          {broadcastMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium border ${
                broadcastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {broadcastMessage.text}
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === 'gu' ? 'મેસેજ ટેમ્પ્લેટ પસંદ કરો' : 'Select Message Template'}
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
              >
                {Object.entries(WHATSAPP_TEMPLATES).map(([key, def]) => (
                  <option key={key} value={key}>
                    {def.name} — {def.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Preview */}
            {WHATSAPP_TEMPLATES[selectedTemplate] && (
              <div className="p-4 bg-[#FFF9F3] border border-[#F3AA55]/20 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-[#C2741C] uppercase tracking-wider">
                  {locale === 'gu' ? 'ટેમ્પ્લેટ પૂર્વાવલોકન' : 'Template Preview'}
                </span>
                <p className="text-xs text-gray-800 whitespace-pre-wrap font-sans">
                  {locale === 'gu'
                    ? WHATSAPP_TEMPLATES[selectedTemplate].defaultGuBody
                    : WHATSAPP_TEMPLATES[selectedTemplate].defaultEnBody}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === 'gu' ? 'લક્ષિત જૂથ' : 'Target Audience'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    targetType === 'all'
                      ? 'border-[#E8973A] bg-[#FFF9F3] text-[#C2741C]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-bold">{locale === 'gu' ? 'બધા સાધકો' : 'All Active Seekers'}</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">
                    {locale === 'gu' ? 'બધા ધ્યાન કેન્દ્રો' : 'Across all registered centers'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('center')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    targetType === 'center'
                      ? 'border-[#E8973A] bg-[#FFF9F3] text-[#C2741C]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-bold">{locale === 'gu' ? 'ચોક્કસ કેન્દ્ર' : 'Specific Center'}</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">
                    {locale === 'gu' ? 'પસંદ કરેલ કેન્દ્રના સાધકો' : 'Only seekers from selected center'}
                  </p>
                </button>
              </div>
            </div>

            {targetType === 'center' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {locale === 'gu' ? 'કેન્દ્ર પસંદ કરો' : 'Select Meditation Center'}
                </label>
                <select
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                  required
                >
                  <option value="">{locale === 'gu' ? '-- કેન્દ્ર પસંદ કરો --' : '-- Choose a Center --'}</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === 'gu' ? c.name_gu : c.name_en}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="saffron" className="w-full" disabled={isSending}>
                {isSending
                  ? locale === 'gu' ? 'સંદેશ મોકલાઈ રહ્યો છે...' : 'Queueing Messages...'
                  : `🚀 ${locale === 'gu' ? 'વોટ્સએપ બ્રોડકાસ્ટ શરૂ કરો' : 'Dispatch WhatsApp Broadcast'}`}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Template Catalog */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(WHATSAPP_TEMPLATES).map(([key, tpl]) => (
            <div key={key} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="blue">{tpl.category}</Badge>
                <span className="text-[10px] font-mono text-gray-400">Meta v22.0 Approved</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-mono">{tpl.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-gray-50">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">ENGLISH:</span>
                  <p className="text-gray-700 font-sans leading-relaxed">{tpl.defaultEnBody}</p>
                </div>
                <div className="bg-[#FFF9F3]/60 p-2.5 rounded-lg border border-[#F3AA55]/20">
                  <span className="text-[10px] font-bold text-[#C2741C] block mb-1">ગુજરાતી (GUJARATI):</span>
                  <p className="text-gray-700 font-sans leading-relaxed">{tpl.defaultGuBody}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
