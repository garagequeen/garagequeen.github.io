# Roadmap — Garage Log

Living document. Updated 2026-03-25.
Structure: Now → Next → Later

---
### v0.8.1 · Polish
- [ ] Edit Vehicle — sections: Basic / Details / History
- [ ] Inventory — linked vehicle/location field
- [ ] Analyse — explanation string + clearer UI
- [ ] Service log — retro journal view as separate screen
- [ ] Scroll to top button on long task lists
- [ ] Content project — content_status field (filmed → editing → ready → posted)
- [ ] Appointments — notification reminder (browser or Telegram)
- [ ] New task — priority toggle inline


## Now — v0.7.4 · In Progress

### In Progress
- [x] Task place field UI (home / garage / car) — column added, UI done, filter pending
- [ ] Pre-trip checklist — show tasks + items needed for a location

### Open Bugs
- [x] Focus card content alignment (center vs bottom)
- [ ] Qty stepper stretches inventory card on tap
- [x] Blocked filter stays active after unblocking task
- [ ] Not all CSVs can be imported
- [ ] No button to add entry in service log from Settings
- [x] Swipe actions lag (touch event conflict)
- [ ] Long task lists hard to scroll through

---

## Next

### Quick Wins
- [x] Convert task → inventory item (reverse of existing convert item → task)
- [x] Project menu ⋯ — Edit on top, Delete below (clearer hierarchy)
- [ ] Pin projects — stick important projects to top
- [ ] Collapse all / expand all icon — replace ⊟ with clearer symbol
- [ ] Changelog integrated — ? icon shows What's New + Known Bugs

### Project Types — New
- [x] 🩺 Clients/Patients type — categories: To contact, Sessions, Follow up, Notes
- [ ] 🎨 Creative type — categories: Research, Grants, Portfolio, Submit, Reply
- [ ] Project type templates — auto-create categories on project creation

### Vehicle — Inspection & Defects
- [ ] Inspection entity linked to vehicle (object)
- [ ] Defect list — each defect can be converted to task
- [ ] Checklist templates — reusable inspection lists (new purchase, seasonal service, pre-sale)
- [ ] Apply template to project or vehicle

### Expenses vs Inventory
- [ ] Separate inventory (physical stock) from expenses (money spent)
- [ ] Expense entry: amount, category, date, linked to vehicle/project
- [ ] Recurring expenses (car wash, insurance, etc.)
- [ ] Budget per vehicle — total spent per year by category
- [ ] expenses table already exists in Supabase — wire up UI

### Locations & Pre-trip
- [ ] Filter tasks by place (home / garage / car)
- [ ] Pre-trip checklist: select destination → tasks + items to bring
- [ ] "Taking to garage" quick list

### Content Pipeline
- [ ] Content project — group 🎬 tasks by source project
- [ ] Filming sessions — group tasks by shoot date
- [ ] Video entity — link multiple tasks to one video
- [ ] Filmed status visible on task card in regular projects

### Photos
- [ ] Photo on inventory item (Cloudinary)
- [ ] Photo compression before upload (Canvas, max 800px)
- [ ] Before/after photos on task

### Sale System
- [ ] Telegram post generation from item (with photo)
- [ ] Sold items archive

### Shared Projects
- [ ] Invite by email
- [ ] project_members table + RLS
- [ ] Read-only vs edit access

### Service Log
- [ ] Complete task → offer "Add to service log" (done ✅)
- [ ] Journal view in app — white monospace style (done ✅)
- [ ] HTML export for printing (done ✅)
- [ ] Landscape / horizontal view for service log

---

## v0.8.0 · Onboarding & Templates

- [ ] Onboarding wizard on first login
- [ ] Project templates with pre-filled categories
- [ ] Type-specific quick actions per project type
- [ ] Inspection checklist templates for vehicles

---

## v0.8.5 · Budget & Expenses

- [ ] Expenses UI (separate from inventory)
- [ ] Recurring expenses
- [ ] Budget per vehicle / project
- [ ] Currency conversion (optional)

---

## v0.9.0 · Offline

- [ ] Snapshot to localStorage after loadAll()
- [ ] Show from cache, load Supabase in parallel
- [ ] Offline action queue
- [ ] Sync on `online` event

---

## Later

- [ ] VIN integration + parts recommendations
- [ ] Import from Notes folder (iOS Shortcuts)
- [ ] Project archive (hide without deleting)
- [ ] Project sorting (drag & drop or manual)
- [ ] Duplicate project
- [ ] Full backup import / export
- [ ] Telegram chatbot for quick input
- [ ] AI photo analysis

---

## Refactor

- [x] Split index.html → index.html / style.css / js/app.js
- [ ] Split app.js into modules
- [ ] Max-length constraints on all inputs
- [ ] Audit Supabase RLS policies
- [ ] Audit delete actions — confirmation + undo coverage
- [ ] CSV test suite — upload and check functionality + edge cases

---

## Done ✅

- [x] Google OAuth, PWA install
- [x] Projects CRUD + cover photo + color + vehicle link
- [x] Projects — type field with SVG icons (general/vehicle/content/build/home)
- [x] Projects — collapse all categories button
- [x] Tasks — full CRUD, categories, import CSV/text
- [x] Tasks — category suggestions (add + edit)
- [x] Tasks — search, filters (project / film / blocked)
- [x] Tasks — multiselect, swipe delete, long press
- [x] Tasks — dependencies (blocked by task, auto-unblock on complete)
- [x] Tasks — filmed boolean, place field
- [x] Tasks — deleteEditTask with undo
- [x] Quick capture — floating + button
- [x] Focus — scroll-snap drum, project filter
- [x] Inventory — full CRUD, tags, CSV import/export
- [x] Inventory — sale system (listings, sale price, sold_for)
- [x] Inventory — spending overview by currency
- [x] Inventory — blocked item highlight
- [x] Inventory — convert item → task
- [x] Garage — vehicles CRUD
- [x] Service log — entries, journal view, HTML export
- [x] Service log — offer add to log on task complete
- [x] Pre-trip checklist — garage/home/car
- [x] Background photo, feedback button
- [x] Undo: tasks, projects, categories, items
- [x] App version shown on login + settings
- [x] Content project — collects 🎬 tasks, filmed toggle
- [x] Refactor — index.html / style.css / js/app.js
