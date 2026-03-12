# Roadmap — Garage Log

Living document. Updated 2026-03-10.
Structure: Now → Next → Later

-----

## Now — v0.5.6

- [ ] Inventory — Edit item: quantity stepper → number input
- [ ] Inventory — sticky buttons: remove dark background, blend with sheet
- [ ] Focus — category label below card (semi-transparent, like Tasks tab style)
- [ ] Rename category — test for duplicate name conflict

-----

## Next — v0.5.7 · Link Parts ↔ Tasks

- [ ] Edit task → “Required parts” → search inventory → link
- [ ] Edit item → “Linked tasks” → list of tasks using this item
- [ ] Task card shows: ✅ part available / ❌ missing
- [ ] Focus auto-blocks task if any required item is missing
- [ ] “Analyse” button in project menu → fuzzy match tasks vs inventory → suggest links
- [ ] From item → create task (pre-linked)
- [ ] From item → add to budget

-----

## v0.5.8 · Project UX

- [ ] Quick category filter inside project (button at top)
- [ ] Collapse/expand category with one tap

-----

## v0.6.0 · Budget

- [ ] Expenses section in project detail
- [ ] Vehicle summary: total spent / by category
- [ ] CSV import → parse costs into Budget
- [ ] CSV export budget by vehicle

-----

## v0.7.0 · Offline

- [ ] Snapshot all data to localStorage after loadAll()
- [ ] On start — show from cache immediately, load Supabase in parallel
- [ ] Offline action queue (pendingQueue)
- [ ] Sync on `online` event

-----

## v0.8.0 · YouTube Pipeline

- [ ] 🎬 tasks auto-collect into YouTube project
- [ ] Copy to YouTube in one tap from Focus
- [ ] Filmed → status “filmed”, moves to edit queue

-----

## Backlog / Ideas

- Share project by email
- Contacts (mechanics, suppliers)
- Telegram chatbot for quick input
- Full backup import/export
- Drag & drop project sorting
- Project archive (hide without deleting)
- Duplicate project
- Task photos (before / after)
- AI photo analysis

-----

## Done ✅

- [x] Google OAuth, PWA install
- [x] Projects CRUD + detail screen + cover photo + color + vehicle link
- [x] Tasks — add, edit, delete, complete, block, copy to project
- [x] Tasks — import from text/notes + CSV (Russian/emoji headers)
- [x] Tasks — categories, rename category
- [x] Tasks — search, filter by project, 🎬 filter, blocked filter
- [x] Tasks — Edit task: new layout (priority segment, notes always visible, sticky buttons)
- [x] Focus tab — complete, skip, block, start over, filter by project
- [x] Inventory — parts/tools/consumables, search, filter, tags
- [x] Inventory — Edit item: new layout (status/type segments, tag chips, sticky buttons)
- [x] Garage (Objects) — add/edit/delete vehicle
- [x] Service log — entries with date and mileage, protection against mileage decrease
- [x] Background photo (Supabase Storage)
- [x] Undo task deletion
- [x] loadAll() refactor — local updates without full reload
- [x] URL in cards — truncated, no overflow
- [x] Removed: done tasks collapse, search icon, “Other” type in inventory
