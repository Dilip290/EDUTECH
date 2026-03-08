/* ============================================================
   EduTech – Live Classes Manager v1.0
   Admin: Post/Edit live class sessions with meeting links
   Students: See and join live sessions
   ============================================================ */

// ─── Admin Live Classes Management ───────────────────────────

function renderAdminLiveClasses(act) {
    const sessions = getLiveSessions();
    act.innerHTML = `
  <style>
    .lc-card{background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:1.5rem;margin-bottom:0.75rem;transition:border-color 0.2s;}
    .lc-card:hover{border-color:rgba(124,58,237,0.3);}
    .lc-card.live-now{border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.04);}
    .lc-badge-live{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:2px 8px;border-radius:99px;font-size:0.65rem;font-weight:800;text-transform:uppercase;}
    .lc-badge-live::before{content:'';width:6px;height:6px;border-radius:50%;background:#ef4444;animation:pulse 1s infinite;}
    .lc-badge-upcoming{display:inline-flex;align-items:center;gap:5px;background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);padding:2px 8px;border-radius:99px;font-size:0.65rem;font-weight:800;}
    .lc-action-btn{padding:7px 14px;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:var(--font);border:none;transition:opacity 0.2s;}
    .lc-action-btn:hover{opacity:0.85;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  </style>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
    <div>
      <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.2rem;">📹 Live Class Manager</h2>
      <p style="color:var(--text3);font-size:0.82rem;">${sessions.length} session${sessions.length === 1 ? '' : 's'} configured</p>
    </div>
    <button onclick="openAddLiveClassModal()" style="padding:10px 20px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:8px;">
      🔴 Schedule Live Class
    </button>
  </div>

  ${sessions.length === 0 ? `
  <div style="text-align:center;padding:4rem;background:var(--card);border:1px solid var(--border2);border-radius:20px;">
    <div style="font-size:3rem;margin-bottom:1rem;">📹</div>
    <h3 style="font-weight:800;margin-bottom:0.5rem;">No Live Classes Scheduled</h3>
    <p style="color:var(--text3);font-size:0.85rem;margin-bottom:1.5rem;">Click "Schedule Live Class" to add your first session.<br>Students will instantly see it with a Join Now button.</p>
    <button onclick="openAddLiveClassModal()" style="padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-family:var(--font);">+ Schedule First Class</button>
  </div>` : `
  <div style="display:grid;gap:0.75rem;">
    ${sessions.map((s, i) => `
    <div class="lc-card ${s.isLive ? 'live-now' : ''}">
      <div style="display:flex;align-items:flex-start;gap:1rem;">
        <div style="padding:1rem;border-radius:14px;background:${s.isLive ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)'};flex-shrink:0;">
          <span style="font-size:1.5rem;">${s.emoji || '📹'}</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;flex-wrap:wrap;">
            <span class="${s.isLive ? 'lc-badge-live' : 'lc-badge-upcoming'}">${s.isLive ? 'LIVE NOW' : 'UPCOMING'}</span>
            <h3 style="font-weight:800;font-size:0.95rem;margin:0;">${s.title}</h3>
          </div>
          <div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.3rem;">📚 ${s.courseName || 'General'} · 👨‍🏫 ${s.instructor || 'Instructor'} · ⏱ ${s.duration || '60 min'}</div>
          <div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem;">📅 ${s.scheduledTime || 'TBD'}</div>
          ${s.description ? `<div style="font-size:0.8rem;color:var(--text2);margin-bottom:0.75rem;">${s.description}</div>` : ''}
          <div style="display:flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.03);border:1px solid var(--border2);border-radius:8px;padding:0.5rem 0.75rem;">
            <span style="font-size:0.7rem;color:var(--text3);">🔗 Meeting Link:</span>
            <span style="font-size:0.75rem;color:#a78bfa;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${s.meetLink || 'Not set'}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;flex-shrink:0;">
          <button onclick="editLiveClass(${i})" class="lc-action-btn" style="background:rgba(124,58,237,0.12);color:#a78bfa;">✏️ Edit</button>
          <button onclick="toggleLiveStatus(${i})" class="lc-action-btn" style="background:${s.isLive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'};color:${s.isLive ? '#ef4444' : '#10b981'};">
            ${s.isLive ? '⏹ End Live' : '▶ Go Live'}
          </button>
          <button onclick="deleteLiveClass(${i})" class="lc-action-btn" style="background:rgba(239,68,68,0.08);color:#ef4444;">🗑</button>
        </div>
      </div>
    </div>`).join('')}
  </div>`}`;
}

function getLiveSessions() {
    return JSON.parse(localStorage.getItem('edutech_live_sessions') || '[]');
}

function saveLiveSessions(sessions) {
    localStorage.setItem('edutech_live_sessions', JSON.stringify(sessions));
}

function openAddLiveClassModal() {
    showModal(`
    <h2 style="font-weight:800;margin-bottom:1.25rem;">🔴 Schedule Live Class</h2>
    <div style="display:grid;gap:0.75rem;">
      <div>
        <label class="ml">Class Title *</label>
        <input id="lc-title" class="mi" placeholder="e.g. React Hooks Deep Dive — Live Q&A"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <label class="ml">Related Course</label>
          <select id="lc-course" class="mi">
            <option value="">-- Select Course --</option>
            ${COURSES_DATA.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
            <option value="general">General / All Students</option>
          </select>
        </div>
        <div>
          <label class="ml">Instructor Name</label>
          <input id="lc-inst" class="mi" placeholder="e.g. Rahul Sharma"/>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <label class="ml">Scheduled Date & Time *</label>
          <input id="lc-time" type="datetime-local" class="mi" style="color:var(--text);color-scheme:dark;"/>
        </div>
        <div>
          <label class="ml">Duration</label>
          <select id="lc-dur" class="mi">
            <option>30 min</option><option selected>60 min</option><option>90 min</option><option>2 hours</option><option>3 hours</option>
          </select>
        </div>
      </div>
      <div>
        <label class="ml">Meeting Link * (Zoom / Google Meet / Teams)</label>
        <input id="lc-link" class="mi" placeholder="https://meet.google.com/xxx-xxxx-xxx  or  https://zoom.us/j/..."/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <label class="ml">Session Emoji</label>
          <input id="lc-emoji" class="mi" value="📹" style="font-size:1.2rem;"/>
        </div>
        <div>
          <label class="ml">Status</label>
          <select id="lc-status" class="mi">
            <option value="false">Upcoming (Not live yet)</option>
            <option value="true">Live Now</option>
          </select>
        </div>
      </div>
      <div>
        <label class="ml">Description (optional)</label>
        <textarea id="lc-desc" class="mi" rows="2" placeholder="What will be covered in this session?"></textarea>
      </div>
    </div>
    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Cancel</button>
      <button onclick="saveLiveClass()" style="flex:2;padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">🔴 Schedule Class</button>
    </div>
  `);
}

function saveLiveClass() {
    const title = document.getElementById('lc-title').value.trim();
    const link = document.getElementById('lc-link').value.trim();
    if (!title) { showToast('Title is required', 'error'); return; }
    if (!link) { showToast('Meeting link is required', 'error'); return; }

    const courseId = document.getElementById('lc-course').value;
    const course = COURSES_DATA.find(c => c.id == courseId);
    const timeVal = document.getElementById('lc-time').value;
    const scheduledTime = timeVal ? new Date(timeVal).toLocaleString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD';

    const sessions = getLiveSessions();
    sessions.unshift({
        id: Date.now(),
        title,
        courseName: course ? course.title : (courseId === 'general' ? 'All Students' : 'General'),
        courseId: courseId || 'general',
        instructor: document.getElementById('lc-inst').value.trim() || 'Admin',
        scheduledTime,
        scheduledTimeRaw: timeVal,
        duration: document.getElementById('lc-dur').value,
        meetLink: link,
        emoji: document.getElementById('lc-emoji').value || '📹',
        isLive: document.getElementById('lc-status').value === 'true',
        description: document.getElementById('lc-desc').value.trim(),
        createdAt: new Date().toISOString()
    });
    saveLiveSessions(sessions);
    closeModal();
    showToast('✅ Live class scheduled! Students can now see it.', 'success');
    handleRoute();
}

function editLiveClass(idx) {
    const sessions = getLiveSessions();
    const s = sessions[idx];
    if (!s) return;
    showModal(`
    <h2 style="font-weight:800;margin-bottom:1.25rem;">✏️ Edit Live Class</h2>
    <div style="display:grid;gap:0.75rem;">
      <div>
        <label class="ml">Class Title *</label>
        <input id="lce-title" class="mi" value="${s.title}"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <label class="ml">Instructor Name</label>
          <input id="lce-inst" class="mi" value="${s.instructor}"/>
        </div>
        <div>
          <label class="ml">Duration</label>
          <select id="lce-dur" class="mi">
            <option ${s.duration === '30 min' ? 'selected' : ''}>30 min</option>
            <option ${s.duration === '60 min' ? 'selected' : ''}>60 min</option>
            <option ${s.duration === '90 min' ? 'selected' : ''}>90 min</option>
            <option ${s.duration === '2 hours' ? 'selected' : ''}>2 hours</option>
            <option ${s.duration === '3 hours' ? 'selected' : ''}>3 hours</option>
          </select>
        </div>
      </div>
      <div>
        <label class="ml">Meeting Link *</label>
        <input id="lce-link" class="mi" value="${s.meetLink}"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <label class="ml">Schedule Date & Time</label>
          <input id="lce-time" type="datetime-local" class="mi" value="${s.scheduledTimeRaw || ''}" style="color:var(--text);color-scheme:dark;"/>
        </div>
        <div>
          <label class="ml">Status</label>
          <select id="lce-status" class="mi">
            <option value="false" ${!s.isLive ? 'selected' : ''}>Upcoming</option>
            <option value="true" ${s.isLive ? 'selected' : ''}>Live Now</option>
          </select>
        </div>
      </div>
      <div>
        <label class="ml">Description</label>
        <textarea id="lce-desc" class="mi" rows="2">${s.description || ''}</textarea>
      </div>
    </div>
    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Cancel</button>
      <button onclick="updateLiveClass(${idx})" style="flex:2;padding:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">💾 Save Changes</button>
    </div>
  `);
}

function updateLiveClass(idx) {
    const sessions = getLiveSessions();
    if (!sessions[idx]) return;
    const timeVal = document.getElementById('lce-time').value;
    const scheduledTime = timeVal ? new Date(timeVal).toLocaleString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : sessions[idx].scheduledTime;
    sessions[idx] = {
        ...sessions[idx],
        title: document.getElementById('lce-title').value.trim(),
        instructor: document.getElementById('lce-inst').value.trim(),
        duration: document.getElementById('lce-dur').value,
        meetLink: document.getElementById('lce-link').value.trim(),
        scheduledTime,
        scheduledTimeRaw: timeVal,
        isLive: document.getElementById('lce-status').value === 'true',
        description: document.getElementById('lce-desc').value.trim()
    };
    saveLiveSessions(sessions);
    closeModal();
    showToast('✅ Live class updated!', 'success');
    handleRoute();
}

function toggleLiveStatus(idx) {
    const sessions = getLiveSessions();
    if (!sessions[idx]) return;
    sessions[idx].isLive = !sessions[idx].isLive;
    saveLiveSessions(sessions);
    showToast(sessions[idx].isLive ? '🔴 Session is now LIVE! Students can join.' : '✅ Session ended.', sessions[idx].isLive ? 'error' : 'success');
    handleRoute();
}

function deleteLiveClass(idx) {
    if (!confirm('Delete this live class session?')) return;
    const sessions = getLiveSessions();
    sessions.splice(idx, 1);
    saveLiveSessions(sessions);
    handleRoute();
    showToast('Live class session deleted.', 'info');
}
