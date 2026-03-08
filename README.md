# Garage Log

A personal garage management PWA built for ADHD brains.
Turns chaos — spreadsheets, lists, half-done projects — into focused action.

**Live:** https://garagequeen.github.io

-----

## What it does

- **Focus** — shows only tasks you can actually do right now (unblocked, parts available)
- **Projects** — Cars, Garage, YouTube — each with its own task list
- **Inventory** — parts, consumables, tools with availability status *(coming v0.3)*
- **Objects** — car cards with VIN, mileage, service log *(coming v0.4)*
- **YouTube pipeline** — tag tasks as filmable, auto-collects into video project *(coming v0.6)*

-----

## Stack

|Layer   |Tech                              |
|--------|----------------------------------|
|Hosting |GitHub Pages                      |
|Auth    |Supabase (Google OAuth)           |
|Database|Supabase (PostgreSQL)             |
|Frontend|Vanilla HTML/CSS/JS — no framework|
|PWA     |Service Worker + Web Manifest     |

-----

## File structure

```
/
├── index.html       # entire app (single file)
├── manifest.json    # PWA config
├── sw.js            # service worker (network-first)
├── icon-192.png
├── icon-512.png
├── CHANGELOG.md
└── ROADMAP.md
```

-----

## Database (Supabase)

Main tables:

|Table           |Purpose                                   |
|----------------|------------------------------------------|
|`projects`      |top-level projects (cars, garage, youtube)|
|`tasks`         |tasks linked to projects                  |
|`subtasks`      |checklist items inside a task             |
|`inventory`     |parts, tools, consumables                 |
|`task_inventory`|links tasks to required inventory         |
|`task_photos`   |before/after photos per task              |
|`objects`       |car/asset cards                           |
|`service_log`   |service history per object                |
|`contacts`      |mechanics, suppliers                      |
|`sales`         |parts for sale                            |
|`fasteners`     |bolts/nuts catalog per car                |

Full schema diagram: *(add dbdiagram.io link here)*

-----

## Versioning

`MAJOR.MINOR.PATCH`

- MAJOR — structural changes (new DB tables, auth changes)
- MINOR — new features or tabs
- PATCH — bug fixes, small tweaks

See [CHANGELOG.md](./CHANGELOG.md) for full history.
See [ROADMAP.md](./ROADMAP.md) for what’s coming.

-----

## Development notes

- All app logic is in `index.html` — no build step needed
- To deploy: commit and push to `main` — GitHub Pages auto-deploys
- Supabase anon key is public (safe for frontend) — RLS policies protect data per user
- Service worker is network-first — always loads fresh version when online
