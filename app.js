const SUPA_URL = “https://fqmmlntmpybijmvrsfxx.supabase.co”
const SUPA_KEY = “eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbW1sbnRtcHliaWptdnJzZnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTYyMzMsImV4cCI6MjA4ODM5MjIzM30.HeiCco9pyNwDKUJJhA5Af6Yh7AIRZH5GGlvr4BFOcXk”
let sb

const PROJECT_COLORS = [’#3fb950’,’#f0a500’,’#c0392b’,’#3498db’,’#9b59b6’,’#1abc9c’,’#e67e22’,’#e91e63’]

let user = null, projects = [], tasks = [], inventory = [], objects = [], currentProject = null, invFilter = ‘all’, editingInvItem = null, taskProjectFilter = null, filmFilterOn = false, blockedFilterOn = false

window.addEventListener(‘load’, () => {
sb = supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { flowType: ‘pkce’ } })
sb.auth.onAuthStateChange((_e, s) => { if (s && !user) checkUser() })
checkUser()
})

function login() {
sb.auth.signInWithOAuth({ provider:“google”, options:{ redirectTo: window.location.origin } })
}
async function logout() { await sb.auth.signOut(); location.reload() }

async function checkUser() {
const { data } = await sb.auth.getSession()
if (data.session) {
user = data.session.user
document.getElementById(“login”).style.display = “none”
document.getElementById(“app”).style.display = “block”
document.getElementById(“userEmail”).innerText = user.email
await loadBg()
await loadAll()
}
}

// ── BACKGROUND (Supabase Storage) ──
async function loadBg() {
try {
const { data } = await sb.storage.from(‘backgrounds’).download(`${user.id}/bg`)
if (data) {
const url = URL.createObjectURL(data)
document.getElementById(“bg”).src = url
document.getElementById(“bgName”).innerText = “Background photo saved ✓”
}
} catch(e) {
const bg = localStorage.getItem(“bg”)
if (bg) {
document.getElementById(“bg”).src = bg
document.getElementById(“bgName”).innerText = “Background photo (local) ✓”
}
}
}

document.getElementById(“bgUpload”).addEventListener(“change”, async function() {
const file = this.files[0]
if (!file) return
const localUrl = URL.createObjectURL(file)
document.getElementById(“bg”).src = localUrl
document.getElementById(“bgName”).innerText = file.name
try {
const { error } = await sb.storage.from(‘backgrounds’).upload(`${user.id}/bg`, file, { upsert: true, contentType: file.type })
if (error) throw error
showToast(“Background saved ✓”)
} catch(e) {
const r2 = new FileReader()
r2.onload = ev => localStorage.setItem(“bg”, ev.target.result)
r2.readAsDataURL(file)
showToast(“Background saved locally ✓”)
}
})

// ── TOAST ──
function showToast(msg, duration=2500) {
const t = document.getElementById(“toast”)
t.innerHTML = msg
t.classList.add(“show”)
clearTimeout(t._timer)
t._timer = setTimeout(() => t.classList.remove(“show”), duration)
}

let _undoCallback = null
function showToastUndo(msg, onUndo) {
_undoCallback = onUndo
const t = document.getElementById(“toast”)
t.innerHTML = `${msg} <span id="undoBtn" style="color:#3fb950;margin-left:10px;font-weight:600;cursor:pointer">Undo</span>`
t.classList.add(“show”)
clearTimeout(t._timer)
document.getElementById(“undoBtn”).onclick = () => {
if (_undoCallback) { _undoCallback(); _undoCallback = null }
t.classList.remove(“show”)
}
t._timer = setTimeout(() => { t.classList.remove(“show”); _undoCallback = null }, 4000)
}

async function loadAll() {
const [p, t, inv, obj] = await Promise.all([
sb.from(“projects”).select(”*”).eq(“user_id”, user.id).order(“created_at”, { ascending: false }),
sb.from(“tasks”).select(”*”).eq(“user_id”, user.id).order(“created_at”, { ascending: false }),
sb.from(“inventory”).select(”*”).eq(“user_id”, user.id).order(“created_at”, { ascending: false }),
sb.from(“objects”).select(”*”).eq(“user_id”, user.id).order(“created_at”, { ascending: false })
])
projects = p.data || []
tasks = t.data || []
inventory = inv.data || []
objects = obj.data || []
renderProjects()
renderFocus()
renderAllTasks()
renderInventory()
renderObjects()
if (currentProject) renderTasks()
if (!projects.length && !user._initialLoadDone) { user._initialLoadDone = true; showTab(“projects”) }
user._initialLoadDone = true
}

// ── PROJECTS ──
function renderProjects() {
const el = document.getElementById(“projectsList”)
if (!projects.length) {
el.innerHTML = `<div class="empty" style="padding:40px 0">No projects yet.<br><span style="font-size:13px">Tap "+ New" to add your first one.</span></div>`
return
}
el.innerHTML = “”
projects.forEach(p => {
const open = tasks.filter(t => t.project_id === p.id && t.status !== “done”).length
const done = tasks.filter(t => t.project_id === p.id && t.status === “done”).length
const total = open + done
const pct = total ? Math.round((done / total) * 100) : 0
const color = p.color || ‘#3fb950’
const d = document.createElement(“div”)
d.className = “project-card”
d.style.borderLeftColor = color

```
// Cover photo as bg
if (p.cover_url) {
  const img = document.createElement("img")
  img.className = "project-card-bg"
  img.src = p.cover_url
  d.appendChild(img)
}

// Progress overlay - light = done (grows from left)
if (total) {
  const overlay = document.createElement("div")
  overlay.className = "project-card-progress-overlay"
  overlay.style.width = pct + "%"
  overlay.style.background = "rgba(255,255,255,0.12)"
  d.appendChild(overlay)
}

const vm = {}; objects.forEach(o => vm[o.id] = o)
const vehicle = p.object_id ? vm[p.object_id] : null
const info = document.createElement("div")
info.className = "project-info"
info.innerHTML = `
  <div class="project-title">${p.title}</div>
  ${vehicle?`<div style="font-size:11px;color:#888;margin-top:2px">${vehicle.name}</div>`:""}
  <div class="project-meta">${open} open${done?" · "+done+" done":""}${total?" · "+pct+"%":""}</div>`
d.appendChild(info)
d.onclick = () => openDetail(p)
el.appendChild(d)
```

})
// Rebuild task project filter - capsules with box-shadow
const pf = document.getElementById(“taskProjectFilter”)
if (pf) {
pf.innerHTML = `<button class="filter-tab${!taskProjectFilter?" active":""}" onclick="setTaskFilter(null,this)">All</button>`
projects.forEach(p => {
const isActive = taskProjectFilter === p.id
const color = p.color || ‘#3fb950’
const btn = document.createElement(“button”)
btn.className = “filter-tab” + (isActive ? “ active” : “”)
btn.style.background = isActive ? color : ‘#222’
btn.style.color = isActive ? ‘#111’ : ‘#aaa’
btn.style.boxShadow = isActive ? `0 3px 0 0 ${color}` : `0 3px 0 0 ${color}55`
btn.innerText = p.title
btn.onclick = () => setTaskFilter(p.id, btn)
pf.appendChild(btn)
})
}
}

function openAddProject() {
document.getElementById(“newProjectName”).value = “”
document.getElementById(“addProjectSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“newProjectName”).focus(), 300)
}

async function addProject() {
const title = document.getElementById(“newProjectName”).value.trim()
if (!title) return
const duplicate = projects.find(p => p.title.toLowerCase() === title.toLowerCase())
if (duplicate) { showToast(`"${title}" already exists`); return }
await sb.from(“projects”).insert({ title, user_id: user.id, color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length] })
closeSheet(“addProjectSheet”)
await loadAll()
}

async function deleteProject(id) {
await sb.from(“tasks”).delete().eq(“project_id”, id).eq(“user_id”, user.id)
await sb.from(“projects”).delete().eq(“id”, id).eq(“user_id”, user.id)
closeDetail()
await loadAll()
}

// ── PROJECT DETAIL ──
function openDetail(p) {
currentProject = p
document.getElementById(“detailTitle”).innerText = p.title
document.getElementById(“projectDetail”).classList.add(“open”)
renderTasks()
}
function closeDetail() { document.getElementById(“projectDetail”).classList.remove(“open”); currentProject = null; closeProjectMenu() }

function toggleProjectMenu(e) {
e.stopPropagation()
const m = document.getElementById(“projectMenu”)
m.style.display = m.style.display === “none” ? “block” : “none”
if (m.style.display === “block”) {
setTimeout(() => document.addEventListener(“click”, closeProjectMenu, { once: true }), 0)
}
}
function closeProjectMenu() {
const m = document.getElementById(“projectMenu”)
if (m) m.style.display = “none”
}

// Sanitize HTML to prevent XSS
function sanitize(str) {
return String(str||””).replace(/&/g,”&”).replace(/</g,”<”).replace(/>/g,”>”).replace(/”/g,”"”)
}

function renderTasks(filterBlocked = false) {
const el = document.getElementById(“tasksList”)
let pt = tasks.filter(t => t.project_id === currentProject?.id)
if (filterBlocked) pt = pt.filter(t => t.blocked_reason)
if (!pt.length) { el.innerHTML = `<div class="empty">${filterBlocked?"No blocked tasks.":"No tasks yet.<br>Tap \"+ Task\" or Import."}</div>`; return }
el.innerHTML = “”
const grouped = {}
pt.forEach(t => {
const cat = t.category?.trim() || “”
if (!grouped[cat]) grouped[cat] = []
grouped[cat].push(t)
})
// Named categories first, empty last
const namedCats = Object.keys(grouped).filter(c => c !== “”).sort()
const cats = grouped[””] ? […namedCats, “”] : namedCats
cats.forEach((cat, catIdx) => {
const open = grouped[cat].filter(t => t.status !== “done”)
const done = grouped[cat].filter(t => t.status === “done”)
if (!open.length && !done.length) return
if (cat) {
const h = document.createElement(“div”)
h.className = “category-header”
h.style.cursor = “pointer”
h.innerText = cat
h.onclick = () => openRenameCategory(cat)
el.appendChild(h)
} else if (catIdx > 0) {
// Separator before uncategorized if there are named categories above
const sep = document.createElement(“div”)
sep.style.cssText = “height:1px;background:#222;margin:8px 0 12px;”
el.appendChild(sep)
}
open.forEach(t => el.appendChild(makeTaskCard(t)))
if (done.length) {
const doneRow = document.createElement(“div”)
doneRow.style.cssText = “font-size:12px;color:#444;cursor:pointer;padding:4px 0 8px 4px;user-select:none;”
doneRow.innerText = `· · · ${done.length} done`
const doneList = document.createElement(“div”)
doneList.style.display = “none”
doneRow.onclick = () => {
const isOpen = doneList.style.display === “none”
doneList.style.display = isOpen ? “block” : “none”
doneRow.innerText = isOpen ? `▾ ${done.length} done` : `· · · ${done.length} done`
}
done.forEach(t => doneList.appendChild(makeTaskCard(t)))
el.appendChild(doneRow)
el.appendChild(doneList)
}
})
}

function openAddTask() {
document.getElementById(“addTaskSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“newTaskTitle”).focus(), 300)
}

async function addTask() {
const rawTitle = document.getElementById(“newTaskTitle”).value.trim()
if (!rawTitle || !currentProject) return
const title = sanitize(rawTitle)
if (!title.replace(/&\w+;/g,’’).trim()) return // reject if only HTML entities
await sb.from(“tasks”).insert({
title, user_id: user.id, project_id: currentProject.id,
category: sanitize(document.getElementById(“newTaskCategory”).value.trim()) || null,
priority: document.getElementById(“newTaskPriority”).value || null,
notes: sanitize(document.getElementById(“newTaskNotes”).value.trim()) || null,
status: “open”
})
document.getElementById(“newTaskTitle”).value = “”
document.getElementById(“newTaskCategory”).value = “”
document.getElementById(“newTaskNotes”).value = “”
document.getElementById(“newTaskPriority”).value = “”
closeSheet(“addTaskSheet”)
await loadAll()
}

async function completeTask(id) {
const task = tasks.find(t => t.id === id)
if (!task) return
const isDone = task.status === “done”
const newStatus = isDone ? “open” : “done”
task.status = newStatus
task.done_at = isDone ? null : new Date().toISOString()
// Update check boxes by data-task-id
document.querySelectorAll(`.task-check[data-id="${id}"]`).forEach(check => {
check.classList.toggle(“done”, !isDone)
})
// Update title style
document.querySelectorAll(`.task-title[data-id="${id}"]`).forEach(title => {
title.classList.toggle(“done”, !isDone)
})
if (!isDone) showToast(“✓ Done!”)
sb.from(“tasks”).update(
isDone ? { status:“open”, done_at: null } : { status:“done”, done_at: new Date().toISOString() }
).eq(“id”, id).eq(“user_id”, user.id)
renderFocus()
}

// ── IMPORT ──
let parsedImportItems = []

function openImport() {
document.getElementById(“importStep1”).style.display = “block”
document.getElementById(“importStep2”).style.display = “none”
document.getElementById(“importText”).value = “”
switchImportTab(‘text’)
document.getElementById(“importSheet”).classList.add(“open”)
}

function backToImportStep1() {
document.getElementById(“importStep1”).style.display = “block”
document.getElementById(“importStep2”).style.display = “none”
}

function parseImport() {
const text = document.getElementById(“importText”).value
const lines = text.split(”\n”)
parsedImportItems = []
let currentCategory = “”

lines.forEach(line => {
const trimmed = line.trim()
if (!trimmed) return
const openMatch = trimmed.match(/^-\s[\s]\s+(.+)/)
const doneMatch = trimmed.match(/^-\s[x]\s+(.+)/i)
if (openMatch || doneMatch) {
const raw = (openMatch || doneMatch)[1]
const notesMatch = raw.match(/(([^)]+))/)
const notes = notesMatch ? notesMatch[1] : null
const title = raw.replace(/([^)]+)/g, “”).trim()
if (!title) return
const isDup = tasks.some(t => t.project_id === currentProject?.id && t.title.toLowerCase() === title.toLowerCase())
parsedImportItems.push({ title, notes, status: doneMatch ? “done” : “open”, category: currentCategory, selected: !isDup, duplicate: isDup, partNumber: null })
} else if (!trimmed.startsWith(”-”) && trimmed.length > 0) {
// Ignore lines that are only digits/article numbers - attach to last task instead
if (/^\d{4,}$/.test(trimmed)) {
if (parsedImportItems.length > 0) {
const last = parsedImportItems[parsedImportItems.length - 1]
last.partNumber = trimmed
}
} else {
currentCategory = trimmed
}
}
})

if (!parsedImportItems.length) { showToast(“No tasks found”); return }
renderImportPreview()
document.getElementById(“importStep1”).style.display = “none”
document.getElementById(“importStep2”).style.display = “block”
}

function renderImportPreview() {
const el = document.getElementById(“importPreview”)
el.innerHTML = “”
const selected = parsedImportItems.filter(i => i.selected).length
document.getElementById(“importCount”).innerText = `${selected} tasks selected`
document.getElementById(“importBtn”).innerText = `Import ${selected} tasks`
const grouped = {}
parsedImportItems.forEach((item, idx) => {
const cat = item.category || “”
if (!grouped[cat]) grouped[cat] = []
grouped[cat].push({ …item, idx })
})
Object.keys(grouped).forEach(cat => {
if (cat) {
const h = document.createElement(“div”)
h.className = “import-category-header”
h.innerText = cat
el.appendChild(h)
}
grouped[cat].forEach(({ title, notes, status, selected, duplicate, partNumber, idx }) => {
const d = document.createElement(“div”)
d.className = “import-item”
d.innerHTML = ` <input type="checkbox" class="import-check" ${selected?"checked":""} ${duplicate?"disabled":""} onchange="toggleImportItem(${idx}, this.checked)"> <div class="import-label ${status==='done'||duplicate?'import-done':''}"> ${title}${duplicate?' <small style="color:#555">already exists</small>':""} ${notes&&!duplicate?`<small>${notes}</small>`:""} ${partNumber?`<small style="color:#3fb950">🔩 ${partNumber} <label style="color:#aaa"><input type="checkbox" onchange="togglePartNumber(${idx},this.checked)" style="width:auto;margin:0 4px 0 6px;accent-color:#3fb950"> add to Parts</label></small>`:""} </div>`
el.appendChild(d)
})
})
}

function togglePartNumber(idx, checked) {
parsedImportItems[idx].addToParts = checked
}

function toggleImportItem(idx, checked) {
parsedImportItems[idx].selected = checked
const selected = parsedImportItems.filter(i => i.selected).length
document.getElementById(“importCount”).innerText = `${selected} tasks selected`
document.getElementById(“importBtn”).innerText = `Import ${selected} tasks`
}

async function doImport() {
const toInsert = parsedImportItems.filter(i => i.selected).map(i => ({
title: i.title, notes: i.notes || null, status: i.status,
category: i.category || null,
done_at: i.status === “done” ? new Date().toISOString() : null,
user_id: user.id, project_id: currentProject.id
}))
if (!toInsert.length) return
await sb.from(“tasks”).insert(toInsert)

// Insert part numbers to inventory
const parts = parsedImportItems.filter(i => i.addToParts && i.partNumber)
if (parts.length) {
await sb.from(“inventory”).insert(parts.map(i => ({
name: i.title,
type: “part”,
status: “missing”,
quantity: null,
location: i.partNumber,
user_id: user.id
})))
}

closeSheet(“importSheet”)
const msg = parts.length ? `${toInsert.length} tasks + ${parts.length} parts imported ✓` : `${toInsert.length} tasks imported ✓`
showToast(msg)
await loadAll()
}

// ── TASK CARD (shared) ──
function makeTaskCard(t, proj) {
const isDone = t.status === “done”
const isBlocked = !!t.blocked_reason
const pm = {}; projects.forEach(p => pm[p.id] = p)
const project = proj || pm[t.project_id]
const projColor = project?.color || ‘#3fb950’

const wrapper = document.createElement(“div”)
wrapper.style.cssText = “position:relative;overflow:hidden;border-radius:16px;margin-bottom:10px;”

const deleteBg = document.createElement(“div”)
deleteBg.style.cssText = “position:absolute;right:0;top:0;bottom:0;width:60px;background:#c0392b;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:600;border-radius:0 16px 16px 0;cursor:pointer;”
deleteBg.innerText = “Delete”
deleteBg.addEventListener(“touchend”, async e => {
e.stopPropagation()
e.preventDefault()
const deletedTask = t
tasks = tasks.filter(x => x.id !== t.id)
wrapper.remove()
renderFocus()
renderProjects()
let undone = false
showToastUndo(“Task deleted”, async () => {
undone = true
tasks = […tasks, deletedTask].sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
await loadAll()
})
setTimeout(async () => {
if (!undone) {
const { error } = await sb.from(“tasks”).delete().eq(“id”, deletedTask.id).eq(“user_id”, user.id)
if (error) { showToast(“Error deleting task ✕”); tasks = […tasks, deletedTask]; await loadAll() }
}
}, 4000)
}, { passive: false })

const card = document.createElement(“div”)
card.className = “task-card”
card.style.cssText = “margin-bottom:0;border-radius:16px;transition:transform 0.2s;position:relative;z-index:1;background:rgba(30,30,30,0.85);”
if (isBlocked) card.style.opacity = “0.6”

const priorityLabel = t.priority === ‘H’ ? ‘High’ : t.priority === ‘L’ ? ‘Low’ : null
const metaLine = proj
? `<span style="color:${projColor}">${project.title}</span>${t.category?` <span style="color:#555">· ${t.category}</span>`:""}${priorityLabel?` · ${priorityLabel}`:""}`
: `${priorityLabel||""}${t.notes?(priorityLabel?" · ":"")+t.notes:""}`

card.innerHTML = ` <div class="task-check${isDone?" done":""}" data-id="${t.id}" onclick="event.stopPropagation();completeTask('${t.id}')"></div> <div class="task-body"> <div class="task-title${isDone?" done":""}${isBlocked?" blocked":""}" data-id="${t.id}">${sanitize(t.title)}${t.film_flag?`<span class="film-flag">🎬</span>`:""}${isBlocked?` <span style="font-size:11px;color:#f0a500;background:#3a2a00;padding:1px 6px;border-radius:4px;margin-left:4px">blocked</span>`:""}</div> ${metaLine?`<div class="task-meta">${metaLine}</div>`:""} ${isBlocked&&t.blocked_reason?`<div class="task-meta" style="color:#f0a500">${sanitize(t.blocked_reason)}</div>`:""} </div>`

card.querySelector(”.task-body”).onclick = () => openEditTask(t)

let startX = 0, currentX = 0, swiping = false
card.addEventListener(“touchstart”, e => { startX = e.touches[0].clientX; swiping = true; currentX = 0 }, { passive: true })
card.addEventListener(“touchmove”, e => {
if (!swiping) return
currentX = e.touches[0].clientX - startX
if (currentX < 0) card.style.transform = `translateX(${Math.max(currentX, -60)}px)`
}, { passive: true })
card.addEventListener(“touchend”, () => {
swiping = false
if (currentX < -40) {
card.style.transform = “translateX(-60px)”
openSwipeCard = card
} else {
card.style.transform = “translateX(0)”
}
})

wrapper.appendChild(deleteBg)
wrapper.appendChild(card)
return wrapper
}

// ── EDIT TASK ──
let editingTask = null
function openEditTask(t) {
editingTask = t
document.getElementById(“editTaskTitle”).value = t.title
document.getElementById(“editTaskCategory”).value = t.category || “”
document.getElementById(“editTaskPriority”).value = t.priority || “”
document.getElementById(“editTaskNotes”).value = t.notes || “”
document.getElementById(“editTaskBlocked”).value = t.blocked_reason || “”
document.getElementById(“editTaskFilmFlag”).checked = !!t.film_flag
document.getElementById(“editTaskSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“editTaskTitle”).focus(), 300)
}

async function saveEditTask() {
const title = document.getElementById(“editTaskTitle”).value.trim()
if (!title || !editingTask) return
const blocked = document.getElementById(“editTaskBlocked”).value.trim()
await sb.from(“tasks”).update({
title,
category: document.getElementById(“editTaskCategory”).value.trim() || null,
priority: document.getElementById(“editTaskPriority”).value || null,
notes: document.getElementById(“editTaskNotes”).value.trim() || null,
blocked_reason: blocked || null,
film_flag: document.getElementById(“editTaskFilmFlag”).checked,
}).eq(“id”, editingTask.id).eq(“user_id”, user.id)
closeSheet(“editTaskSheet”)
showToast(“Task saved ✓”)
await loadAll()
}

async function deleteEditTask() {
if (!editingTask) return
const id = editingTask.id
await sb.from(“tasks”).delete().eq(“id”, id).eq(“user_id”, user.id)
tasks = tasks.filter(t => t.id !== id)
closeSheet(“editTaskSheet”)
showToast(“Task deleted”)
renderTasks()
renderProjects()
renderFocus()
renderAllTasks()
}

// ── RENAME PROJECT ──
let selectedColor = null
function openRenameProject() {
selectedColor = currentProject.color || ‘#3fb950’
document.getElementById(“renameProjectInput”).value = currentProject.title
document.getElementById(“projectCoverUpload”).value = “”
document.getElementById(“projectCoverName”).innerText = currentProject.cover_url ? “Current photo saved ✓” : “”
document.getElementById(“removeCoverBtn”).style.display = currentProject.cover_url ? “block” : “none”
const picker = document.getElementById(“colorPicker”)
picker.innerHTML = “”
PROJECT_COLORS.forEach(c => {
const dot = document.createElement(“div”)
dot.className = “color-dot” + (c === selectedColor ? “ selected” : “”)
dot.style.background = c
dot.onclick = () => {
selectedColor = c
picker.querySelectorAll(”.color-dot”).forEach(d => d.classList.remove(“selected”))
dot.classList.add(“selected”)
}
picker.appendChild(dot)
})
const sel = document.getElementById(“projectSettingsVehicle”)
sel.innerHTML = `<option value="">No vehicle</option>`
objects.forEach(obj => {
const opt = document.createElement(“option”)
opt.value = obj.id
opt.innerText = obj.name
opt.selected = currentProject.object_id === obj.id
sel.appendChild(opt)
})
document.getElementById(“renameProjectSheet”).classList.add(“open”)
}

function openProjectSettings() {
document.getElementById(“projectCoverUpload”).value = “”
document.getElementById(“projectCoverName”).innerText = currentProject.cover_url ? “Current photo saved ✓” : “”
document.getElementById(“removeCoverBtn”).style.display = currentProject.cover_url ? “block” : “none”
const sel = document.getElementById(“projectSettingsVehicle”)
sel.innerHTML = `<option value="">No vehicle</option>`
objects.forEach(obj => {
const opt = document.createElement(“option”)
opt.value = obj.id
opt.innerText = obj.name
opt.selected = currentProject.object_id === obj.id
sel.appendChild(opt)
})
document.getElementById(“projectSettingsSheet”).classList.add(“open”)
}

async function saveProjectSettings() {
if (!currentProject) return
const objectId = document.getElementById(“projectSettingsVehicle”).value || null
const coverFile = document.getElementById(“projectCoverUpload”).files[0]
let coverUrl = currentProject.cover_url
if (coverFile) {
const path = `${user.id}/project-${currentProject.id}`
await sb.storage.from(‘backgrounds’).upload(path, coverFile, { upsert: true })
const { data } = sb.storage.from(‘backgrounds’).getPublicUrl(path)
coverUrl = data.publicUrl + ‘?t=’ + Date.now()
}
await sb.from(“projects”).update({ object_id: objectId, cover_url: coverUrl }).eq(“id”, currentProject.id).eq(“user_id”, user.id)
currentProject.object_id = objectId
currentProject.cover_url = coverUrl
closeSheet(“projectSettingsSheet”)
showToast(“Saved ✓”)
await loadAll()
}

function switchImportTab(tab) {
const isText = tab === ‘text’
document.getElementById(“importTabTextContent”).style.display = isText ? “block” : “none”
document.getElementById(“importTabCsvContent”).style.display = isText ? “none” : “block”
document.getElementById(“importTabText”).style.background = isText ? “#3fb950” : “#222”
document.getElementById(“importTabText”).style.color = isText ? “#111” : “#aaa”
document.getElementById(“importTabCsv”).style.background = isText ? “#222” : “#3fb950”
document.getElementById(“importTabCsv”).style.color = isText ? “#aaa” : “#111”
}

let parsedTaskCSVItems = []
function parseTaskCSV(event) {
const file = event.target.files[0]
if (!file) return
document.getElementById(“taskCsvFileName”).innerText = file.name
const reader = new FileReader()
reader.onload = e => {
const lines = e.target.result.split(’\n’).filter(l => l.trim())
if (lines.length < 2) return
const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim())
const find = (…keys) => headers.findIndex(h => keys.some(k => h.includes(k)))
const titleIdx  = find(‘title’,‘name’,‘таска’,‘действие’,‘задача’)
const catIdx    = find(‘cat’,‘категори’,‘канал’,‘раздел’)
const prioIdx   = find(‘prior’,‘приоритет’)
const notesIdx  = find(‘notes’,‘заметки’,‘нюанс’,‘описани’)
const blockIdx  = find(‘block’,‘блок’)
const mapPriority = v => {
if (!v) return null
const s = v.toLowerCase()
if (s.includes(‘высок’) || s.includes(‘🔴’) || s.includes(‘high’)) return ‘high’
if (s.includes(‘средн’) || s.includes(‘🟡’) || s.includes(‘med’))  return ‘medium’
if (s.includes(‘низк’)  || s.includes(‘🟢’) || s.includes(‘low’))  return ‘low’
return null
}
parsedTaskCSVItems = []
for (let i = 1; i < lines.length; i++) {
const cols = splitCSVLine(lines[i])
const title = titleIdx >= 0 ? cols[titleIdx]?.trim() : “”
if (!title) continue
parsedTaskCSVItems.push({
selected: true,
title,
category: catIdx    >= 0 ? cols[catIdx]?.trim()    || null : null,
priority: prioIdx   >= 0 ? mapPriority(cols[prioIdx]) : null,
notes:    notesIdx  >= 0 ? cols[notesIdx]?.trim()  || null : null,
blocked_reason: blockIdx >= 0 ? cols[blockIdx]?.trim() || null : null,
})
}
renderTaskCSVPreview()
}
reader.readAsText(file, ‘UTF-8’)
}

function renderTaskCSVPreview() {
const el = document.getElementById(“taskCsvPreview”)
el.innerHTML = “”
if (!parsedTaskCSVItems.length) { el.innerHTML = `<div style="color:#555;font-size:13px">No tasks found.</div>`; return }
const ctrl = document.createElement(“div”)
ctrl.style.cssText = “display:flex;gap:12px;padding:4px 0 8px;border-bottom:1px solid #2a2a2a;margin-bottom:4px”
ctrl.innerHTML = ` <span style="font-size:12px;color:#3fb950;cursor:pointer" onclick="parsedTaskCSVItems.forEach((_,i)=>parsedTaskCSVItems[i].selected=true);renderTaskCSVPreview()">All</span> <span style="font-size:12px;color:#555;cursor:pointer" onclick="parsedTaskCSVItems.forEach((_,i)=>parsedTaskCSVItems[i].selected=false);renderTaskCSVPreview()">None</span>`
el.appendChild(ctrl)
parsedTaskCSVItems.forEach((item, idx) => {
const d = document.createElement(“div”)
d.style.cssText = “padding:8px 0;border-bottom:1px solid #1a1a1a;display:flex;align-items:flex-start;gap:8px”
d.innerHTML = ` <input type="checkbox" ${item.selected?"checked":""} onchange="parsedTaskCSVItems[${idx}].selected=this.checked;updateTaskCSVCount()" style="accent-color:#3fb950;min-width:16px;margin-top:2px"> <div style="flex:1"> <div style="font-size:13px;line-height:1.4">${item.title}</div> <div style="font-size:11px;color:#555;margin-top:2px">${[item.category,item.priority].filter(Boolean).join(' · ')}</div> </div>`
el.appendChild(d)
})
document.getElementById(“taskCsvActions”).style.display = “block”
updateTaskCSVCount()
}

function updateTaskCSVCount() {
const n = parsedTaskCSVItems.filter(i => i.selected).length
document.getElementById(“taskCsvCount”).innerText = `${n} tasks selected`
}

async function doTaskCSVImport() {
const toImport = parsedTaskCSVItems.filter(i => i.selected)
if (!toImport.length || !currentProject) return
const rows = toImport.map(i => ({
user_id: user.id,
project_id: currentProject.id,
title: i.title,
category: i.category,
priority: i.priority,
notes: i.notes,
blocked_reason: i.blocked_reason,
status: “open”
}))
const { error } = await sb.from(“tasks”).insert(rows)
if (error) { showToast(“Import error ✕”); return }
closeSheet(“importSheet”)
showToast(`Imported ${rows.length} tasks ✓`)
await loadAll()
}

async function removeCoverPhoto() {
if (!currentProject) return
try {
await sb.storage.from(‘backgrounds’).remove([`${user.id}/project-${currentProject.id}`])
} catch(e) {}
const { error } = await sb.from(“projects”).update({ cover_url: null }).eq(“id”, currentProject.id).eq(“user_id”, user.id)
if (error) { showToast(“Error removing photo ✕”); return }
currentProject.cover_url = null
document.getElementById(“projectCoverName”).innerText = “”
document.getElementById(“removeCoverBtn”).style.display = “none”
showToast(“Photo removed ✓”)
await loadAll()
}

async function saveRenameProject() {
const title = document.getElementById(“renameProjectInput”).value.trim()
if (!title || !currentProject) return
const object_id = document.getElementById(“projectSettingsVehicle”).value || null
let cover_url = currentProject.cover_url || null
const coverFile = document.getElementById(“projectCoverUpload”).files[0]
if (coverFile) {
try {
const path = `${user.id}/project-${currentProject.id}`
await sb.storage.from(‘backgrounds’).upload(path, coverFile, { upsert: true, contentType: coverFile.type })
const { data } = sb.storage.from(‘backgrounds’).getPublicUrl(path)
cover_url = data.publicUrl + “?t=” + Date.now()
} catch(e) { console.error(e) }
}
await sb.from(“projects”).update({ title, color: selectedColor, object_id, cover_url }).eq(“id”, currentProject.id).eq(“user_id”, user.id)
currentProject.title = title
currentProject.color = selectedColor
currentProject.object_id = object_id
currentProject.cover_url = cover_url
document.getElementById(“detailTitle”).innerText = title
closeSheet(“renameProjectSheet”)
showToast(“Project saved ✓”)
await loadAll()
}

function toggleFilmFilter() {
filmFilterOn = !filmFilterOn
const btn = document.getElementById(“filmFilterBtn”)
btn.style.background = filmFilterOn ? ‘#e91e63’ : ‘#222’
btn.style.color = filmFilterOn ? ‘white’ : ‘#aaa’
renderAllTasks()
}

function toggleProjectBlockedFilter() {
blockedFilterOn = !blockedFilterOn
const btn = document.getElementById(“projectBlockedBtn”)
if (btn) {
btn.style.background = blockedFilterOn ? ‘#f0a500’ : ‘#222’
btn.style.color = blockedFilterOn ? ‘#111’ : ‘#aaa’
}
renderTasks(blockedFilterOn)
}

function toggleBlockedFilter() {
blockedFilterOn = !blockedFilterOn
const btn = document.getElementById(“blockedFilterBtn”)
btn.style.background = blockedFilterOn ? ‘#f0a500’ : ‘#222’
btn.style.color = blockedFilterOn ? ‘#111’ : ‘#aaa’
renderAllTasks()
}

function setTaskFilter(projectId, btn) {
taskProjectFilter = projectId
// Reset all buttons
document.querySelectorAll(”#taskProjectFilter .filter-tab”).forEach(b => {
b.classList.remove(“active”)
b.style.background = ‘#222’
b.style.color = ‘#aaa’
})
// Highlight active
btn.classList.add(“active”)
if (projectId) {
const p = projects.find(p => p.id === projectId)
const color = p?.color || ‘#3fb950’
btn.style.background = color
btn.style.color = ‘#111’
} else {
btn.style.background = ‘#3fb950’
btn.style.color = ‘#111’
}
renderAllTasks()
}

// ── ALL TASKS ──
// ── OBJECTS (Garage) ──
function renderObjects() {
const el = document.getElementById(“objectsList”)
if (!el) return
if (!objects.length) {
el.innerHTML = `<div style="font-size:13px;color:#555;padding:4px 0">No vehicles yet.</div>`
return
}
el.innerHTML = “”
objects.forEach(obj => {
const d = document.createElement(“div”)
d.style.cssText = “padding:8px 0;border-bottom:1px solid #222;cursor:pointer;display:flex;align-items:center;”
const info = [obj.make, obj.model, obj.year].filter(Boolean).join(” · “)
const km = obj.mileage ? “ · “ + obj.mileage.toLocaleString() + “ km” : “”
d.innerHTML = `<div style="flex:1;font-size:14px">${obj.name}</div><div style="font-size:12px;color:#555">${info}${km}</div>`
d.onclick = () => openEditObject(obj)
// Service log button
const svcBtn = document.createElement(“button”)
svcBtn.innerText = “›”
svcBtn.style.cssText = “background:none;color:#555;font-size:22px;padding:4px 8px;margin-top:0;margin-left:8px;line-height:1;”
svcBtn.onclick = e => { e.stopPropagation(); openServiceLog(obj) }
d.appendChild(svcBtn)
el.appendChild(d)
})
}

let editingObject = null
function openAddObject() {
editingObject = null
document.getElementById(“objSheetTitle”).innerText = “New vehicle”
document.getElementById(“objSaveBtn”).innerText = “Add vehicle”
document.getElementById(“objDeleteBtn”).style.display = “none”
;[“objName”,“objMake”,“objModel”,“objYear”,“objVin”,“objColorCode”,“objMileage”,“objPurchaseDate”,“objPurchasePrice”].forEach(id => document.getElementById(id).value = “”)
document.getElementById(“objType”).value = “car”
document.getElementById(“addObjectSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“objName”).focus(), 300)
}

function openEditObject(obj) {
editingObject = obj
document.getElementById(“objSheetTitle”).innerText = “Edit vehicle”
document.getElementById(“objSaveBtn”).innerText = “Save”
document.getElementById(“objDeleteBtn”).style.display = “block”
document.getElementById(“objName”).value = obj.name || “”
document.getElementById(“objType”).value = obj.type || “car”
document.getElementById(“objMake”).value = obj.make || “”
document.getElementById(“objModel”).value = obj.model || “”
document.getElementById(“objYear”).value = obj.year || “”
document.getElementById(“objVin”).value = obj.vin || “”
document.getElementById(“objColorCode”).value = obj.color_code || “”
document.getElementById(“objMileage”).value = obj.mileage || “”
document.getElementById(“objPurchaseDate”).value = obj.purchase_date || “”
document.getElementById(“objPurchasePrice”).value = obj.purchase_price || “”
document.getElementById(“addObjectSheet”).classList.add(“open”)
}

async function saveObject() {
const name = document.getElementById(“objName”).value.trim()
if (!name) return
const data = {
name,
type: document.getElementById(“objType”).value,
make: document.getElementById(“objMake”).value.trim() || null,
model: document.getElementById(“objModel”).value.trim() || null,
year: document.getElementById(“objYear”).value ? parseInt(document.getElementById(“objYear”).value) : null,
vin: document.getElementById(“objVin”).value.trim() || null,
color_code: document.getElementById(“objColorCode”).value.trim() || null,
mileage: document.getElementById(“objMileage”).value ? parseInt(document.getElementById(“objMileage”).value) : null,
purchase_date: document.getElementById(“objPurchaseDate”).value || null,
purchase_price: document.getElementById(“objPurchasePrice”).value ? parseFloat(document.getElementById(“objPurchasePrice”).value) : null,
}
if (editingObject) {
await sb.from(“objects”).update(data).eq(“id”, editingObject.id).eq(“user_id”, user.id)
showToast(“Vehicle updated ✓”)
} else {
await sb.from(“objects”).insert({ …data, user_id: user.id })
showToast(“Vehicle added ✓”)
}
closeSheet(“addObjectSheet”)
await loadAll()
}

async function deleteObject() {
if (!editingObject) return
const linked = projects.filter(p => p.object_id === editingObject.id)
const msg = linked.length
? `"${editingObject.name}" is linked to ${linked.length} project${linked.length>1?"s":""}. They will be unlinked and service log deleted.`
: `Delete "${editingObject.name}" and its service log?`
if (!confirm(msg)) return
// Unlink projects
if (linked.length) {
await sb.from(“projects”).update({ object_id: null }).eq(“object_id”, editingObject.id).eq(“user_id”, user.id)
}
// Delete service log
await sb.from(“service_log”).delete().eq(“object_id”, editingObject.id)
await sb.from(“objects”).delete().eq(“id”, editingObject.id).eq(“user_id”, user.id)
closeSheet(“addObjectSheet”)
showToast(“Vehicle deleted”)
await loadAll()
}

// ── SERVICE LOG ──
let serviceLogObject = null
async function openServiceLog(obj) {
serviceLogObject = obj
document.getElementById(“serviceLogTitle”).innerText = obj.name + “ — Service log”
// Vehicle summary from cache
const parts = [obj.make, obj.model, obj.year].filter(Boolean).join(” · “)
const km = obj.mileage ? obj.mileage.toLocaleString() + “ km” : null
const bought = obj.purchase_date ? “Куплено: “ + obj.purchase_date : null
const price = obj.purchase_price ? “Цена: €” + Number(obj.purchase_price).toLocaleString() : null
document.getElementById(“serviceLogSummary”).innerHTML = [parts, km, bought, price].filter(Boolean).join(”<br>”)
document.getElementById(“svcDate”).value = new Date().toISOString().split(“T”)[0]
document.getElementById(“svcMileage”).value = obj.mileage || “”
document.getElementById(“svcDesc”).value = “”
await renderServiceLog()
document.getElementById(“serviceLogSheet”).classList.add(“open”)
}

let _serviceLogCache = []
async function renderServiceLog() {
const el = document.getElementById(“serviceLogList”)
const { data } = await sb.from(“service_log”).select(”*”).eq(“object_id”, serviceLogObject.id).order(“date”, { ascending: false }).limit(50)
_serviceLogCache = data || []
if (!_serviceLogCache.length) { el.innerHTML = `<div style="font-size:13px;color:#555">No entries yet.</div>`; return }
el.innerHTML = “”
_serviceLogCache.forEach(entry => {
const d = document.createElement(“div”)
d.style.cssText = “padding:8px 0;border-bottom:1px solid #222;display:flex;align-items:flex-start;gap:8px;”
const dateStr = entry.date ? new Date(entry.date).toLocaleDateString(‘ru-RU’, {day:‘numeric’,month:‘short’,year:‘numeric’}) : “”
d.innerHTML = ` <div style="flex:1"> <div style="font-size:12px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${dateStr}${entry.mileage?" · "+entry.mileage.toLocaleString()+" km":""}${entry.cost?" · "+entry.cost+" UAH":""}</div> <div style="font-size:14px;margin-top:2px">${entry.title||entry.description||""}</div> ${entry.notes?`<div style="font-size:12px;color:#555;margin-top:2px">${entry.notes}</div>`:""} </div>`
const del = document.createElement(“button”)
del.innerText = “×”
del.style.cssText = “background:none;color:#555;font-size:18px;padding:0 4px;margin-top:0;min-width:24px;”
del.onclick = () => deleteServiceLogEntry(entry.id)
d.appendChild(del)
el.appendChild(d)
})
}

async function saveServiceLog() {
const title = document.getElementById(“svcDesc”).value.trim()
if (!title || !serviceLogObject) return
const newMileage = document.getElementById(“svcMileage”).value ? parseInt(document.getElementById(“svcMileage”).value) : null
const rawDate = document.getElementById(“svcDate”).value.trim()
const isoDate = rawDate || new Date().toISOString().split(“T”)[0]
const { error } = await sb.from(“service_log”).insert({
user_id: user.id,
object_id: serviceLogObject.id,
date: isoDate,
mileage: newMileage,
title: title
})
if (error) { showToast(“Error: “ + (error.message || error.code)); return }
if (newMileage && serviceLogObject.mileage && newMileage < serviceLogObject.mileage) {
showToast(`Mileage not updated — ${newMileage.toLocaleString()} < current ${serviceLogObject.mileage.toLocaleString()}`)
} else if (newMileage && (!serviceLogObject.mileage || newMileage > serviceLogObject.mileage)) {
await sb.from(“objects”).update({ mileage: newMileage }).eq(“id”, serviceLogObject.id).eq(“user_id”, user.id)
serviceLogObject.mileage = newMileage
const obj = objects.find(o => o.id === serviceLogObject.id)
if (obj) obj.mileage = newMileage
renderObjects()
}
document.getElementById(“svcDesc”).value = “”
document.getElementById(“svcMileage”).value = “”
showToast(“Entry added ✓”)
await renderServiceLog()
}

async function deleteServiceLogEntry(id) {
await sb.from(“service_log”).delete().eq(“id”, id)
showToast(“Entry deleted”)
await renderServiceLog()
}

// ── RENAME CATEGORY ──
let renamingCategory = null
function openRenameCategory(cat) {
renamingCategory = cat
document.getElementById(“renameCatTitle”).innerText = `Rename "${cat}"`
document.getElementById(“renameCatInput”).value = cat
document.getElementById(“renameCatSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“renameCatInput”).focus(), 300)
}

async function saveRenameCategory() {
const newCat = document.getElementById(“renameCatInput”).value.trim()
if (!newCat || !renamingCategory || !currentProject) return
const toUpdate = tasks.filter(t => t.project_id === currentProject.id && t.category === renamingCategory)
await Promise.all(toUpdate.map(t => sb.from(“tasks”).update({ category: newCat }).eq(“id”, t.id)))
closeSheet(“renameCatSheet”)
showToast(`Renamed to "${newCat}" ✓`)
await loadAll()
renderTasks()
}

// ── CSV EXPORT ──
function downloadCSV(filename, rows) {
const csv = rows.map(r => r.map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(”,”)).join(”\n”)
const blob = new Blob([csv], { type: “text/csv;charset=utf-8;” })
const url = URL.createObjectURL(blob)
const a = document.createElement(“a”); a.href = url; a.download = filename; a.click()
URL.revokeObjectURL(url)
showToast(“Exported ✓”)
}

function exportProjectCSV() {
if (!currentProject) return
const pt = tasks.filter(t => t.project_id === currentProject.id)
const rows = [[“title”,“category”,“status”,“priority”,“notes”,“blocked_reason”]]
pt.forEach(t => rows.push([t.title, t.category, t.status, t.priority, t.notes, t.blocked_reason]))
downloadCSV(`${currentProject.title.replace(/\s+/g,"-")}-tasks.csv`, rows)
}

function exportInventoryCSV() {
const rows = [[“name”,“type”,“status”,“quantity”,“location”,“article”]]
inventory.forEach(i => rows.push([i.name, i.type, i.status, i.quantity, i.location, i.article]))
downloadCSV(“inventory.csv”, rows)
}

function exportServiceLog() {
const rows = [[“date”,“mileage”,“description”]]
_serviceLogCache.forEach(e => rows.push([e.date, e.mileage, e.title||e.description, e.cost, e.notes]))
const name = serviceLogObject ? serviceLogObject.name.replace(/\s+/g,”-”) : “service-log”
downloadCSV(`${name}-service-log.csv`, rows)
}

// ── COPY TASK ──
function openCopyTask() {
if (!editingTask) return
const el = document.getElementById(“copyTaskProjectList”)
el.innerHTML = “”
projects.filter(p => p.id !== editingTask.project_id).forEach(p => {
const btn = document.createElement(“button”)
btn.style.cssText = “width:100%;margin-top:8px;background:#222;text-align:left;border-left:4px solid “+(p.color||’#3fb950’)+”;”
btn.innerText = p.title
btn.onclick = () => doCopyTask(p.id)
el.appendChild(btn)
})
closeSheet(“editTaskSheet”)
document.getElementById(“copyTaskSheet”).classList.add(“open”)
}

async function doCopyTask(targetProjectId) {
if (!editingTask) return
const { title, category, priority, notes } = editingTask
await sb.from(“tasks”).insert({ title, category, priority, notes, project_id: targetProjectId, user_id: user.id, status: “open” })
closeSheet(“copyTaskSheet”)
showToast(“Task copied ✓”)
await loadAll()
}

// ── INVENTORY ──
function setInvFilter(f, btn) {
invFilter = f
document.querySelectorAll(”.filter-tab”).forEach(b => b.classList.remove(“active”))
btn.classList.add(“active”)
renderInventory()
}

function renderInventory() {
const el = document.getElementById(“inventoryList”)
const search = (document.getElementById(“invSearch”)?.value || “”).toLowerCase().trim()
let filtered = invFilter === “all” ? inventory : inventory.filter(i => i.type === invFilter)
if (search) filtered = filtered.filter(i =>
i.name.toLowerCase().includes(search) ||
(i.location||””).toLowerCase().includes(search) ||
(i.article||””).toLowerCase().includes(search) ||
(i.notes||””).toLowerCase().includes(search) ||
(i.tags||[]).some(tag => tag.includes(search))
)
if (!filtered.length) { el.innerHTML = `<div class="empty">No items${search?" found":""}.</div>`; return }
el.innerHTML = “”
const statusLabel = { have: “Have it”, low: “Running low”, missing: “Missing”, for_sale: “For sale”, sold: “Sold”, other: “Other” }
filtered.forEach(item => {
const d = document.createElement(“div”)
d.className = “inv-card”
d.innerHTML = ` <div class="inv-name">${item.name}</div> <div class="inv-meta">${item.type}${item.quantity!=null?" · qty: "+item.quantity:""}${item.article?" · "+item.article:""}${item.price_paid?" · "+item.price_paid+" UAH":""}${item.location?" · "+item.location:""}</div> ${item.tags&&item.tags.length?`<div style="font-size:11px;color:#3fb950;margin-top:3px">${item.tags.map(t=>’#’+t).join(’ ’)}</div>`:""} ${item.notes?`<div style="font-size:12px;color:#555;margin-top:2px">${item.notes}</div>`:""} ${item.tags?.length?`<div style="margin-top:4px">${item.tags.map(t=>`<span style="font-size:11px;background:#1a2a1a;color:#3fb950;padding:1px 6px;border-radius:4px;margin-right:4px">#${t}</span>`).join(””)}</div>`:""} <span class="inv-status ${item.status}">${statusLabel[item.status]||item.status}</span>`
d.onclick = () => openEditInventory(item)
el.appendChild(d)
})
}

function openAddInventory() {
editingInvItem = null
document.getElementById(“invSheetTitle”).innerText = “New item”
document.getElementById(“invSaveBtn”).innerText = “Add item”
document.getElementById(“invDeleteBtn”).style.display = “none”
;[“invName”,“invArticle”,“invLocation”,“invUrl”,“invNotes”,“invTags”].forEach(id => document.getElementById(id).value = “”)
;[“invQty”,“invPricePaid”].forEach(id => document.getElementById(id).value = “”)
document.getElementById(“invType”).value = “part”
document.getElementById(“invStatus”).value = “have”
document.getElementById(“addInventorySheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“invName”).focus(), 300)
}

function openEditInventory(item) {
editingInvItem = item
document.getElementById(“invSheetTitle”).innerText = “Edit item”
document.getElementById(“invSaveBtn”).innerText = “Save”
document.getElementById(“invDeleteBtn”).style.display = “block”
document.getElementById(“invName”).value = item.name
document.getElementById(“invType”).value = item.type
document.getElementById(“invStatus”).value = item.status
document.getElementById(“invQty”).value = item.quantity || “”
document.getElementById(“invArticle”).value = item.article || “”
document.getElementById(“invPricePaid”).value = item.price_paid || “”
document.getElementById(“invLocation”).value = item.location || “”
document.getElementById(“invUrl”).value = item.url || “”
document.getElementById(“invNotes”).value = item.notes || “”
document.getElementById(“invTags”).value = item.tags ? item.tags.join(”, “) : “”
document.getElementById(“addInventorySheet”).classList.add(“open”)
}

async function saveInventoryItem() {
const name = document.getElementById(“invName”).value.trim()
if (!name) return
const pricePaid = document.getElementById(“invPricePaid”).value ? parseFloat(document.getElementById(“invPricePaid”).value) : null
const data = {
name,
type: document.getElementById(“invType”).value,
status: document.getElementById(“invStatus”).value,
quantity: document.getElementById(“invQty”).value ? parseInt(document.getElementById(“invQty”).value) : null,
article: document.getElementById(“invArticle”).value.trim() || null,
price_paid: pricePaid,
location: document.getElementById(“invLocation”).value.trim() || null,
url: document.getElementById(“invUrl”).value.trim() || null,
notes: document.getElementById(“invNotes”).value.trim() || null,
tags: document.getElementById(“invTags”).value.trim() ? document.getElementById(“invTags”).value.split(”,”).map(t=>t.trim().toLowerCase()).filter(Boolean) : null,
}
if (editingInvItem) {
await sb.from(“inventory”).update(data).eq(“id”, editingInvItem.id).eq(“user_id”, user.id)
// Update local array
Object.assign(editingInvItem, data)
closeSheet(“addInventorySheet”)
showToast(“Item updated ✓”)
renderInventory()
} else {
const { data: inserted } = await sb.from(“inventory”).insert({ …data, user_id: user.id }).select().single()
if (inserted) {
inventory.push(inserted)
if (pricePaid) {
await sb.from(“expenses”).insert({ user_id: user.id, inventory_id: inserted.id, description: name, amount: pricePaid, category: data.type, date: new Date().toISOString().split(“T”)[0] })
}
}
closeSheet(“addInventorySheet”)
showToast(“Item added ✓”)
renderInventory()
}
}

async function deleteCurrentInvItem() {
if (!editingInvItem) return
const id = editingInvItem.id
const { error } = await sb.from(“inventory”).delete().eq(“id”, id).eq(“user_id”, user.id)
if (error) { showToast(error.message || “Delete error”); return }
const idx = inventory.findIndex(i => i.id === id)
if (idx !== -1) inventory.splice(idx, 1)
renderInventory()
closeSheet(“addInventorySheet”)
showToast(“Item deleted”)
}

// ── CSV IMPORT ──
let parsedCSVItems = []

function openCSVImport() {
parsedCSVItems = []
document.getElementById(“csvFileName”).innerText = “”
document.getElementById(“csvPreview”).innerHTML = “”
document.getElementById(“csvImportActions”).style.display = “none”
document.getElementById(“csvFileInput”).value = “”
document.getElementById(“csvImportSheet”).classList.add(“open”)
}

function parseCSVFile(event) {
const file = event.target.files[0]
if (!file) return
document.getElementById(“csvFileName”).innerText = file.name
const reader = new FileReader()
reader.onload = e => {
const text = e.target.result
parsedCSVItems = parseNotionCSV(text)
renderCSVPreview()
}
reader.readAsText(file, “UTF-8”)
}

function parseNotionCSV(text) {
// Split into lines respecting quoted fields
const lines = []
let cur = “”, inQ = false
for (let i = 0; i < text.length; i++) {
const c = text[i]
if (c === ‘”’) { inQ = !inQ }
else if (c === ‘\n’ && !inQ) { lines.push(cur); cur = “”; continue }
cur += c
}
if (cur) lines.push(cur)

if (lines.length < 2) return []

// Parse header
const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim())
const tagIdx = headers.findIndex(h => h === ‘tags’)
const nameIdx = headers.findIndex(h => h.includes(‘name’) || h.includes(‘part’))
const numIdx = headers.findIndex(h => h === ‘number’ || h === ‘№’ || h === ‘артикул’)
const priceIdx = headers.findIndex(h => h.includes(‘price’) || h.includes(‘цена’) || h.includes(‘прайс’))
const notesIdx = headers.findIndex(h => h.includes(‘note’) || h.includes(‘тут’) || h.includes(‘описание’) || h === ‘туториал’)
const urlIdx = headers.findIndex(h => h === ‘url’)

const items = []
for (let i = 1; i < lines.length; i++) {
const cols = splitCSVLine(lines[i])
const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : “”
if (!name) continue

```
const tags = (tagIdx >= 0 ? cols[tagIdx] || "" : "").toLowerCase()
const isDone = tags.includes("done")

// Expanded tag mapping
const isInstrument = tags.includes("инструмент") || tags.includes("instrument") || tags.includes("аврора")
const isConsumable = tags.includes("расход") || tags.includes("consumable") ||
  tags.includes("не инструмент") || tags.includes("покраска") ||
  tags.includes("внешний вид") || tags.includes("то") || tags.includes("to,") ||
  tags === "to" || tags.includes("salon") || tags.includes("химия")
const isOther = tags.includes("юридические") || tags.includes("legal") || tags.includes("страхов")

const type = isOther ? "other" : isInstrument ? "tool" : isConsumable ? "consumable" : "part"
const status = isDone ? "have" : "missing"

// Parse price — take first number from string
const rawPrice = priceIdx >= 0 ? cols[priceIdx] || "" : ""
const priceMatch = rawPrice.replace(/\s/g, "").match(/\d+[.,]?\d*/)
const price = priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null

// Article — only if contains letters (not just a price number)
const rawArticle = numIdx >= 0 ? cols[numIdx]?.trim() || "" : ""
const article = rawArticle && /[a-zA-Zа-яА-Я]/.test(rawArticle) ? rawArticle : null

items.push({
  selected: true,
  name,
  type,
  status,
  article,
  price_paid: price,
  notes: notesIdx >= 0 ? cols[notesIdx]?.trim() || null : null,
  url: urlIdx >= 0 ? cols[urlIdx]?.trim() || null : null,
  tags,
})
```

}
return items
}

function splitCSVLine(line) {
const cols = []
let cur = “”, inQ = false
for (let i = 0; i < line.length; i++) {
const c = line[i]
if (c === ‘”’) { inQ = !inQ }
else if (c === ‘,’ && !inQ) { cols.push(cur.replace(/^”|”$/g,””)); cur = “”; continue }
else cur += c
}
cols.push(cur.replace(/^”|”$/g,””))
return cols
}

function renderCSVPreview() {
const el = document.getElementById(“csvPreview”)
el.innerHTML = “”
if (!parsedCSVItems.length) { el.innerHTML = `<div style="color:#555;font-size:13px">No items found.</div>`; return }

// Group: existing (duplicates) vs new
const existingNames = new Set(inventory.map(i => i.name.toLowerCase().trim()))

// Select all / none row
const ctrl = document.createElement(“div”)
ctrl.style.cssText = “display:flex;gap:12px;padding:6px 0 8px;border-bottom:1px solid #2a2a2a;margin-bottom:4px”
ctrl.innerHTML = ` <span style="font-size:12px;color:#3fb950;cursor:pointer" onclick="parsedCSVItems.forEach((_,i)=>parsedCSVItems[i].selected=true);renderCSVPreview()">Select all</span> <span style="font-size:12px;color:#555;cursor:pointer" onclick="parsedCSVItems.forEach((_,i)=>parsedCSVItems[i].selected=false);renderCSVPreview()">None</span> <span style="font-size:12px;color:#555;cursor:pointer" onclick="parsedCSVItems.forEach((it,i)=>{if(!existingNamesSet.has(it.name.toLowerCase().trim()))parsedCSVItems[i].selected=true;else parsedCSVItems[i].selected=false});renderCSVPreview()">New only</span>`
el.appendChild(ctrl)

const existingNamesSet = existingNames
window.existingNamesSet = existingNamesSet

parsedCSVItems.forEach((item, idx) => {
const isDupe = existingNames.has(item.name.toLowerCase().trim())
const d = document.createElement(“div”)
d.style.cssText = `padding:5px 0;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:6px;${isDupe?"opacity:0.4":""}`
d.innerHTML = ` <input type="checkbox" ${item.selected?"checked":""} onchange="parsedCSVItems[${idx}].selected=this.checked;updateCSVCount()" style="accent-color:#3fb950;min-width:16px;width:16px"> <div style="flex:1;min-width:0;overflow:hidden"> <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}${isDupe?' <span style="color:#555;font-size:11px">dup</span>':''}</div> ${item.price_paid?`<div style="font-size:11px;color:#555">${item.price_paid} UAH</div>`:''} </div> <select onchange="parsedCSVItems[${idx}].type=this.value" style="font-size:11px;padding:2px 4px;background:#222;color:#aaa;border:none;border-radius:6px;margin:0;width:90px"> <option value="part" ${item.type==='part'?'selected':''}>part</option> <option value="tool" ${item.type==='tool'?'selected':''}>tool</option> <option value="consumable" ${item.type==='consumable'?'selected':''}>consumable</option> <option value="other" ${item.type==='other'?'selected':''}>other</option> </select>`
el.appendChild(d)
})
document.getElementById(“csvImportActions”).style.display = “block”
updateCSVCount()
}

function updateCSVCount() {
const n = parsedCSVItems.filter(i => i.selected).length
document.getElementById(“csvCount”).innerText = `${n} items selected`
}

async function doCSVImport() {
const toImport = parsedCSVItems.filter(i => i.selected)
if (!toImport.length) return
showToast(“Importing…”)

// Filter out duplicates by name (case-insensitive)
const existingNames = new Set(inventory.map(i => i.name.toLowerCase().trim()))
const newItems = toImport.filter(i => !existingNames.has(i.name.toLowerCase().trim()))
const skipped = toImport.length - newItems.length

if (!newItems.length) {
showToast(`All ${skipped} items already exist`)
closeSheet(“csvImportSheet”)
return
}

const invRows = newItems.map(i => ({
user_id: user.id,
name: i.name,
type: i.type,
status: i.status,
article: i.article || null,
price_paid: i.price_paid || null,
notes: i.notes || null,
url: i.url || null,
}))

const { data: inserted, error } = await sb.from(“inventory”).insert(invRows).select()
if (error) { showToast(“Import error ✕”); return }

// Insert expenses for items with price
const expenseRows = (inserted || [])
.filter((_, idx) => newItems[idx]?.price_paid)
.map((item, idx) => ({
user_id: user.id,
inventory_id: item.id,
description: item.name,
amount: newItems[idx].price_paid,
category: item.type,
date: new Date().toISOString().split(“T”)[0]
}))

if (expenseRows.length) await sb.from(“expenses”).insert(expenseRows)

closeSheet(“csvImportSheet”)
const msg = skipped ? `Imported ${inserted.length}, skipped ${skipped} duplicates` : `Imported ${inserted.length} items ✓`
showToast(msg)
await loadAll()
}

// ── PREVENT BROWSER SWIPE NAVIGATION ──
document.addEventListener(“touchstart”, e => {
const x = e.touches[0].clientX
if (x < 20 || x > window.innerWidth - 20) e.preventDefault()
}, { passive: false })

// ── FOCUS ──
function renderFocus() {
const el = document.getElementById(“focusContent”)
const open = tasks.filter(t => t.status !== “done” && !t.blocked_reason)
if (!open.length) {
if (!projects.length) {
el.innerHTML = `<div class="empty">No projects yet.<br><button onclick="showTab('projects')" style="margin-top:16px;display:inline-block">→ Add a project</button></div>`
} else if (tasks.filter(t=>t.status!==“done”).length === 0) {
el.innerHTML = `<div class="empty" style="font-size:28px;padding-top:80px">🎉<br><span style="font-size:16px;color:#aaa;display:block;margin-top:12px">All done!</span></div>`
} else {
el.innerHTML = `<div class="empty">All tasks are blocked.<br><span style="font-size:12px">Check Tasks tab to unblock.</span></div>`
}
return
}
const pm = {}; projects.forEach(p => pm[p.id] = p)
el.innerHTML = `<div class="focus-count">${open.length} task${open.length!==1?"s":""} available</div>`
open.forEach(t => {
const proj = pm[t.project_id]
const d = document.createElement(“div”)
d.className = “focus-card”
d.innerHTML = ` ${proj?`<div class="focus-project" style="color:${proj.color||'#3fb950'}">${proj.title}${t.category?` <span class="focus-category">· ${t.category}</span>`:””}</div>`:""} <div class="focus-title">${t.title}</div> ${t.notes?`<div class="focus-notes">${t.notes}</div>`:""} <div class="focus-actions"> <button onclick="completeTask('${t.id}')">Complete</button> <button class="btn-skip" onclick="openBlockTask('${t.id}')">Block</button> <button class="btn-skip" onclick="skipFocusCard(this)">Skip</button> </div>`
el.appendChild(d)
})
// Start over sentinel
const sentinel = document.createElement(“div”)
sentinel.className = “empty”
sentinel.style.display = “none”
sentinel.id = “focusStartOver”
sentinel.innerHTML = `All skipped.<br><button onclick="renderFocus()" style="margin-top:16px;display:inline-block">↺ Start over</button>`
el.appendChild(sentinel)
}

function skipFocusCard(btn) {
btn.closest(”.focus-card”).remove()
const el = document.getElementById(“focusContent”)
const remaining = el.querySelectorAll(”.focus-card”).length
if (remaining === 0) {
const so = document.getElementById(“focusStartOver”)
if (so) so.style.display = “block”
}
}

let blockingTaskId = null
function openBlockTask(id) {
blockingTaskId = id
const task = tasks.find(t => t.id === id)
document.getElementById(“blockTaskName”).innerText = task ? task.title : “”
document.getElementById(“blockReason”).value = “”
document.getElementById(“blockTaskSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“blockReason”).focus(), 300)
}

async function saveBlockTask() {
const reason = document.getElementById(“blockReason”).value.trim()
if (!reason || !blockingTaskId) return
await sb.from(“tasks”).update({ blocked_reason: reason }).eq(“id”, blockingTaskId).eq(“user_id”, user.id)
closeSheet(“blockTaskSheet”)
showToast(“Task blocked”)
await loadAll()
}

// ── UI ──
function showTab(tab) {
[“focus”,“tasks”,“projects”,“inventory”,“settings”].forEach(t => {
document.getElementById(t+“Tab”).style.display = t===tab?“block”:“none”
document.getElementById(“tab-”+t).classList.toggle(“active”, t===tab)
})
// Reset film/blocked filter when leaving tasks tab
if (tab !== “tasks”) {
if (filmFilterOn) {
filmFilterOn = false
const btn = document.getElementById(“filmFilterBtn”)
if (btn) { btn.style.background = ‘#222’; btn.style.color = ‘#aaa’ }
}
if (blockedFilterOn) {
blockedFilterOn = false
const btn = document.getElementById(“blockedFilterBtn”)
if (btn) { btn.style.background = ‘#222’; btn.style.color = ‘#aaa’ }
}
}
}

function closeSheet(id) { document.getElementById(id).classList.remove(“open”) }
function closeIfBg(e, id) { if (e.target===document.getElementById(id)) closeSheet(id) }

let pendingDelete = null
function confirmDelete() {
pendingDelete = () => deleteProject(currentProject.id)
document.getElementById(“confirmTitle”).innerText = “Delete project?”
document.getElementById(“confirmText”).innerText = `"${currentProject.title}" and all its tasks will be deleted.`
document.getElementById(“confirmOk”).onclick = () => { closeConfirm(); pendingDelete() }
document.getElementById(“confirmOverlay”).classList.add(“open”)
}
function closeConfirm() { document.getElementById(“confirmOverlay”).classList.remove(“open”) }

let feedbackType = null
function openFeedback(type) {
feedbackType = type
document.getElementById(“feedbackSheetTitle”).innerText = type === “bug” ? “Report a problem” : “Share an idea”
document.getElementById(“feedbackText”).value = “”
document.getElementById(“feedbackText”).placeholder = type === “bug” ? “Describe the problem…” : “Describe your idea…”
document.getElementById(“feedbackSheet”).classList.add(“open”)
setTimeout(() => document.getElementById(“feedbackText”).focus(), 300)
}
async function submitFeedback() {
const text = document.getElementById(“feedbackText”).value.trim()
if (!text) return
await sb.from(“feedback”).insert({ user_id: user?.id || null, type: feedbackType, text })
closeSheet(“feedbackSheet”)
showToast(“Thanks for the feedback!”)
}

// Close open swipes on tap elsewhere
let openSwipeCard = null
document.addEventListener(“touchstart”, e => {
if (openSwipeCard && !openSwipeCard.contains(e.target)) {
openSwipeCard.style.transform = “translateX(0)”
openSwipeCard = null
}
}, { passive: true })

// Cover photo name display
document.addEventListener(“change”, e => {
if (e.target.id === “projectCoverUpload”) {
const f = e.target.files[0]
if (f) document.getElementById(“projectCoverName”).innerText = f.name
}
})

if (“serviceWorker” in navigator) navigator.serviceWorker.register(“sw.js”)

// Only block pinch zoom, don’t interfere with scroll
document.addEventListener(“touchmove”, e => {
if (e.touches.length > 1) e.preventDefault()
}, { passive: false })

// ── KEYBOARD / VIEWPORT FIX ──
if (window.visualViewport) {
window.visualViewport.addEventListener(“resize”, () => {
const offset = window.innerHeight - window.visualViewport.height
document.querySelectorAll(”.sheet”).forEach(s => {
s.style.paddingBottom = offset > 50 ? (offset + 16) + “px” : “”
})
})
}

// ── LOAD MORE (Tasks tab) ──
let tasksPage = 1
const TASKS_PAGE_SIZE = 30

function renderAllTasks() {
tasksPage = 1
_renderAllTasksPage()
}

function _renderAllTasksPage() {
const el = document.getElementById(“allTasksList”)
const search = (document.getElementById(“taskSearch”)?.value || “”).toLowerCase().trim()
const pm = {}; projects.forEach(p => pm[p.id] = p)

let filtered = tasks
if (taskProjectFilter) filtered = filtered.filter(t => t.project_id === taskProjectFilter)
if (filmFilterOn) filtered = filtered.filter(t => t.film_flag)
if (blockedFilterOn) filtered = filtered.filter(t => !!t.blocked_reason)
if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || (t.notes||””).toLowerCase().includes(search))

if (!filtered.length) { el.innerHTML = `<div class="empty">${search||filmFilterOn||blockedFilterOn?"No results.":"No tasks yet."}</div>`; return }

const open = filtered.filter(t => t.status !== “done”)
const done = filtered.filter(t => t.status === “done”)
const all = […open, …done]
const page = all.slice(0, tasksPage * TASKS_PAGE_SIZE)

if (tasksPage === 1) el.innerHTML = “”
// Remove old load more btn
const oldBtn = document.getElementById(“loadMoreBtn”)
if (oldBtn) oldBtn.remove()

page.forEach(t => {
if (!el.querySelector(`[data-task-id="${t.id}"]`)) {
const card = makeTaskCard(t, pm[t.project_id])
card.setAttribute(“data-task-id”, t.id)
el.appendChild(card)
}
})

if (all.length > tasksPage * TASKS_PAGE_SIZE) {
const btn = document.createElement(“button”)
btn.id = “loadMoreBtn”
btn.innerText = `Load more (${all.length - tasksPage * TASKS_PAGE_SIZE} left)`
btn.style.cssText = “width:100%;margin-top:8px;background:#222;color:#aaa;”
btn.onclick = () => { tasksPage++; _renderAllTasksPage() }
el.appendChild(btn)
}
}
