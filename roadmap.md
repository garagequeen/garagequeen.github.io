# Roadmap — Garage Log

Living document. Updated 2026-03-12.
Structure: Now → Next → Later

-----

## Now — v0.6.x · Open Bugs

### Critical

- [x] Undo item — does not return to list (cause unclear, check console)
- [ ] Date picker — does not show date when adding a vehicle
- [ ] Convert item → task is broken

### Layout / Visual

- [ ] Qty stepper inside sheet — not centered
- [ ] “Have it” badge — shifts when qty is present; items without qty are misaligned against items with qty
- [ ] Tapping qty on “have it” card — stretches the card
- [x] Sync button — larger than ⊘ Block and 🎬 Video buttons
- [ ] Edit item sheet — opens at Type field, top of sheet not visible (doesn’t scroll to top)
- [x] Categories sort lexically: 1, 10, 12, 2, 3… (need natural sort)

### Interaction / UX

- [ ] Swipe-to-button actions lag (touch event conflict)
- [ ] Tapping search field in Tasks zooms in (fix: font-size ≥ 16px on input)
- [ ] Pinch zoom enabled — consider disabling
- [ ] Inventory filters — hover/active color doesn’t change, unclear which subcategory is active
- [ ] Undo without category — item restores to bottom of list instead of original position

### Logic / Data

- [ ] Blocked filter in project — after unblocking, button stays active but shows all unblocked tasks
- [ ] Import tasks — input fields not cleared when switching between Text/CSV tabs
- [ ] Edit task — Medium and Low priority options still visible; remove (keep only High or none)
- [ ] Priority: simplify to high | null — if null, show no badge

-----

## Next — v0.6.7 · UX Polish

- [ ] Save task on tap outside (without Save button) — discuss tradeoffs
- [ ] Block on task — not obvious how to remove quickly; add shortcut (swipe or inline button?)
- [ ] Category collapse state — persist between renders

-----

## v0.7.0 · Changelog UI + Quality of Life

- [ ] ? icon in header → shows What’s New (from CHANGELOG) + Known Bugs
- [ ] App version shown on login screen (small, subtle)
- [ ] Sync ↻ button — already added, fix size to match other buttons
- [ ] Select all tasks in category (long press on header? - now long plress on task: then select the task)
- [ ] Pin tasks (swipe right to pin?)
- [ ] Scroll to top button (appears on scroll down)

-----

## v0.7.5 · CSV Test Suite

- [ ] Create CSV file with test cases to run after each update
- [ ] Upload CSV → runs through features and edge cases automatically
- [ ] Cover: CRUD tasks/items/projects, undo, swipe, filters, import, block logic

-----

## v0.8.0 · Budget

- [ ] Expenses section in project detail
- [ ] Vehicle summary: total spent / by category
- [ ] CSV import → parse costs into Budget
- [ ] CSV export budget by vehicle
- [ ] From item → add to budget

-----

## v0.9.0 · Offline

- [ ] Snapshot all data to localStorage after loadAll()
- [ ] On start — show from cache immediately, load Supabase in parallel
- [ ] Offline action queue (pendingQueue)
- [ ] Sync on `online` event

-----

## v1.0.0 · YouTube Pipeline

- [ ] 🎬 tasks auto-collect into YouTube project
- [ ] Copy to YouTube in one tap from Focus
- [ ] Filmed → status “filmed”, moves to edit queue
- [ ] Video + block tags — visibility toggle, maybe left sidebar

-----

## Backlog / Ideas

- [ ] Service log per vehicle — comfortable view in landscape mode
- [ ] Collapsable Garage section
- [ ] Shared task completion (co-op)
- [ ] Budget generation / export
- [ ] Task photos — before / after
- [ ] Import directly from Notes folder (iOS Shortcuts?)
- [ ] Telegram chatbot for quick input
- [ ] Feedback collection — superuser or separate Supabase table
- [ ] Project limit cap
- [ ] Share project by email
- [ ] Full backup import / export
- [ ] Drag & drop project sorting
- [ ] Project archive (hide without deleting)
- [ ] Duplicate project
- [ ] AI photo analysis
- [ ] Date picker on Add Vehicle — remove or replace with year-only picker

-----

## Refactor

- [ ] Split index.html into modules:
  
  ```
  /js/app.js
  /js/projects.js
  /js/tasks.js
  /js/inventory.js
  /js/swipe.js
  /js/ui.js
  /js/supabase.js
  index.html
  styles.css
  ```
- [ ] Add max-length constraints on all input fields
- [ ] Audit Supabase RLS policies on all tables
- [ ] Audit all delete actions — which have confirmation, which don’t
- [ ] Verify undo works for all delete types

-----

## Done ✅

- [x] Google OAuth, PWA install
- [x] Projects CRUD + detail + cover photo + color + vehicle link
- [x] Tasks — add, edit, delete, complete, block, copy to project
- [x] Tasks — import from text/notes + CSV
- [x] Tasks — categories, rename, delete category (with undo)
- [x] Tasks — search, filter by project, 🎬 filter, blocked filter
- [x] Tasks — Edit task: category chip above title, priority color chips, sticky buttons
- [x] Tasks — Swipe left to delete (with undo, hidden until swipe)
- [x] Tasks — Long press → multiselect → Complete / Category / Delete
- [x] Tasks — Collapse/expand categories (short tap header), count badge
- [x] Tasks — Blocked chip filter inside project list
- [x] Tasks — Priority shown on card (colored chip in meta line)
- [x] Tasks — “All” button: correct default/active/inactive states
- [x] Tasks — New category: mixed case input + autofocus on first tap
- [x] Focus — complete, skip, block, start over, filter by project
- [x] Focus — category + project label at bottom of card (semi-transparent)
- [x] Focus — filter tabs same style as Tasks (color + bottom shadow)
- [x] Inventory — Edit item: drum status, type segment, tag chips, sticky buttons
- [x] Inventory — Swipe left delete (undo), swipe right toggle Have↔Missing
- [x] Inventory — Inline qty stepper on card (−N+), auto-save
- [x] Inventory — Tag suggestions with global delete
- [x] Inventory — film_flag + blocked_reason columns in DB
- [x] Inventory — Convert item → task (with project picker) *(broken, needs refix)*
- [x] Garage — add/edit/delete vehicle, sticky footer
- [x] Service log — entries with date and mileage
- [x] Background photo (Supabase Storage)
- [x] Undo: task delete, project delete, category delete, item delete (partial)
- [x] loadAll() refactor — local updates without full reload
- [x] Edit project — sticky footer
- [x] Add vehicle — sticky footer
- [x] Delete project — undo toast
- [x] Sync / Refresh ↻ button added
- [x] Qty stepper `−N+` — alignment fixed
