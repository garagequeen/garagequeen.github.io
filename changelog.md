# Changelog

All notable changes to Garage Log will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com)

-----

## [0.2.1] - 2026-03-08

### Added

- New user auto-redirects to Projects tab on first login
- Touch event blocking: pinch zoom and double-tap zoom disabled

### Fixed

- Bottom tab bar now respects iPhone safe area (home bar no longer overlaps)
- viewport-fit=cover added for proper notch/home bar handling

-----

## [0.2.0] - 2026-03-08

### Added

- Projects are now clickable — opens detail screen with task list
- Tasks are linked to projects
- Add task sheet with priority and notes fields
- Delete project with confirmation dialog
- Focus tab shows all unblocked open tasks as cards with Skip button
- Empty states with hints for new users
- `v0.2.0` version label in Settings
- Auth fix: `flowType: 'pkce'` for Chrome on iOS

### Changed

- Tabs reduced to Focus / Projects / Settings (Tasks inside Projects for now)
- Service worker switched to network-first — no more stale cache issues

### Removed

- Gallery tab (temporary, returns in later version)
- Standalone Tasks tab (tasks now live inside projects)

-----

## [0.1.0] - 2026-03-01

### Added

- Initial version
- Google OAuth login
- Tasks list (global, not linked to projects)
- Projects list (display only, no interaction)
- Focus tab (first open task only)
- Background image via localStorage
- PWA support (manifest + service worker)
- Settings tab with logout
