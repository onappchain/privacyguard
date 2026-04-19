const state = {
  targets: [],
  queue: [],
  audit: [],
  selectedTarget: null,
  lastJob: null
};

const el = {
  targetSelect: document.getElementById('targetId'),
  requestType: document.getElementById('requestType'),
  residentState: document.getElementById('residentState'),
  companyName: document.getElementById('companyName'),
  privacyEmail: document.getElementById('privacyEmail'),
  userName: document.getElementById('userName'),
  userEmail: document.getElementById('userEmail'),
  notes: document.getElementById('notes'),
  targetInfo: document.getElementById('targetInfo'),
  form: document.getElementById('intakeForm'),
  formMessage: document.getElementById('formMessage'),
  results: document.getElementById('results'),
  queueList: document.getElementById('queueList'),
  auditList: document.getElementById('auditList'),
  queueCount: document.getElementById('queueCount'),
  targetCount: document.getElementById('targetCount'),
  preparedCount: document.getElementById('preparedCount'),
  refreshBtn: document.getElementById('refreshBtn')
};

async function request(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
}

function renderTargetOptions() {
  el.targetSelect.innerHTML = state.targets.map((target) => {
    return `<option value="${target.id}">${target.name}</option>`;
  }).join('');
  state.selectedTarget = state.targets[0] || null;
  if (state.selectedTarget) {
    el.targetSelect.value = state.selectedTarget.id;
    renderTargetInfo();
  }
}

function renderTargetInfo() {
  const target = state.targets.find((item) => item.id === el.targetSelect.value);
  state.selectedTarget = target || null;
  if (!target) {
    el.targetInfo.innerHTML = '<div class="muted">No target selected.</div>';
    return;
  }
  el.targetInfo.innerHTML = `
    <div class="kv-item"><div><strong>${target.name}</strong><br /><small>${target.notes || ''}</small></div><span class="badge">${target.automationLevel || target.status || 'unknown'}</span></div>
    <div class="kv-item"><div><small>Mode</small><br /><strong>${target.mode}</strong></div><div><small>Supports</small><br /><strong>${(target.supports || []).join(', ')}</strong></div></div>
  `;
}

function renderResults() {
  if (!state.lastJob) {
    el.results.innerHTML = '<div class="muted">Submit a request to see the prepared workflow here.</div>';
    return;
  }
  const job = state.lastJob;
  const nextSteps = (job.result?.nextSteps || []).map((step) => `<li>${step}</li>`).join('');
  el.results.innerHTML = `
    <div class="list-card">
      <h4>Job ${job.id.slice(0, 8)} prepared</h4>
      <p>${job.result?.message || 'Prepared successfully.'}</p>
      <div class="list-meta">
        <span class="badge">${job.status}</span>
        <span class="badge">${job.result?.automationLevel || 'unknown'}</span>
        <span class="badge">${job.targetId}</span>
      </div>
      <ul>${nextSteps}</ul>
      ${job.result?.actionUrl ? `<p><a href="${job.result.actionUrl}" target="_blank" rel="noreferrer">Open action link</a></p>` : ''}
      <div class="code">${escapeHtml(JSON.stringify(job, null, 2))}</div>
    </div>
  `;
}

function renderQueue() {
  el.queueCount.textContent = String(state.queue.length);
  const prepared = state.queue.filter((item) => item.status === 'prepared').length;
  el.preparedCount.textContent = String(prepared);
  if (!state.queue.length) {
    el.queueList.innerHTML = '<div class="muted">No jobs yet.</div>';
    return;
  }
  el.queueList.innerHTML = state.queue.slice().reverse().map((job) => `
    <div class="list-card">
      <h4>${job.payload?.user?.name || 'User'} - ${job.targetId}</h4>
      <p>${job.result?.message || 'Queued request.'}</p>
      <div class="list-meta">
        <span class="badge">${job.status}</span>
        <span class="badge">${job.requestType}</span>
      </div>
    </div>
  `).join('');
}

function renderAudit() {
  if (!state.audit.length) {
    el.auditList.innerHTML = '<div class="muted">No audit events yet.</div>';
    return;
  }
  el.auditList.innerHTML = state.audit.slice().reverse().slice(0, 8).map((item) => `
    <div class="list-card">
      <h4>${item.event}</h4>
      <p>${new Date(item.at).toLocaleString()}</p>
      <div class="code">${escapeHtml(JSON.stringify(item.details, null, 2))}</div>
    </div>
  `).join('');
}

function renderStats() {
  el.targetCount.textContent = String(state.targets.length);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function loadAll() {
  const [targetsRes, queueRes, auditRes] = await Promise.all([
    request('/api/targets'),
    request('/api/queue'),
    request('/api/audit')
  ]);
  state.targets = targetsRes.targets || [];
  state.queue = queueRes.jobs || [];
  state.audit = auditRes.audit || [];
  renderTargetOptions();
  renderStats();
  renderQueue();
  renderAudit();
  renderResults();
}

el.targetSelect.addEventListener('change', renderTargetInfo);
el.refreshBtn.addEventListener('click', async () => {
  el.refreshBtn.disabled = true;
  try {
    await loadAll();
  } finally {
    el.refreshBtn.disabled = false;
  }
});

el.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  el.formMessage.className = 'message';
  el.formMessage.textContent = 'Preparing request...';
  const payload = {
    targetId: el.targetSelect.value,
    requestType: el.requestType.value,
    companyName: el.companyName.value.trim(),
    privacyEmail: el.privacyEmail.value.trim(),
    notes: el.notes.value.trim(),
    user: {
      name: el.userName.value.trim(),
      email: el.userEmail.value.trim(),
      state: el.residentState.value.trim()
    }
  };
  try {
    const data = await request('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    state.lastJob = data.job;
    el.formMessage.className = 'message success';
    el.formMessage.textContent = 'Request prepared. Review the next steps and audit trail below.';
    await loadAll();
    state.lastJob = data.job;
    renderResults();
  } catch (error) {
    el.formMessage.className = 'message error';
    el.formMessage.textContent = 'Submission failed. Check required fields and try again.';
  }
});

loadAll().catch(() => {
  el.formMessage.className = 'message error';
  el.formMessage.textContent = 'Could not load backend data. Verify the backend is reachable.';
});
