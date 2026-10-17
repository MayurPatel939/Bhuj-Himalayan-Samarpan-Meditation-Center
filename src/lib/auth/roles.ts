import type { AppRoleType } from '../supabase/types';

export interface RoleDefinition {
  name: AppRoleType;
  displayNameEn: string;
  displayNameGu: string;
  hierarchyLevel: number;
  description: string;
}

export const ROLES: Record<AppRoleType, RoleDefinition> = {
  super_admin: {
    name: 'super_admin',
    displayNameEn: 'Super Admin',
    displayNameGu: 'સુપર એડમિન',
    hierarchyLevel: 1,
    description: 'IT team with unrestricted access to all data and system configurations',
  },
  admin: {
    name: 'admin',
    displayNameEn: 'Admin',
    displayNameGu: 'એડમિન',
    hierarchyLevel: 2,
    description: 'Center leadership managing coordinators, approvals, and reports',
  },
  center_coordinator: {
    name: 'center_coordinator',
    displayNameEn: 'Center Coordinator',
    displayNameGu: 'કેન્દ્ર સંયોજક',
    hierarchyLevel: 3,
    description: 'Manages seekers and operations for an assigned meditation center',
  },
  event_coordinator: {
    name: 'event_coordinator',
    displayNameEn: 'Event Coordinator',
    displayNameGu: 'ઇવેન્ટ સંયોજક',
    hierarchyLevel: 4,
    description: 'Manages event creation, registrations, attendance, and expenses',
  },
  ratri_sadhna_coordinator: {
    name: 'ratri_sadhna_coordinator',
    displayNameEn: 'Ratri Sadhna Coordinator',
    displayNameGu: 'રાત્રિ સાધના સંયોજક',
    hierarchyLevel: 5,
    description: 'Manages night meditation sessions and community activities',
  },
  bus_coordinator: {
    name: 'bus_coordinator',
    displayNameEn: 'Bus Coordinator',
    displayNameGu: 'બસ સંયોજક',
    hierarchyLevel: 5,
    description: 'Coordinates event buses and passenger lists',
  },
  dhyan_rath_coordinator: {
    name: 'dhyan_rath_coordinator',
    displayNameEn: 'Dhyan Rath Coordinator',
    displayNameGu: 'ધ્યાન રથ સંયોજક',
    hierarchyLevel: 5,
    description: 'Coordinates Dhyan Rath vehicle routes and bookings',
  },
  product_coordinator: {
    name: 'product_coordinator',
    displayNameEn: 'Product Coordinator',
    displayNameGu: 'પ્રોડક્ટ સંયોજક',
    hierarchyLevel: 5,
    description: 'Coordinates seasonal fruits and Dhyansthali products',
  },
  sahitya_coordinator: {
    name: 'sahitya_coordinator',
    displayNameEn: 'Sahitya Coordinator',
    displayNameGu: 'સાહિત્ય સંયોજક',
    hierarchyLevel: 5,
    description: 'Coordinates spiritual literature, Granths, and distribution',
  },
};
