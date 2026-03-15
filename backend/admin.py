# admin dashboard v2
"""
admin.py — The Drop Admin Dashboard v2
Serves a standalone password-protected admin panel at /admin.
All HTML/CSS/JS is inline. Mount via init_admin() + app.include_router().
"""
from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
import hashlib, hmac, os, asyncio
from datetime import datetime, timezone, timedelta

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
        _admin_password.encode(), b"the-drop-admin-v2", hashlib.sha256
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
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{background:#111827;color:#f9fafb;font-family:'Segoe UI',system-ui,sans-serif;
       min-height:100vh;display:flex;align-items:center;justify-content:center}}
  .card{{background:#1f2937;border:1px solid #374151;border-radius:12px;padding:40px;
        width:360px;box-shadow:0 20px 60px rgba(0,0,0,.5)}}
  h1{{font-size:22px;font-weight:700;margin-bottom:6px;color:#f9fafb}}
  .sub{{font-size:13px;color:#9ca3af;margin-bottom:28px}}
  label{{display:block;font-size:12px;color:#9ca3af;margin-bottom:6px;font-weight:500;
        letter-spacing:.5px;text-transform:uppercase}}
  input{{width:100%;background:#111827;border:1px solid #374151;border-radius:8px;
        padding:10px 14px;color:#f9fafb;font-size:15px;outline:none;transition:.2s}}
  input:focus{{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}}
  button{{width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;
         padding:11px;font-size:15px;font-weight:600;cursor:pointer;margin-top:18px;
         transition:background .2s}}
  button:hover{{background:#2563eb}}
  .err{{color:#f87171;font-size:13px;margin-top:14px;text-align:center}}
</style>
</head>
<body>
<div class="card">
  <h1>The Drop</h1>
  <p class="sub">Admin Dashboard</p>
  <form method="post" action="/admin/login">
    <label>Password</label>
    <input type="password" name="password" autofocus placeholder="Enter admin password">
    <button type="submit">Sign In</button>
    {error}
  </form>
</div>
</body>
</html>"""

_DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Drop — Admin</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#111827;color:#f9fafb;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
  /* Layout */
  .header{background:#1f2937;border-bottom:1px solid #374151;padding:0 24px;display:flex;
           align-items:center;justify-content:space-between;height:56px;position:sticky;top:0;z-index:100}
  .header-title{font-size:18px;font-weight:700;color:#f9fafb}
  .header-sub{font-size:12px;color:#6b7280;margin-top:1px}
  .logout-btn{background:#374151;color:#9ca3af;border:none;border-radius:6px;
              padding:6px 14px;font-size:13px;cursor:pointer;transition:.2s}
  .logout-btn:hover{background:#4b5563;color:#f9fafb}
  /* Tabs */
  .tabs{display:flex;gap:2px;padding:16px 24px 0;border-bottom:1px solid #374151;background:#1f2937}
  .tab{padding:10px 18px;font-size:13px;font-weight:500;color:#9ca3af;cursor:pointer;
       border-bottom:2px solid transparent;border-radius:6px 6px 0 0;transition:.2s;white-space:nowrap}
  .tab:hover{color:#f9fafb;background:#374151}
  .tab.active{color:#3b82f6;border-bottom-color:#3b82f6;background:#111827}
  /* Content */
  .content{padding:24px;max-width:1400px;margin:0 auto}
  .pane{display:none}
  .pane.active{display:block}
  /* Cards */
  .card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:24px}
  .card{background:#1f2937;border:1px solid #374151;border-radius:10px;padding:18px}
  .card-label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
  .card-value{font-size:28px;font-weight:700;color:#f9fafb}
  .card-sub{font-size:12px;color:#6b7280;margin-top:4px}
  .card.blue .card-value{color:#60a5fa}
  .card.green .card-value{color:#34d399}
  .card.yellow .card-value{color:#fbbf24}
  .card.purple .card-value{color:#a78bfa}
  .card.pink .card-value{color:#f472b6}
  /* Section headers */
  .section-title{font-size:14px;font-weight:600;color:#f9fafb;margin-bottom:14px;
                  display:flex;align-items:center;gap:8px}
  .section-title .badge{background:#374151;color:#9ca3af;font-size:10px;padding:2px 8px;border-radius:10px}
  /* Chart containers */
  .chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
  .chart-box{background:#1f2937;border:1px solid #374151;border-radius:10px;padding:20px}
  .chart-box canvas{max-height:260px}
  .chart-box-full{background:#1f2937;border:1px solid #374151;border-radius:10px;padding:20px;margin-bottom:20px}
  .chart-box-full canvas{max-height:220px}
  /* Tables */
  .table-wrap{background:#1f2937;border:1px solid #374151;border-radius:10px;overflow:auto;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:12px 16px;color:#9ca3af;font-size:11px;font-weight:600;
      text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #374151;
      background:#1f2937;position:sticky;top:0}
  td{padding:10px 16px;border-bottom:1px solid #1e2533;color:#d1d5db}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#232d3f}
  /* Filters */
  .filters{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
  .filter-select,.filter-input{background:#1f2937;border:1px solid #374151;color:#d1d5db;
                                 border-radius:6px;padding:7px 12px;font-size:13px;outline:none;transition:.2s}
  .filter-select:focus,.filter-input:focus{border-color:#3b82f6}
  .filter-input{min-width:220px}
  .filter-btn{background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:7px 16px;
               font-size:13px;font-weight:500;cursor:pointer;transition:.2s}
  .filter-btn:hover{background:#2563eb}
  /* Pipeline buttons */
  .btn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px}
  .btn{padding:11px 16px;border:none;border-radius:8px;font-size:13px;font-weight:600;
       cursor:pointer;transition:.2s;display:flex;align-items:center;gap:6px;justify-content:center}
  .btn-primary{background:#3b82f6;color:#fff}
  .btn-primary:hover{background:#2563eb}
  .btn-secondary{background:#374151;color:#d1d5db}
  .btn-secondary:hover{background:#4b5563}
  .btn-green{background:#059669;color:#fff}
  .btn-green:hover{background:#047857}
  .btn:disabled{opacity:.5;cursor:not-allowed}
  /* Response box */
  .response-box{background:#0d1117;border:1px solid #374151;border-radius:8px;
                padding:14px 16px;font-size:12px;font-family:'Courier New',monospace;
                color:#a3e635;min-height:48px;max-height:200px;overflow-y:auto;
                white-space:pre-wrap;margin-top:14px;display:none}
  .response-box.visible{display:block}
  /* Status badges */
  .badge-status{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500}
  .badge-raw{background:#1e3a5f;color:#60a5fa}
  .badge-pending{background:#451a03;color:#fbbf24}
  .badge-selected{background:#3b1d8a;color:#c4b5fd}
  .badge-rewritten{background:#052e16;color:#34d399}
  .badge-done{background:#052e16;color:#34d399}
  .badge-failed{background:#450a0a;color:#f87171}
  .badge-safe{background:#052e16;color:#34d399}
  .badge-flagged{background:#450a0a;color:#f87171}
  /* Loading */
  .spinner{display:inline-block;width:16px;height:16px;border:2px solid #374151;
           border-top-color:#3b82f6;border-radius:50%;animation:spin .7s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-row{text-align:center;padding:30px;color:#6b7280}
  /* Health items */
  .health-item{display:flex;justify-content:space-between;align-items:center;
               padding:10px 0;border-bottom:1px solid #1e2533}
  .health-item:last-child{border-bottom:none}
  .health-key{font-size:13px;color:#9ca3af}
  .health-val{font-size:13px;color:#d1d5db;font-weight:500}
  .dot-green{display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399;margin-right:6px}
  /* Responsive */
  @media(max-width:768px){
    .chart-grid{grid-template-columns:1fr}
    .tabs{overflow-x:auto}
    .tab{font-size:12px;padding:8px 12px}
  }
  /* Pagination */
  .pagination{display:flex;gap:6px;align-items:center;margin-top:12px;justify-content:flex-end}
  .page-btn{background:#374151;color:#d1d5db;border:none;border-radius:6px;padding:5px 12px;
            font-size:12px;cursor:pointer;transition:.2s}
  .page-btn:hover{background:#4b5563}
  .page-btn.active{background:#3b82f6;color:#fff}
  .page-info{font-size:12px;color:#6b7280}
  /* Rewrites modal */
  .rw-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000;
              align-items:center;justify-content:center;padding:20px}
  .rw-overlay.open{display:flex}
  .rw-card{background:#1f2937;border:1px solid #374151;border-radius:12px;width:100%;
           max-width:820px;max-height:90vh;display:flex;flex-direction:column;
           box-shadow:0 25px 80px rgba(0,0,0,.7)}
  .rw-header{display:flex;align-items:flex-start;justify-content:space-between;
             padding:20px 24px 16px;border-bottom:1px solid #374151;gap:16px}
  .rw-title{font-size:15px;font-weight:600;color:#f9fafb;line-height:1.4;flex:1}
  .rw-close{background:#374151;border:none;color:#9ca3af;border-radius:6px;
            width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1;
            flex-shrink:0;transition:.2s}
  .rw-close:hover{background:#4b5563;color:#f9fafb}
  .rw-tabs{display:flex;gap:2px;padding:12px 24px 0;border-bottom:1px solid #374151}
  .rw-tab{padding:8px 16px;font-size:13px;font-weight:500;color:#9ca3af;cursor:pointer;
          border-bottom:2px solid transparent;border-radius:6px 6px 0 0;transition:.2s}
  .rw-tab:hover{color:#f9fafb;background:#374151}
  .rw-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}
  .rw-body{overflow-y:auto;padding:20px 24px;flex:1}
  .rw-pane{display:none}
  .rw-pane.active{display:block}
  .rw-field{margin-bottom:18px}
  .rw-field-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;
                   font-weight:600;margin-bottom:6px}
  .rw-field-value{font-size:14px;color:#d1d5db;line-height:1.6}
  .rw-field-value.body-text{font-size:13px;white-space:pre-wrap;line-height:1.7;
                             background:#111827;border:1px solid #374151;border-radius:8px;
                             padding:12px 14px;max-height:320px;overflow-y:auto}
  .rw-empty{color:#6b7280;font-size:13px;font-style:italic;padding:20px 0}
  .btn-view-rewrites{background:#1e3a5f;color:#60a5fa;border:1px solid #2563eb;
                     border-radius:5px;padding:4px 10px;font-size:11px;font-weight:500;
                     cursor:pointer;transition:.2s;white-space:nowrap}
  .btn-view-rewrites:hover{background:#2563eb;color:#fff}
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="header-title">The Drop</div>
    <div class="header-sub">Admin Dashboard</div>
  </div>
  <form method="post" action="/admin/logout" style="display:inline">
    <button class="logout-btn" type="submit">Sign Out</button>
  </form>
</div>

<div class="tabs" id="tabBar">
  <div class="tab active" onclick="switchTab('health')">System Health</div>
  <div class="tab" onclick="switchTab('pipeline')">Pipeline Control</div>
  <div class="tab" onclick="switchTab('analytics')">Analytics</div>
  <div class="tab" onclick="switchTab('articles')">Article Viewer</div>
  <div class="tab" onclick="switchTab('users')">User Management</div>
</div>

<!-- ═══════════════════════ HEALTH TAB ═══════════════════════ -->
<div class="content">
<div class="pane active" id="pane-health">
  <div class="card-grid" id="healthCards">
    <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div>
      <div class="section-title">API Status</div>
      <div class="card" id="healthMeta" style="margin-bottom:20px">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>
    <div>
      <div class="section-title">Scheduler Jobs</div>
      <div class="card" id="schedulerJobs">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>
  </div>
  <p style="font-size:11px;color:#4b5563;margin-top:16px">Auto-refreshes every 60 seconds</p>
</div>

<!-- ═══════════════════════ PIPELINE TAB ═══════════════════════ -->
<div class="pane" id="pane-pipeline">
  <div class="section-title">Maintenance</div>
  <div class="btn-grid">
    <button class="btn btn-secondary" onclick="triggerCleanup()">🗑️ Clean Up Old Articles</button>
    <button class="btn btn-secondary" onclick="triggerMigrateDates()">🔧 Migrate Date Formats</button>
  </div>
  <div class="section-title" style="margin-top:8px">Crawl</div>
  <div class="btn-grid">
    <button class="btn btn-primary" onclick="triggerCrawl()">🕷 Crawl All Countries</button>
    <button class="btn btn-secondary" onclick="triggerCrawlCC('IN')">🇮🇳 Crawl IN</button>
    <button class="btn btn-secondary" onclick="triggerCrawlCC('US')">🇺🇸 Crawl US</button>
    <button class="btn btn-secondary" onclick="triggerCrawlCC('GB')">🇬🇧 Crawl GB</button>
    <button class="btn btn-secondary" onclick="triggerCrawlCC('AU')">🇦🇺 Crawl AU</button>
    <button class="btn btn-secondary" onclick="triggerCrawlCC('AE')">🇦🇪 Crawl AE</button>
  </div>
  <div class="section-title" style="margin-top:8px">Rewrite</div>
  <div class="btn-grid">
    <button class="btn btn-green" onclick="triggerRewrite()">✏️ Rewrite Pending</button>
    <button class="btn btn-green" onclick="triggerRetryFailed()">🔄 Retry Failed Rewrites</button>
    <button class="btn btn-secondary" onclick="triggerResetSelectedToRaw()">↩️ Reset Selected→Raw</button>
    <button class="btn btn-secondary" onclick="triggerResetRewrittenToSelected()">↩️ Reset Rewritten→Selected</button>
    <button class="btn btn-secondary" onclick="triggerResetRewrite()">🔄 Reset &amp; Rewrite All</button>
    <button class="btn btn-secondary" onclick="triggerResetRewriteCC('IN')">🔄 Reset IN</button>
    <button class="btn btn-secondary" onclick="triggerResetRewriteCC('US')">🔄 Reset US</button>
    <button class="btn btn-secondary" onclick="triggerResetRewriteCC('GB')">🔄 Reset GB</button>
    <button class="btn btn-secondary" onclick="triggerResetRewriteCC('AU')">🔄 Reset AU</button>
    <button class="btn btn-secondary" onclick="triggerResetRewriteCC('AE')">🔄 Reset AE</button>
  </div>
  <div class="response-box" id="pipelineResponse"></div>
</div>

<!-- ═══════════════════════ ANALYTICS TAB ═══════════════════════ -->
<div class="pane" id="pane-analytics">
  <div id="analyticsLoading" class="loading-row"><div class="spinner"></div> Loading analytics…</div>
  <div id="analyticsContent" style="display:none">
    <!-- Engagement stat cards -->
    <div class="card-grid" id="engagementCards"></div>

    <!-- Country + Age charts -->
    <div class="chart-grid">
      <div class="chart-box">
        <div class="section-title">Users by Country</div>
        <canvas id="countryChart"></canvas>
      </div>
      <div class="chart-box">
        <div class="section-title">Users by Age Band</div>
        <canvas id="ageChart"></canvas>
      </div>
    </div>

    <!-- Daily trend -->
    <div class="chart-box-full">
      <div class="section-title">Registrations — Last 30 Days</div>
      <canvas id="dailyChart"></canvas>
    </div>

    <!-- Monthly trend -->
    <div class="chart-box-full">
      <div class="section-title">Registrations — Last 12 Months</div>
      <canvas id="monthlyChart"></canvas>
    </div>
  </div>
</div>

<!-- ═══════════════════════ ARTICLES TAB ═══════════════════════ -->
<div class="pane" id="pane-articles">
  <div class="filters">
    <select class="filter-select" id="artCountry" onchange="loadArticles(1)">
      <option value="">All Countries</option>
      <option value="IN">IN</option>
      <option value="US">US</option>
      <option value="GB">GB</option>
      <option value="AU">AU</option>
      <option value="AE">AE</option>
    </select>
    <select class="filter-select" id="artCategory" onchange="loadArticles(1)">
      <option value="">All Categories</option>
      <option value="world">World</option>
      <option value="power">Power</option>
      <option value="money">Money</option>
      <option value="tech">Tech</option>
      <option value="sports">Sports</option>
      <option value="entertainment">Entertainment</option>
      <option value="environment">Environment</option>
    </select>
    <select class="filter-select" id="artStatus" onchange="loadArticles(1)">
      <option value="">All Statuses</option>
      <option value="raw">Raw</option>
      <option value="selected">Selected</option>
      <option value="rewritten">Rewritten</option>
      <option value="failed">Failed</option>
    </select>
  </div>
  <div class="section-title"><span id="artCount">—</span> articles</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Country</th>
          <th>Rewrite Status</th>
          <th>Safety</th>
          <th>Age Bands</th>
          <th>Published</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="artBody"><tr><td colspan="8" class="loading-row"><div class="spinner"></div></td></tr></tbody>
    </table>
  </div>
  <div class="pagination" id="artPagination"></div>
</div>

<!-- ═══════════════════════ USERS TAB ═══════════════════════ -->
<div class="pane" id="pane-users">
  <div class="filters">
    <input class="filter-input" id="userSearch" type="text" placeholder="Search username or email…" oninput="debounceUsers()">
    <button class="filter-btn" onclick="loadUsers(1)">Search</button>
  </div>
  <div class="section-title"><span id="userCount">—</span> users total</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Full Name</th>
          <th>Country</th>
          <th>Age Band</th>
          <th>Streak</th>
          <th>Stories Read</th>
          <th>Joined</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody id="userBody"><tr><td colspan="9" class="loading-row"><div class="spinner"></div></td></tr></tbody>
    </table>
  </div>
  <div class="pagination" id="userPagination"></div>
</div>

</div><!-- /content -->

<!-- ═══════════════════════ REWRITES MODAL ═══════════════════════ -->
<div class="rw-overlay" id="rwOverlay" onclick="closeRewriteModal(event)">
  <div class="rw-card" onclick="event.stopPropagation()">
    <div class="rw-header">
      <div style="flex:1;min-width:0">
        <div class="rw-title" id="rwArticleTitle">Rewrites</div>
        <a id="rwOriginalLink" href="#" target="_blank" rel="noopener noreferrer"
           style="display:none;font-size:11px;color:#6b7280;text-decoration:none;margin-top:5px">
          Read Original →
        </a>
      </div>
      <button class="rw-close" onclick="closeRewriteModal()">✕</button>
    </div>
    <div class="rw-tabs" id="rwTabBar">
      <div class="rw-tab active" onclick="switchRwTab('8-10')">8–10</div>
      <div class="rw-tab" onclick="switchRwTab('11-13')">11–13</div>
      <div class="rw-tab" onclick="switchRwTab('14-16')">14–16</div>
      <div class="rw-tab" onclick="switchRwTab('17-20')">17–20</div>
    </div>
    <div class="rw-body">
      <div class="rw-pane active" id="rwPane-8-10"></div>
      <div class="rw-pane" id="rwPane-11-13"></div>
      <div class="rw-pane" id="rwPane-14-16"></div>
      <div class="rw-pane" id="rwPane-17-20"></div>
    </div>
  </div>
</div>

<script>
const PAGE_SIZE = 50;
let artPage = 1, userPage = 1, userDebounceTimer = null;
let countryChartInst=null, ageChartInst=null, dailyChartInst=null, monthlyChartInst=null;

// ── TAB SWITCHING ──────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t,i)=>{
    const names=['health','pipeline','analytics','articles','users'];
    t.classList.toggle('active', names[i]===name);
  });
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('pane-'+name).classList.add('active');
  if(name==='health') loadHealth();
  if(name==='analytics') loadAnalytics();
  if(name==='articles') loadArticles(1);
  if(name==='users') loadUsers(1);
}

// ── HEALTH ─────────────────────────────────────────────────────
async function loadHealth() {
  try {
    const r = await fetch('/admin/api/health');
    if(!r.ok) throw new Error(r.statusText);
    const d = await r.json();
    const h = d.health || {};
    const jobs = d.jobs || [];

    document.getElementById('healthCards').innerHTML = `
      <div class="card blue"><div class="card-label">Status</div><div class="card-value">${h.status||'—'}</div></div>
      <div class="card green"><div class="card-label">Articles</div><div class="card-value">${(h.article_count||0).toLocaleString()}</div></div>
      <div class="card yellow"><div class="card-label">Users</div><div class="card-value">${(d.user_count||0).toLocaleString()}</div></div>
      <div class="card purple"><div class="card-label">Version</div><div class="card-value" style="font-size:18px">${h.version||'—'}</div></div>
    `;

    const ts = h.timestamp ? new Date(h.timestamp).toLocaleString() : '—';
    document.getElementById('healthMeta').innerHTML = `
      <div class="health-item"><span class="health-key">Timestamp</span><span class="health-val">${ts}</span></div>
      <div class="health-item"><span class="health-key">DB Status</span><span class="health-val"><span class="dot-green"></span>${h.status||'—'}</span></div>
    `;

    if(jobs.length===0) {
      document.getElementById('schedulerJobs').innerHTML = '<div style="color:#6b7280;font-size:13px">No job data available</div>';
    } else {
      document.getElementById('schedulerJobs').innerHTML = jobs.map(j=>`
        <div class="health-item">
          <span class="health-key">${j.id}</span>
          <span class="health-val" style="font-size:12px">${j.next_run||'—'}</span>
        </div>`).join('');
    }
  } catch(e) {
    document.getElementById('healthCards').innerHTML = `<div style="color:#f87171">Error: ${e.message}</div>`;
  }
}

// Auto-refresh health every 60s
let healthTimer = null;
function startHealthAutoRefresh() {
  if(healthTimer) clearInterval(healthTimer);
  healthTimer = setInterval(()=>{
    const pane = document.getElementById('pane-health');
    if(pane.classList.contains('active')) loadHealth();
  }, 60000);
}
startHealthAutoRefresh();
loadHealth();

// ── PIPELINE ───────────────────────────────────────────────────
function showResponse(msg, ok=true) {
  const box = document.getElementById('pipelineResponse');
  box.textContent = msg;
  box.style.color = ok ? '#a3e635' : '#f87171';
  box.classList.add('visible');
}

async function triggerCrawl() {
  showResponse('Triggering crawl for all countries…');
  try {
    const r = await fetch('/admin/api/crawl', {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerCrawlCC(cc) {
  showResponse(`Triggering crawl for ${cc}…`);
  try {
    const r = await fetch(`/admin/api/crawl/${cc}`, {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerRewrite() {
  showResponse('Triggering rewrite of pending articles…');
  try {
    const r = await fetch('/admin/api/rewrite', {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerResetRewrite(cc) {
  const label = cc ? `country=${cc}` : 'all articles';
  showResponse(`Resetting rewrites for ${label}, then triggering rewrite…`);
  try {
    const url = '/admin/api/reset-rewrites' + (cc ? `?country_code=${cc}` : '');
    const r1 = await fetch(url, {method:'POST'});
    const d1 = await r1.json();
    if(!r1.ok) { showResponse(JSON.stringify(d1, null, 2), false); return; }
    showResponse(`Reset done: ${JSON.stringify(d1)}\n\nTriggering rewrite…`);
    const r2 = await fetch('/admin/api/rewrite', {method:'POST'});
    const d2 = await r2.json();
    showResponse(`Reset: ${JSON.stringify(d1)}\nRewrite: ${JSON.stringify(d2)}`, r2.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

function triggerResetRewriteCC(cc) { triggerResetRewrite(cc); }

async function triggerResetSelectedToRaw() {
  showResponse('Resetting selected articles back to raw…');
  try {
    const r = await fetch('/admin/api/reset-selected-to-raw', {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerResetRewrittenToSelected() {
  showResponse('Resetting rewritten articles back to selected…');
  try {
    const r = await fetch('/admin/api/reset-rewritten-to-selected', {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerRetryFailed() {
  showResponse('Resetting failed articles to pending, then triggering rewrite…');
  try {
    const r1 = await fetch('/admin/api/reset-failed', {method:'POST'});
    const d1 = await r1.json();
    if(!r1.ok) { showResponse(JSON.stringify(d1, null, 2), false); return; }
    showResponse(`Reset ${d1.reset_count} failed articles.\n\nTriggering rewrite…`);
    const r2 = await fetch('/admin/api/rewrite', {method:'POST'});
    const d2 = await r2.json();
    showResponse(`Reset: ${JSON.stringify(d1)}\nRewrite: ${JSON.stringify(d2)}`, r2.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerCleanup() {
  showResponse('Deleting articles older than 7 days…');
  try {
    const r = await fetch('/admin/api/cleanup-old-articles', {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

async function triggerMigrateDates() {
  showResponse('Migrating RFC 2822 dates to ISO 8601…');
  try {
    const r = await fetch('/admin/api/migrate-dates', {method:'POST'});
    const d = await r.json();
    showResponse(JSON.stringify(d, null, 2), r.ok);
  } catch(e) { showResponse('Error: '+e.message, false); }
}

// ── ANALYTICS ──────────────────────────────────────────────────
let analyticsLoaded = false;

async function loadAnalytics() {
  if(analyticsLoaded) return;
  analyticsLoaded = true;
  try {
    const r = await fetch('/admin/api/analytics');
    if(!r.ok) throw new Error(r.statusText);
    const d = await r.json();

    document.getElementById('analyticsLoading').style.display='none';
    document.getElementById('analyticsContent').style.display='block';

    // Engagement cards
    const dropPct = d.drop_completion_rate != null
      ? d.drop_completion_rate.toFixed(1)+'%' : '—';
    document.getElementById('engagementCards').innerHTML = `
      <div class="card blue"><div class="card-label">Avg Streak</div><div class="card-value">${(d.avg_streak||0).toFixed(1)}</div><div class="card-sub">days</div></div>
      <div class="card green"><div class="card-label">Total Stories Read</div><div class="card-value">${(d.total_stories_read||0).toLocaleString()}</div></div>
      <div class="card yellow"><div class="card-label">Most Read Category</div><div class="card-value" style="font-size:16px;text-transform:capitalize">${d.most_read_category||'—'}</div></div>
      <div class="card purple"><div class="card-label">Today's Drop Complete</div><div class="card-value">${dropPct}</div><div class="card-sub">${d.drop_completed_today||0} of ${d.total_users||0} users</div></div>
    `;

    // Country chart
    const countryLabels = (d.country_breakdown||[]).map(x=>x._id||'Unknown');
    const countryData   = (d.country_breakdown||[]).map(x=>x.count);
    if(countryChartInst) countryChartInst.destroy();
    countryChartInst = new Chart(document.getElementById('countryChart'), {
      type:'bar',
      data:{labels:countryLabels,datasets:[{label:'Users',data:countryData,
        backgroundColor:'rgba(59,130,246,.7)',borderColor:'#3b82f6',borderWidth:1,borderRadius:4}]},
      options:{responsive:true,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}},
                y:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}}}}
    });

    // Age chart
    const ageLabels = (d.age_breakdown||[]).map(x=>x._id||'Unknown');
    const ageData   = (d.age_breakdown||[]).map(x=>x.count);
    if(ageChartInst) ageChartInst.destroy();
    ageChartInst = new Chart(document.getElementById('ageChart'), {
      type:'bar',
      data:{labels:ageLabels,datasets:[{label:'Users',data:ageData,
        backgroundColor:'rgba(167,139,250,.7)',borderColor:'#a78bfa',borderWidth:1,borderRadius:4}]},
      options:{responsive:true,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}},
                y:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}}}}
    });

    // Daily chart
    const dailyLabels = (d.daily_registrations||[]).map(x=>x._id);
    const dailyData   = (d.daily_registrations||[]).map(x=>x.count);
    if(dailyChartInst) dailyChartInst.destroy();
    dailyChartInst = new Chart(document.getElementById('dailyChart'), {
      type:'line',
      data:{labels:dailyLabels,datasets:[{label:'New Users',data:dailyData,
        fill:true,borderColor:'#34d399',backgroundColor:'rgba(52,211,153,.1)',
        tension:.3,pointRadius:3,pointBackgroundColor:'#34d399'}]},
      options:{responsive:true,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'#9ca3af',maxTicksLimit:10},grid:{color:'#1e2533'}},
                y:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}}}}
    });

    // Monthly chart
    const monthlyLabels = (d.monthly_registrations||[]).map(x=>x._id);
    const monthlyData   = (d.monthly_registrations||[]).map(x=>x.count);
    if(monthlyChartInst) monthlyChartInst.destroy();
    monthlyChartInst = new Chart(document.getElementById('monthlyChart'), {
      type:'bar',
      data:{labels:monthlyLabels,datasets:[{label:'New Users',data:monthlyData,
        backgroundColor:'rgba(251,191,36,.7)',borderColor:'#fbbf24',borderWidth:1,borderRadius:4}]},
      options:{responsive:true,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}},
                y:{ticks:{color:'#9ca3af'},grid:{color:'#1e2533'}}}}
    });

  } catch(e) {
    document.getElementById('analyticsLoading').innerHTML = `<span style="color:#f87171">Error: ${e.message}</span>`;
  }
}

// ── ARTICLES ───────────────────────────────────────────────────
async function loadArticles(page) {
  artPage = page;
  const country  = document.getElementById('artCountry').value;
  const category = document.getElementById('artCategory').value;
  const status   = document.getElementById('artStatus').value;
  const skip = (page-1)*PAGE_SIZE;

  document.getElementById('artBody').innerHTML =
    '<tr><td colspan="8" class="loading-row"><div class="spinner"></div></td></tr>';

  try {
    const params = new URLSearchParams({skip, limit:PAGE_SIZE});
    if(country) params.set('country', country);
    if(category) params.set('category', category);
    if(status) params.set('status', status);

    const r = await fetch('/admin/api/articles?'+params);
    if(!r.ok) throw new Error(r.statusText);
    const d = await r.json();

    document.getElementById('artCount').textContent = (d.total||0).toLocaleString();

    if(!d.articles || !d.articles.length) {
      document.getElementById('artBody').innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:30px;color:#6b7280">No articles found</td></tr>';
      document.getElementById('artPagination').innerHTML = '';
      return;
    }

    document.getElementById('artBody').innerHTML = d.articles.map(a => {
      const rs = a.rewrite_status||'pending';
      const ss = a.safety_status||'safe';
      const rsBadge = `<span class="badge-status badge-${rs}">${rs}</span>`;
      const ssBadge = `<span class="badge-status badge-${ss==='safe'?'safe':'flagged'}">${ss}</span>`;
      const bands = (a.age_bands||[]).join(', ')||'—';
      const pub = a.published_at ? new Date(a.published_at).toLocaleDateString() : '—';
      const title = (a.title||'').substring(0,80) + ((a.title||'').length>80?'…':'');
      const safeId = a.id.replace(/"/g,'');
      const safeTitle = (a.title||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return `<tr>
        <td title="${(a.title||'').replace(/"/g,'&quot;')}">${title}</td>
        <td style="text-transform:capitalize">${a.category||'—'}</td>
        <td>${a.source_country||'—'}</td>
        <td>${rsBadge}</td>
        <td>${ssBadge}</td>
        <td style="font-size:11px;color:#9ca3af">${bands}</td>
        <td style="font-size:11px;color:#6b7280">${pub}</td>
        <td><button class="btn-view-rewrites" onclick="viewRewrites('${safeId}','${safeTitle}')">View Rewrites</button></td>
      </tr>`;
    }).join('');

    renderPagination('artPagination', d.total, page, n=>loadArticles(n));
  } catch(e) {
    document.getElementById('artBody').innerHTML =
      `<tr><td colspan="8" style="color:#f87171;padding:20px">Error: ${e.message}</td></tr>`;
  }
}

// ── USERS ──────────────────────────────────────────────────────
function debounceUsers() {
  clearTimeout(userDebounceTimer);
  userDebounceTimer = setTimeout(()=>loadUsers(1), 350);
}

async function loadUsers(page) {
  userPage = page;
  const q = document.getElementById('userSearch').value.trim();
  const skip = (page-1)*PAGE_SIZE;

  document.getElementById('userBody').innerHTML =
    '<tr><td colspan="9" class="loading-row"><div class="spinner"></div></td></tr>';

  try {
    const params = new URLSearchParams({skip, limit:PAGE_SIZE});
    if(q) params.set('q', q);

    const r = await fetch('/admin/api/users?'+params);
    if(!r.ok) throw new Error(r.statusText);
    const d = await r.json();

    document.getElementById('userCount').textContent = (d.total||0).toLocaleString();

    if(!d.users || !d.users.length) {
      document.getElementById('userBody').innerHTML =
        '<tr><td colspan="9" style="text-align:center;padding:30px;color:#6b7280">No users found</td></tr>';
      document.getElementById('userPagination').innerHTML = '';
      return;
    }

    document.getElementById('userBody').innerHTML = d.users.map(u => {
      const joined = u.member_since || u.created_at
        ? new Date(u.member_since||u.created_at).toLocaleDateString() : '—';
      const last = u.last_read_date
        ? new Date(u.last_read_date).toLocaleDateString() : '—';
      return `<tr>
        <td style="font-weight:500">${u.username||'—'}</td>
        <td style="color:#9ca3af;font-size:12px">${u.email||'—'}</td>
        <td>${u.full_name||'—'}</td>
        <td>${u.country||'—'}</td>
        <td>${u.age_group||'—'}</td>
        <td style="color:#fbbf24">🔥 ${u.current_streak||0}</td>
        <td>${(u.stories_read_count||0).toLocaleString()}</td>
        <td style="font-size:11px;color:#6b7280">${joined}</td>
        <td style="font-size:11px;color:#6b7280">${last}</td>
      </tr>`;
    }).join('');

    renderPagination('userPagination', d.total, page, n=>loadUsers(n));
  } catch(e) {
    document.getElementById('userBody').innerHTML =
      `<tr><td colspan="9" style="color:#f87171;padding:20px">Error: ${e.message}</td></tr>`;
  }
}

// ── REWRITES MODAL ─────────────────────────────────────────────
const AGE_GROUPS = ['8-10','11-13','14-16','17-20'];

function switchRwTab(group) {
  document.querySelectorAll('.rw-tab').forEach((t,i)=>{
    t.classList.toggle('active', AGE_GROUPS[i]===group);
  });
  document.querySelectorAll('.rw-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('rwPane-'+group).classList.add('active');
}

function renderRewritePane(group, rw) {
  const pane = document.getElementById('rwPane-'+group);
  if(!rw || rw.status==='failed') {
    pane.innerHTML = `<div class="rw-empty">${rw && rw.status==='failed' ? 'Rewrite failed for this age group.' : 'Not yet rewritten.'}</div>`;
    return;
  }
  const bodyText = (rw.body||'').replace(/\n\n/g,'\n\n');
  pane.innerHTML = `
    <div class="rw-field">
      <div class="rw-field-label">Rewrite Status</div>
      <div class="rw-field-value"><span class="badge-status badge-${rw.status||'pending'}">${rw.status||'pending'}</span></div>
    </div>
    <div class="rw-field">
      <div class="rw-field-label">Title</div>
      <div class="rw-field-value">${escHtml(rw.title||'—')}</div>
    </div>
    <div class="rw-field">
      <div class="rw-field-label">Summary</div>
      <div class="rw-field-value">${escHtml(rw.summary||'—')}</div>
    </div>
    <div class="rw-field">
      <div class="rw-field-label">Body</div>
      <div class="rw-field-value body-text">${escHtml(rw.body||'—')}</div>
    </div>
    <div class="rw-field">
      <div class="rw-field-label">Wonder Question</div>
      <div class="rw-field-value">${escHtml(rw.wonder_question||'—')}</div>
    </div>
    <div class="rw-field">
      <div class="rw-field-label">Reading Time</div>
      <div class="rw-field-value">${rw.reading_time!=null ? rw.reading_time+' min' : '—'}</div>
    </div>
  `;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function viewRewrites(articleId, articleTitle) {
  document.getElementById('rwArticleTitle').textContent = articleTitle || 'Rewrites';
  const linkEl = document.getElementById('rwOriginalLink');
  linkEl.style.display = 'none';
  AGE_GROUPS.forEach(g => {
    document.getElementById('rwPane-'+g).innerHTML =
      '<div class="loading-row"><div class="spinner"></div></div>';
  });
  switchRwTab('8-10');
  document.getElementById('rwOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const r = await fetch(`/admin/api/articles/${articleId}/rewrites`);
    if(!r.ok) throw new Error(r.statusText);
    const d = await r.json();
    const rewrites = d.rewrites || {};
    AGE_GROUPS.forEach(g => renderRewritePane(g, rewrites[g]||null));
    if(d.original_url) {
      linkEl.href = d.original_url;
      linkEl.style.display = 'inline-block';
    }
  } catch(e) {
    AGE_GROUPS.forEach(g => {
      document.getElementById('rwPane-'+g).innerHTML =
        `<div class="rw-empty" style="color:#f87171">Error: ${e.message}</div>`;
    });
  }
}

function closeRewriteModal(event) {
  if(event && event.target !== document.getElementById('rwOverlay')) return;
  document.getElementById('rwOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── PAGINATION ─────────────────────────────────────────────────
function renderPagination(containerId, total, current, onPage) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if(totalPages <= 1) { document.getElementById(containerId).innerHTML=''; return; }
  let html = `<span class="page-info">Page ${current} of ${totalPages}</span>`;
  if(current>1) html += `<button class="page-btn" onclick="(${onPage.toString()})(${current-1})">‹ Prev</button>`;
  // Show page window
  const start = Math.max(1, current-2);
  const end   = Math.min(totalPages, current+2);
  for(let i=start;i<=end;i++) {
    html += `<button class="page-btn${i===current?' active':''}" onclick="(${onPage.toString()})(${i})">${i}</button>`;
  }
  if(current<totalPages) html += `<button class="page-btn" onclick="(${onPage.toString()})(${current+1})">Next ›</button>`;
  document.getElementById(containerId).innerHTML = html;
}
</script>
</body>
</html>"""


# ── ROUTES ─────────────────────────────────────────────────────

@admin_router.get("/login", response_class=HTMLResponse)
async def admin_login_get(request: Request):
    if _is_auth(request):
        return RedirectResponse("/admin", status_code=302)
    return HTMLResponse(_LOGIN_HTML.format(error=""))


@admin_router.post("/login")
async def admin_login_post(request: Request, password: str = Form(...)):
    if hmac.compare_digest(password, _admin_password):
        resp = RedirectResponse("/admin", status_code=302)
        resp.set_cookie(
            "admin_session", _make_token(),
            max_age=86400, httponly=True, samesite="lax"
        )
        return resp
    return HTMLResponse(_LOGIN_HTML.format(error='<p class="err">Incorrect password</p>'))


@admin_router.post("/logout")
async def admin_logout():
    resp = RedirectResponse("/admin/login", status_code=302)
    resp.delete_cookie("admin_session")
    return resp


@admin_router.get("", response_class=HTMLResponse)
@admin_router.get("/", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    if not _is_auth(request):
        return RedirectResponse("/admin/login", status_code=302)
    return HTMLResponse(_DASHBOARD_HTML)


# ── API: HEALTH ─────────────────────────────────────────────────

@admin_router.get("/api/health")
async def admin_api_health(request: Request):
    _require_api_auth(request)
    health = {}
    user_count = 0
    jobs = []
    try:
        article_count = await _db["articles"].count_documents({})
        user_count = await _db["users"].count_documents({})
        health = {
            "status": "ok",
            "article_count": article_count,
            "version": "2.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        health = {"status": "error", "detail": str(e)}

    # Attempt to get scheduler jobs if available
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        import server as _server
        sched = getattr(_server, "scheduler", None)
        if sched:
            for job in sched.get_jobs():
                nr = job.next_run_time
                jobs.append({
                    "id": job.id,
                    "next_run": nr.strftime("%Y-%m-%d %H:%M:%S UTC") if nr else "paused",
                })
    except Exception:
        pass

    return JSONResponse({"health": health, "user_count": user_count, "jobs": jobs})


# ── API: ANALYTICS ──────────────────────────────────────────────

@admin_router.get("/api/analytics")
async def admin_api_analytics(request: Request):
    _require_api_auth(request)

    # Country breakdown (full country names stored in users.country)
    country_pipeline = [
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]

    # Age band breakdown
    age_pipeline = [
        {"$group": {"_id": "$age_group", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]

    # Daily registrations — last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
    ]

    # Monthly registrations — last 12 months
    twelve_months_ago = datetime.now(timezone.utc) - timedelta(days=365)
    monthly_pipeline = [
        {"$match": {"created_at": {"$gte": twelve_months_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
    ]

    # Engagement: avg streak, total stories read
    engagement_pipeline = [
        {"$group": {
            "_id": None,
            "avg_streak": {"$avg": "$current_streak"},
            "total_stories": {"$sum": "$stories_read_count"},
        }}
    ]

    # Most read category — by counting articles with rewrites (proxy for reads)
    # Count articles per category where rewrite_status=done as proxy
    category_pipeline = [
        {"$match": {"rewrite_status": "done"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]

    # Today's Drop completion rate
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    total_users = 0
    drop_completed_today = 0

    try:
        results = await asyncio.gather(
            _db["users"].aggregate(country_pipeline).to_list(length=20),
            _db["users"].aggregate(age_pipeline).to_list(length=20),
            _db["users"].aggregate(daily_pipeline).to_list(length=31),
            _db["users"].aggregate(monthly_pipeline).to_list(length=12),
            _db["users"].aggregate(engagement_pipeline).to_list(length=1),
            _db["articles"].aggregate(category_pipeline).to_list(length=1),
            _db["users"].count_documents({}),
            _db["daily_drop_progress"].count_documents({"date": today_str}),
        )
        country_bd, age_bd, daily_reg, monthly_reg, eng, top_cat, total_users, drop_today_total = results

        # Users who completed all 5 today's drop articles
        drop_completed_today = await _db["daily_drop_progress"].count_documents({
            "date": today_str,
            "articles": {"$size": 5},
        })

        avg_streak = eng[0]["avg_streak"] if eng else 0
        total_stories = eng[0]["total_stories"] if eng else 0
        most_read_category = top_cat[0]["_id"] if top_cat else "—"

        drop_rate = (drop_completed_today / total_users * 100) if total_users > 0 else 0

        return JSONResponse({
            "country_breakdown": country_bd,
            "age_breakdown": age_bd,
            "daily_registrations": daily_reg,
            "monthly_registrations": monthly_reg,
            "avg_streak": round(avg_streak or 0, 2),
            "total_stories_read": total_stories or 0,
            "most_read_category": most_read_category,
            "total_users": total_users,
            "drop_completed_today": drop_completed_today,
            "drop_completion_rate": round(drop_rate, 1),
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── API: ARTICLES ───────────────────────────────────────────────

@admin_router.get("/api/articles")
async def admin_api_articles(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    country: str = "",
    category: str = "",
    status: str = "",
):
    _require_api_auth(request)
    query = {}
    if country:
        query["source_country"] = country
    if category:
        query["category"] = category
    if status:
        query["rewrite_status"] = status

    try:
        total = await _db["articles"].count_documents(query)
        cursor = _db["articles"].find(
            query,
            {"original_title": 1, "category": 1, "source_country": 1,
             "rewrite_status": 1, "safety_status": 1, "rewrites": 1, "published_at": 1}
        ).sort("published_at", -1).skip(skip).limit(limit)
        raw = await cursor.to_list(length=limit)

        articles = []
        for a in raw:
            articles.append({
                "id": str(a.get("_id", "")),
                "title": a.get("original_title", ""),
                "category": a.get("category", ""),
                "source_country": a.get("source_country", ""),
                "rewrite_status": a.get("rewrite_status", "pending"),
                "safety_status": a.get("safety_status", "safe"),
                "age_bands": list((a.get("rewrites") or {}).keys()),
                "published_at": a.get("published_at", "").isoformat() if hasattr(a.get("published_at", ""), "isoformat") else str(a.get("published_at", "")),
            })

        return JSONResponse({"total": total, "articles": articles})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── API: ARTICLE REWRITES ───────────────────────────────────────

@admin_router.get("/api/articles/{article_id}/rewrites")
async def admin_api_article_rewrites(request: Request, article_id: str):
    _require_api_auth(request)
    from bson import ObjectId
    try:
        oid = ObjectId(article_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID")
    try:
        doc = await _db["articles"].find_one({"_id": oid}, {"rewrites": 1, "original_title": 1, "original_url": 1})
        if not doc:
            raise HTTPException(status_code=404, detail="Article not found")
        return JSONResponse({"rewrites": doc.get("rewrites") or {}, "original_url": doc.get("original_url") or ""})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── API: USERS ──────────────────────────────────────────────────

@admin_router.get("/api/users")
async def admin_api_users(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    q: str = "",
):
    _require_api_auth(request)
    query = {}
    if q:
        query["$or"] = [
            {"username": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]

    try:
        total = await _db["users"].count_documents(query)
        cursor = _db["users"].find(
            query,
            {"username": 1, "email": 1, "full_name": 1, "country": 1, "age_group": 1,
             "current_streak": 1, "stories_read_count": 1, "member_since": 1,
             "created_at": 1, "last_read_date": 1}
        ).sort("created_at", -1).skip(skip).limit(limit)
        raw = await cursor.to_list(length=limit)

        def _fmt_date(val):
            if val is None:
                return None
            if hasattr(val, "isoformat"):
                return val.isoformat()
            return str(val)

        users = []
        for u in raw:
            users.append({
                "username": u.get("username", ""),
                "email": u.get("email", ""),
                "full_name": u.get("full_name", ""),
                "country": u.get("country", ""),
                "age_group": u.get("age_group", ""),
                "current_streak": u.get("current_streak", 0),
                "stories_read_count": u.get("stories_read_count", 0),
                "member_since": _fmt_date(u.get("member_since")),
                "created_at": _fmt_date(u.get("created_at")),
                "last_read_date": _fmt_date(u.get("last_read_date")),
            })

        return JSONResponse({"total": total, "users": users})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── API: PIPELINE TRIGGERS ──────────────────────────────────────

@admin_router.post("/api/cleanup-old-articles")
async def admin_api_cleanup_old_articles(request: Request):
    _require_api_auth(request)
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        result = await _db["articles"].delete_many({"published_at": {"$lt": cutoff}})
        return JSONResponse({"ok": True, "deleted_count": result.deleted_count})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/api/migrate-dates")
async def admin_api_migrate_dates(request: Request):
    _require_api_auth(request)
    from email.utils import parsedate_to_datetime
    try:
        cursor = _db["articles"].find(
            {"published_at": {"$regex": r",.*(\+\d{4}|GMT)"}},
            {"_id": 1, "published_at": 1},
        )
        docs = await cursor.to_list(length=None)
        migrated = 0
        errors = 0
        for doc in docs:
            try:
                iso = parsedate_to_datetime(doc["published_at"]).astimezone(
                    timezone.utc
                ).isoformat()
                await _db["articles"].update_one(
                    {"_id": doc["_id"]}, {"$set": {"published_at": iso}}
                )
                migrated += 1
            except Exception:
                errors += 1
        return JSONResponse({"ok": True, "migrated": migrated, "errors": errors})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/api/reset-failed")
async def admin_api_reset_failed(request: Request):
    _require_api_auth(request)
    try:
        result = await _db["articles"].update_many(
            {"rewrite_status": "failed"},
            {"$set": {"rewrites": {}, "rewrite_status": "pending"}},
        )
        return JSONResponse({"ok": True, "reset_count": result.modified_count})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/api/reset-selected-to-raw")
async def admin_api_reset_selected_to_raw(request: Request):
    _require_api_auth(request)
    try:
        result = await _db["articles"].update_many(
            {"rewrite_status": "selected"},
            {"$set": {"rewrite_status": "raw", "rewrites": {}}},
        )
        return JSONResponse({"ok": True, "reset_count": result.modified_count})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/api/reset-rewritten-to-selected")
async def admin_api_reset_rewritten_to_selected(request: Request):
    _require_api_auth(request)
    try:
        result = await _db["articles"].update_many(
            {"rewrite_status": "rewritten"},
            {"$set": {"rewrite_status": "selected", "rewrites": {}}},
        )
        return JSONResponse({"ok": True, "reset_count": result.modified_count})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/api/reset-rewrites")
async def admin_api_reset_rewrites(request: Request, country_code: str = ""):
    _require_api_auth(request)
    query = {}
    if country_code:
        query["source_country"] = country_code.upper()
    try:
        result = await _db["articles"].update_many(
            query,
            {"$set": {"rewrites": {}, "rewrite_status": "pending"}}
        )
        return JSONResponse({
            "ok": True,
            "reset_count": result.modified_count,
            "country": country_code.upper() if country_code else "ALL",
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/api/crawl")
async def admin_api_crawl(request: Request):
    _require_api_auth(request)
    fn = _fns.get("crawl")
    if not fn:
        raise HTTPException(status_code=503, detail="Crawl function not registered")
    try:
        result = await fn()
        return JSONResponse({"ok": True, "result": result})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@admin_router.post("/api/crawl/{country_code}")
async def admin_api_crawl_cc(request: Request, country_code: str):
    _require_api_auth(request)
    fn = _fns.get("crawl")
    if not fn:
        raise HTTPException(status_code=503, detail="Crawl function not registered")
    try:
        result = await fn(country_code=country_code.upper())
        return JSONResponse({"ok": True, "country": country_code.upper(), "result": result})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@admin_router.post("/api/rewrite")
async def admin_api_rewrite(request: Request):
    _require_api_auth(request)
    fn = _fns.get("rewrite")
    if not fn:
        raise HTTPException(status_code=503, detail="Rewrite function not registered")
    try:
        await asyncio.gather(
            fn("8-10"),
            fn("11-13"),
            fn("14-16"),
            fn("17-20"),
        )
        return JSONResponse({"ok": True, "result": "Rewrites complete for all age groups"})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)
