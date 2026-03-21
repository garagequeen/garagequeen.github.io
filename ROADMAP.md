# Roadmap — Garage Log

Living document. Updated 2026-03-21.
Structure: Now → Next → Later

---

## Now — v0.7.1 · Open Bugs

### Layout / Visual
- [ ] Qty stepper — stretches card on tap in inventory list
- [ ] "Have it" badge shifts when qty present
- [ ] Focus card content alignment (center vs bottom)

### Logic / Data
- [ ] Blocked filter stays active after unblocking task
- [ ] Import tasks — fields not cleared when switching Text/CSV tabs
- [ ] Undo without category — item restores to bottom instead of original position

---

## Next

### Content / YouTube Pipeline
- [ ] Content project — group 🎬 tasks by source project
- [ ] Content project — filming sessions (group tasks by date/shoot)
- [ ] Video entity — link multiple tasks to one video
- [ ] Filmed status visible on task card in regular projects
- [ ] Reminder to film when heading to garage

### Sale System
- [ ] Sale price visible on inventory card (done)
- [ ] Listings visible on card (done)
- [ ] Photo on inventory item (Supabase Storage)
- [ ] Telegram post generation from item

### Shared Projects
- [ ] Invite mechanic/partner by email
- [ ] project_members table + RLS policies
- [ ] Read-only vs edit access

### Service Log Journal
- [ ] Monospace journal view (IBM Plex Mono style)
- [ ] Complete task → option to add to service log
- [ ] HTML export for printing/sharing

---

## v0.8.0 · Project Types & Onboarding

- [ ] Project type field (generic / car / content)
- [ ] Onboarding wizard on first login
- [ ] Project templates (Car restore, YouTube series, Generic)
- [ ] Type-specific fields shown in project detail

---

## v0.8.5 · Budget

- [ ] Expenses section in project detail (via task → inventory links)
- [ ] Vehicle summary: total spent / by category
- [ ] Currency conversion (optional)

---

## v0.9.0 · Offline

- [ ] Snapshot all data to localStorage after loadAll()
- [ ] Show from cache immediately, load Supabase in parallel
- [ ] Offline action queue (pendingQueue)
- [ ] Sync on `online` event

---

## Later

- [ ] VIN integration + parts recommendations by model
- [ ] Service log — landscape view
- [ ] Telegram chatbot for quick input
- [ ] AI photo analysis
- [ ] Import from Notes folder (iOS Shortcuts)
- [ ] Project archive (hide without deleting)
- [ ] Duplicate project
- [ ] Drag & drop project sorting
- [ ] Full backup import / export

---

## Refactor

- [x] Split index.html → index.html / style.css / js/app.js
- [ ] Split app.js into modules (projects, tasks, inventory, ui, supabase)
- [ ] Add max-length constraints on all input fields
- [ ] Audit Supabase RLS policies
- [ ] Audit all delete actions — confirmation + undo coverage

---

## Done ✅

- [x] Google OAuth, PWA install
- [x] Projects CRUD + detail + cover photo + color + vehicle link
- [x] Tasks — add, edit, delete, complete, block, copy to project
- [x] Tasks — import from text/notes + CSV
- [x] Tasks — categories, rename, delete category (with undo)
- [x] Tasks — search, filter by project, 🎬 filter, blocked filter
- [x] Tasks — Edit task: category chip, priority chips, sticky buttons
- [x] Tasks — Swipe left to delete (with undo)
- [x] Tasks — Long press → multiselect → Complete / Category / Delete
- [x] Tasks — Collapse/expand categories, count badge
- [x] Tasks — Blocked chip filter inside project list
- [x] Tasks — deleteEditTask with undo toast
- [x] Tasks — filmed boolean field on task
- [x] Focus — complete, skip, block, start over, filter by project
- [x] Focus — scroll-snap drum (one task = one swipe)
- [x] Focus — filter shows only projects with open unblocked tasks
- [x] Inventory — Edit item: type buttons + status drum side by side
- [x] Inventory — Qty stepper in edit sheet (centered)
- [x] Inventory — Swipe left delete, swipe right toggle Have/Missing
- [x] Inventory — Inline qty stepper on card
- [x] Inventory — Tag suggestions with global delete
- [x] Inventory — Convert item → task (duplicate check + item deleted after)
- [x] Inventory — Currency field (UAH/EUR/USD) per item
- [x] Inventory — Spending overview (Spent / Planned by currency with qty)
- [x] Inventory — Sale system: sale_price, sale_currency, sold_for, listings
- [x] Inventory — For sale fields appear immediately on drum change
- [x] Inventory — For sale filter tab
- [x] Inventory — Sale price + listings shown on card
- [x] Inventory — Blocked item highlight (red left border if linked to blocked task)
- [x] Inventory — Removed block field (auto-block via task links only)
- [x] Garage — add/edit/delete vehicle, sticky footer
- [x] Service log — entries with date and mileage
- [x] Background photo (Supabase Storage)
- [x] Undo: task delete, project delete, category delete, item delete
- [x] App version constant shown on login and settings
- [x] Content project — is_content flag, collects all 🎬 tasks, filmed toggle
- [x] Refactor — index.html / style.css / js/app.js
