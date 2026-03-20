# Changelog — Garage Log

All notable changes documented here.
Format: [Keep a Changelog](https://keepachangelog.com)

-----

## [0.6.8] - 2026-03-20

### Added

- Focus — барабан scroll-snap: одна таска на экран, один свайп = одна карточка
- Focus — фильтр по проектам показывает только проекты с открытыми незаблокированными тасками
- Inventory — поле currency (₴/€/$) на каждом айтеме, дефолт ₴ UAH
- Inventory — Spending overview внизу списка: Spent / Planned по валютам с учётом qty
- Convert item → task — проверка дубликата перед созданием
- Convert item → task — айтем удаляется после успешной конвертации

### Changed

- Рефакторинг: index.html разделён на index.html / style.css / js/app.js

### Fixed

- Convert item → task — починили (editingInvItem порядок объявления)

-----

## [0.6.7] - 2026-03-12

### Added

- deleteEditTask — undo toast с 4-секундной задержкой перед удалением из БД
- APP_VERSION константа — единый источник версии, отображается на экране логина и в настройках

### Fixed

- Toast pointer-events — теперь кнопка Undo кликабельна
- versionLogin HTML — сломанный style атрибут исправлен
- docement typo — исправлено на document.getElementById

-----

## [0.6.x] - 2026-03-11

### Added

- Tasks — deleteEditTask with undo
- Tasks — Long press → multiselect → Complete / Category / Delete
- Tasks — Collapse/expand categories with count badge
- Tasks — Blocked chip filter inside project list
- Inventory — film_flag + blocked_reason columns
- Inventory — Tag suggestions with global delete
- Inventory — Swipe right to toggle Have↔Missing
- Focus — film filter 🎬
- Focus — blocked filter

### Fixed

- Qty stepper − N + alignment (flex centering)
- Tasks "All" button correct default/active/inactive states
- New category input — mixed case + autofocus
- Priority simplified — only High | null
- font-size 16px on inputs (prevents iOS zoom)
- Blocked filter auto-reset after saveEditTask()
- invFilter reset on swipe-delete undo

-----

## [0.4.2] - 2026-03-09

### Added

- Project cover photo fills entire card background
- Progress overlay — light fill grows left→right as tasks complete

### Fixed

- Settings tab scroll — version now reachable
- Inventory — gap between search and filters removed

-----

## [0.4.1] - 2026-03-09

### Added

- 🎬 Film flag on tasks
- Cover photo for projects (Supabase Storage)
- Progress bar on project cards
- Copy task to another project

### Fixed

- Swipe delete — touchend + stopPropagation
- Task filter capsules — box-shadow color accent

-----

## [0.4.0] - 2026-03-09

### Added

- Garage section in Settings — add/edit/delete vehicles
- Focus — project name shown in project color
- Task filters — capsule style with project color
- Inventory — search field

-----

## [0.3.x] - 2026-03-08/09

### Added

- Tasks tab — search + filter by project
- Block task — reason input, badge on card, hidden from Focus
- Swipe left on task → Delete button
- Rename project sheet — name + color picker
- Import parser — text/notes + CSV
- Background photo saved to Supabase Storage
- Feedback button (🐛 Problem / 💡 Idea)
- Safe area support everywhere

-----

## [0.2.0] - 2026-03-08

### Added

- Projects clickable → detail screen with task list
- Focus tab — cards with Skip button
- Delete project with confirmation
- Auth fix: flowType pkce for Chrome on iOS

-----

## [0.1.0] - 2026-03-01

### Added

- Initial version
- Google OAuth login
- Tasks list, Projects list, Focus tab
- Background image via localStorage
- PWA support (manifest + service worker)
- Settings tab with logout
