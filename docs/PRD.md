# Product Requirements Document (PRD)
## Bhuj Himalayan Samarpan Meditation Center Management System

**Version**: 1.0  
**Date**: October 2026  
**Status**: Approved  

---

## 1. Executive Summary

### 1.1 Purpose
Build a production-ready, bilingual (English + Gujarati) web application for the Bhuj Himalayan Samarpan Meditation Center to manage seekers, meditation centers, events, transportation, activities, spiritual literature, products, and finances through a single, centralized platform.

### 1.2 Mission
Spread meditation awareness and support the spiritual growth of Himalayan Samarpan Meditation seekers in Bhuj, Gujarat.

### 1.3 Target Users
- **Volunteer coordinators** — Non-technical users of varying age groups who manage daily operations
- **Admin/IT team** — Technical administrators who manage system settings and user access
- **Seekers** — Meditation practitioners who are the subjects of the data (not direct system users in Phase 1)
- **Public visitors** — Anyone seeking information about meditation centers and events

### 1.4 Scale
- **500–1000+ seekers** across multiple active meditation centers in Bhuj
- **9 distinct user roles** with granular permissions
- **12 functional modules** covering all aspects of center operations

---

## 2. Business Requirements

### BR-01: Centralized Operations
All volunteer coordinators must be able to access and manage their assigned responsibilities from a single web application, eliminating scattered spreadsheets, WhatsApp groups, and paper records.

### BR-02: Mobile-First Accessibility
The application must be fully functional on mobile browsers, as most coordinators will use smartphones for day-to-day operations.

### BR-03: Bilingual Support
All user-facing text must be available in both English and Gujarati. Users can switch languages at any time.

### BR-04: Data Privacy
Seeker personal information must be protected. Only authorized coordinators can access data relevant to their role and center assignment.

### BR-05: Financial Transparency
Event expenses and contributions must be tracked with an immutable audit trail. Approved financial summaries can be published for seeker visibility.

### BR-06: Automated Communications
Birthday/anniversary greetings and event reminders must be sent automatically via WhatsApp without depending on manual triggers.

### BR-07: Booking Integrity
Transportation bookings (Dhyan Rath and Bus) must prevent overbooking and duplicate reservations through server-side enforcement.

---

## 3. Functional Requirements by Module

### Module A — Dashboard & Administration

#### User Stories
- **US-A01**: As a coordinator, I want a dashboard showing key metrics relevant to my role so I can quickly understand the current state.
- **US-A02**: As a Super Admin, I want to manage user accounts and assign roles so coordinators have appropriate access.
- **US-A03**: As an Admin, I want to view audit logs so I can track who made changes to sensitive data.
- **US-A04**: As a coordinator, I want to receive in-app notifications about items requiring my attention.
- **US-A05**: As a user, I want to configure system-wide settings (e.g., default center, notification preferences).

#### Acceptance Criteria
- [ ] Role-specific dashboard shows different KPI cards per role
- [ ] User management supports creating, editing, deactivating accounts
- [ ] Audit logs are searchable by user, action, entity, and date range
- [ ] Settings page accessible only to Super Admin and Admin roles

---

### Module B — Seeker Management

#### User Stories
- **US-B01**: As a coordinator, I want to register new seekers with their basic information so they're tracked in the system.
- **US-B02**: As a coordinator, I want each seeker to get a unique human-readable ID (e.g., BHJ-0001).
- **US-B03**: As a coordinator, I want to search seekers by name, mobile, center, or status.
- **US-B04**: As a coordinator, I want the system to alert me if I'm creating a duplicate seeker (same mobile or similar name).
- **US-B05**: As a coordinator, I want to assign seekers to specific meditation centers.
- **US-B06**: As an admin, I want to import seekers from a CSV file for initial data migration.
- **US-B07**: As a coordinator, I want to export seeker lists for offline use.
- **US-B08**: As a coordinator, I want to manage guardian information for minor seekers.
- **US-B09**: As a coordinator, I want to record seekers' notification preferences (opt-in/opt-out for WhatsApp).

#### Acceptance Criteria
- [ ] Auto-generated seeker ID in BHJ-NNNN format
- [ ] Duplicate detection on mobile + name match (fuzzy)
- [ ] Center coordinators see only their center's seekers
- [ ] CSV import handles 500+ records with progress indicator
- [ ] Minor seekers require guardian linkage
- [ ] Seeker status: active, inactive, archived (soft delete)
- [ ] Edit history tracked in audit log

#### Data Fields
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Seeker ID | Auto | Text | BHJ-NNNN format |
| First Name (EN) | Yes | Text | |
| Last Name (EN) | Yes | Text | |
| First Name (GU) | No | Text | |
| Last Name (GU) | No | Text | |
| Mobile | No | Phone | Primary contact, used for WhatsApp |
| Email | No | Email | |
| Date of Birth | No | Date | For birthday greetings |
| Anniversary Date | No | Date | For anniversary greetings |
| Gender | No | Select | Male, Female, Other |
| Address (EN) | No | Text | |
| Address (GU) | No | Text | |
| City | No | Text | Default: Bhuj |
| Pincode | No | Text | |
| Center | No | FK | Assigned meditation center |
| Guardian | Conditional | FK | Required for minors |
| Guardian Relation | Conditional | Text | |
| Notification Consent | Yes | Boolean | Default: true |
| Status | Auto | Select | active, inactive, archived |
| Registration Date | Auto | Date | |

---

### Module C — Meditation Center Management

#### User Stories
- **US-C01**: As an admin, I want to add new meditation centers with their location and schedule.
- **US-C02**: As an admin, I want to assign coordinators to centers.
- **US-C03**: As a coordinator, I want to view my center's details and associated seekers.
- **US-C04**: As a public visitor, I want to see active meditation centers with their schedules on the public website.

#### Acceptance Criteria
- [ ] Center CRUD with bilingual names and addresses
- [ ] Meditation schedule (days + timings) configurable per center
- [ ] Shanchalak name and contact stored
- [ ] Center-wise seeker count and active/inactive statistics
- [ ] Public page listing active centers (no login required)

---

### Module D — Events & Registrations

#### User Stories
- **US-D01**: As an event coordinator, I want to create events with details (type, date, venue, capacity).
- **US-D02**: As a coordinator, I want to register seekers for events.
- **US-D03**: As a coordinator, I want the system to automatically waitlist seekers when an event is full.
- **US-D04**: As a coordinator, I want to cancel registrations and auto-promote waitlisted seekers.
- **US-D05**: As a coordinator, I want to mark attendance for event participants.
- **US-D06**: As a coordinator, I want to send event announcements to registered seekers via WhatsApp.
- **US-D07**: As a public visitor, I want to see upcoming events on the website.

#### Acceptance Criteria
- [ ] Event status workflow: draft → published → registration_open → registration_closed → ongoing → completed → cancelled
- [ ] Auto-waitlisting when max capacity reached
- [ ] Auto-promotion when cancellation frees a spot
- [ ] Bulk attendance marking
- [ ] Event types: local, outstation, meditation_program, special, other
- [ ] Participant list export
- [ ] Public events visible on website without login

---

### Module E — WhatsApp Automation

#### User Stories
- **US-E01**: As an admin, I want to configure WhatsApp message templates.
- **US-E02**: As the system, I want to automatically send birthday greetings each day to eligible seekers.
- **US-E03**: As the system, I want to automatically send anniversary greetings each day.
- **US-E04**: As a coordinator, I want to send event announcements to specific groups of seekers.
- **US-E05**: As an admin, I want to view message delivery status and failure logs.
- **US-E06**: As the system, I want to retry failed messages up to 3 times.
- **US-E07**: As the system, I want to prevent sending duplicate messages to the same seeker for the same job.

#### Acceptance Criteria
- [ ] Daily cron trigger at 01:00 UTC for birthday/anniversary greetings
- [ ] 6-hourly cron for event reminders and failed message retry
- [ ] Messages only sent to seekers with notification_consent = true
- [ ] Each notification job has an idempotency key
- [ ] Unique constraint prevents duplicate (job_id, seeker_id) messages
- [ ] Delivery status tracked: queued → sent → delivered → read → failed
- [ ] Failed messages retry up to 3 times with exponential backoff
- [ ] API credentials stored server-side only (never in browser)
- [ ] Uses approved WhatsApp templates (Meta policy compliant)

---

### Module F — Dhyan Rath Booking

#### User Stories
- **US-F01**: As a Dhyan Rath coordinator, I want to manage vehicles and routes.
- **US-F02**: As a coordinator, I want to create trip schedules with departure times and pickup points.
- **US-F03**: As a coordinator, I want to book seekers on trips.
- **US-F04**: As the system, I want to prevent overbooking beyond seat capacity.
- **US-F05**: As a coordinator, I want to view and export passenger lists.
- **US-F06**: As a coordinator, I want to manage waitlists when trips are full.

#### Acceptance Criteria
- [ ] Server-side seat capacity enforcement
- [ ] Concurrent booking requests handled safely (no double-booking)
- [ ] Booking status: confirmed, waitlisted, cancelled
- [ ] Auto-promote from waitlist on cancellation
- [ ] Trip is marked as free by default (Dhyan Rath = no charge)
- [ ] Passenger list with pickup points exportable

---

### Module G — Bus Booking

Same structure as Dhyan Rath but:
- Tied to specific events (event-wise transportation)
- May have fare amounts
- Different coordinator role (Bus Coordinator)

---

### Module H — Ratri Sadhna & Activities

#### User Stories
- **US-H01**: As a Ratri Sadhna coordinator, I want to schedule sessions (one-time or recurring).
- **US-H02**: As a coordinator, I want to register seekers for activities.
- **US-H03**: As a coordinator, I want to track attendance.
- **US-H04**: As a coordinator, I want to set capacity limits.

#### Acceptance Criteria
- [ ] Activity types: ratri_sadhna, sports, community, other
- [ ] Recurring events support (weekly, monthly patterns)
- [ ] Capacity limits with waitlisting
- [ ] Attendance tracking

---

### Module I & J — Seasonal Fruits & Dhyansthali Products

#### User Stories
- **US-IJ01**: As a product coordinator, I want to manage product catalog with variants and pricing.
- **US-IJ02**: As a product coordinator, I want to set booking windows for seasonal items.
- **US-IJ03**: As a coordinator, I want to place orders on behalf of seekers.
- **US-IJ04**: As a product coordinator, I want to track inventory (stock in/out).
- **US-IJ05**: As a product coordinator, I want low-stock alerts.
- **US-IJ06**: As a coordinator, I want to record payments (cash, UPI, bank transfer).
- **US-IJ07**: As a product coordinator, I want to track order fulfillment and distribution.

#### Acceptance Criteria
- [ ] Shared product-variant-inventory model (no duplicate data across modules)
- [ ] Categories: seasonal_fruit, dhyansthali_product
- [ ] Booking windows enforce availability periods
- [ ] Inventory cannot go negative (database constraint)
- [ ] Order workflow: pending → confirmed → processing → ready → delivered → cancelled
- [ ] Low-stock threshold alerts
- [ ] Auto-generated order numbers (ORD-YYYY-NNNN)

---

### Module K — Granth & Sahitya

Same product/inventory model as Modules I & J but:
- Categories: granth, sahitya
- Managed by Sahitya Coordinator
- Includes book descriptions and spiritual content metadata

---

### Module L — Event Expenses & Financial Transparency

#### User Stories
- **US-L01**: As an event coordinator, I want to record expenses with descriptions, amounts, and receipts.
- **US-L02**: As an admin, I want to set event budgets.
- **US-L03**: As an admin, I want to approve or reject submitted expenses.
- **US-L04**: As an admin, I want to see budget vs actual expenditure.
- **US-L05**: As an admin, I want to record contributions/donations (anonymously or by name).
- **US-L06**: As an admin, I want to publish financial summaries for seeker transparency.
- **US-L07**: As a seeker/public viewer, I want to view published financial summaries (read-only).

#### Acceptance Criteria
- [ ] Expense status workflow: draft → submitted → approved/rejected → paid
- [ ] Receipt upload to private Supabase Storage bucket
- [ ] Signed URLs for authorized receipt viewing
- [ ] Approved expenses become immutable
- [ ] Complete approval history with timestamps
- [ ] Budget vs actual with remaining balance calculation
- [ ] Published summaries don't expose personal donor information
- [ ] Contributions tracked separately from expenses
- [ ] Refunds tracked as negative expenses or separate entry type

---

## 4. Non-Functional Requirements

### NFR-01: Performance
- Dashboard load time < 2 seconds for 1000 seekers
- Search results return in < 500ms
- Report generation completes within 5 seconds

### NFR-02: Security
- Server-side authentication and authorization on all protected routes
- PostgreSQL Row Level Security (RLS) on all data tables
- Input validation on server (Zod schemas)
- CSRF protection via SameSite cookies
- Rate limiting on auth endpoints
- Private storage for sensitive documents
- Audit trail for administrative and financial changes

### NFR-03: Accessibility
- WCAG 2.1 AA compliance for core workflows
- Keyboard navigable
- Screen reader compatible
- Minimum touch target size 44x44px on mobile
- High contrast text (4.5:1 ratio minimum)

### NFR-04: Reliability
- Cloudflare Workers 99.9% uptime SLA
- Supabase managed database with automatic backups
- Graceful error handling with user-friendly messages
- Idempotent background jobs (safe to retry)

### NFR-05: Maintainability
- Feature-based code organization
- Version-controlled database migrations
- TypeScript strict mode
- Comprehensive documentation
- Reusable component library

---

## 5. Out of Scope (Phase 1)

- Native mobile app (responsive web only)
- Online payment gateway integration (manual payment recording only)
- Seeker self-service portal (coordinators manage on behalf of seekers)
- SMS notifications (WhatsApp only)
- Video conferencing integration
- Multi-language beyond English and Gujarati
- Advanced reporting (BI dashboards, predictive analytics)
