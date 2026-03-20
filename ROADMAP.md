# Roadmap — Garage Log

Living document. Updated 2026-03-20.
Structure: Now → Next → Later

-----

## Now — v0.6.8 · Open Bugs

### Layout / Visual

- [ ] Qty stepper inside sheet — not centered
- [ ] "Have it" badge — shifts when qty is present; items without qty are misaligned against items with qty
- [ ] Tapping qty on "have it" card — stretches the card
- [ ] Edit item sheet — opens at Type field, top of sheet not visible (doesn't scroll to top)

### Interaction / UX

- [ ] Swipe-to-button actions lag (touch event conflict)
- [ ] Inventory filters — hover/active color doesn't change, unclear which subcategory is active
- [ ] Undo without category — item restores to bottom of list instead of original position

### Logic / Data

- [ ] Blocked filter in project — after unblocking, button stays active but shows all unblocked tasks
- [ ] Import tasks — input fields not cleared when switching between Text/CSV tabs

-----

## Next

- [ ] Shared projects — доступ механику/партнёру по email
- [ ] Система продажи запчастей:
  - [ ] Цена продажи (отдельно от price_paid)
  - [ ] Куда выложила (OLX / Telegram / др.)
  - [ ] Продано за сколько
  - [ ] Фото на айтем (Supabase Storage)
  - [ ] Локация (гараж/полка)
  - [ ] Генерация поста для телеги через AI
- [ ] Save task on tap outside (without Save button) — discuss tradeoffs
- [ ] Block on task — add shortcut to remove quickly (swipe or inline button)
- [ ] Category collapse state — persist between renders

-----

## v0.7.0 · Quality of Life

- [ ] ? icon in header → shows What's New (from CHANGELOG) + Known Bugs
- [ ] Sync ↻ button — fix size to match other buttons
- [ ] Select all tasks in category
- [ ] Pin tasks (swipe right to pin?)
- [ ] Scroll to top button (appears on scroll down)

-----

## v0.7.5 · CSV Test Suite

- [ ] Create CSV file with test cases to run after each update
- [ ] Cover: CRUD tasks/items/projects, undo, swipe, filters, import, block logic

-----

## v0.8.0 · Budget

- [ ] Expenses section in project detail (via task → inventory links)
- [ ] Vehicle summary: total spent / by category
- [ ] Конвертация валют (опционально)

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
- [ ] Filmed → status "filmed", moves to edit queue

-----

## Later

- [ ] VIN интеграция + рекомендации запчастей по модели
- [ ] Service log — comfortable view in landscape mode
- [ ] Telegram chatbot for quick input
- [ ] AI photo analysis
- [ ] Import directly from Notes folder (iOS Shortcuts?)
- [ ] Project archive (hide without deleting)
- [ ] Duplicate project
- [ ] Drag & drop project sorting
- [ ] Full backup import / export
- [ ] Date picker on Add Vehicle — remove or replace with year-only picker

-----

## Refactor

- [x] Split index.html → index.html / style.css / js/app.js
- [ ] Split app.js into modules (projects, tasks, inventory, ui, supabase)
- [ ] Add max-length constraints on all input fields
- [ ] Audit Supabase RLS policies on all tables
- [ ] Audit all delete actions — which have confirmation, which don't
- [ ] Verify undo works for all delete types

-----

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
- [x] Tasks — Priority shown on card
- [x] Tasks — "All" button correct states
- [x] Tasks — deleteEditTask with undo toast
- [x] Focus — complete, skip, block, start over, filter by project
- [x] Focus — category + project label at bottom of card
- [x] Focus — барабан scroll-snap (одна таска = один свайп)
- [x] Focus — фильтр показывает только проекты с открытыми незаблокированными тасками
- [x] Inventory — Edit item: drum status, type segment, tag chips, sticky buttons
- [x] Inventory — Swipe left delete (undo), swipe right toggle Have↔Missing
- [x] Inventory — Inline qty stepper on card (−N+), auto-save
- [x] Inventory — Tag suggestions with global delete
- [x] Inventory — film_flag + blocked_reason
- [x] Inventory — Convert item → task (проверка дубликата + удаление айтема)
- [x] Inventory — Currency field (₴/€/$) на айтеме
- [x] Inventory — Spending overview (Spent / Planned по валютам с учётом qty)
- [x] Garage — add/edit/delete vehicle, sticky footer
- [x] Service log — entries with date and mileage
- [x] Background photo (Supabase Storage)
- [x] Undo: task delete, project delete, category delete, item delete
- [x] App version constant + shown on login and settings
- [x] Рефакторинг — index.html / style.css / js/app.js
