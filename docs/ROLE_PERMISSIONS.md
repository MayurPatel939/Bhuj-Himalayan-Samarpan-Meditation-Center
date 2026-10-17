# Role Permissions Matrix
## Bhuj Himalayan Samarpan Meditation Center Management System

**Version**: 1.0  
**Date**: October 2026  

---

## 1. Role Definitions

### Role Hierarchy

```
Level 1: Super Admin (IT Team)
Level 2: Admin (Center Leadership)
Level 3: Center Coordinator
Level 4: Event Coordinator
Level 5: Ratri Sadhna Coordinator
Level 5: Bus Coordinator
Level 5: Dhyan Rath Coordinator
Level 5: Product Coordinator
Level 5: Sahitya Coordinator
```

### Role Details

| # | Role Code | Display Name (EN) | Display Name (GU) | Scope | Description |
|---|-----------|------------------|--------------------|-------|-------------|
| 1 | `super_admin` | Super Admin | સુપર એડમિન | Global | IT team. Full system access. Manages all settings, users, and data. |
| 2 | `admin` | Admin | એડમિન | Global | Center leadership. All module access except system settings deletion. |
| 3 | `center_coordinator` | Center Coordinator | કેન્દ્ર સંયોજક | Center-scoped | Manages assigned center's seekers, registrations, and basic reports. |
| 4 | `event_coordinator` | Event Coordinator | ઇવેન્ટ સંયોજક | Module-scoped | Manages events, registrations, attendance, and event finance. |
| 5 | `ratri_sadhna_coordinator` | Ratri Sadhna Coordinator | રાત્રિ સાધના સંયોજક | Module-scoped | Manages Ratri Sadhna and community activities. |
| 6 | `bus_coordinator` | Bus Coordinator | બસ સંયોજક | Module-scoped | Manages bus routes, schedules, and bookings for events. |
| 7 | `dhyan_rath_coordinator` | Dhyan Rath Coordinator | ધ્યાન રથ સંયોજક | Module-scoped | Manages Dhyan Rath vehicles, routes, and trip bookings. |
| 8 | `product_coordinator` | Product Coordinator | પ્રોડક્ટ સંયોજક | Module-scoped | Manages seasonal fruits, products, inventory, and orders. |
| 9 | `sahitya_coordinator` | Sahitya Coordinator | સાહિત્ય સંયોજક | Module-scoped | Manages Granths, spiritual literature, inventory, and distribution. |

### Multi-Role Support

A user can hold multiple roles simultaneously. For example:
- A person could be both a Center Coordinator (for Bhuj Main Center) and a Bus Coordinator
- Permissions are the union of all assigned roles
- Center-scoped roles require a `center_id` assignment

---

## 2. Permission Actions

| Action | Code | Description |
|--------|------|-------------|
| Read | `read` | View records and lists |
| Create | `create` | Add new records |
| Update | `update` | Modify existing records |
| Delete | `delete` | Soft-delete or archive records |
| Approve | `approve` | Approve submissions (expenses, summaries) |
| Export | `export` | Download data as CSV/Excel/PDF |
| Manage | `manage` | Full CRUD + system-level configuration |
| Send | `send` | Send notifications/messages |

---

## 3. Detailed Permission Matrix

### Module A — System Administration

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| System Settings | manage | ✅ | — | — | — | — | — | — | — | — |
| System Settings | read | ✅ | ✅ | — | — | — | — | — | — | — |
| User Accounts | create | ✅ | ✅ | — | — | — | — | — | — | — |
| User Accounts | read | ✅ | ✅ | — | — | — | — | — | — | — |
| User Accounts | update | ✅ | ✅ | — | — | — | — | — | — | — |
| User Accounts | delete | ✅ | — | — | — | — | — | — | — | — |
| Role Assignment | manage | ✅ | ✅¹ | — | — | — | — | — | — | — |
| Audit Logs | read | ✅ | ✅ | — | — | — | — | — | — | — |
| Own Profile | read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Own Profile | update | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

¹ Admin can assign roles of hierarchy level ≤ their own (cannot create Super Admins)

### Module B — Seeker Management

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Seekers | read | All | All | Own center | All² | All² | All² | All² | All² | All² |
| Seekers | create | ✅ | ✅ | Own center | — | — | — | — | — | — |
| Seekers | update | ✅ | ✅ | Own center | — | — | — | — | — | — |
| Seekers | delete | ✅ | ✅ | — | — | — | — | — | — | — |
| Seekers | export | ✅ | ✅ | Own center | — | — | — | — | — | — |
| Seekers | import | ✅ | ✅ | — | — | — | — | — | — | — |
| Seeker History | read | ✅ | ✅ | Own center | — | — | — | — | — | — |

² Read-only access to basic seeker info (name, mobile) for module operations (e.g., booking a seeker on a bus). No access to personal details like DOB, address.

### Module C — Center Management

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Centers | read | All | All | Own center | All | All | All | All | All | All |
| Centers | create | ✅ | ✅ | — | — | — | — | — | — | — |
| Centers | update | ✅ | ✅ | Own center³ | — | — | — | — | — | — |
| Centers | delete | ✅ | — | — | — | — | — | — | — | — |
| Center Stats | read | ✅ | ✅ | Own center | — | — | — | — | — | — |
| Coordinator Assignment | manage | ✅ | ✅ | — | — | — | — | — | — | — |

³ Center Coordinator can update non-structural fields (instructions, timings) of their assigned center only

### Module D — Events & Registrations

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Events | read | All | All | Own center | All | — | — | — | — | — |
| Events | create | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Events | update | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Events | delete | ✅ | ✅ | — | — | — | — | — | — | — |
| Registrations | read | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Registrations | create | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Registrations | update | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Attendance | manage | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Participant List | export | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |

### Module E — WhatsApp Notifications

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Templates | manage | ✅ | ✅ | — | — | — | — | — | — | — |
| Templates | read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Messages | send | ✅ | ✅ | Own center | ✅ | ✅ | ✅ | ✅ | — | — |
| Delivery Logs | read | ✅ | ✅ | Own center | ✅ | ✅ | ✅ | ✅ | — | — |
| Job Management | manage | ✅ | ✅ | — | — | — | — | — | — | — |

### Module F — Dhyan Rath

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Vehicles | manage | ✅ | ✅ | — | — | — | — | ✅ | — | — |
| Routes | manage | ✅ | ✅ | — | — | — | — | ✅ | — | — |
| Schedules | manage | ✅ | ✅ | — | — | — | — | ✅ | — | — |
| Bookings | read | ✅ | ✅ | ✅⁴ | — | — | — | ✅ | — | — |
| Bookings | create | ✅ | ✅ | — | — | — | — | ✅ | — | — |
| Bookings | update | ✅ | ✅ | — | — | — | — | ✅ | — | — |
| Passenger List | export | ✅ | ✅ | — | — | — | — | ✅ | — | — |
| Utilization Reports | read | ✅ | ✅ | — | — | — | — | ✅ | — | — |

⁴ Center Coordinator can view bookings of their center's seekers only

### Module G — Bus Booking

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Buses | manage | ✅ | ✅ | — | — | — | ✅ | — | — | — |
| Routes | manage | ✅ | ✅ | — | — | — | ✅ | — | — | — |
| Schedules | manage | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — |
| Bookings | read | ✅ | ✅ | ✅⁴ | ✅ | — | ✅ | — | — | — |
| Bookings | create | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — |
| Bookings | update | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — |
| Passenger List | export | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — |

### Module H — Ratri Sadhna & Activities

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Activities | read | All | All | Own center | — | All | — | — | — | — |
| Activities | create | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| Activities | update | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| Activities | delete | ✅ | ✅ | — | — | — | — | — | — | — |
| Registrations | manage | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| Attendance | manage | ✅ | ✅ | — | — | ✅ | — | — | — | — |

### Module I & J — Products & Seasonal Fruits

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Product Catalog | read | ✅ | ✅ | ✅ | — | — | — | — | ✅ | — |
| Product Catalog | manage | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Inventory | read | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Inventory | manage | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Orders | read | ✅ | ✅ | Own center⁵ | — | — | — | — | ✅ | — |
| Orders | create | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Orders | update | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Payments | manage | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Stock Alerts | read | ✅ | ✅ | — | — | — | — | — | ✅ | — |

⁵ Center Coordinator can view orders placed for their center's seekers

### Module K — Granth & Sahitya

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Sahitya Catalog | read | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| Sahitya Catalog | manage | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| Sahitya Inventory | read | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| Sahitya Inventory | manage | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| Sahitya Orders | read | ✅ | ✅ | Own center⁵ | — | — | — | — | — | ✅ |
| Sahitya Orders | create | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| Sahitya Orders | update | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| Sahitya Payments | manage | ✅ | ✅ | — | — | — | — | — | — | ✅ |

### Module L — Finance & Transparency

| Resource | Action | Super Admin | Admin | Center Coord | Event Coord | Ratri Sadhna | Bus Coord | Dhyan Rath | Product Coord | Sahitya Coord |
|----------|--------|:-----------:|:-----:|:------------:|:-----------:|:------------:|:---------:|:----------:|:-------------:|:-------------:|
| Expense Categories | manage | ✅ | ✅ | — | — | — | — | — | — | — |
| Event Budgets | manage | ✅ | ✅ | — | — | — | — | — | — | — |
| Expenses | read | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Expenses | create | ✅ | ✅ | — | ✅ | — | — | — | — | — |
| Expenses | update | ✅ | ✅ | — | ✅⁶ | — | — | — | — | — |
| Expenses | approve | ✅ | ✅ | — | — | — | — | — | — | — |
| Receipts | read | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Receipts | upload | ✅ | ✅ | — | ✅ | — | — | — | — | — |
| Contributions | manage | ✅ | ✅ | — | — | — | — | — | — | — |
| Financial Summary | read | ✅ | ✅ | Own center | ✅ | — | — | — | — | — |
| Financial Summary | publish | ✅ | ✅ | — | — | — | — | — | — | — |

⁶ Event Coordinator can only update expenses in `draft` status (before submission)

---

## 4. RLS Implementation

### Permission Check Functions

```sql
-- Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION auth.user_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = ANY(allowed_roles)
        AND ur.is_active = true
    );
$$;

-- Check if user has access to a specific center
CREATE OR REPLACE FUNCTION auth.user_has_center_access(target_center_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND (
            r.name IN ('super_admin', 'admin')  -- Global access
            OR ur.center_id = target_center_id   -- Center-scoped
        )
    );
$$;

-- Check module-level permission
CREATE OR REPLACE FUNCTION auth.user_has_permission(target_module text, target_action text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND p.module = target_module
        AND p.action = target_action
    );
$$;
```

### Example RLS Policies

```sql
-- Seekers: Center-scoped read access
CREATE POLICY "Seekers read access" ON seekers
FOR SELECT TO authenticated
USING (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (
        auth.user_has_role(ARRAY['center_coordinator'])
        AND auth.user_has_center_access(center_id)
    )
    OR auth.user_has_permission('seekers', 'read')
);

-- Expenses: Only creator can update in draft status
CREATE POLICY "Expenses update" ON event_expenses
FOR UPDATE TO authenticated
USING (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (submitted_by = auth.uid() AND status = 'draft')
)
WITH CHECK (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (submitted_by = auth.uid() AND status = 'draft')
);
```

---

## 5. Scope Enforcement Summary

| Scope | How Enforced | Example |
|-------|-------------|---------|
| **Global** | No center filter; user sees all records | Super Admin sees all seekers |
| **Center** | Filter by `center_id` matching user's assigned centers | Center Coordinator sees only their center's seekers |
| **Module** | Filter by resource type/category | Product Coordinator sees only product-related data |
| **Own** | Filter by `created_by` or `submitted_by` = current user | Event Coordinator edits only their own draft expenses |
| **Record-level** | Row-specific checks (e.g., status = 'draft') | Can't edit approved expenses |
