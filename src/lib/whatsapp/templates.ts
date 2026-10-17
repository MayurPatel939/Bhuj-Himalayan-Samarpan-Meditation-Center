export interface TemplateDefinition {
  name: string;
  category: 'UTILITY' | 'MARKETING';
  description: string;
  defaultEnBody: string;
  defaultGuBody: string;
}

export const WHATSAPP_TEMPLATES: Record<string, TemplateDefinition> = {
  seeker_birthday_greeting: {
    name: 'seeker_birthday_greeting',
    category: 'UTILITY',
    description: 'Sent on the seeker\'s birthday',
    defaultEnBody: 'Jai Baba Swami {{1}}, Bhuj Himalayan Samarpan Meditation Center warmly wishes you a very Happy Birthday! May your spiritual journey be blessed with peace and divine grace.',
    defaultGuBody: 'જય બાબા સ્વામી {{1}}, ભુજ હિમાલયન સમર્પણ ધ્યાન કેન્દ્ર તરફથી આપને જન્મદિવસની હાર્દિક શુભકામનાઓ! આપની આધ્યાત્મિક યાત્રા શાંતિ અને ગુરુકૃપાથી પરિપૂર્ણ રહે તેવી પ્રાર્થના.',
  },
  seeker_anniversary_greeting: {
    name: 'seeker_anniversary_greeting',
    category: 'UTILITY',
    description: 'Sent on the seeker\'s wedding anniversary',
    defaultEnBody: 'Jai Baba Swami {{1}}, Wishing you and your family a very happy Wedding Anniversary! Warm regards from Bhuj Himalayan Samarpan Meditation Center.',
    defaultGuBody: 'જય બાબા સ્વામી {{1}}, આપના લગ્ન દિવસની હાર્દિક શુભકામનાઓ! ભુજ હિમાલયન સમર્પણ ધ્યાન કેન્દ્ર પરિવાર તરફથી અનંત આશીર્વાદ.',
  },
  event_announcement_notice: {
    name: 'event_announcement_notice',
    category: 'UTILITY',
    description: 'Sent for announcing upcoming meditation programs and events',
    defaultEnBody: 'Jai Baba Swami {{1}}, You are cordially invited to {{2}} at {{3}} on {{4}}. Details: {{5}}',
    defaultGuBody: 'જય બાબા સ્વામી {{1}}, આપને {{2}} માં પધારવા હાર્દિક આમંત્રણ છે. સ્થળ: {{3}}, તારીખ: {{4}}. વિગતો: {{5}}',
  },
  transport_booking_confirmed: {
    name: 'transport_booking_confirmed',
    category: 'UTILITY',
    description: 'Sent when Dhyan Rath or Bus seat booking is confirmed',
    defaultEnBody: 'Jai Baba Swami {{1}}, Your transport booking for {{2}} on {{3}} is confirmed. Pickup: {{4}} at {{5}}.',
    defaultGuBody: 'જય બાબા સ્વામી {{1}}, {{2}} માટે આપનું વાહન બુકિંગ તારીખ {{3}} ના રોજ મંજૂર થયેલ છે. પિકઅપ: {{4}}, સમય: {{5}}.',
  },
};
