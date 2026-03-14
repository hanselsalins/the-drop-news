"""
admin.py — The Drop Admin Dashboard
Serves a standalone password-protected admin panel at /admin.
All HTML/CSS/JS is inline. Mount via init_admin() + app.include_router().
"""
from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
import hashlib, hmac, os, asyncio
from datetime import datetime, timezone

admin_router = APIRouter(prefix="/admin", tags=["admin"])

_db = None
_admin_password = "admin"
_fns = {}


def init_admin(db, password: str, **fns):
    global _db, _admin_password, _fns
    _db = db
    _admin_password = password or "admin"
    _fns = fns


def _make_token() -> str:
    return hmac.new(
        _admin_password.encode(), b"the-drop-admin-v1", hashlib.sha256
    ).hexdigest()


def _is_auth(request: Request) -> bool:
    token = request.cookies.get("admin_session")
    if not token:
        return False
    return hmac.compare_digest(token, _make_token())


def _require_api_auth(request: Request):
    if not _is_auth(request):
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── LOGIN ──────────────────────────────────────────────────────

_LOGIN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Drop — Admin</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#ededed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#161616;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:44px 48px;width:380px}
.logo{font-size:1.4rem;font-weight:700;color:#CCFF00;letter-spacing:-0.02em}
.sub{color:#555;font-size:0.8rem;margin-top:4px;margin-bottom:36px}
label{display:block;font-size:0.72rem;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
input[type=password]{width:100%;background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);
  border-radius:8px;padding:11px 14px;color:#ededed;font-size:0.9rem;outline:none;margin-bottom:20px}
input[type=password]:focus{border-color:#CCFF00}
button{width:100%;background:#CCFF00;color:#0a0a0a;font-weight:700;border:none;
  border-radius:8px;padding:12px;font-size:0.9rem;cursor:pointer;letter-spacing:.01em}
button:hover{background:#b8e600}
.err{color:#FF006E;font-size:0.78rem;margin-top:14px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">The Drop</div>
  <div class="sub">Admin Dashboard</div>
  <form method="POST" action="/admin/login">
    <label>Password</label>
    <input type="password" name="password" autofocus autocomplete="current-password">
    <button type="submit">Sign in</button>
    {error}
  </form>
</div>
</body>
</html>"""


@admin_router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if _is_auth(request):
        return RedirectResponse("/admin", status_code=302)
    return HTMLResponse(_LOGIN_HTML.replace("{error}", ""))


@admin_router.post("/login")
async def login_submit(request: Request, password: str = Form(...)):
    if password == _admin_password:
        resp = RedirectResponse("/admin", status_code=302)
        resp.set_cookie("admin_session", _make_token(),
                        httponly=True, samesite="lax", max_age=86400 * 7)
        return resp
    html = _LOGIN_HTML.replace("{error}", '<div class="err">Incorrect password.</div>')
    return HTMLResponse(html, status_code=401)


@admin_router.get("/logout")
async def logout():
    resp = RedirectResponse("/admin/login", status_code=302)
    resp.delete_cookie("admin_session")
    return resp


# ── DASHBOARD HTML ─────────────────────────────────────────────

_DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Drop — Admin</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#ededed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.5}

/* Sidebar */
.sidebar{position:fixed;left:0;top:0;bottom:0;width:196px;background:#111;
  border-right:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;padding:0}
.sidebar-logo{padding:22px 20px 18px;border-bottom:1px solid rgba(255,255,255,0.05)}
.sidebar-logo .name{font-size:1rem;font-weight:700;color:#CCFF00;letter-spacing:-.01em}
.sidebar-logo .tag{font-size:0.7rem;color:#444;margin-top:2px}
.nav-item{padding:10px 20px;cursor:pointer;color:#666;font-size:0.82rem;display:flex;
  align-items:center;gap:10px;border-left:2px solid transparent;transition:all .12s}
.nav-item:hover{color:#ccc;background:rgba(255,255,255,0.03)}
.nav-item.active{color:#CCFF00;border-left-color:#CCFF00;background:rgba(204,255,0,0.04)}
.nav-icon{width:16px;text-align:center;font-size:0.85rem}
.sidebar-footer{margin-top:auto;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.05)}
.logout-btn{color:#444;font-size:0.78rem;cursor:pointer;background:none;border:none;
  display:flex;align-items:center;gap:8px;padding:0}
.logout-btn:hover{color:#888}

/* Main */
.main{margin-left:196px;padding:32px 36px;min-height:100vh}
.tab-content{display:none}
.tab-content.active{display:block}
.page-hd{margin-bottom:26px}
.page-hd h1{font-size:1.25rem;font-weight:600;letter-spacing:-.02em}
.page-hd p{color:#555;font-size:0.78rem;margin-top:4px}

/* Metric grid */
.metric-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.metric-card{background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 18px}
.metric-label{font-size:0.68rem;color:#555;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px}
.metric-value{font-size:1.6rem;font-weight:700;color:#ededed;line-height:1}
.c-ok{color:#39FF14}.c-err{color:#FF006E}.c-warn{color:#FFD60A}.c-dim{color:#666}

/* Card */
.card{background:#161616;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:20px 22px;margin-bottom:16px}
.card-title{font-size:0.7rem;color:#555;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;
  display:flex;align-items:center;justify-content:space-between}

/* Table */
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:0.78rem}
thead th{text-align:left;padding:8px 12px;color:#444;text-transform:uppercase;
  font-size:0.65rem;letter-spacing:.07em;border-bottom:1px solid rgba(255,255,255,0.05);font-weight:600}
tbody tr{border-bottom:1px solid rgba(255,255,255,0.03)}
tbody tr:hover{background:rgba(255,255,255,0.015)}
tbody td{padding:8px 12px;color:#bbb;vertical-align:middle}
.td-title{max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-mono{font-family:'SF Mono',Menlo,monospace;font-size:0.7rem;color:#555}

/* Badges */
.badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.b-ok{background:rgba(57,255,20,.12);color:#39FF14}
.b-fail{background:rgba(255,0,110,.12);color:#FF006E}
.b-pend{background:rgba(255,214,10,.12);color:#FFD60A}
.b-world{background:rgba(58,134,255,.14);color:#3A86FF}
.b-power{background:rgba(255,107,53,.14);color:#FF6B35}
.b-money{background:rgba(255,214,10,.14);color:#FFD60A}
.b-tech{background:rgba(57,255,20,.11);color:#39FF14}
.b-sports{background:rgba(255,0,110,.11);color:#FF006E}
.b-entertainment{background:rgba(255,105,180,.11);color:#FF69B4}
.b-environment{background:rgba(0,229,204,.11);color:#00E5CC}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;
  border:none;cursor:pointer;font-size:0.78rem;font-weight:600;transition:all .12s;line-height:1}
.btn-primary{background:#CCFF00;color:#0a0a0a}
.btn-primary:hover{background:#b8e600}
.btn-ghost{background:rgba(255,255,255,0.07);color:#aaa}
.btn-ghost:hover{background:rgba(255,255,255,0.11);color:#ededed}
.btn-cc{background:rgba(255,255,255,0.05);color:#777;min-width:48px;justify-content:center}
.btn-cc:hover{background:rgba(204,255,0,.1);color:#CCFF00}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}

/* Control sections */
.ctrl-section{margin-bottom:24px}
.ctrl-section:last-child{margin-bottom:0}
.ctrl-label{font-size:0.68rem;color:#555;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
.res-box{margin-top:10px;padding:11px 14px;border-radius:7px;font-family:'SF Mono',Menlo,monospace;
  font-size:0.72rem;color:#888;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);
  display:none;white-space:pre-wrap;word-break:break-all;line-height:1.6}
.res-ok{border-color:rgba(57,255,20,.25);color:#39FF14}
.res-err{border-color:rgba(255,0,110,.25);color:#FF006E}

/* Filters */
.filter-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;align-items:center}
select,input[type=search]{background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);
  border-radius:7px;padding:6px 10px;color:#ccc;font-size:0.78rem;outline:none}
select:focus,input[type=search]:focus{border-color:#CCFF00}
.count-info{margin-left:auto;color:#555;font-size:0.72rem}
.count-info strong{color:#CCFF00}

.note{color:#444;font-size:0.72rem;margin-top:10px}
.loading{color:#444;padding:28px 12px;text-align:center}
</style>
</head>
<body>

<nav class="sidebar">
  <div class="sidebar-logo">
    <div class="name">The Drop</div>
    <div class="tag">Admin Dashboard v1.0</div>
  </div>
  <div class="nav-item active" data-tab="health"   onclick="switchTab('health')">
    <span class="nav-icon">⚡</span>System Health</div>
  <div class="nav-item"        data-tab="pipeline" onclick="switchTab('pipeline')">
    <span class="nav-icon">🔄</span>Pipeline</div>
  <div class="nav-item"        data-tab="articles" onclick="switchTab('articles')">
    <span class="nav-icon">📰</span>Articles</div>
  <div class="nav-item"        data-tab="users"    onclick="switchTab('users')">
    <span class="nav-icon">👤</span>Users</div>
  <div class="sidebar-footer">
    <button class="logout-btn" onclick="location='/admin/logout'">
      <span>⎋</span> Sign out
    </button>
  </div>
</nav>

<main class="main">

  <!-- ═══ SYSTEM HEALTH ═══════════════════════════════════════ -->
  <div id="tab-health" class="tab-content active">
    <div class="page-hd">
      <h1>System Health</h1>
      <p>Live server status, article counts, and scheduler jobs. Auto-refreshes every 60s.</p>
    </div>

    <div id="health-metrics" class="metric-grid">
      <div class="loading">Loading…</div>
    </div>

    <div class="card">
      <div class="card-title">
        <span>Scheduled Jobs</span>
        <span id="health-ts" class="note" style="margin-top:0"></span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Job ID</th><th>Trigger</th><th>Next Run (UTC)</th><th>State</th>
          </tr></thead>
          <tbody id="jobs-body">
            <tr><td colspan="4" class="loading">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="note">↻ Auto-refreshes every 60 seconds</p>
  </div>

  <!-- ═══ PIPELINE CONTROL ════════════════════════════════════ -->
  <div id="tab-pipeline" class="tab-content">
    <div class="page-hd">
      <h1>Pipeline Control</h1>
      <p>Manually trigger crawl and rewrite jobs. Actions run in the background.</p>
    </div>

    <div class="card">
      <div class="ctrl-section">
        <div class="ctrl-label">Crawl — All Countries</div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-crawl-all" onclick="triggerCrawlAll(this)">
            ▶ Crawl All Countries
          </button>
        </div>
        <div class="res-box" id="res-crawl-all"></div>
      </div>

      <div class="ctrl-section">
        <div class="ctrl-label">Crawl — Per Country</div>
        <div class="btn-row">
          <button class="btn btn-cc" onclick="triggerCrawlCountry(this,'IN')">IN</button>
          <button class="btn btn-cc" onclick="triggerCrawlCountry(this,'US')">US</button>
          <button class="btn btn-cc" onclick="triggerCrawlCountry(this,'GB')">GB</button>
          <button class="btn btn-cc" onclick="triggerCrawlCountry(this,'AU')">AU</button>
          <button class="btn btn-cc" onclick="triggerCrawlCountry(this,'AE')">AE</button>
        </div>
        <div class="res-box" id="res-crawl-cc"></div>
      </div>

      <div class="ctrl-section">
        <div class="ctrl-label">Rewrite Pending Articles</div>
        <div class="btn-row">
          <button class="btn btn-ghost" id="btn-rewrite" onclick="triggerRewrite(this)">
            ⟳ Rewrite All Pending
          </button>
        </div>
        <div class="res-box" id="res-rewrite"></div>
      </div>
    </div>
  </div>

  <!-- ═══ ARTICLE VIEWER ══════════════════════════════════════ -->
  <div id="tab-articles" class="tab-content">
    <div class="page-hd">
      <h1>Articles</h1>
      <p>All crawled articles. Showing up to 500 most recent.</p>
    </div>
    <div class="card">
      <div class="filter-row">
        <select id="f-country" onchange="loadArticles()">
          <option value="">All Countries</option>
          <option value="IN">India (IN)</option>
          <option value="US">United States (US)</option>
          <option value="GB">United Kingdom (GB)</option>
          <option value="AU">Australia (AU)</option>
          <option value="AE">UAE (AE)</option>
        </select>
        <select id="f-category" onchange="loadArticles()">
          <option value="">All Categories</option>
          <option value="world">World</option>
          <option value="power">Power</option>
          <option value="money">Money</option>
          <option value="tech">Tech</option>
          <option value="sports">Sports</option>
          <option value="entertainment">Entertainment</option>
          <option value="environment">Environment</option>
        </select>
        <select id="f-status" onchange="loadArticles()">
          <option value="">All Statuses</option>
          <option value="complete">Complete</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <span class="count-info">Showing <strong id="art-count">—</strong> articles</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Title</th><th>Category</th><th>Country</th>
            <th>Rewrite Status</th><th>Crawled</th>
          </tr></thead>
          <tbody id="art-body">
            <tr><td colspan="5" class="loading">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══ USER MANAGEMENT ═════════════════════════════════════ -->
  <div id="tab-users" class="tab-content">
    <div class="page-hd">
      <h1>Users</h1>
      <p>All registered accounts.</p>
    </div>
    <div class="card">
      <div class="filter-row">
        <span class="count-info">Total <strong id="user-count">—</strong> users</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Username</th><th>Email</th><th>Country</th>
            <th>Age Group</th><th>Streak</th><th>Joined</th>
          </tr></thead>
          <tbody id="user-body">
            <tr><td colspan="6" class="loading">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

</main>

<script>
// ── Tab switching ───────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  if (name === 'health')   loadHealth();
  if (name === 'articles') loadArticles();
  if (name === 'users')    loadUsers();
}

// ── Helpers ─────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toISOString().replace('T',' ').slice(0,16) + ' UTC'; }
  catch { return String(s).slice(0,16); }
}

function catBadge(c) {
  const cls = ['world','power','money','tech','sports','entertainment','environment'].includes(c) ? c : 'pend';
  return `<span class="badge b-${cls}">${c || '—'}</span>`;
}

function statusBadge(s) {
  if (s === 'complete') return '<span class="badge b-ok">complete</span>';
  if (s === 'failed')   return '<span class="badge b-fail">failed</span>';
  return '<span class="badge b-pend">pending</span>';
}

function showRes(boxId, data, ok) {
  const box = document.getElementById(boxId);
  box.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  box.className = 'res-box ' + (ok ? 'res-ok' : 'res-err');
  box.style.display = 'block';
}

// ── System Health ────────────────────────────────────────────────
async function loadHealth() {
  try {
    const [health, stats] = await Promise.all([
      fetch('/admin/api/health').then(r => r.json()),
      fetch('/admin/api/stats').then(r => r.json()),
    ]);

    const isOk = health.status === 'ok';
    const cards = [
      { label: 'Status',        value: isOk ? 'OK' : health.status, cls: isOk ? 'c-ok' : 'c-err' },
      { label: 'Total Articles', value: health.articles_count ?? stats.total_articles ?? '—', cls: '' },
      { label: 'Total Users',    value: stats.total_users ?? '—',    cls: '' },
      { label: 'Version',        value: health.version ?? '—',       cls: 'c-dim' },
    ];
    const catCards = Object.entries(stats.by_category || {}).map(([k, v]) => ({
      label: k, value: v, cls: ''
    }));
    document.getElementById('health-metrics').innerHTML =
      [...cards, ...catCards].map(m =>
        `<div class="metric-card">
          <div class="metric-label">${m.label}</div>
          <div class="metric-value ${m.cls}">${m.value}</div>
         </div>`
      ).join('');

    const jobs = stats.scheduler_jobs || [];
    const tbody = document.getElementById('jobs-body');
    if (!jobs.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:#555;padding:16px 12px">
        Scheduler running in-process — job list available via server logs.
        </td></tr>`;
    } else {
      tbody.innerHTML = jobs.map(j =>
        `<tr>
          <td><code style="color:#CCFF00;font-size:.72rem">${j.id}</code></td>
          <td class="td-mono">${j.schedule || '—'}</td>
          <td class="td-mono">${j.next_run ? fmtDate(j.next_run) : '—'}</td>
          <td><span class="badge b-ok">active</span></td>
         </tr>`
      ).join('');
    }
    document.getElementById('health-ts').textContent =
      'Updated ' + fmtDate(new Date().toISOString());
  } catch (e) {
    document.getElementById('health-metrics').innerHTML =
      `<div class="metric-card"><div class="metric-value c-err">Error</div>
       <div class="metric-label">${e.message}</div></div>`;
  }
}
// Auto-refresh health tab every 60s
setInterval(() => {
  if (document.getElementById('tab-health').classList.contains('active')) loadHealth();
}, 60000);
loadHealth();

// ── Pipeline ─────────────────────────────────────────────────────
async function triggerCrawlAll(btn) {
  btn.disabled = true; btn.textContent = '…';
  try {
    const r = await fetch('/admin/api/crawl', { method: 'POST' });
    showRes('res-crawl-all', await r.json(), r.ok);
  } catch(e) { showRes('res-crawl-all', e.message, false); }
  btn.disabled = false; btn.innerHTML = '▶ Crawl All Countries';
}

async function triggerCrawlCountry(btn, cc) {
  btn.disabled = true;
  try {
    const r = await fetch(`/admin/api/crawl/${cc}`, { method: 'POST' });
    showRes('res-crawl-cc', await r.json(), r.ok);
  } catch(e) { showRes('res-crawl-cc', e.message, false); }
  btn.disabled = false;
}

async function triggerRewrite(btn) {
  btn.disabled = true; btn.textContent = '…';
  try {
    const r = await fetch('/admin/api/rewrite', { method: 'POST' });
    showRes('res-rewrite', await r.json(), r.ok);
  } catch(e) { showRes('res-rewrite', e.message, false); }
  btn.disabled = false; btn.innerHTML = '⟳ Rewrite All Pending';
}

// ── Articles ─────────────────────────────────────────────────────
async function loadArticles() {
  const p = new URLSearchParams();
  const c = document.getElementById('f-country').value;
  const cat = document.getElementById('f-category').value;
  const st = document.getElementById('f-status').value;
  if (c) p.set('country', c);
  if (cat) p.set('category', cat);
  if (st) p.set('status', st);
  const tbody = document.getElementById('art-body');
  tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading…</td></tr>';
  try {
    const data = await fetch('/admin/api/articles?' + p).then(r => r.json());
    document.getElementById('art-count').textContent = data.length;
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:#444;padding:20px 12px">No articles match the filter.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td class="td-title" title="${(a.original_title||'').replace(/"/g,'&quot;')}">
          ${a.original_title || '—'}</td>
        <td>${catBadge(a.category)}</td>
        <td><span style="color:#777;font-size:.72rem">${a.source_country || '—'}</span></td>
        <td>${statusBadge(a.rewrite_status)}</td>
        <td class="td-mono">${fmtDate(a.crawled_at)}</td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#FF006E;padding:12px">${e.message}</td></tr>`;
  }
}

// ── Users ─────────────────────────────────────────────────────────
async function loadUsers() {
  const tbody = document.getElementById('user-body');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading…</td></tr>';
  try {
    const data = await fetch('/admin/api/users').then(r => r.json());
    document.getElementById('user-count').textContent = data.length;
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:#444;padding:20px 12px">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(u => `
      <tr>
        <td><span style="color:#CCFF00">@${u.username || '—'}</span></td>
        <td style="color:#555">${u.email || '—'}</td>
        <td>${u.country || '—'}</td>
        <td><span style="color:#777">${u.age_group || '—'}</span></td>
        <td><span style="color:${(u.current_streak||0)>0?'#39FF14':'#444'}">
          ${u.current_streak || 0}${(u.current_streak||0)>0?' 🔥':''}</span></td>
        <td class="td-mono">${fmtDate(u.created_at || u.member_since)}</td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#FF006E;padding:12px">${e.message}</td></tr>`;
  }
}
</script>
</body>
</html>"""


@admin_router.get("", response_class=HTMLResponse)
@admin_router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    if not _is_auth(request):
        return RedirectResponse("/admin/login", status_code=302)
    return HTMLResponse(_DASHBOARD_HTML)


# ── ADMIN JSON API ──────────────────────────────────────────────

@admin_router.get("/api/health")
async def api_health(request: Request):
    _require_api_auth(request)
    count = await _db.articles.estimated_document_count()
    return {
        "status": "ok",
        "articles_count": count,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@admin_router.get("/api/stats")
async def api_stats(request: Request):
    _require_api_auth(request)
    total_articles = await _db.articles.count_documents({})
    total_users = await _db.users.count_documents({})
    by_cat = {}
    for cat in ["world", "power", "money", "tech", "sports", "entertainment", "environment"]:
        by_cat[cat] = await _db.articles.count_documents({"category": cat})
    return {
        "total_articles": total_articles,
        "total_users": total_users,
        "by_category": by_cat,
        "scheduler_jobs": [],   # in-process scheduler; job list shown in server logs
    }


@admin_router.get("/api/articles")
async def api_articles(
    request: Request,
    country: str = None,
    category: str = None,
    status: str = None,
):
    _require_api_auth(request)
    query = {}
    if country:  query["source_country"] = country.upper()
    if category: query["category"] = category
    if status:   query["rewrite_status"] = status
    cursor = _db.articles.find(
        query,
        {"_id": 0, "id": 1, "original_title": 1, "category": 1,
         "source_country": 1, "rewrite_status": 1, "crawled_at": 1},
    ).sort("crawled_at", -1).limit(500)
    return await cursor.to_list(500)


@admin_router.get("/api/users")
async def api_users(request: Request):
    _require_api_auth(request)
    cursor = _db.users.find(
        {},
        {"_id": 0, "password_hash": 0, "device_tokens": 0},
    ).sort("created_at", -1).limit(1000)
    return await cursor.to_list(1000)


@admin_router.post("/api/crawl")
async def api_crawl_all(request: Request):
    _require_api_auth(request)
    if "crawl" not in _fns:
        raise HTTPException(status_code=503, detail="Crawl function not registered")
    asyncio.create_task(_fns["crawl"]())
    return {"message": "Crawl started for all countries in background."}


@admin_router.post("/api/crawl/{country_code}")
async def api_crawl_country(request: Request, country_code: str):
    _require_api_auth(request)
    if "crawl" not in _fns:
        raise HTTPException(status_code=503, detail="Crawl function not registered")
    asyncio.create_task(_fns["crawl"](country_code=country_code.upper()))
    return {"message": f"Crawl started for {country_code.upper()} in background."}


@admin_router.post("/api/rewrite")
async def api_rewrite(request: Request):
    _require_api_auth(request)
    if "rewrite" not in _fns:
        raise HTTPException(status_code=503, detail="Rewrite function not registered")
    for ag in ["8-10", "11-13", "14-16", "17-20"]:
        asyncio.create_task(_fns["rewrite"](ag))
    return {"message": "Rewrite tasks queued for all 4 age groups in background."}
