
const APP_VERSION = 'v0.6.8'
const SUPA_URL = "https://fqmmlntmpybijmvrsfxx.supabase.co"
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbW1sbnRtcHliaWptdnJzZnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTYyMzMsImV4cCI6MjA4ODM5MjIzM30.HeiCco9pyNwDKUJJhA5Af6Yh7AIRZH5GGlvr4BFOcXk"
const sb = supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { flowType: 'pkce' } })
const PROJECT_COLORS = ['#3fb950','#f0a500','#c0392b','#3498db','#9b59b6','#1abc9c','#e67e22','#e91e63']
let user = null, projects = [], tasks = [], inventory = [], objects = [], taskLinks = [], currentProject = null, invFilter = 'all', editingInvItem = null, taskProjectFilter = null, filmFilterOn = false, blockedFilterOn = false
let collapsedCats = new Set()
let selectMode = false, selectedTaskIds = new Set()
sb.auth.onAuthStateChange((_e, s) => { if (s && !user) checkUser() })
window.addEventListener('load', () => {
  checkUser()
  try {
    document.getElementById('versionFooter').innerText = APP_VERSION
    document.getElementById('versionLogin').innerText = APP_VERSION
  } catch(e) {}
  const tabsH = document.querySelector('.tabs').offsetHeight
  document.documentElement.style.setProperty('--tabs-height', tabsH + 'px')

})
function login() {
  sb.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.origin } })
}
async function logout() { await sb.auth.signOut(); location.reload() }
async function checkUser() {
  try {
    const { data } = await sb.auth.getSession()
    if (data.session) {
      user = data.session.user
      document.getElementById("login").style.display = "none"
      document.getElementById("app").style.display = "block"
      document.getElementById("userEmail").innerText = user.email
      await loadBg()
      await loadAll()
    }
  } catch(e) {
    console.error('checkUser error:', e)
  }
}
// ── BACKGROUND ──
async function loadBg() {
  try {
    const { data } = await sb.storage.from('backgrounds').download(`${user.id}/bg`)
    if (data) {
      const url = URL.createObjectURL(data)
      document.getElementById("bg").src = url
      document.getElementById("bgName").innerText = "Background photo saved ✓"
    }
  } catch(e) {
    const bg = localStorage.getItem("bg")
    if (bg) {
      document.getElementById("bg").src = bg
      document.getElementById("bgName").innerText = "Background photo (local) ✓"
    }
  }
}
document.getElementById("bgUpload").addEventListener("change", async function() {
  const file = this.files[0]
  if (!file) return
  const localUrl = URL.createObjectURL(file)
  document.getElementById("bg").src = localUrl
  document.getElementById("bgName").innerText = file.name
  try {
    const { error } = await sb.storage.from('backgrounds').upload(`${user.id}/bg`, file, { upsert: true, contentType: file.type })
    if (error) throw error
    showToast("Background saved ✓")
  } catch(e) {
    const r2 = new FileReader()
    r2.onload = ev => localStorage.setItem("bg", ev.target.result)
    r2.readAsDataURL(file)
    showToast("Background saved locally ✓")
  }
})
// ── TOAST ──
function showToast(msg, duration=2500) {
  const t = document.getElementById("toast")
  t.innerHTML = msg
  t.classList.add("show")
  clearTimeout(t._timer)
  t._timer = setTimeout(() => t.classList.remove("show"), duration)
}
let _undoCallback = null
// FIX 3: capture callback in local const — prevents overwrite when multiple undo toasts fire
function showToastUndo(msg, onUndo) {
  const callback = onUndo
  _undoCallback = callback
  const t = document.getElementById("toast")
  t.innerHTML = `${msg} <span id="undoBtn" style="color:#3fb950;margin-left:10px;font-weight:600;cursor:pointer">Undo</span>`
  t.classList.add("show")
  clearTimeout(t._timer)
  document.getElementById("undoBtn").onclick = () => {
    if (callback) { callback(); _undoCallback = null }
    t.classList.remove("show")
  }
  t._timer = setTimeout(() => { t.classList.remove("show"); _undoCallback = null }, 4000)
}
async function loadAll() {
  const [p, t, inv, obj, tl] = await Promise.all([
    sb.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("inventory").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("objects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("task_inventory").select("*")
  ])
  projects = p.data || []
  tasks = t.data || []
  inventory = inv.data || []
  objects = obj.data || []
  taskLinks = tl.data || []
  renderProjects()
  renderFocus()
  renderAllTasks()
  renderInventory()
  renderObjects()
  if (currentProject) renderTasks()
  if (!projects.length && !user._initialLoadDone) { user._initialLoadDone = true; showTab("projects") }
  user._initialLoadDone = true
}
// ── PROJECTS ──
function renderProjects() {
  const el = document.getElementById("projectsList")
  if (!projects.length) {
    el.innerHTML = `<div class="empty" style="padding:40px 0">No projects yet.<br><span style="font-size:13px">Tap "+ New" to add your first one.</span></div>`
    return
  }
  el.innerHTML = ""
  projects.forEach(p => {
    const open = tasks.filter(t => t.project_id === p.id && t.status !== "done").length
    const done = tasks.filter(t => t.project_id === p.id && t.status === "done").length
    const total = open + done
    const pct = total ? Math.round((done / total) * 100) : 0
    const color = p.color || '#3fb950'
    const d = document.createElement("div")
    d.className = "project-card"
    d.style.borderLeftColor = color
    if (p.cover_url) {
      const img = document.createElement("img")
      img.className = "project-card-bg"
      img.src = p.cover_url
      d.appendChild(img)
    }
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
  })
  // Rebuild task project filter
  const pf = document.getElementById("taskProjectFilter")
  if (pf) {
    // FIX 4a: All button gets active styles on render, not just after click
    const allActive = !taskProjectFilter
    pf.innerHTML = `<button class="filter-tab${allActive?' active':''}" style="${allActive?'background:#3fb950;color:#111':''}" onclick="setTaskFilter(null,this)">All</button>`
    projects.forEach(p => {
      const isActive = taskProjectFilter === p.id
      const color = p.color || '#3fb950'
      const btn = document.createElement("button")
      btn.className = "filter-tab" + (isActive ? " active" : "")
      btn.style.background = isActive ? color : '#222'
      btn.style.color = isActive ? '#111' : '#aaa'
      btn.style.boxShadow = isActive ? `0 3px 0 0 ${color}` : `0 3px 0 0 ${color}55`
      btn.innerText = p.title
      btn.onclick = () => setTaskFilter(p.id, btn)
      pf.appendChild(btn)
    })
  }
}
function openAddProject() {
  document.getElementById("newProjectName").value = ""
  document.getElementById("addProjectSheet").classList.add("open")
  setTimeout(() => document.getElementById("newProjectName").focus(), 300)
}
async function addProject() {
  const title = document.getElementById("newProjectName").value.trim()
  if (!title) return
  const duplicate = projects.find(p => p.title.toLowerCase() === title.toLowerCase())
  if (duplicate) { showToast(`"${title}" already exists`); return }
  const { data, error } = await sb.from("projects").insert({
    title, user_id: user.id, color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
  }).select().single()
  if (error) { showToast("Error creating project ✕"); return }
  projects.unshift(data)
  closeSheet("addProjectSheet")
  rerender()
}
async function deleteProject(id) {
  const deletedProject = projects.find(p => p.id === id)
  const deletedTasks = tasks.filter(t => t.project_id === id)
  projects = projects.filter(p => p.id !== id)
  tasks = tasks.filter(t => t.project_id !== id)
  closeDetail()
  rerender()
  let undone = false
  showToastUndo("Project deleted", async () => {
    undone = true
    projects = [...projects, deletedProject].sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
    tasks = [...tasks, ...deletedTasks]
    rerender()
  })
  setTimeout(async () => {
    if (!undone) {
      await sb.from("tasks").delete().eq("project_id", id).eq("user_id", user.id)
      await sb.from("projects").delete().eq("id", id).eq("user_id", user.id)
    }
  }, 4000)
}
// ── PROJECT DETAIL ──
function openDetail(p) {
  currentProject = p
  document.getElementById("detailTitle").innerText = p.title
  document.getElementById("projectDetail").classList.add("open")
  renderTasks()
}
function closeDetail() { 
  document.getElementById("projectDetail").classList.remove("open")
  currentProject = null
  closeProjectMenu()
  blockedFilterOn = false
  projectFilmFilterOn = false
}
function toggleProjectMenu(e) {
  e.stopPropagation()
  const m = document.getElementById("projectMenu")
  m.style.display = m.style.display === "none" ? "block" : "none"
  if (m.style.display === "block") {
    setTimeout(() => document.addEventListener("click", closeProjectMenu, { once: true }), 0)
  }
}
function closeProjectMenu() {
  const m = document.getElementById("projectMenu")
  if (m) m.style.display = "none"
}
function sanitize(str) {
  return String(str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}
function renderTasks(filterBlocked = false) {
  const el = document.getElementById("tasksList")
  let pt = tasks.filter(t => t.project_id === currentProject?.id)
  if (filterBlocked) pt = pt.filter(t => t.blocked_reason)
  if (projectFilmFilterOn) pt = pt.filter(t => t.film_flag)
  let bar = document.getElementById('multiselectBar')
  if (!bar) {
    bar = document.createElement('div')
    bar.id = 'multiselectBar'
    bar.style.cssText = 'display:none;position:sticky;bottom:0;background:#1a1a1a;border-top:1px solid #333;padding:10px 16px;padding-bottom:max(10px,env(safe-area-inset-bottom));gap:8px;z-index:20;'
    bar.innerHTML = `
      <button onclick="multiselectComplete()" style="flex:1;margin:0;background:#3fb950;color:#111;font-size:13px">✓ Complete</button>
      <button onclick="multiselectSetCategory()" style="flex:1;margin:0;background:#333;font-size:13px">Category</button>
      <button onclick="multiselectDelete()" style="flex:0 0 70px;margin:0;background:#c0392b;font-size:13px">Delete</button>
      <button onclick="exitSelectMode()" style="flex:0 0 50px;margin:0;background:#333;font-size:13px">✕</button>`
    document.getElementById('projectDetail').appendChild(bar)
  }
  bar.style.display = selectMode ? 'flex' : 'none'
  if (!pt.length) { el.innerHTML = `<div class="empty">${filterBlocked?"No blocked tasks.":"No tasks yet.<br>Tap \"+ Task\" or Import."}</div>`; return }
  el.innerHTML = ""
  const grouped = {}
  pt.forEach(t => {
    const cat = t.category?.trim() || ""
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(t)
  })
  const namedCats = Object.keys(grouped)
  .filter(c => c !== "")
  .sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || a);
    const numB = parseInt(b.match(/^\d+/)?.[0] || b);
    return numA - numB || a.localeCompare(b);
  });
  const cats = grouped[""] ? [...namedCats, ""] : namedCats
  cats.forEach((cat, catIdx) => {
    const open = grouped[cat].filter(t => t.status !== "done")
    const done = grouped[cat].filter(t => t.status === "done")
    if (!open.length && !done.length) return
    const isCollapsed = collapsedCats.has(cat || '__empty__')
    if (cat) {
      const h = document.createElement("div")
      h.className = "category-header"
      h.style.cssText = "cursor:pointer;display:flex;align-items:center;justify-content:space-between;"
      h.innerHTML = `<span>${cat}</span><span style="font-size:14px;color:#555;transition:transform .2s;display:inline-block;transform:rotate(${isCollapsed?'0deg':'90deg'})">›</span>`
      let pressTimer = null
      h.addEventListener('touchstart', () => { pressTimer = setTimeout(() => { pressTimer = null; openRenameCategory(cat) }, 500) }, { passive: true })
      h.addEventListener('touchend', () => {
        if (pressTimer) {
          clearTimeout(pressTimer)
          pressTimer = null
          const key = cat || '__empty__'
          if (collapsedCats.has(key)) collapsedCats.delete(key)
          else collapsedCats.add(key)
          renderTasks(filterBlocked)
        }
      })
      h.addEventListener('touchmove', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null } }, { passive: true })
      h.onclick = () => {}
      el.appendChild(h)
    } else if (catIdx > 0) {
      const sep = document.createElement("div")
      sep.style.cssText = "height:1px;background:#222;margin:8px 0 12px;"
      el.appendChild(sep)
    }
    if (!isCollapsed) {
      open.forEach(t => el.appendChild(makeTaskCard(t)))
      done.forEach(t => el.appendChild(makeTaskCard(t)))
    }
  })
}
function toggleTaskSelect(id) {
  if (selectedTaskIds.has(id)) selectedTaskIds.delete(id)
  else selectedTaskIds.add(id)
  renderTasks(blockedFilterOn)
}
function exitSelectMode() {
  selectMode = false
  selectedTaskIds.clear()
  renderTasks(blockedFilterOn)
}
async function multiselectComplete() {
  if (!selectedTaskIds.size) return
  const ids = [...selectedTaskIds]
  await Promise.all(ids.map(id => sb.from('tasks').update({ status: 'done' }).eq('id', id).eq('user_id', user.id)))
  ids.forEach(id => { const t = tasks.find(x => x.id === id); if (t) t.status = 'done' })
  exitSelectMode()
}
async function multiselectDelete() {
  if (!selectedTaskIds.size) return
  const ids = [...selectedTaskIds]
  const deleted = tasks.filter(t => ids.includes(t.id))
  tasks = tasks.filter(t => !ids.includes(t.id))
  exitSelectMode()
  let undone = false
  showToastUndo(`${ids.length} tasks deleted`, () => { undone = true; tasks = [...tasks, ...deleted]; rerender() })
  setTimeout(async () => {
    if (!undone) await Promise.all(ids.map(id => sb.from('tasks').delete().eq('id', id).eq('user_id', user.id)))
  }, 4000)
}
function multiselectSetCategory() {
  const bar = document.getElementById('multiselectBar')
  bar.innerHTML = `
    <input id="multiselectCatInput" placeholder="Category name..." autocomplete="off" style="flex:1;margin:0;font-size:14px">
    <button onclick="applyMultiselectCategory()" style="flex:0 0 60px;margin:0;font-size:13px">Apply</button>
    <button onclick="renderTasks(blockedFilterOn)" style="flex:0 0 40px;margin:0;background:#333;font-size:13px">✕</button>`
  setTimeout(() => document.getElementById('multiselectCatInput')?.focus(), 100)
}
function applyMultiselectCategory() {
  const input = document.getElementById('multiselectCatInput')
  const cat = input ? input.value.trim() : ''
  const ids = [...selectedTaskIds]
  ids.forEach(id => { const t = tasks.find(x => x.id === id); if (t) t.category = cat || null })
  Promise.all(ids.map(id => sb.from('tasks').update({ category: cat || null }).eq('id', id).eq('user_id', user.id)))
  showToast(`Category updated ✓`)
  exitSelectMode()
}
function openAddTask() {
  document.getElementById("addTaskSheet").classList.add("open")
  setTimeout(() => document.getElementById("newTaskTitle").focus(), 300)
}
function rerender() {
  renderProjects()
  renderFocus()
  renderAllTasks()
  renderInventory()
  renderObjects()
  if (currentProject) renderTasks()
}
async function addTask() {
  const rawTitle = document.getElementById("newTaskTitle").value.trim()
  if (!rawTitle || !currentProject) return
  const title = sanitize(rawTitle)
  if (!title.replace(/&\w+;/g,'').trim()) return
  const newTask = {
    title, user_id: user.id, project_id: currentProject.id,
    category: sanitize(document.getElementById("newTaskCategory").value.trim()) || null,
    priority: document.getElementById("newTaskPriority").value || null,
    notes: sanitize(document.getElementById("newTaskNotes").value.trim()) || null,
    status: "open",
    created_at: new Date().toISOString()
  }
  document.getElementById("newTaskTitle").value = ""
  document.getElementById("newTaskCategory").value = ""
  document.getElementById("newTaskNotes").value = ""
  document.getElementById("newTaskPriority").value = ""
  closeSheet("addTaskSheet")
  const { data, error } = await sb.from("tasks").insert(newTask).select().single()
  if (error) { showToast("Error saving task ✕"); return }
  tasks.unshift(data)
  rerender()
}
async function completeTask(id) {
  const task = tasks.find(t => t.id === id)
  if (!task) return
  const isDone = task.status === "done"
  const newStatus = isDone ? "open" : "done"
  task.status = newStatus
  task.done_at = isDone ? null : new Date().toISOString()
  document.querySelectorAll(`.task-check[data-id="${id}"]`).forEach(check => {
    check.classList.toggle("done", !isDone)
  })
  document.querySelectorAll(`.task-title[data-id="${id}"]`).forEach(title => {
    title.classList.toggle("done", !isDone)
  })
  if (!isDone) showToast("✓ Done!")
  const { error } = await sb.from("tasks").update(
    isDone ? { status:"open", done_at: null } : { status:"done", done_at: new Date().toISOString() }
  ).eq("id", id).eq("user_id", user.id)
  if (error) {
    task.status = isDone ? "done" : "open"
    task.done_at = isDone ? new Date().toISOString() : null
    showToast("Error saving ✕")
  }
  renderFocus()
  renderTasks()
  renderProjects()
}
// ── IMPORT ──
let parsedImportItems = []
function openImport() {
  document.getElementById("importStep1").style.display = "block"
  document.getElementById("importStep2").style.display = "none"
  document.getElementById("importText").value = ""
  switchImportTab('text')
  document.getElementById("importSheet").classList.add("open")
}
function backToImportStep1() {
  document.getElementById("importStep1").style.display = "block"
  document.getElementById("importStep2").style.display = "none"
}
function parseImport() {
  const text = document.getElementById("importText").value
  const lines = text.split("\n")
  parsedImportItems = []
  let currentCategory = ""
  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return
    const openMatch = trimmed.match(/^-\s\[\s\]\s+(.+)/)
    const doneMatch = trimmed.match(/^-\s\[x\]\s+(.+)/i)
    if (openMatch || doneMatch) {
      const raw = (openMatch || doneMatch)[1]
      const notesMatch = raw.match(/\(([^)]+)\)/)
      const notes = notesMatch ? notesMatch[1] : null
      const title = raw.replace(/\([^)]+\)/g, "").trim()
      if (!title) return
      const isDup = tasks.some(t => t.project_id === currentProject?.id && t.title.toLowerCase() === title.toLowerCase())
      parsedImportItems.push({ title, notes, status: doneMatch ? "done" : "open", category: currentCategory, selected: !isDup, duplicate: isDup, partNumber: null })
    } else if (!trimmed.startsWith("-") && trimmed.length > 0) {
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
  if (!parsedImportItems.length) { showToast("No tasks found"); return }
  renderImportPreview()
  document.getElementById("importStep1").style.display = "none"
  document.getElementById("importStep2").style.display = "block"
}
function renderImportPreview() {
  const el = document.getElementById("importPreview")
  el.innerHTML = ""
  const selected = parsedImportItems.filter(i => i.selected).length
  document.getElementById("importCount").innerText = `${selected} tasks selected`
  document.getElementById("importBtn").innerText = `Import ${selected} tasks`
  const grouped = {}
  parsedImportItems.forEach((item, idx) => {
    const cat = item.category || ""
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({ ...item, idx })
  })
  Object.keys(grouped).forEach(cat => {
    if (cat) {
      const h = document.createElement("div")
      h.className = "import-category-header"
      h.innerText = cat
      el.appendChild(h)
    }
    grouped[cat].forEach(({ title, notes, status, selected, duplicate, partNumber, idx }) => {
      const d = document.createElement("div")
      d.className = "import-item"
      d.innerHTML = `
        <input type="checkbox" class="import-check" ${selected?"checked":""} ${duplicate?"disabled":""} onchange="toggleImportItem(${idx}, this.checked)">
        <div class="import-label ${status==='done'||duplicate?'import-done':''}">
          ${title}${duplicate?' <small style="color:#555">already exists</small>':""}
          ${notes&&!duplicate?`<small>${notes}</small>`:""}
          ${partNumber?`<small style="color:#3fb950">🔩 ${partNumber} <label style="color:#aaa"><input type="checkbox" onchange="togglePartNumber(${idx},this.checked)" style="width:auto;margin:0 4px 0 6px;accent-color:#3fb950"> add to Parts</label></small>`:""}
        </div>`
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
  document.getElementById("importCount").innerText = `${selected} tasks selected`
  document.getElementById("importBtn").innerText = `Import ${selected} tasks`
}
async function doImport() {
  const toInsert = parsedImportItems.filter(i => i.selected).map(i => ({
    title: i.title, notes: i.notes || null, status: i.status,
    category: i.category || null,
    done_at: i.status === "done" ? new Date().toISOString() : null,
    user_id: user.id, project_id: currentProject.id
  }))
  if (!toInsert.length) return
  const { data: insertedTasks } = await sb.from("tasks").insert(toInsert).select()
  if (insertedTasks) tasks.unshift(...insertedTasks)
  const parts = parsedImportItems.filter(i => i.addToParts && i.partNumber)
  if (parts.length) {
    const { data: insertedParts } = await sb.from("inventory").insert(parts.map(i => ({
      name: i.title, type: "part", status: "missing", quantity: null, location: i.partNumber, user_id: user.id
    }))).select()
    if (insertedParts) inventory.push(...insertedParts)
  }
  closeSheet("importSheet")
  const msg = parts.length ? `${toInsert.length} tasks + ${parts.length} parts imported ✓` : `${toInsert.length} tasks imported ✓`
  showToast(msg)
  rerender()
}
// ── TASK CARD ──
function makeTaskCard(t, proj) {
  const isDone = t.status === "done"
  const isBlocked = !!t.blocked_reason
  const pm = {}; projects.forEach(p => pm[p.id] = p)
  const project = proj || pm[t.project_id]
  const projColor = project?.color || '#3fb950'
  const wrapper = document.createElement("div")
  wrapper.style.cssText = "position:relative;overflow:hidden;border-radius:16px;margin-bottom:10px;touch-action:pan-y;"
  const deleteBg = document.createElement("div")
  deleteBg.style.cssText = "position:absolute;right:0;top:0;bottom:0;width:70px;background:#c0392b;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:600;border-radius:0 16px 16px 0;cursor:pointer;opacity:0;transition:opacity 0.15s;"
  deleteBg.innerText = "Delete"
  deleteBg.addEventListener("touchend", async e => {
    e.stopPropagation()
    e.preventDefault()
    const deletedTask = t
    tasks = tasks.filter(x => x.id !== t.id)
    wrapper.remove()
    renderFocus()
    renderProjects()
    let undone = false
    showToastUndo("Task deleted", async () => {
      undone = true
      tasks = [...tasks, deletedTask].sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
      rerender()
    })
    setTimeout(async () => {
      if (!undone) {
        const { error } = await sb.from("tasks").delete().eq("id", deletedTask.id).eq("user_id", user.id)
        if (error) { showToast("Error deleting task ✕"); tasks = [...tasks, deletedTask]; rerender() }
      }
    }, 4000)
  }, { passive: false })
  const card = document.createElement("div")
  card.className = "task-card"
  card.style.cssText = "margin-bottom:0;border-radius:16px;transition:transform 0.2s;position:relative;z-index:1;background:rgba(30,30,30,0.85);"
  if (isBlocked) card.style.opacity = "0.6"
  const prioConfig = { high: {label:'High', color:'#e74c3c', bg:'#3a0a0a'}, medium: {label:'Medium', color:'#f0a500', bg:'#3a2a00'}, low: {label:'Low', color:'#3fb950', bg:'#0a2a0a'} }
  const prio = prioConfig[t.priority]
  const prioChip = prio ? `<span style="font-size:10px;font-weight:700;color:${prio.color};background:${prio.bg};padding:1px 6px;border-radius:4px;margin-left:2px">${prio.label}</span>` : ''
  const links = getTaskLinks(t.id)
  const partsIndicator = links.length ? (() => {
    const allOk = links.every(l => { const i = inventory.find(x => x.id === l.inventory_id); return i && i.status !== 'missing' })
    return `<span style="font-size:12px;margin-left:4px">${allOk ? '✅' : '❌'}</span>`
  })() : ''
  const metaLine = proj
    ? `<span style="color:${projColor}">${project.title}</span>${t.category?` <span style="color:#555">· ${t.category}</span>`:""}${prio?` · ${prioChip}`:""}${partsIndicator}`
    : `${t.category||''}${t.notes?(t.category?' · ':'')+t.notes:''}${prio?(t.category||t.notes?' · ':'')+prioChip:''}${partsIndicator}`
  const isSelected = selectedTaskIds.has(t.id)
  card.innerHTML = `
    ${selectMode ? `<div onclick="event.stopPropagation();toggleTaskSelect('${t.id}')" style="width:22px;height:22px;border-radius:50%;border:2px solid ${isSelected?'#3fb950':'#444'};background:${isSelected?'#3fb950':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#111">${isSelected?'✓':''}</div>` : `<div class="task-check${isDone?" done":""}" data-id="${t.id}" onclick="event.stopPropagation();completeTask('${t.id}')"></div>`}
    <div class="task-body">
      <div class="task-title${isDone?" done":""}${isBlocked?" blocked":""}" data-id="${t.id}">${sanitize(t.title)}${t.film_flag?`<span class="film-flag">🎬</span>`:""}${isBlocked?` <span style="font-size:11px;color:#e74c3c;background:#3a0a0a;padding:1px 6px;border-radius:4px;margin-left:4px">⊘</span>`:""}</div>
      ${metaLine?`<div class="task-meta">${metaLine}</div>`:""}
      ${isBlocked&&t.blocked_reason?`<div class="task-meta" style="color:#c0392b;opacity:0.8">${sanitize(t.blocked_reason)}</div>`:""}
    </div>`
  if (selectMode) {
    card.querySelector('.task-body').onclick = () => toggleTaskSelect(t.id)
  } else {
    card.querySelector(".task-body").onclick = () => openEditTask(t)
  }
  let pressTimer = null
  card.addEventListener('touchstart', e => {
    pressTimer = setTimeout(() => {
      pressTimer = null
      if (!selectMode) { selectMode = true; selectedTaskIds.clear() }
      toggleTaskSelect(t.id)
    }, 500)
  }, { passive: true })
  card.addEventListener('touchmove', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null } }, { passive: true })
  card.addEventListener('touchend', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null } }, { passive: true })
  let startX = 0, currentX = 0, swiping = false
  card.addEventListener("touchstart", e => { startX = e.touches[0].clientX; swiping = true; currentX = 0 }, { passive: true })
  card.addEventListener("touchmove", e => {
    if (!swiping) return
    currentX = e.touches[0].clientX - startX
    if (currentX < 0) {
      const dx = Math.max(currentX, -80)
      card.style.transform = `translateX(${dx}px)`
      deleteBg.style.opacity = Math.min(1, Math.abs(dx) / 60).toString()
    }
  }, { passive: true })
  card.addEventListener("touchend", () => {
    swiping = false
    if (currentX < -50) {
      card.style.transform = "translateX(-70px)"
      deleteBg.style.opacity = "1"
      openSwipeCard = card
    } else {
      card.style.transform = "translateX(0)"
      deleteBg.style.opacity = "0"
    }
  })
  wrapper.appendChild(deleteBg)
  wrapper.appendChild(card)
  return wrapper
}
// ── EDIT TASK ──
let editingTask = null
let editTaskFilmFlagValue = false
let editTaskPriorityValue = ''
// FIX 6: increased timeout from 50→100ms for iOS sheet animation
function focusEditTaskCategory() {
  document.getElementById('editTaskCategoryChip').style.display = 'none'
  const input = document.getElementById('editTaskCategory')
  input.style.display = 'block'
  setTimeout(() => input.focus(), 100)
}
function blurEditTaskCategory() {
  const input = document.getElementById('editTaskCategory')
  input.style.display = 'none'
  const chip = document.getElementById('editTaskCategoryChip')
  chip.style.display = 'inline-block'
  chip.innerText = input.value.trim() || '+ Category'
  chip.style.color = input.value.trim() ? '#555' : '#333'
}
function setEditTaskPriority(val, btn) {
  editTaskPriorityValue = val
  document.querySelectorAll('#editTaskPrioritySeg .priority-chip').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
}
function toggleFilmFlagEdit() {
  editTaskFilmFlagValue = !editTaskFilmFlagValue
  document.getElementById('editTaskFilmIcon').style.opacity = editTaskFilmFlagValue ? '1' : '0.3'
}
function toggleEditTaskBlock() {
  const row = document.getElementById('editTaskBlockRow')
  const btn = document.getElementById('editTaskBlockBtn')
  const isOpen = row.style.display !== 'none'
  row.style.display = isOpen ? 'none' : 'block'
  btn.style.opacity = isOpen ? '0.4' : '1'
  if (!isOpen) setTimeout(() => document.getElementById('editTaskBlocked').focus(), 100)
}
function openEditTask(t) {
  editingTask = t
  editTaskFilmFlagValue = !!t.film_flag
  editTaskPriorityValue = t.priority || ''
  document.getElementById('editTaskTitle').value = t.title
  document.getElementById('editTaskNotes').value = t.notes || ''
  document.getElementById('editTaskBlocked').value = t.blocked_reason || ''
  document.getElementById('editTaskFilmIcon').style.opacity = editTaskFilmFlagValue ? '1' : '0.3'
  const cat = t.category || ''
  document.getElementById('editTaskCategory').value = cat
  document.getElementById('editTaskCategory').style.display = 'none'
  const chip = document.getElementById('editTaskCategoryChip')
  chip.style.display = 'inline-block'
  chip.innerText = cat || '+ Category'
  chip.style.color = cat ? '#555' : '#333'
  const hasBlock = !!t.blocked_reason
  document.getElementById('editTaskBlockRow').style.display = hasBlock ? 'block' : 'none'
  document.getElementById('editTaskBlockBtn').style.opacity = hasBlock ? '1' : '0.4'
  document.querySelectorAll('#editTaskPrioritySeg .priority-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.val === editTaskPriorityValue)
  })
  document.getElementById('editTaskSheet').classList.add('open')
  setTimeout(() => {
    const inp = document.getElementById('editTaskTitle')
    inp.focus()
    inp.setSelectionRange(0, 0)
    inp.scrollLeft = 0
  }, 300)
  renderEditTaskParts()
}
async function saveEditTask() {
  const title = document.getElementById("editTaskTitle").value.trim()
  if (!title || !editingTask) return
  const updates = {
    title,
    category: document.getElementById("editTaskCategory").value.trim() || null,
    priority: editTaskPriorityValue || null,
    notes: document.getElementById("editTaskNotes").value.trim() || null,
    blocked_reason: document.getElementById("editTaskBlocked").value.trim() || null,
    film_flag: editTaskFilmFlagValue,
  }
  const { error } = await sb.from("tasks").update(updates).eq("id", editingTask.id).eq("user_id", user.id)
  if (error) { showToast("Error saving task ✕"); return }
  Object.assign(editingTask, updates)
  closeSheet("editTaskSheet")
  showToast("Task saved ✓")
  rerender()
// после rerender()
if (blockedFilterOn) {
  const stillBlocked = tasks.filter(t => t.project_id === currentProject?.id && !!t.blocked_reason)
  if (!stillBlocked.length) {
    blockedFilterOn = false
    const btn = document.getElementById('projectBlockedBtn')
    if (btn) { btn.style.background = '#222'; btn.style.color = '#aaa' }
  }
}

}
async function deleteEditTask() {
  if (!editingTask) return
  const deletedTask = { ...editingTask }
  const idx = tasks.findIndex(t => t.id === deletedTask.id)
  tasks = tasks.filter(t => t.id !== deletedTask.id)
  closeSheet('editTaskSheet')
  rerender()
  let undone = false
  showToastUndo('Task deleted', () => {
    undone = true
    tasks.splice(Math.min(idx, tasks.length), 0, deletedTask)
    rerender()
  })
  setTimeout(async () => {
    if (!undone) await sb.from('tasks').delete().eq('id', deletedTask.id).eq('user_id', user.id)
  }, 4000)
}

// ── RENAME PROJECT ──
let selectedColor = null
function openRenameProject() {
  selectedColor = currentProject.color || '#3fb950'
  document.getElementById("renameProjectInput").value = currentProject.title
  document.getElementById("projectCoverUpload").value = ""
  document.getElementById("projectCoverName").innerText = currentProject.cover_url ? "Current photo saved ✓" : ""
  document.getElementById("removeCoverBtn").style.display = currentProject.cover_url ? "block" : "none"
  const picker = document.getElementById("colorPicker")
  picker.innerHTML = ""
  PROJECT_COLORS.forEach(c => {
    const dot = document.createElement("div")
    dot.className = "color-dot" + (c === selectedColor ? " selected" : "")
    dot.style.background = c
    dot.onclick = () => {
      selectedColor = c
      picker.querySelectorAll(".color-dot").forEach(d => d.classList.remove("selected"))
      dot.classList.add("selected")
    }
    picker.appendChild(dot)
  })
  const sel = document.getElementById("projectSettingsVehicle")
  sel.innerHTML = `<option value="">No vehicle</option>`
  objects.forEach(obj => {
    const opt = document.createElement("option")
    opt.value = obj.id
    opt.innerText = obj.name
    opt.selected = currentProject.object_id === obj.id
    sel.appendChild(opt)
  })
  document.getElementById("renameProjectSheet").classList.add("open")
}
async function saveRenameProject() {
  const title = document.getElementById("renameProjectInput").value.trim()
  if (!title || !currentProject) return
  const object_id = document.getElementById("projectSettingsVehicle").value || null
  let cover_url = currentProject.cover_url || null
  const coverFile = document.getElementById("projectCoverUpload").files[0]
  if (coverFile) {
    try {
      const path = `${user.id}/project-${currentProject.id}`
      await sb.storage.from('backgrounds').upload(path, coverFile, { upsert: true, contentType: coverFile.type })
      const { data } = sb.storage.from('backgrounds').getPublicUrl(path)
      cover_url = data.publicUrl + "?t=" + Date.now()
    } catch(e) { console.error(e) }
  }
  const { error } = await sb.from("projects").update({ title, color: selectedColor, object_id, cover_url }).eq("id", currentProject.id).eq("user_id", user.id)
  if (error) { showToast("Error saving project ✕"); return }
  Object.assign(currentProject, { title, color: selectedColor, object_id, cover_url })
  const p = projects.find(x => x.id === currentProject.id)
  if (p) Object.assign(p, { title, color: selectedColor, object_id, cover_url })
  document.getElementById("detailTitle").innerText = title
  closeSheet("renameProjectSheet")
  showToast("Project saved ✓")
  rerender()
}
async function removeCoverPhoto() {
  if (!currentProject) return
  try {
    await sb.storage.from('backgrounds').remove([`${user.id}/project-${currentProject.id}`])
  } catch(e) {}
  const { error } = await sb.from("projects").update({ cover_url: null }).eq("id", currentProject.id).eq("user_id", user.id)
  if (error) { showToast("Error removing photo ✕"); return }
  currentProject.cover_url = null
  const p = projects.find(x => x.id === currentProject.id)
  if (p) p.cover_url = null
  document.getElementById("projectCoverName").innerText = ""
  document.getElementById("removeCoverBtn").style.display = "none"
  showToast("Photo removed ✓")
  rerender()
}
function switchImportTab(tab) {
  const isText = tab === 'text'
  document.getElementById("importTabTextContent").style.display = isText ? "block" : "none"
  document.getElementById("importTabCsvContent").style.display = isText ? "none" : "block"
  document.getElementById("importTabText").style.background = isText ? "#3fb950" : "#222"
  document.getElementById("importTabText").style.color = isText ? "#111" : "#aaa"
  document.getElementById("importTabCsv").style.background = isText ? "#222" : "#3fb950"
  document.getElementById("importTabCsv").style.color = isText ? "#aaa" : "#111"
}
let parsedTaskCSVItems = []
function parseTaskCSV(event) {
  const file = event.target.files[0]
  if (!file) return
  document.getElementById("taskCsvFileName").innerText = file.name
  const reader = new FileReader()
  reader.onload = e => {
    const lines = e.target.result.split('\n').filter(l => l.trim())
    if (lines.length < 2) return
    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    const find = (...keys) => headers.findIndex(h => keys.some(k => h.includes(k)))
    const titleIdx  = find('title','name','таска','действие','задача')
    const catIdx    = find('cat','категори','канал','раздел')
    const prioIdx   = find('prior','приоритет')
    const notesIdx  = find('notes','заметки','нюанс','описани')
    const blockIdx  = find('block','блок')
    const mapPriority = v => {
      if (!v) return null
      const s = v.toLowerCase()
      if (s.includes('высок') || s.includes('🔴') || s.includes('high')) return 'high'
      if (s.includes('средн') || s.includes('🟡') || s.includes('med'))  return 'medium'
      if (s.includes('низк')  || s.includes('🟢') || s.includes('low'))  return 'low'
      return null
    }
    parsedTaskCSVItems = []
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      const title = titleIdx >= 0 ? cols[titleIdx]?.trim() : ""
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
  reader.readAsText(file, 'UTF-8')
}
function renderTaskCSVPreview() {
  const el = document.getElementById("taskCsvPreview")
  el.innerHTML = ""
  if (!parsedTaskCSVItems.length) { el.innerHTML = `<div style="color:#555;font-size:13px">No tasks found.</div>`; return }
  const ctrl = document.createElement("div")
  ctrl.style.cssText = "display:flex;gap:12px;padding:4px 0 8px;border-bottom:1px solid #2a2a2a;margin-bottom:4px"
  ctrl.innerHTML = `
    <span style="font-size:12px;color:#3fb950;cursor:pointer" onclick="parsedTaskCSVItems.forEach((_,i)=>parsedTaskCSVItems[i].selected=true);renderTaskCSVPreview()">All</span>
    <span style="font-size:12px;color:#555;cursor:pointer" onclick="parsedTaskCSVItems.forEach((_,i)=>parsedTaskCSVItems[i].selected=false);renderTaskCSVPreview()">None</span>`
  el.appendChild(ctrl)
  parsedTaskCSVItems.forEach((item, idx) => {
    const d = document.createElement("div")
    d.style.cssText = "padding:8px 0;border-bottom:1px solid #1a1a1a;display:flex;align-items:flex-start;gap:8px"
    d.innerHTML = `
      <input type="checkbox" ${item.selected?"checked":""} onchange="parsedTaskCSVItems[${idx}].selected=this.checked;updateTaskCSVCount()" style="accent-color:#3fb950;min-width:16px;margin-top:2px">
      <div style="flex:1">
        <div style="font-size:13px;line-height:1.4">${item.title}</div>
        <div style="font-size:11px;color:#555;margin-top:2px">${[item.category,item.priority].filter(Boolean).join(' · ')}</div>
      </div>`
    el.appendChild(d)
  })
  document.getElementById("taskCsvActions").style.display = "block"
  updateTaskCSVCount()
}
function updateTaskCSVCount() {
  const n = parsedTaskCSVItems.filter(i => i.selected).length
  document.getElementById("taskCsvCount").innerText = `${n} tasks selected`
}
async function doTaskCSVImport() {
  const toImport = parsedTaskCSVItems.filter(i => i.selected)
  if (!toImport.length || !currentProject) return
  const rows = toImport.map(i => ({
    user_id: user.id, project_id: currentProject.id,
    title: i.title, category: i.category, priority: i.priority,
    notes: i.notes, blocked_reason: i.blocked_reason, status: "open"
  }))
  const { data, error } = await sb.from("tasks").insert(rows).select()
  if (error) { showToast("Import error ✕"); return }
  tasks.unshift(...(data || []))
  closeSheet("importSheet")
  showToast(`Imported ${rows.length} tasks ✓`)
  rerender()
}
function toggleFilmFilter() {
  filmFilterOn = !filmFilterOn
  const btn = document.getElementById("filmFilterBtn")
  btn.style.background = filmFilterOn ? '#e91e63' : '#222'
  btn.style.color = filmFilterOn ? 'white' : '#aaa'
  renderAllTasks()
}
function toggleProjectBlockedFilter() {
  blockedFilterOn = !blockedFilterOn
  const btn = document.getElementById("projectBlockedBtn")
  if (btn) {
    btn.style.background = blockedFilterOn ? '#c0392b' : '#222'
    btn.style.color = blockedFilterOn ? 'white' : '#aaa'
  }
  renderTasks(blockedFilterOn)
}
let projectFilmFilterOn = false
function toggleProjectFilmFilter() {
  projectFilmFilterOn = !projectFilmFilterOn
  const btn = document.getElementById("projectFilmBtn")
  if (btn) {
    btn.style.background = projectFilmFilterOn ? '#3fb950' : '#222'
    btn.style.color = projectFilmFilterOn ? '#111' : '#aaa'
  }
  renderTasks(blockedFilterOn)
}
function toggleBlockedFilter() {
  blockedFilterOn = !blockedFilterOn
  const btn = document.getElementById("blockedFilterBtn")
  btn.style.background = blockedFilterOn ? '#c0392b' : '#222'
  btn.style.color = blockedFilterOn ? 'white' : '#aaa'
  renderAllTasks()
}
function setTaskFilter(projectId, btn) {
  taskProjectFilter = projectId
  document.querySelectorAll("#taskProjectFilter .filter-tab").forEach(b => {
    b.classList.remove("active")
    b.style.background = '#222'
    b.style.color = '#aaa'
  })
  btn.classList.add("active")
  if (projectId) {
    const p = projects.find(p => p.id === projectId)
    const color = p?.color || '#3fb950'
    btn.style.background = color
    btn.style.color = '#111'
  } else {
    btn.style.background = '#3fb950'
    btn.style.color = '#111'
  }
  renderAllTasks()
}
// ── OBJECTS (Garage) ──
function renderObjects() {
  const el = document.getElementById("objectsList")
  if (!el) return
  if (!objects.length) {
    el.innerHTML = `<div style="font-size:13px;color:#555;padding:4px 0">No vehicles yet.</div>`
    return
  }
  el.innerHTML = ""
  objects.forEach(obj => {
    const d = document.createElement("div")
    d.style.cssText = "padding:8px 0;border-bottom:1px solid #222;cursor:pointer;display:flex;align-items:center;"
    const info = [obj.make, obj.model, obj.year].filter(Boolean).join(" · ")
    const km = obj.mileage ? " · " + obj.mileage.toLocaleString() + " km" : ""
    d.innerHTML = `<div style="flex:1;font-size:14px">${obj.name}</div><div style="font-size:12px;color:#555">${info}${km}</div>`
    d.onclick = () => openEditObject(obj)
    const svcBtn = document.createElement("button")
    svcBtn.innerText = "›"
    svcBtn.style.cssText = "background:none;color:#555;font-size:22px;padding:4px 8px;margin-top:0;margin-left:8px;line-height:1;"
    svcBtn.onclick = e => { e.stopPropagation(); openServiceLog(obj) }
    d.appendChild(svcBtn)
    el.appendChild(d)
  })
}
let editingObject = null
function openAddObject() {
  editingObject = null
  document.getElementById("objSheetTitle").innerText = "New vehicle"
  document.getElementById("objSaveBtn").innerText = "Add vehicle"
  document.getElementById("objDeleteBtn").style.display = "none"
  ;["objName","objMake","objModel","objYear","objVin","objColorCode","objMileage","objPurchaseDate","objPurchasePrice"].forEach(id => document.getElementById(id).value = "")
  document.getElementById("objType").value = "car"
  document.getElementById("addObjectSheet").classList.add("open")
  setTimeout(() => document.getElementById("objName").focus(), 300)
}
function openEditObject(obj) {
  editingObject = obj
  document.getElementById("objSheetTitle").innerText = "Edit vehicle"
  document.getElementById("objSaveBtn").innerText = "Save"
  document.getElementById("objDeleteBtn").style.display = "block"
  document.getElementById("objName").value = obj.name || ""
  document.getElementById("objType").value = obj.type || "car"
  document.getElementById("objMake").value = obj.make || ""
  document.getElementById("objModel").value = obj.model || ""
  document.getElementById("objYear").value = obj.year || ""
  document.getElementById("objVin").value = obj.vin || ""
  document.getElementById("objColorCode").value = obj.color_code || ""
  document.getElementById("objMileage").value = obj.mileage || ""
  document.getElementById("objPurchaseDate").value = obj.purchase_date || ""
  document.getElementById("objPurchasePrice").value = obj.purchase_price || ""
  document.getElementById("addObjectSheet").classList.add("open")
}
async function saveObject() {
  const name = document.getElementById("objName").value.trim()
  if (!name) return
  const data = {
    name,
    type: document.getElementById("objType").value,
    make: document.getElementById("objMake").value.trim() || null,
    model: document.getElementById("objModel").value.trim() || null,
    year: document.getElementById("objYear").value ? parseInt(document.getElementById("objYear").value) : null,
    vin: document.getElementById("objVin").value.trim() || null,
    color_code: document.getElementById("objColorCode").value.trim() || null,
    mileage: document.getElementById("objMileage").value ? parseInt(document.getElementById("objMileage").value) : null,
    purchase_date: document.getElementById("objPurchaseDate").value || null,
    purchase_price: document.getElementById("objPurchasePrice").value ? parseFloat(document.getElementById("objPurchasePrice").value) : null,
  }
  if (editingObject) {
    const { error } = await sb.from("objects").update(data).eq("id", editingObject.id).eq("user_id", user.id)
    if (error) { showToast("Error saving vehicle ✕"); return }
    Object.assign(editingObject, data)
    showToast("Vehicle updated ✓")
  } else {
    const { data: inserted, error } = await sb.from("objects").insert({ ...data, user_id: user.id }).select().single()
    if (error) { showToast("Error saving vehicle ✕"); return }
    if (inserted) objects.push(inserted)
    showToast("Vehicle added ✓")
  }
  closeSheet("addObjectSheet")
  rerender()
}
async function deleteObject() {
  if (!editingObject) return
  const linked = projects.filter(p => p.object_id === editingObject.id)
  const msg = linked.length
    ? `"${editingObject.name}" is linked to ${linked.length} project${linked.length>1?"s":""}. They will be unlinked and service log deleted.`
    : `Delete "${editingObject.name}" and its service log?`
  if (!confirm(msg)) return
  if (linked.length) {
    await sb.from("projects").update({ object_id: null }).eq("object_id", editingObject.id).eq("user_id", user.id)
    linked.forEach(p => p.object_id = null)
  }
  await sb.from("service_log").delete().eq("object_id", editingObject.id)
  await sb.from("objects").delete().eq("id", editingObject.id).eq("user_id", user.id)
  objects = objects.filter(o => o.id !== editingObject.id)
  closeSheet("addObjectSheet")
  showToast("Vehicle deleted")
  rerender()
}
// ── SERVICE LOG ──
let serviceLogObject = null
async function openServiceLog(obj) {
  serviceLogObject = obj
  document.getElementById("serviceLogTitle").innerText = obj.name + " — Service log"
  const parts = [obj.make, obj.model, obj.year].filter(Boolean).join(" · ")
  const km = obj.mileage ? obj.mileage.toLocaleString() + " km" : null
  const bought = obj.purchase_date ? "Bought: " + obj.purchase_date : null
  const price = obj.purchase_price ? "Price: €" + Number(obj.purchase_price).toLocaleString() : null
  document.getElementById("serviceLogSummary").innerHTML = [parts, km, bought, price].filter(Boolean).join("<br>")
  document.getElementById("svcDate").value = new Date().toISOString().split("T")[0]
  document.getElementById("svcMileage").value = obj.mileage || ""
  document.getElementById("svcDesc").value = ""
  await renderServiceLog()
  document.getElementById("serviceLogSheet").classList.add("open")
}
let _serviceLogCache = []
async function renderServiceLog() {
  const el = document.getElementById("serviceLogList")
  const { data } = await sb.from("service_log").select("*").eq("object_id", serviceLogObject.id).order("date", { ascending: false }).limit(50)
  _serviceLogCache = data || []
  if (!_serviceLogCache.length) { el.innerHTML = `<div style="font-size:13px;color:#555">No entries yet.</div>`; return }
  el.innerHTML = ""
  _serviceLogCache.forEach(entry => {
    const d = document.createElement("div")
    d.style.cssText = "padding:8px 0;border-bottom:1px solid #222;display:flex;align-items:flex-start;gap:8px;"
    const dateStr = entry.date ? new Date(entry.date).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'}) : ""
    d.innerHTML = `
      <div style="flex:1">
        <div style="font-size:12px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${dateStr}${entry.mileage?" · "+entry.mileage.toLocaleString()+" km":""}${entry.cost?" · "+entry.cost:""}</div>
        <div style="font-size:14px;margin-top:2px">${entry.title||entry.description||""}</div>
        ${entry.notes?`<div style="font-size:12px;color:#555;margin-top:2px">${entry.notes}</div>`:""}
      </div>`
    const del = document.createElement("button")
    del.innerText = "×"
    del.style.cssText = "background:none;color:#555;font-size:18px;padding:0 4px;margin-top:0;min-width:24px;"
    del.onclick = () => deleteServiceLogEntry(entry.id)
    d.appendChild(del)
    el.appendChild(d)
  })
}
async function saveServiceLog() {
  const title = document.getElementById("svcDesc").value.trim()
  if (!title || !serviceLogObject) return
  const newMileage = document.getElementById("svcMileage").value ? parseInt(document.getElementById("svcMileage").value) : null
  const rawDate = document.getElementById("svcDate").value.trim()
  const isoDate = rawDate || new Date().toISOString().split("T")[0]
  const { error } = await sb.from("service_log").insert({
    user_id: user.id,
    object_id: serviceLogObject.id,
    date: isoDate,
    mileage: newMileage,
    title: title
  })
  if (error) { showToast("Error: " + (error.message || error.code)); return }
  if (newMileage && serviceLogObject.mileage && newMileage < serviceLogObject.mileage) {
    showToast(`Mileage not updated — ${newMileage.toLocaleString()} < current ${serviceLogObject.mileage.toLocaleString()}`)
  } else if (newMileage && (!serviceLogObject.mileage || newMileage > serviceLogObject.mileage)) {
    await sb.from("objects").update({ mileage: newMileage }).eq("id", serviceLogObject.id).eq("user_id", user.id)
    serviceLogObject.mileage = newMileage
    const obj = objects.find(o => o.id === serviceLogObject.id)
    if (obj) obj.mileage = newMileage
    renderObjects()
  }
  document.getElementById("svcDesc").value = ""
  document.getElementById("svcMileage").value = ""
  showToast("Entry added ✓")
  await renderServiceLog()
}
async function deleteServiceLogEntry(id) {
  await sb.from("service_log").delete().eq("id", id)
  showToast("Entry deleted")
  await renderServiceLog()
}
// ── RENAME CATEGORY ──
let renamingCategory = null
function openRenameCategory(cat) {
  renamingCategory = cat
  document.getElementById("renameCatTitle").innerText = `Rename "${cat}"`
  document.getElementById("renameCatInput").value = cat
  document.getElementById("renameCatSheet").classList.add("open")
  setTimeout(() => document.getElementById("renameCatInput").focus(), 300)
}
function convertItemToTask() {
  if (!editingInvItem) return
  if (!projects.length) { showToast('Create a project first'); return }
  const el = document.getElementById("copyTaskProjectList")
  el.innerHTML = `<div style="font-size:13px;color:#aaa;margin-bottom:12px">Choose project for new task:</div>`
  projects.forEach(p => {
    const btn = document.createElement("button")
    btn.style.cssText = "width:100%;margin-top:8px;background:#222;text-align:left;border-left:4px solid "+(p.color||'#3fb950')+";"
    btn.innerText = p.title
    btn.onclick = () => doConvertItemToTask(p.id)
    el.appendChild(btn)
  })
  closeSheet('addInventorySheet')
  document.getElementById("copyTaskSheet").classList.add("open")
}
async function doConvertItemToTask(projectId) {
  const item = editingInvItem
  if (!item) return
  const existing = tasks.find(t => t.project_id === projectId && t.title.toLowerCase() === item.name.toLowerCase())
  if (existing) {
    showToast('Task already exists in this project')
    return
  }
  const { data: newTask, error } = await sb.from('tasks').insert({
    user_id: user.id,
    project_id: projectId,
    title: item.name,
    notes: [item.notes, item.article ? `Article: ${item.article}` : null, item.url || null].filter(Boolean).join('\n') || null,
    status: 'open'
  }).select().single()
  if (error) { showToast('Error ✕'); return }
  tasks.push(newTask)

  // удаляем айтем из инвентаря
  const itemIdx = inventory.findIndex(i => i.id === item.id)
  if (itemIdx !== -1) inventory.splice(itemIdx, 1)
  await sb.from('inventory').delete().eq('id', item.id).eq('user_id', user.id)
  closeSheet('copyTaskSheet')
  const proj = projects.find(p => p.id === projectId)
  showToast(`Task created in "${proj?.title}" ✓`)
  renderInventory()
  if (currentProject?.id === projectId) renderTasks()
}

async function deleteCategory() {
  if (!renamingCategory || !currentProject) return
  const toUpdate = tasks.filter(t => t.project_id === currentProject.id && t.category === renamingCategory)
  const oldCat = renamingCategory
  toUpdate.forEach(t => t.category = null)
  closeSheet("renameCatSheet")
  renderTasks()
  let undone = false
  showToastUndo("Category removed", () => {
    undone = true
    toUpdate.forEach(t => t.category = oldCat)
    renderTasks()
  })
  setTimeout(async () => {
    if (!undone) {
      await Promise.all(toUpdate.map(t => sb.from("tasks").update({ category: null }).eq("id", t.id).eq("user_id", user.id)))
    }
  }, 4000)
}
async function saveRenameCategory() {
  const newCat = document.getElementById("renameCatInput").value.trim()
  if (!newCat || !renamingCategory || !currentProject) return
  const existing = [...new Set(tasks.filter(t => t.project_id === currentProject.id && t.category).map(t => t.category))]
  if (newCat !== renamingCategory && existing.includes(newCat)) {
    showToast(`Category "${newCat}" already exists`)
    return
  }
  const toUpdate = tasks.filter(t => t.project_id === currentProject.id && t.category === renamingCategory)
  await Promise.all(toUpdate.map(t => sb.from("tasks").update({ category: newCat }).eq("id", t.id).eq("user_id", user.id)))
  toUpdate.forEach(t => t.category = newCat)
  renamingCategory = newCat
  closeSheet("renameCatSheet")
  showToast(`Renamed to "${newCat}" ✓`)
  renderTasks()
}
// ── CSV EXPORT ──
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  showToast("Exported ✓")
}
function exportProjectCSV() {
  if (!currentProject) return
  const pt = tasks.filter(t => t.project_id === currentProject.id)
  const rows = [["title","category","status","priority","notes","blocked_reason"]]
  pt.forEach(t => rows.push([t.title, t.category, t.status, t.priority, t.notes, t.blocked_reason]))
  downloadCSV(`${currentProject.title.replace(/\s+/g,"-")}-tasks.csv`, rows)
}
function exportInventoryCSV() {
  const rows = [["name","type","status","quantity","location","article"]]
  inventory.forEach(i => rows.push([i.name, i.type, i.status, i.quantity, i.location, i.article]))
  downloadCSV("inventory.csv", rows)
}
function exportServiceLog() {
  const rows = [["date","mileage","description"]]
  _serviceLogCache.forEach(e => rows.push([e.date, e.mileage, e.title||e.description, e.cost, e.notes]))
  const name = serviceLogObject ? serviceLogObject.name.replace(/\s+/g,"-") : "service-log"
  downloadCSV(`${name}-service-log.csv`, rows)
}
// ── COPY TASK ──
function openCopyTask() {
  if (!editingTask) return
  const el = document.getElementById("copyTaskProjectList")
  el.innerHTML = ""
  projects.filter(p => p.id !== editingTask.project_id).forEach(p => {
    const btn = document.createElement("button")
    btn.style.cssText = "width:100%;margin-top:8px;background:#222;text-align:left;border-left:4px solid "+(p.color||'#3fb950')+";"
    btn.innerText = p.title
    btn.onclick = () => doCopyTask(p.id)
    el.appendChild(btn)
  })
  closeSheet("editTaskSheet")
  document.getElementById("copyTaskSheet").classList.add("open")
}
async function doCopyTask(targetProjectId) {
  if (!editingTask) return
  const { title, category, priority, notes } = editingTask
  const { data, error } = await sb.from("tasks").insert({ title, category, priority, notes, project_id: targetProjectId, user_id: user.id, status: "open" }).select().single()
  if (error) { showToast("Error copying task ✕"); return }
  if (data) tasks.unshift(data)
  closeSheet("copyTaskSheet")
  showToast("Task copied ✓")
  rerender()
}
// ── TASK ↔ INVENTORY LINKS ──
function getTaskLinks(taskId) {
  return taskLinks.filter(l => l.task_id === taskId)
}
function getItemLinks(itemId) {
  return taskLinks.filter(l => l.inventory_id === itemId)
}
function renderEditTaskParts() {
  if (!editingTask) return
  const links = getTaskLinks(editingTask.id)
  ;['part','consumable','tool'].forEach(type => {
    const el = document.getElementById(`editTaskPartsList_${type}`)
    if (!el) return
    const typeLinks = links.filter(l => {
      const item = inventory.find(i => i.id === l.inventory_id)
      return item && item.type === type
    })
    if (!typeLinks.length) { el.innerHTML = ''; return }
    el.innerHTML = typeLinks.map(l => {
      const item = inventory.find(i => i.id === l.inventory_id)
      if (!item) return ''
      const ok = item.status === 'have' || item.status === 'low'
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #222">
        <span style="font-size:14px">${ok ? '✅' : '❌'}</span>
        <span style="flex:1;font-size:13px;color:${ok?'#aaa':'#e74c3c'}">${item.name}</span>
        <span style="font-size:11px;color:#555">${item.status}</span>
        <span onclick="unlinkPart('${l.inventory_id}')" style="color:#555;cursor:pointer;padding:2px 6px;font-size:16px">×</span>
      </div>`
    }).join('')
  })
}
async function unlinkPart(inventoryId) {
  if (!editingTask) return
  await sb.from('task_inventory').delete().eq('task_id', editingTask.id).eq('inventory_id', inventoryId)
  taskLinks = taskLinks.filter(l => !(l.task_id === editingTask.id && l.inventory_id === inventoryId))
  renderEditTaskParts()
  renderTasks(blockedFilterOn)
}
let partPickerType = 'part'
function openPartPicker(type) {
  partPickerType = type || 'part'
  const titles = { part: 'Parts needed', consumable: 'Consumables needed', tool: 'Tools needed' }
  document.getElementById('partPickerTitle').innerText = titles[partPickerType]
  document.getElementById('partPickerSearch').value = ''
  renderPartPickerList()
  document.getElementById('partPickerSheet').classList.add('open')
}
function renderPartPickerList() {
  const el = document.getElementById('partPickerList')
  const search = document.getElementById('partPickerSearch').value.toLowerCase().trim()
  const alreadyLinked = getTaskLinks(editingTask?.id || '').map(l => l.inventory_id)
  let items = inventory.filter(i => !alreadyLinked.includes(i.id) && i.type === partPickerType)
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search))
  if (!items.length) { el.innerHTML = '<div style="color:#555;font-size:13px;padding:8px 0">No items found</div>'; return }
  el.innerHTML = items.map(i => {
    const ok = i.status === 'have' || i.status === 'low'
    return `<div onclick="linkPart('${i.id}')" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1a1a1a;cursor:pointer">
      <span style="font-size:14px">${ok ? '✅' : '❌'}</span>
      <div style="flex:1">
        <div style="font-size:14px">${i.name}</div>
        <div style="font-size:11px;color:#555">${i.location ? i.location : ''}${i.article ? ' · ' + i.article : ''}</div>
      </div>
      <span style="font-size:11px;color:#555">${i.status}</span>
    </div>`
  }).join('')
}
async function linkPart(inventoryId) {
  if (!editingTask) return
  const { error } = await sb.from('task_inventory').insert({ task_id: editingTask.id, inventory_id: inventoryId, required: true })
  if (error) { showToast('Error linking ✕'); return }
  taskLinks.push({ task_id: editingTask.id, inventory_id: inventoryId, required: true })
  closeSheet('partPickerSheet')
  renderEditTaskParts()
  renderTasks(blockedFilterOn)
  checkAutoBlock(editingTask.id)
}
function checkAutoBlock(taskId) {
  const t = tasks.find(x => x.id === taskId)
  if (!t) return
  const links = getTaskLinks(taskId)
  if (!links.length) return
  const missingItems = links.map(l => inventory.find(i => i.id === l.inventory_id)).filter(i => i && i.status === 'missing')
  if (missingItems.length > 0) {
    const reason = `⊘ Missing: ${missingItems.map(i => i.name).join(', ')}`
    if (t.blocked_reason !== reason) {
      t.blocked_reason = reason
      sb.from('tasks').update({ blocked_reason: reason }).eq('id', taskId).eq('user_id', user.id)
    }
  } else if (t.blocked_reason?.startsWith('⊘ Missing:')) {
    t.blocked_reason = null
    sb.from('tasks').update({ blocked_reason: null }).eq('id', taskId).eq('user_id', user.id)
  }
}
function checkAutoBlockForItem(itemId) {
  const links = getItemLinks(itemId)
  links.forEach(l => checkAutoBlock(l.task_id))
  renderTasks(blockedFilterOn)
  renderAllTasks()
}
function renderItemLinkedTasks(itemId) {
  const links = getItemLinks(itemId)
  const el = document.getElementById('invLinkedTasks')
  if (!el) return
  if (!links.length) { el.style.display = 'none'; return }
  el.style.display = 'block'
  const taskList = links.map(l => {
    const t = tasks.find(x => x.id === l.task_id)
    if (!t) return ''
    const proj = projects.find(p => p.id === t.project_id)
    return `<div onclick="event.stopPropagation();closeSheet('addInventorySheet');setTimeout(()=>openEditTask(tasks.find(x=>x.id==='${t.id}')),300)" style="padding:8px 0;border-bottom:1px solid #222;cursor:pointer">
      <div style="font-size:13px">${t.title}</div>
      ${proj ? `<div style="font-size:11px;color:#555">${proj.title}</div>` : ''}
    </div>`
  }).join('')
  el.innerHTML = `<div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Used in ${links.length} task${links.length>1?'s':''}</div>${taskList}`
}
// ── ANALYSE ──
let analyseSuggestions = []
function fuzzyScore(taskTitle, itemName) {
  const t = taskTitle.toLowerCase()
  const words = itemName.toLowerCase().split(/\s+/).filter(w => w.length >= 3)
  if (!words.length) return 0
  const matches = words.filter(w => t.includes(w))
  return matches.length / words.length
}
function openAnalyse() {
  if (!currentProject) return
  const pt = tasks.filter(t => t.project_id === currentProject.id && t.status !== 'done')
  analyseSuggestions = []
  pt.forEach(task => {
    inventory.forEach(item => {
      const alreadyLinked = taskLinks.some(l => l.task_id === task.id && l.inventory_id === item.id)
      if (alreadyLinked) return
      const score = fuzzyScore(task.title, item.name)
      if (score >= 0.5) analyseSuggestions.push({ task, item, score, accepted: true })
    })
  })
  analyseSuggestions.sort((a, b) => b.score - a.score)
  renderAnalyseList()
  document.getElementById('analyseSheet').classList.add('open')
}
function renderAnalyseList() {
  const el = document.getElementById('analyseList')
  const accepted = analyseSuggestions.filter(s => s.accepted)
  document.getElementById('analyseApplyBtn').innerText = `Link ${accepted.length}`
  document.getElementById('analyseApplyBtn').style.opacity = accepted.length ? '1' : '0.4'
  if (!analyseSuggestions.length) {
    el.innerHTML = '<div style="color:#555;font-size:13px;padding:20px 0;text-align:center">No matches found</div>'
    return
  }
  el.innerHTML = analyseSuggestions.map((s, i) => {
    const ok = s.item.status === 'have' || s.item.status === 'low'
    const pct = Math.round(s.score * 100)
    return `<div style="padding:12px 0;border-bottom:1px solid #222;display:flex;align-items:center;gap:10px;opacity:${s.accepted?'1':'0.35'}">
      <div onclick="toggleAnalyseSuggestion(${i})" style="width:22px;height:22px;border-radius:6px;border:2px solid ${s.accepted?'#3fb950':'#444'};background:${s.accepted?'#3fb950':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:#111">${s.accepted?'✓':''}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.task.title}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
          <span style="font-size:11px">${ok?'✅':'❌'}</span>
          <span style="font-size:13px">${s.item.name}</span>
          <span style="font-size:10px;color:#555;margin-left:auto">${pct}%</span>
        </div>
      </div>
    </div>`
  }).join('')
}
function toggleAnalyseSuggestion(i) {
  analyseSuggestions[i].accepted = !analyseSuggestions[i].accepted
  renderAnalyseList()
}
async function applyAllAnalyse() {
  const toLink = analyseSuggestions.filter(s => s.accepted)
  if (!toLink.length) return
  const rows = toLink.map(s => ({ task_id: s.task.id, inventory_id: s.item.id, required: true }))
  const { error } = await sb.from('task_inventory').insert(rows)
  if (error) { showToast('Error linking ✕'); return }
  rows.forEach(r => taskLinks.push(r))
  toLink.forEach(s => checkAutoBlock(s.task.id))
  closeSheet('analyseSheet')
  showToast(`${toLink.length} link${toLink.length>1?'s':''} created ✓`)
  renderTasks(blockedFilterOn)
}
function setInvFilter(f, btn) {
  invFilter = f
  document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
  renderInventory()
}
function renderInventory() {
  const el = document.getElementById("inventoryList")
  const search = (document.getElementById("invSearch")?.value || "").toLowerCase().trim()
  let filtered = invFilter === "all" ? inventory : inventory.filter(i => i.type === invFilter)
  if (search) filtered = filtered.filter(i =>
    i.name.toLowerCase().includes(search) ||
    (i.location||"").toLowerCase().includes(search) ||
    (i.article||"").toLowerCase().includes(search) ||
    (i.notes||"").toLowerCase().includes(search) ||
    (i.tags||[]).some(tag => tag.includes(search))
  )
  if (!filtered.length) { el.innerHTML = `<div class="empty">No items${search?" found":""}.</div>`; return }
  el.innerHTML = ""
  const statusLabel = { have: "Have it", low: "Running low", missing: "Missing", for_sale: "For sale", sold: "Sold", other: "Other" }
  filtered.forEach(item => {
    const wrapper = document.createElement("div")
    wrapper.style.cssText = "position:relative;overflow:hidden;border-radius:16px;margin-bottom:10px;touch-action:pan-y;"
    const deleteBg = document.createElement("div")
    deleteBg.style.cssText = "position:absolute;right:0;top:0;bottom:0;width:70px;background:#c0392b;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:600;border-radius:0 16px 16px 0;opacity:0;transition:opacity .15s;"
    deleteBg.innerText = "Delete"
    const toggleBg = document.createElement("div")
    const isHave = item.status === 'have'
    toggleBg.style.cssText = `position:absolute;left:0;top:0;bottom:0;width:80px;background:${isHave?'#c0392b':'#3fb950'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;border-radius:16px 0 0 16px;opacity:0;transition:opacity .15s;text-align:center;padding:0 6px;`
    toggleBg.innerText = isHave ? '✕ Missing' : '✓ Have it'
    const d = document.createElement("div")
    d.className = "inv-card"
    d.style.cssText = "position:relative;z-index:1;transition:transform .2s;margin-bottom:0;border-radius:16px;"
    d.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="flex:1;min-width:0">
          <div class="inv-name">${item.name}</div>
          <div class="inv-meta">${item.type}${item.article?" · "+item.article:""}${item.price_paid?" · "+item.price_paid:""}${item.location?" · "+item.location:""}</div>
          ${item.tags?.length?`<div style="margin-top:4px">${item.tags.map(t=>`<span style="font-size:11px;background:#1a2a1a;color:#3fb950;padding:1px 6px;border-radius:4px;margin-right:4px">#${t}</span>`).join("")}</div>`:""}
          ${item.notes?`<div style="font-size:12px;color:#555;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.notes}</div>`:""}
          ${item.url?`<div style="font-size:11px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a href="${item.url}" onclick="event.stopPropagation()" target="_blank" style="color:#3498db">🔗 ${item.url}</a></div>`:""}
        </div>
        <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:80px">
          <span class="inv-status ${item.status}" style="margin:0;text-align:center;width:100%">${statusLabel[item.status]||item.status}</span>
          <div class="counter-border" style="display:${item.quantity != null ? 'inline-flex' : 'none'}">
            <button onclick="event.stopPropagation();invQtyChange('${item.id}',-1)">−</button>
            <div class="cb-div"></div>
            <div class="cb-num iqv-val" data-itemid="${item.id}">${item.quantity}</div>
            <div class="cb-div"></div>
            <button onclick="event.stopPropagation();invQtyChange('${item.id}',1)">+</button>
          </div>
        </div>
      </div>`
    d.onclick = () => openEditInventory(item)
    let sx = 0, cx = 0, sw = false
    d.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sw = true; cx = 0 }, { passive: true })
    d.addEventListener("touchmove", e => {
      if (!sw) return
      cx = e.touches[0].clientX - sx
      if (cx < 0) {
        const dx = Math.max(cx, -80)
        d.style.transform = `translateX(${dx}px)`
        deleteBg.style.opacity = Math.min(1, Math.abs(dx)/60).toString()
        toggleBg.style.opacity = "0"
      } else if (cx > 0) {
        const dx = Math.min(cx, 90)
        d.style.transform = `translateX(${dx}px)`
        toggleBg.style.opacity = Math.min(1, dx/60).toString()
        deleteBg.style.opacity = "0"
      }
    }, { passive: true })
    d.addEventListener("touchend", () => {
      sw = false
      if (cx < -60) {
        const deletedItem = Object.assign({}, item)
        const origIdx = inventory.findIndex(i => i.id === deletedItem.id)
        inventory.splice(origIdx, 1)
        wrapper.remove()
        let undone = false
        showToastUndo("Item deleted", () => {
          undone = true
          invFilter = 'all'
          const restoreIdx = Math.min(origIdx, inventory.length)
          inventory.splice(restoreIdx, 0, deletedItem)
          const s = document.getElementById('invSearch')
          if (s) s.value = ''
          renderInventory()
        })
        setTimeout(async () => {
          if (!undone) await sb.from('inventory').delete().eq('id', deletedItem.id).eq('user_id', user.id)
        }, 4000)
      } else if (cx > 60) {
        const newStatus = item.status === 'have' ? 'missing' : 'have'
        item.status = newStatus
        sb.from('inventory').update({ status: newStatus }).eq('id', item.id).eq('user_id', user.id)
        checkAutoBlockForItem(item.id)
        renderInventory()
      } else {
        d.style.transform = "translateX(0)"
        deleteBg.style.opacity = "0"
        toggleBg.style.opacity = "0"
      }
    })
    wrapper.appendChild(toggleBg)
    wrapper.appendChild(deleteBg)
    wrapper.appendChild(d)
    el.appendChild(wrapper)
  })
  
  // spending overview
  const spent = {}, planned = {}
  filtered.forEach(i => {
    if (!i.price_paid) return
    const cur = i.currency || 'UAH'
    if (i.status === 'have' || i.status === 'low') {
      spent[cur] = (spent[cur] || 0) + i.price_paid
    } else {
      planned[cur] = (planned[cur] || 0) + i.price_paid
    }
  })
  const symbols = { UAH: '₴', EUR: '€', USD: '$' }
  const fmt = obj => Object.entries(obj).map(([k,v]) => `${symbols[k]||k}${v.toLocaleString()}`).join(' · ')
  const spentStr = fmt(spent)
  const plannedStr = fmt(planned)
  if (spentStr || plannedStr) {
    const summary = document.createElement('div')
    summary.style.cssText = 'font-size:12px;color:#555;padding:12px 4px;border-top:1px solid #222;margin-top:4px'
    summary.innerHTML = `${spentStr?`💰 Spent: <span style="color:#3fb950">${spentStr}</span>`:''}${spentStr&&plannedStr?' · ':''}${plannedStr?`Planned: <span style="color:#aaa">${plannedStr}</span>`:''}`
    el.appendChild(summary)
  }
}

function invQtyChange(itemId, delta) {
  const span = document.querySelector(`.iqv-val[data-itemid="${itemId}"]`)
  if (!span) return
  event.stopPropagation()
  const cur = span.innerText === '—' ? 0 : (parseInt(span.innerText) || 0)
  const newVal = Math.max(0, cur + delta)
  span.innerText = newVal
  clearTimeout(span._saveTimer)
  span._saveTimer = setTimeout(() => saveInvQtyById(itemId, newVal), 800)
}
async function saveInvQtyById(itemId, newQty) {
  const item = inventory.find(i => i.id === itemId)
  if (!item) return
  item.quantity = newQty
  await sb.from('inventory').update({ quantity: newQty }).eq('id', itemId).eq('user_id', user.id)
}
// ── INVENTORY SHEET STATE ──
let invTagsValue = []
let invStatusValue = 'missing'
let invTypeValue = 'part'
let invFilmValue = false
let invBlockedValue = false
const INV_STATUSES = [
  { val: 'missing',  label: 'Missing',     color: '#c0392b' },
  { val: 'have',     label: 'Have it',     color: '#3fb950' },
  { val: 'low',      label: 'Running low', color: '#f0a500' },
  { val: 'for_sale', label: 'For sale',    color: '#3498db' },
  { val: 'sold',     label: 'Sold',        color: '#555'    },
]
const DRUM_ITEM_H = 36
function initInvDrum() {
  const list = document.getElementById('invStatusDrumList')
  if (!list) return
  list.innerHTML = ''
  ;[null, ...INV_STATUSES, null].forEach((s, i) => {
    const d = document.createElement('div')
    d.style.cssText = `height:${DRUM_ITEM_H}px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:500;transition:opacity .15s,color .15s;`
    d.dataset.val = s ? s.val : ''
    d.innerText = s ? s.label : ''
    list.appendChild(d)
  })
  setDrumStatus(invStatusValue, false)
  let startY = 0, startTop = 0, dragging = false
  const drum = document.getElementById('invStatusDrum')
  drum.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY
    startTop = parseInt(list.style.top || '0')
    dragging = true
    e.stopPropagation()
  }, { passive: true })
  drum.addEventListener('touchmove', e => {
    if (!dragging) return
    e.preventDefault()
    e.stopPropagation()
    const dy = e.touches[0].clientY - startY
    const newTop = Math.max(-(INV_STATUSES.length) * DRUM_ITEM_H + DRUM_ITEM_H,
                   Math.min(0, startTop + dy))
    list.style.top = newTop + 'px'
    const idx = Math.round(-newTop / DRUM_ITEM_H)
    highlightDrumItem(idx)
  }, { passive: false })
  drum.addEventListener('touchend', e => {
    dragging = false
    e.stopPropagation()
    const curTop = parseInt(list.style.top || '0')
    const idx = Math.max(0, Math.min(INV_STATUSES.length - 1, Math.round(-curTop / DRUM_ITEM_H)))
    setDrumStatus(INV_STATUSES[idx].val, true)
  })
  drum.addEventListener('mousedown', e => { startY = e.clientY; startTop = parseInt(list.style.top||'0'); dragging = true })
  window.addEventListener('mousemove', e => {
    if (!dragging) return
    const dy = e.clientY - startY
    const newTop = Math.max(-(INV_STATUSES.length)*DRUM_ITEM_H+DRUM_ITEM_H, Math.min(0, startTop+dy))
    list.style.top = newTop + 'px'
    highlightDrumItem(Math.round(-newTop/DRUM_ITEM_H))
  })
  window.addEventListener('mouseup', () => {
    if (!dragging) return
    dragging = false
    const idx = Math.max(0, Math.min(INV_STATUSES.length-1, Math.round(-parseInt(list.style.top||'0')/DRUM_ITEM_H)))
    setDrumStatus(INV_STATUSES[idx].val, true)
  })
}
function highlightDrumItem(activeIdx) {
  document.querySelectorAll('#invStatusDrumList div').forEach((d, i) => {
    const realIdx = i - 1
    const dist = Math.abs(realIdx - activeIdx)
    d.style.opacity = dist === 0 ? '1' : dist === 1 ? '0.4' : '0.15'
    d.style.fontSize = dist === 0 ? '16px' : '14px'
    d.style.color = dist === 0 ? (INV_STATUSES[activeIdx]?.color || 'white') : '#aaa'
  })
}
function setDrumStatus(val, animate) {
  invStatusValue = val
  const idx = INV_STATUSES.findIndex(s => s.val === val)
  if (idx < 0) return
  const list = document.getElementById('invStatusDrumList')
  if (!list) return
  const targetTop = -idx * DRUM_ITEM_H
  if (animate) {
    list.style.transition = 'top .2s ease'
    setTimeout(() => { if(list) list.style.transition = '' }, 250)
  }
  list.style.top = targetTop + 'px'
  highlightDrumItem(idx)
  const qty = document.getElementById('invQty')
  if (qty) qty.style.opacity = val === 'missing' ? '0.3' : '1'
  const saleFields = document.getElementById('invSaleFields')
  if (saleFields) saleFields.style.display = (val === 'for_sale' || val === 'sold') ? 'block' : 'none'
  const soldFields = document.getElementById('invSoldFields')
  if (soldFields) soldFields.style.display = val === 'sold' ? 'block' : 'none'
}
function setInvSeg(kind, val, btn) {
  document.querySelectorAll('#invTypeSeg .seg-btn').forEach(b => { b.classList.remove('active') })
  btn.classList.add('active')
  invTypeValue = val
}
function toggleInvTags() {
  const row = document.getElementById('invTagRow')
  const btn = document.getElementById('invTagBtn')
  const inputVisible = row.style.display !== 'none'
  row.style.display = inputVisible ? 'none' : 'block'
  btn.style.opacity = inputVisible ? '0.4' : '1'
  if (!inputVisible) setTimeout(() => document.getElementById('invTagInput').focus(), 100)
}
function toggleInvFilm() {
  invFilmValue = !invFilmValue
  document.getElementById('invFilmBtn').style.opacity = invFilmValue ? '1' : '0.3'
}
function toggleInvBlock() {
  invBlockedValue = !invBlockedValue
  const row = document.getElementById('invBlockRow')
  const btn = document.getElementById('invBlockBtn')
  row.style.display = invBlockedValue ? 'block' : 'none'
  btn.style.opacity = invBlockedValue ? '1' : '0.4'
  if (invBlockedValue) setTimeout(() => document.getElementById('invBlockReason').focus(), 100)
  else document.getElementById('invBlockReason').value = ''
}
function renderInvTagChips() {
  const el = document.getElementById('invTagChips')
  if (!el) return
  el.innerHTML = invTagsValue.map((t, i) => `
    <span style="background:#1a2a1a;color:#3fb950;padding:4px 10px;border-radius:20px;font-size:12px;display:inline-flex;align-items:center;gap:4px">
      #${t}<span onclick="removeInvTag(${i})" style="cursor:pointer;color:#555;font-size:15px;line-height:1;margin-left:2px">×</span>
    </span>`).join('')
}
function commitInvTags(raw) {
  raw.split(',').map(t => t.trim().toLowerCase().replace(/[^a-zа-яёіїє0-9-]/gi, ''))
    .filter(t => t.length >= 2 && t.length <= 20)
    .forEach(t => { if (!invTagsValue.includes(t)) invTagsValue.push(t) })
  document.getElementById('invTagInput').value = ''
  document.getElementById('invTagSuggestions').style.display = 'none'
  renderInvTagChips()
}
function handleInvTagKey(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    commitInvTags(e.target.value)
  }
}
function showInvTagSuggestions() {
  const input = document.getElementById('invTagInput')
  const box = document.getElementById('invTagSuggestions')
  const q = input.value.trim().toLowerCase()
  const existing = [...new Set(inventory.flatMap(i => i.tags || []))].filter(t => !invTagsValue.includes(t))
  const matches = q ? existing.filter(t => t.includes(q)) : existing.slice(0, 8)
  if (!matches.length) { box.style.display = 'none'; return }
  box.style.display = 'block'
  box.innerHTML = matches.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #333">
      <span onclick="invTagsValue.includes('${t}')||invTagsValue.push('${t}');renderInvTagChips();document.getElementById('invTagInput').value='';document.getElementById('invTagSuggestions').style.display='none'" style="font-size:13px;color:#3fb950;cursor:pointer;flex:1">#${t}</span>
      <span onclick="deleteTagGlobally('${t}')" style="color:#555;font-size:16px;cursor:pointer;padding:0 4px">×</span>
    </div>`).join('')
}
async function deleteTagGlobally(tag) {
  const affected = inventory.filter(i => i.tags && i.tags.includes(tag))
  affected.forEach(i => { i.tags = i.tags.filter(t => t !== tag) })
  await Promise.all(affected.map(i => sb.from('inventory').update({ tags: i.tags.length ? i.tags : null }).eq('id', i.id).eq('user_id', user.id)))
  invTagsValue = invTagsValue.filter(t => t !== tag)
  renderInvTagChips()
  showInvTagSuggestions()
  showToast(`#${tag} removed`)
}
function removeInvTag(i) {
  invTagsValue.splice(i, 1)
  renderInvTagChips()
}
// ── LISTINGS ──
let invListingsValue = []

function addInvListing() {
  const platform = document.getElementById('invListingPlatform').value
  const url = document.getElementById('invListingUrl').value.trim()
  invListingsValue.push({ platform, url: url || null })
  document.getElementById('invListingUrl').value = ''
  renderInvListings()
}

function removeInvListing(i) {
  invListingsValue.splice(i, 1)
  renderInvListings()
}

function renderInvListings() {
  const el = document.getElementById('invListingsList')
  if (!el) return
  if (!invListingsValue.length) { el.innerHTML = ''; return }
  el.innerHTML = invListingsValue.map((l, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #222">
      <span style="font-size:12px;color:#3498db;min-width:70px">${l.platform}</span>
      ${l.url
        ? `<a href="${l.url}" target="_blank" onclick="event.stopPropagation()" style="flex:1;font-size:12px;color:#3498db;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🔗 ${l.url}</a>`
        : `<span style="flex:1;font-size:12px;color:#555">no link</span>`}
      <span onclick="removeInvListing(${i})" style="color:#555;cursor:pointer;padding:2px 6px;font-size:16px">×</span>
    </div>`).join('')
}

function invSheetQtyChange(delta) {
  const input = document.getElementById('invQty')
  const display = document.getElementById('invQtyDisplay')
  const cur = input.value === '' ? 0 : (parseInt(input.value) || 0)
  const newVal = Math.max(0, cur + delta)
  input.value = newVal
  display.innerText = newVal
}

function resetInvSheet() {
  invTagsValue = []
  invStatusValue = 'missing'
  invTypeValue = 'part'
  invFilmValue = false
  invBlockedValue = false
  ;['invName','invArticle','invLocation','invUrl','invNotes','invTagInput','invBlockReason'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = ''
  })
  document.getElementById('invPricePaid').value = ''
  document.getElementById('invCurrency').value = ''
  document.getElementById('invQty').value = ''
  document.getElementById('invQtyDisplay').innerText = '—'
  document.getElementById('invTagRow').style.display = 'none'
  document.getElementById('invTagBtn').style.opacity = '0.4'
  document.getElementById('invFilmBtn').style.opacity = '0.3'
  document.getElementById('invBlockBtn').style.opacity = '0.4'
  document.getElementById('invBlockRow').style.display = 'none'
  document.getElementById('invTagSuggestions').style.display = 'none'
  document.querySelectorAll('#invTypeSeg .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === 'part')
  })
  document.getElementById('invSaleFields').style.display = 'none'
  document.getElementById('invSoldFields').style.display = 'none'
  document.getElementById('invSalePrice').value = ''
  document.getElementById('invStorageLocation').value = ''
  document.getElementById('invSoldFor').value = ''
  invListingsValue = []
  renderInvListings()
  renderInvTagChips()
  initInvDrum()
}


function openAddInventory() {
  editingInvItem = null
  document.getElementById('invSheetTitle').innerText = 'New item'
  document.getElementById('invSaveBtn').innerText = 'Add item'
  document.getElementById('invDeleteBtn').style.display = 'none'
  document.getElementById('invConvertTaskBtn').style.display = 'none'
  resetInvSheet()
  document.getElementById('addInventorySheet').classList.add('open')
  setTimeout(() => document.getElementById('invName').focus(), 300)
}
function openEditInventory(item) {
  editingInvItem = item
  document.getElementById('invSheetTitle').innerText = 'Edit item'
  document.getElementById('invSaveBtn').innerText = 'Save'
  document.getElementById('invDeleteBtn').style.display = 'block'
  document.getElementById('invConvertTaskBtn').style.display = 'block'
  document.getElementById('invName').value = item.name
  invStatusValue = item.status || 'missing'
  invTypeValue = item.type || 'part'
  invFilmValue = !!item.film_flag
  invBlockedValue = !!item.blocked_reason
  invTagsValue = item.tags ? [...item.tags] : []
  document.getElementById('invFilmBtn').style.opacity = invFilmValue ? '1' : '0.3'
  document.getElementById('invQty').value = item.quantity != null ? item.quantity : ''
  document.getElementById('invQty').style.opacity = invStatusValue === 'missing' ? '0.3' : '1'
  document.getElementById('invArticle').value = item.article || ''
  document.getElementById('invPricePaid').value = item.price_paid || ''
  document.getElementById('invCurrency').value = item.currency || 'UAH'
  const showSale = item.status === 'for_sale' || item.status === 'sold'
  document.getElementById('invSaleFields').style.display = showSale ? 'block' : 'none'
  document.getElementById('invSoldFields').style.display = item.status === 'sold' ? 'block' : 'none'
  document.getElementById('invSalePrice').value = item.sale_price || ''
  document.getElementById('invStorageLocation').value = item.storage_location || ''
  document.getElementById('invSoldFor').value = item.sold_for || ''
  invListingsValue = item.listings ? [...item.listings] : []
  renderInvListings()
  document.getElementById('invLocation').value = item.location || ''
  document.getElementById('invUrl').value = item.url || ''
  document.getElementById('invNotes').value = item.notes || ''
  document.getElementById('invTagInput').value = ''
  document.getElementById('invTagSuggestions').style.display = 'none'
  const blockRow = document.getElementById('invBlockRow')
  const blockBtn = document.getElementById('invBlockBtn')
  blockRow.style.display = invBlockedValue ? 'block' : 'none'
  blockBtn.style.opacity = invBlockedValue ? '1' : '0.4'
  document.getElementById('invBlockReason').value = item.blocked_reason || ''
  document.getElementById('invTagRow').style.display = 'none'
  document.getElementById('invTagBtn').style.opacity = '0.4'
  document.querySelectorAll('#invTypeSeg .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === invTypeValue)
  })
  renderInvTagChips()
  renderItemLinkedTasks(item.id)
  document.getElementById('addInventorySheet').classList.add('open')
  setTimeout(() => initInvDrum(), 50)
}
async function saveInventoryItem() {
  const name = document.getElementById('invName').value.trim()
  if (!name) { document.getElementById('invName').focus(); return }
  const tagInput = document.getElementById('invTagInput').value.trim()
  if (tagInput) commitInvTags(tagInput)
  const pricePaid = document.getElementById('invPricePaid').value ? parseFloat(document.getElementById('invPricePaid').value) : null
  const qtyRaw = document.getElementById('invQty').value
  const data = {
    name,
    type: invTypeValue,
    status: invStatusValue,
    quantity: qtyRaw ? parseInt(qtyRaw) : null,
    article: document.getElementById('invArticle').value.trim() || null,
    price_paid: pricePaid,
    currency: document.getElementById('invCurrency').value,
    listings: invListingsValue.length ? invListingsValue : null,
    sale_price: document.getElementById('invSalePrice').value ? parseFloat(document.getElementById('invSalePrice').value) : null,
    storage_location: document.getElementById('invStorageLocation').value.trim() || null,
    sold_for: document.getElementById('invSoldFor').value ? parseFloat(document.getElementById('invSoldFor').value) : null,
    location: document.getElementById('invLocation').value.trim() || null,
    url: document.getElementById('invUrl').value.trim() || null,
    notes: document.getElementById('invNotes').value.trim() || null,
    tags: invTagsValue.length ? invTagsValue : null,
    blocked_reason: invBlockedValue ? (document.getElementById('invBlockReason').value.trim() || null) : null,
  }
  if (editingInvItem) {
    const { error } = await sb.from('inventory').update(data).eq('id', editingInvItem.id).eq('user_id', user.id)
    if (error) { showToast('Error saving ✕'); return }
    Object.assign(editingInvItem, data)
    closeSheet('addInventorySheet')
    showToast('Item updated ✓')
    renderInventory()
  } else {
    const { data: inserted, error } = await sb.from('inventory').insert({ ...data, user_id: user.id }).select().single()
    if (error) { showToast('Error saving ✕'); return }
    if (inserted) {
      inventory.push(inserted)
      if (pricePaid) {
        await sb.from('expenses').insert({ user_id: user.id, inventory_id: inserted.id, description: name, amount: pricePaid, category: data.type, date: new Date().toISOString().split('T')[0] })
      }
    }
    closeSheet('addInventorySheet')
    showToast('Item added ✓')
    renderInventory()
  }
}
async function deleteCurrentInvItem() {
  if (!editingInvItem) return
  const deletedItem = editingInvItem
  const idx = inventory.findIndex(i => i.id === deletedItem.id)
  if (idx !== -1) inventory.splice(idx, 1)
  renderInventory()
  closeSheet('addInventorySheet')
  let undone = false
  showToastUndo('Item deleted', () => {
    undone = true
    invFilter = 'all'
    inventory.splice(idx, 0, deletedItem)
    const s = document.getElementById('invSearch')
    if (s) s.value = ''
    renderInventory()
  })
  setTimeout(async () => {
    if (!undone) {
      const { error } = await sb.from('inventory').delete().eq('id', deletedItem.id).eq('user_id', user.id)
      if (error) { showToast('Error deleting ✕'); inventory.splice(idx, 0, deletedItem); renderInventory() }
    }
  }, 4000)
}
// ── CSV IMPORT ──
let parsedCSVItems = []
function openCSVImport() {
  parsedCSVItems = []
  document.getElementById("csvFileName").innerText = ""
  document.getElementById("csvPreview").innerHTML = ""
  document.getElementById("csvImportActions").style.display = "none"
  document.getElementById("csvFileInput").value = ""
  document.getElementById("csvImportSheet").classList.add("open")
}
function parseCSVFile(event) {
  const file = event.target.files[0]
  if (!file) return
  document.getElementById("csvFileName").innerText = file.name
  const reader = new FileReader()
  reader.onload = e => {
    const text = e.target.result
    parsedCSVItems = parseNotionCSV(text)
    renderCSVPreview()
  }
  reader.readAsText(file, "UTF-8")
}
function parseNotionCSV(text) {
  const lines = []
  let cur = "", inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { inQ = !inQ }
    else if (c === '\n' && !inQ) { lines.push(cur); cur = ""; continue }
    cur += c
  }
  if (cur) lines.push(cur)
  if (lines.length < 2) return []
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  const tagIdx = headers.findIndex(h => h === 'tags')
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('part'))
  const numIdx = headers.findIndex(h => h === 'number' || h === '№' || h === 'артикул')
  const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('цена') || h.includes('прайс'))
  const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('тут') || h.includes('описание') || h === 'туториал')
  const urlIdx = headers.findIndex(h => h === 'url')
  const items = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i])
    const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : ""
    if (!name) continue
    const tags = (tagIdx >= 0 ? cols[tagIdx] || "" : "").toLowerCase()
    const isDone = tags.includes("done")
    const isInstrument = tags.includes("инструмент") || tags.includes("instrument") || tags.includes("аврора")
    const isConsumable = tags.includes("расход") || tags.includes("consumable") ||
      tags.includes("не инструмент") || tags.includes("покраска") ||
      tags.includes("внешний вид") || tags.includes("то") || tags.includes("to,") ||
      tags === "to" || tags.includes("salon") || tags.includes("химия")
    const isOther = tags.includes("юридические") || tags.includes("legal") || tags.includes("страхов")
    const type = isOther ? "other" : isInstrument ? "tool" : isConsumable ? "consumable" : "part"
    const status = isDone ? "have" : "missing"
    const rawPrice = priceIdx >= 0 ? cols[priceIdx] || "" : ""
    const priceMatch = rawPrice.replace(/\s/g, "").match(/\d+[.,]?\d*/)
    const price = priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null
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
  }
  return items
}
function splitCSVLine(line) {
  const cols = []
  let cur = "", inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ }
    else if (c === ',' && !inQ) { cols.push(cur.replace(/^"|"$/g,"")); cur = ""; continue }
    else cur += c
  }
  cols.push(cur.replace(/^"|"$/g,""))
  return cols
}
function renderCSVPreview() {
  const el = document.getElementById("csvPreview")
  el.innerHTML = ""
  if (!parsedCSVItems.length) { el.innerHTML = `<div style="color:#555;font-size:13px">No items found.</div>`; return }
  const existingNames = new Set(inventory.map(i => i.name.toLowerCase().trim()))
  const ctrl = document.createElement("div")
  ctrl.style.cssText = "display:flex;gap:12px;padding:6px 0 8px;border-bottom:1px solid #2a2a2a;margin-bottom:4px"
  ctrl.innerHTML = `
    <span style="font-size:12px;color:#3fb950;cursor:pointer" onclick="parsedCSVItems.forEach((_,i)=>parsedCSVItems[i].selected=true);renderCSVPreview()">Select all</span>
    <span style="font-size:12px;color:#555;cursor:pointer" onclick="parsedCSVItems.forEach((_,i)=>parsedCSVItems[i].selected=false);renderCSVPreview()">None</span>
    <span style="font-size:12px;color:#555;cursor:pointer" onclick="parsedCSVItems.forEach((it,i)=>{if(!existingNamesSet.has(it.name.toLowerCase().trim()))parsedCSVItems[i].selected=true;else parsedCSVItems[i].selected=false});renderCSVPreview()">New only</span>`
  el.appendChild(ctrl)
  const existingNamesSet = existingNames
  window.existingNamesSet = existingNamesSet
  parsedCSVItems.forEach((item, idx) => {
    const isDupe = existingNames.has(item.name.toLowerCase().trim())
    const d = document.createElement("div")
    d.style.cssText = `padding:5px 0;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:6px;${isDupe?"opacity:0.4":""}`
    d.innerHTML = `
      <input type="checkbox" ${item.selected?"checked":""} onchange="parsedCSVItems[${idx}].selected=this.checked;updateCSVCount()" style="accent-color:#3fb950;min-width:16px;width:16px">
      <div style="flex:1;min-width:0;overflow:hidden">
        <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}${isDupe?' <span style="color:#555;font-size:11px">dup</span>':''}</div>
        ${item.price_paid?`<div style="font-size:11px;color:#555">${item.price_paid}</div>`:''}
      </div>
      <select onchange="parsedCSVItems[${idx}].type=this.value" style="font-size:11px;padding:2px 4px;background:#222;color:#aaa;border:none;border-radius:6px;margin:0;width:90px">
        <option value="part" ${item.type==='part'?'selected':''}>part</option>
        <option value="tool" ${item.type==='tool'?'selected':''}>tool</option>
        <option value="consumable" ${item.type==='consumable'?'selected':''}>consumable</option>
        <option value="other" ${item.type==='other'?'selected':''}>other</option>
      </select>`
    el.appendChild(d)
  })
  document.getElementById("csvImportActions").style.display = "block"
  updateCSVCount()
}
function updateCSVCount() {
  const n = parsedCSVItems.filter(i => i.selected).length
  document.getElementById("csvCount").innerText = `${n} items selected`
}
async function doCSVImport() {
  const toImport = parsedCSVItems.filter(i => i.selected)
  if (!toImport.length) return
  showToast("Importing...")
  const existingNames = new Set(inventory.map(i => i.name.toLowerCase().trim()))
  const newItems = toImport.filter(i => !existingNames.has(i.name.toLowerCase().trim()))
  const skipped = toImport.length - newItems.length
  if (!newItems.length) {
    showToast(`All ${skipped} items already exist`)
    closeSheet("csvImportSheet")
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
  const { data: inserted, error } = await sb.from("inventory").insert(invRows).select()
  if (error) { showToast("Import error ✕"); return }
  const expenseRows = (inserted || [])
    .filter((_, idx) => newItems[idx]?.price_paid)
    .map((item, idx) => ({
      user_id: user.id,
      inventory_id: item.id,
      description: item.name,
      amount: newItems[idx].price_paid,
      category: item.type,
      date: new Date().toISOString().split("T")[0]
    }))
  if (expenseRows.length) await sb.from("expenses").insert(expenseRows)
  closeSheet("csvImportSheet")
  const msg = skipped ? `Imported ${inserted.length}, skipped ${skipped} duplicates` : `Imported ${inserted.length} items ✓`
  showToast(msg)
  inventory.push(...inserted)
  rerender()
}
// ── PREVENT BROWSER SWIPE NAVIGATION ──
document.addEventListener("touchstart", e => {
  const x = e.touches[0].clientX
  if (x < 20 || x > window.innerWidth - 20) e.preventDefault()
}, { passive: false })
// ── FOCUS ──
let focusProjectId = null
function setFocusProject(id, btn) {
  focusProjectId = id
  document.querySelectorAll("#focusProjectFilter .filter-tab").forEach(b => {
    b.classList.remove("active")
    b.style.background = '#222'
    b.style.color = '#aaa'
  })
  btn.classList.add("active")
  if (id) {
    const p = projects.find(x => x.id === id)
    const color = p?.color || '#3fb950'
    btn.style.background = color
    btn.style.color = '#111'
  } else {
    btn.style.background = '#3fb950'
    btn.style.color = '#111'
  }
  renderFocus()
}
function renderFocus() {
  const filterEl = document.getElementById("focusProjectFilter")
  const allOpen = tasks.filter(t => t.status !== "done" && !t.blocked_reason)
  if (filterEl) {
    const allActive = focusProjectId === null
    filterEl.innerHTML = `<button class="filter-tab${allActive?' active':''}" style="${allActive?'background:#3fb950;color:#111':''}" onclick="setFocusProject(null,this)">All</button>`
    projects.filter(p => allOpen.some(t => t.project_id === p.id)).forEach(p => {
      const btn = document.createElement("button")
      const isActive = focusProjectId === p.id
      const color = p.color || '#3fb950'
      btn.className = "filter-tab" + (isActive ? " active" : "")
      btn.style.background = isActive ? color : '#222'
      btn.style.color = isActive ? '#111' : '#aaa'
      btn.style.boxShadow = isActive ? `0 3px 0 0 ${color}` : `0 3px 0 0 ${color}55`
      btn.innerText = p.title
      btn.onclick = function(){ setFocusProject(p.id, this) }
      filterEl.appendChild(btn)
    })
  }
  const el = document.getElementById("focusContent")
  let open = tasks.filter(t => t.status !== "done" && !t.blocked_reason)
  if (focusProjectId) open = open.filter(t => t.project_id === focusProjectId)
  if (!open.length) {
    if (!projects.length) {
      el.innerHTML = `<div class="empty">No projects yet.<br><button onclick="showTab('projects')" style="margin-top:16px;display:inline-block">→ Add a project</button></div>`
    } else if (tasks.filter(t=>t.status!=="done").length === 0) {
      el.innerHTML = `<div class="empty" style="font-size:28px;padding-top:80px">🎉<br><span style="font-size:16px;color:#aaa;display:block;margin-top:12px">All done!</span></div>`
    } else {
      el.innerHTML = `<div class="empty">All tasks are blocked.<br><span style="font-size:12px">Check Tasks tab to unblock.</span></div>`
    }
    return
  }
  const pm = {}; projects.forEach(p => pm[p.id] = p)
  el.innerHTML = `<div class="focus-count">${open.length} task${open.length!==1?"s":""} available</div><div class="focus-drum" id="focusDrum"></div>`
  open.forEach(t => {
    const proj = pm[t.project_id]
    const d = document.createElement("div")
    d.className = "focus-card"
    d.style.cssText = "position:relative;overflow:hidden;display:flex;flex-direction:column;"
    const catLabel = t.category ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:4px 20px;background:rgba(0,0,0,0.35);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${proj?.color||'#555'}">${proj?`<span style="opacity:0.8">${proj.title}</span>${t.category?` · `:''}`:''}${t.category||''}</div>` : proj ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:4px 20px;background:rgba(0,0,0,0.35);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${proj.color||'#3fb950'};opacity:0.8">${proj.title}</div>` : ''
  d.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
        <div class="focus-title">${t.title}</div>
        ${t.notes?`<div class="focus-notes">${t.notes}</div>`:""}
        <div class="focus-actions">
        <button onclick="completeTask('${t.id}')">Complete</button>
        <button class="btn-skip" onclick="openBlockTask('${t.id}')">Block</button>
        <button class="btn-skip" onclick="skipFocusCard(this)">Skip</button>
      </div>
      </div>
      ${catLabel}`
    document.getElementById('focusDrum').appendChild(d)
  })
  const sentinel = document.createElement("div")
  sentinel.className = "empty"
  sentinel.style.display = "none"
  sentinel.id = "focusStartOver"
  sentinel.innerHTML = `All skipped.<br><button onclick="renderFocus()" style="margin-top:16px;display:inline-block">↺ Start over</button>`
  document.getElementById('focusDrum').appendChild(sentinel)
}
function skipFocusCard(btn) {
  btn.closest(".focus-card").remove()
  const el = document.getElementById("focusContent")
  const remaining = el.querySelectorAll(".focus-card").length
  if (remaining === 0) {
    const so = document.getElementById("focusStartOver")
    if (so) so.style.display = "block"
  }
}
let blockingTaskId = null
function openBlockTask(id) {
  blockingTaskId = id
  const task = tasks.find(t => t.id === id)
  document.getElementById("blockTaskName").innerText = task ? task.title : ""
  document.getElementById("blockReason").value = ""
  document.getElementById("blockTaskSheet").classList.add("open")
  setTimeout(() => document.getElementById("blockReason").focus(), 300)
}
async function saveBlockTask() {
  const reason = document.getElementById("blockReason").value.trim()
  if (!reason || !blockingTaskId) return
  await sb.from("tasks").update({ blocked_reason: reason }).eq("id", blockingTaskId).eq("user_id", user.id)
  const t = tasks.find(x => x.id === blockingTaskId)
  if (t) t.blocked_reason = reason
  closeSheet("blockTaskSheet")
  showToast("Task blocked")
  rerender()
}
// ── UI ──
function showTab(tab) {
  ["focus","tasks","projects","inventory","settings"].forEach(t => {
    document.getElementById(t+"Tab").style.display = t===tab?"block":"none"
    document.getElementById("tab-"+t).classList.toggle("active", t===tab)
  })
  if (tab !== "tasks") {
    if (filmFilterOn) {
      filmFilterOn = false
      const btn = document.getElementById("filmFilterBtn")
      if (btn) { btn.style.background = '#222'; btn.style.color = '#aaa' }
    }
    if (blockedFilterOn) {
      blockedFilterOn = false
      const btn = document.getElementById("blockedFilterBtn")
      if (btn) { btn.style.background = '#222'; btn.style.color = '#aaa' }
    }
  }
}
function closeSheet(id) { document.getElementById(id).classList.remove("open") }
function closeIfBg(e, id) { if (e.target===document.getElementById(id)) closeSheet(id) }
let pendingDelete = null
function confirmDelete() {
  pendingDelete = () => deleteProject(currentProject.id)
  document.getElementById("confirmTitle").innerText = "Delete project?"
  document.getElementById("confirmText").innerText = `"${currentProject.title}" and all its tasks will be deleted.`
  document.getElementById("confirmOk").onclick = () => { closeConfirm(); pendingDelete() }
  document.getElementById("confirmOverlay").classList.add("open")
}
function closeConfirm() { document.getElementById("confirmOverlay").classList.remove("open") }
let feedbackType = null
function openFeedback(type) {
  feedbackType = type
  document.getElementById("feedbackSheetTitle").innerText = type === "bug" ? "Report a problem" : "Share an idea"
  document.getElementById("feedbackText").value = ""
  document.getElementById("feedbackText").placeholder = type === "bug" ? "Describe the problem..." : "Describe your idea..."
  document.getElementById("feedbackSheet").classList.add("open")
  setTimeout(() => document.getElementById("feedbackText").focus(), 300)
}
async function submitFeedback() {
  const text = document.getElementById("feedbackText").value.trim()
  if (!text) return
  await sb.from("feedback").insert({ user_id: user?.id || null, type: feedbackType, text })
  closeSheet("feedbackSheet")
  showToast("Thanks for the feedback!")
}
let openSwipeCard = null
document.addEventListener("touchstart", e => {
  if (openSwipeCard && !openSwipeCard.contains(e.target)) {
    openSwipeCard.style.transform = "translateX(0)"
    openSwipeCard = null
  }
}, { passive: true })
document.addEventListener("change", e => {
  if (e.target.id === "projectCoverUpload") {
    const f = e.target.files[0]
    if (f) document.getElementById("projectCoverName").innerText = f.name
  }
})
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js")
document.addEventListener("touchmove", e => {
  if (e.touches.length > 1) e.preventDefault()
}, { passive: false })
// ── KEYBOARD / VIEWPORT FIX ──
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    const offset = window.innerHeight - window.visualViewport.height
    document.querySelectorAll(".sheet").forEach(s => {
      s.style.paddingBottom = offset > 50 ? (offset + 16) + "px" : ""
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
  const el = document.getElementById("allTasksList")
  const search = (document.getElementById("taskSearch")?.value || "").toLowerCase().trim()
  const pm = {}; projects.forEach(p => pm[p.id] = p)
  let filtered = tasks
  if (taskProjectFilter) filtered = filtered.filter(t => t.project_id === taskProjectFilter)
  if (filmFilterOn) filtered = filtered.filter(t => t.film_flag)
  if (blockedFilterOn) filtered = filtered.filter(t => !!t.blocked_reason)
  if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || (t.notes||"").toLowerCase().includes(search))
  if (!filtered.length) { el.innerHTML = `<div class="empty">${search||filmFilterOn||blockedFilterOn?"No results.":"No tasks yet."}</div>`; return }
  const open = filtered.filter(t => t.status !== "done")
  const done = filtered.filter(t => t.status === "done")
  const all = [...open, ...done]
  const page = all.slice(0, tasksPage * TASKS_PAGE_SIZE)
  if (tasksPage === 1) el.innerHTML = ""
  const oldBtn = document.getElementById("loadMoreBtn")
  if (oldBtn) oldBtn.remove()
  page.forEach(t => {
    if (!el.querySelector(`[data-task-id="${t.id}"]`)) {
      const card = makeTaskCard(t, pm[t.project_id])
      card.setAttribute("data-task-id", t.id)
      el.appendChild(card)
    }
  })
  if (all.length > tasksPage * TASKS_PAGE_SIZE) {
    const btn = document.createElement("button")
    btn.id = "loadMoreBtn"
    btn.innerText = `Load more (${all.length - tasksPage * TASKS_PAGE_SIZE} left)`
    btn.style.cssText = "width:100%;margin-top:8px;background:#222;color:#aaa;"
    btn.onclick = () => { tasksPage++; _renderAllTasksPage() }
    el.appendChild(btn)
  }
}
