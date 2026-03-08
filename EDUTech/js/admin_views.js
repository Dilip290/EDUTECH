/* ============================================================
   EduTech – Admin Views v2.0
   Overview Analytics · Profile w/ Photo · Course CRUD w/ Lessons
   ============================================================ */

// ─── Overview ────────────────────────────────────────────────
function renderAdminOverview(act) {
  const pending = JSON.parse(localStorage.getItem('edutech_pending_enrollments_global') || '[]');
  const totalRev = students.reduce((acc, s) => {
    const sc = JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]');
    return acc + sc.reduce((a, cid) => a + (COURSES_DATA.find(c => c.id === cid)?.price || 0), 0);
  }, 0);
  const enrolled = students.filter(s => (JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]')).length > 0).length;

  act.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;">
      ${[
      { icon: '👥', val: students.length, label: 'Total Students', color: '#7c3aed' },
      { icon: '📚', val: COURSES_DATA.length, label: 'Courses', color: '#2563eb' },
      { icon: '💰', val: '₹' + totalRev, label: 'Revenue', color: '#059669' },
      { icon: '⏳', val: pending.length, label: 'Pending', color: '#d97706' }
    ].map(s => `
        <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:1.25rem;">
          <div style="font-size:1.5rem;margin-bottom:0.5rem;">${s.icon}</div>
          <div style="font-size:1.6rem;font-weight:800;color:${s.color};">${s.val}</div>
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px;">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Enrollment Chart -->
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:1.5rem;margin-bottom:1.25rem;">
      <h3 style="font-weight:800;margin-bottom:1.25rem;">📊 Course Enrollment Analytics</h3>
      <div style="display:grid;gap:0.75rem;">
        ${COURSES_DATA.map(c => {
      const cnt = students.filter(s => (JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]')).includes(c.id)).length;
      const pct = students.length > 0 ? Math.round(cnt / Math.max(students.length, 1) * 100) : 0;
      return `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px;">
              <span style="font-weight:600;">${c.emoji} ${c.title}</span>
              <span style="color:var(--accent2);font-weight:700;">${cnt} students (${pct}%)</span>
            </div>
            <div style="background:rgba(255,255,255,0.06);height:10px;border-radius:99px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:99px;"></div>
            </div>
          </div>`;
    }).join('')}
      </div>
    </div>

    <!-- Recent Students -->
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:1.5rem;">
      <h3 style="font-weight:800;margin-bottom:1rem;">Recent Registrations</h3>
      ${students.length === 0 ? `<div style="text-align:center;padding:2rem;color:var(--text3);">No students yet.</div>` : `
      <table style="width:100%;border-collapse:collapse;font-size:0.83rem;">
        <thead><tr style="text-align:left;border-bottom:1px solid var(--border2);">
          <th style="padding:8px 10px;">Student</th><th style="padding:8px 10px;">College</th><th style="padding:8px 10px;">Enrolled</th><th style="padding:8px 10px;">Joined</th>
        </tr></thead>
        <tbody>${students.slice(-5).reverse().map(s => {
      const ec = (JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]')).length;
      return `<tr style="border-bottom:1px solid var(--border2);">
            <td style="padding:10px;"><div style="font-weight:700;">${s.name}</div><div style="font-size:0.72rem;color:var(--text3);">${s.email}</div></td>
            <td style="padding:10px;color:var(--text3);">${s.college || '—'}</td>
            <td style="padding:10px;"><span style="background:rgba(16,185,129,0.1);color:#10b981;padding:2px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;">${ec} course${ec !== 1 ? 's' : ''}</span></td>
            <td style="padding:10px;color:var(--text3);">${formatDate(s.registerDate)}</td>
          </tr>`;
    }).join('')}</tbody>
      </table>`}
    </div>`;
}

// ─── Courses ─────────────────────────────────────────────────
function renderAdminCourses(act) {
  act.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
      <div><h2 style="font-size:1.15rem;font-weight:800;">Course Management</h2><p style="color:var(--text3);font-size:0.8rem;">Add, edit and manage courses & lessons</p></div>
      <button onclick="openAddCourseModal()" style="padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">+ Add Course</button>
    </div>
    <div style="display:grid;gap:1rem;">
      ${COURSES_DATA.map(c => `
        <div style="background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:1.25rem;">
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
            <div style="font-size:1.8rem;">${c.emoji}</div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:0.95rem;">${c.title}</div>
              <div style="font-size:0.75rem;color:var(--text3);">${c.category} · ${c.lessons.length} lessons · ${c.isFree ? 'Free' : '₹' + c.price}</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button onclick="adminPreviewCourse(${c.id})" style="padding:7px 14px;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:var(--font);">▶ Preview</button>
              <button onclick="openEditCourseModal(${c.id})" style="padding:7px 14px;background:rgba(255,255,255,0.05);border:1px solid var(--border2);border-radius:8px;color:var(--text2);font-size:0.75rem;font-weight:700;cursor:pointer;font-family:var(--font);">✏️ Edit</button>
              <button onclick="openAddLessonModal(${c.id})" style="padding:7px 14px;background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.2);border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:var(--font);">+ Lesson</button>
            </div>
          </div>
          <div style="border-top:1px solid var(--border2);padding-top:0.75rem;">
            <div style="font-size:0.7rem;color:var(--text3);font-weight:700;letter-spacing:1px;margin-bottom:0.5rem;">LESSONS</div>
            <div style="display:grid;gap:0.4rem;">
              ${c.lessons.map((l, li) => `
                <div style="display:flex;align-items:center;gap:0.75rem;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:8px;">
                  <span style="width:20px;height:20px;border-radius:50%;background:rgba(124,58,237,0.2);color:#a78bfa;font-size:0.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${li + 1}</span>
                  <span style="flex:1;font-size:0.82rem;">${l.title}</span>
                  <span style="font-size:0.72rem;color:var(--text3);">${l.duration || ''}</span>
                  <button onclick="adminPreviewLesson(${c.id},${li})" style="background:none;border:none;color:#a78bfa;cursor:pointer;font-size:0.72rem;font-weight:700;">▶ Preview</button>
                  <button onclick="editLesson(${c.id},${li})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:0.72rem;">✏️</button>
                  <button onclick="deleteLesson(${c.id},${li})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.72rem;">✕</button>
                </div>`).join('')}
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

function adminPreviewCourse(id) {
  const c = COURSES_DATA.find(x => x.id === id);
  if (!c || !c.lessons.length) return;
  adminPreviewLesson(id, 0);
}

function adminPreviewLesson(courseId, lessonIdx) {
  const c = COURSES_DATA.find(x => x.id === courseId);
  if (!c) return;
  const lesson = c.lessons[lessonIdx];
  const ov = document.createElement('div');
  ov.id = 'preview-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;';
  ov.innerHTML = `
    <div style="padding:1rem 1.5rem;background:rgba(10,10,26,0.95);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;z-index:20;">
      <div>
        <div style="font-weight:800;color:white;">${c.title}</div>
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);">Lesson ${lessonIdx + 1}: ${lesson.title} · Admin Preview</div>
      </div>
      <button onclick="document.getElementById('preview-overlay').remove()" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-family:var(--font);">✕ Close</button>
    </div>
    <div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;position:relative;">
      <div id="admin-player-wrap" style="width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;background:#000;" onmousemove="document.getElementById('admin-video-controls').style.opacity='1'; clearTimeout(window.adminCtrlTimeout); window.adminCtrlTimeout=setTimeout(()=>document.getElementById('admin-video-controls').style.opacity='0', 2500);" onmouseleave="document.getElementById('admin-video-controls').style.opacity='0'">
        <iframe id="admin-course-iframe" src="${makeEmbedUrl(lesson.videoUrl)}&autoplay=1" frameborder="0" allow="autoplay;fullscreen" allowfullscreen style="width:100%;height:300%;position:absolute;top:-100%;left:0;pointer-events:none;border:none;display:block;"></iframe>
        <div id="admin-video-overlay" onclick="ytTogglePlay()" style="position:absolute;inset:0;z-index:10;cursor:pointer;display:flex;align-items:center;justify-content:center;">
           <div id="admin-play-btn" style="width:64px;height:64px;background:rgba(124,58,237,0.85);backdrop-filter:blur(4px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:white;opacity:0;transition:opacity 0.2s;box-shadow:0 10px 25px rgba(0,0,0,0.5);">▶</div>
        </div>
        <!-- Top Watermark -->
        <div style="position:absolute;top:20px;left:20px;z-index:20;pointer-events:none;display:flex;align-items:center;gap:8px;">
           <div style="width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:6px;display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.25"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
           <span style="color:white;font-weight:800;font-size:0.9rem;text-shadow:0 2px 4px rgba(0,0,0,0.8);">EduTech</span>
        </div>
        <!-- Custom Control Bar -->
        <div id="admin-video-controls" style="position:absolute;bottom:0;left:0;width:100%;padding:30px 20px 15px;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);z-index:30;display:flex;flex-direction:column;gap:8px;transition:opacity 0.4s;opacity:0;">
          <div style="display:flex;align-items:center;gap:15px;" onclick="event.stopPropagation()">
            <span id="admin-video-time" style="color:white;font-size:0.75rem;font-weight:700;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px rgba(0,0,0,0.8);">0:00 / 0:00</span>
            <input type="range" id="admin-video-progress" oninput="ytSeek(event)" value="0" min="0" max="100" style="flex:1;height:5px;border-radius:3px;cursor:pointer;accent-color:#7c3aed;background:rgba(255,255,255,0.2);-webkit-appearance:none;outline:none;">
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;" onclick="event.stopPropagation()">
            <div style="display:flex;gap:15px;align-items:center;">
              <button onclick="ytTogglePlay()" id="admin-ctrl-play" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;width:30px;height:30px;">⏸</button>
              <button onclick="ytToggleMute()" id="admin-ctrl-mute" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.5);">🔊</button>
              <div style="color:white;font-size:0.85rem;font-weight:700;margin-left:10px;">${lesson.title.replace(/'/g, "\\'")}</div>
            </div>
            <button onclick="ytFullscreen('admin-player-wrap')" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.5);">⛶</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  setTimeout(() => setupCustomPlayer('admin-course-iframe', 'admin-'), 200);
}

function openAddCourseModal() {
  showModal(`
    <h2 style="font-weight:800;margin-bottom:1.25rem;">Add New Course</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
      <div style="grid-column:1/-1;"><label class="ml">Course Title *</label><input id="nc-title" class="mi" placeholder="e.g. Python Masterclass"/></div>
      <div><label class="ml">Category</label><input id="nc-cat" class="mi" placeholder="e.g. Programming"/></div>
      <div><label class="ml">Emoji</label><input id="nc-emoji" class="mi" value="📘" style="font-size:1.2rem;"/></div>
      <div><label class="ml">Price (₹) — 0 = Free</label><input id="nc-price" type="number" class="mi" value="0"/></div>
      <div><label class="ml">Original Price (₹)</label><input id="nc-orig" type="number" class="mi" value="0"/></div>
      <div><label class="ml">Instructor</label><input id="nc-inst" class="mi" value="EduTech Instructor"/></div>
      <div><label class="ml">Level</label>
        <select id="nc-level" class="mi"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
      </div>
      <div style="grid-column:1/-1;"><label class="ml">Description</label><textarea id="nc-desc" class="mi" rows="2" placeholder="Course description..."></textarea></div>
    </div>
    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Cancel</button>
      <button onclick="saveNewCourse()" style="flex:2;padding:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Create Course</button>
    </div>`);
}

function saveNewCourse() {
  const title = document.getElementById('nc-title').value.trim();
  if (!title) { showToast('Title is required', 'error'); return; }
  const price = parseInt(document.getElementById('nc-price').value) || 0;
  const newCourse = {
    id: Date.now(), emoji: document.getElementById('nc-emoji').value || '📘',
    category: document.getElementById('nc-cat').value || 'General',
    title, desc: document.getElementById('nc-desc').value,
    instructor: document.getElementById('nc-inst').value || 'Instructor',
    duration: '0 hrs', level: document.getElementById('nc-level').value,
    rating: 5.0, reviews: 0, enrolled: 0,
    price, originalPrice: parseInt(document.getElementById('nc-orig').value) || price,
    isFree: price === 0, tags: [], lessons: []
  };
  COURSES_DATA.push(newCourse);
  localStorage.setItem('edutech_courses', JSON.stringify(COURSES_DATA));
  closeModal(); handleRoute();
  showToast('✅ Course created!', 'success');
}

function openEditCourseModal(id) {
  const c = COURSES_DATA.find(x => x.id === id);
  if (!c) return;
  showModal(`
    <h2 style="font-weight:800;margin-bottom:1.25rem;">Edit Course</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
      <div style="grid-column:1/-1;"><label class="ml">Course Title</label><input id="ec-title" class="mi" value="${c.title}"/></div>
      <div><label class="ml">Category</label><input id="ec-cat" class="mi" value="${c.category}"/></div>
      <div><label class="ml">Emoji</label><input id="ec-emoji" class="mi" value="${c.emoji}" style="font-size:1.2rem;"/></div>
      <div><label class="ml">Price (₹)</label><input id="ec-price" type="number" class="mi" value="${c.price}"/></div>
      <div><label class="ml">Original Price (₹)</label><input id="ec-orig" type="number" class="mi" value="${c.originalPrice}"/></div>
      <div><label class="ml">Instructor</label><input id="ec-inst" class="mi" value="${c.instructor}"/></div>
      <div><label class="ml">Level</label>
        <select id="ec-level" class="mi"><option ${c.level === 'Beginner' ? 'selected' : ''}>Beginner</option><option ${c.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option><option ${c.level === 'Advanced' ? 'selected' : ''}>Advanced</option></select>
      </div>
      <div style="grid-column:1/-1;"><label class="ml">Description</label><textarea id="ec-desc" class="mi" rows="2">${c.desc}</textarea></div>
    </div>
    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Cancel</button>
      <button onclick="saveEditCourse(${id})" style="flex:2;padding:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Save Changes</button>
    </div>`);
}

function saveEditCourse(id) {
  const idx = COURSES_DATA.findIndex(x => x.id === id);
  if (idx < 0) return;
  const price = parseInt(document.getElementById('ec-price').value) || 0;
  COURSES_DATA[idx] = {
    ...COURSES_DATA[idx],
    title: document.getElementById('ec-title').value,
    category: document.getElementById('ec-cat').value,
    emoji: document.getElementById('ec-emoji').value,
    price, originalPrice: parseInt(document.getElementById('ec-orig').value) || price,
    isFree: price === 0, instructor: document.getElementById('ec-inst').value,
    level: document.getElementById('ec-level').value,
    desc: document.getElementById('ec-desc').value
  };
  localStorage.setItem('edutech_courses', JSON.stringify(COURSES_DATA));
  closeModal(); handleRoute();
  showToast('Course updated!', 'success');
}

function openAddLessonModal(courseId) {
  showModal(`
    <h2 style="font-weight:800;margin-bottom:1.25rem;">Add Lesson</h2>
    <div style="display:grid;gap:0.75rem;">
      <div><label class="ml">Lesson Title *</label><input id="nl-title" class="mi" placeholder="e.g. Introduction to React"/></div>
      <div><label class="ml">Video URL (YouTube or direct)</label><input id="nl-url" class="mi" placeholder="https://youtube.com/watch?v=..."/></div>
      <div><label class="ml">Duration (e.g. 24:30)</label><input id="nl-dur" class="mi" placeholder="24:30"/></div>
      <div><label class="ml">Notes / PDF URL</label><input id="nl-notes" class="mi" placeholder="https://... or leave blank"/></div>
      <div>
        <label class="ml">Resource Links (one per line: name|url|type)</label>
        <textarea id="nl-res" class="mi" rows="3" placeholder="HTML Cheat Sheet|https://...|pdf&#10;Setup Guide|https://...|pdf"></textarea>
      </div>
    </div>
    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Cancel</button>
      <button onclick="saveNewLesson(${courseId})" style="flex:2;padding:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Add Lesson</button>
    </div>`);
}

function saveNewLesson(courseId) {
  const title = document.getElementById('nl-title').value.trim();
  const videoUrl = document.getElementById('nl-url').value.trim();
  if (!title || !videoUrl) { showToast('Title and video URL required', 'error'); return; }
  const resLines = document.getElementById('nl-res').value.trim().split('\n').filter(Boolean);
  const resources = resLines.map(line => { const [name, url, type] = line.split('|'); return { name: name?.trim(), url: url?.trim(), type: (type || 'pdf').trim() }; }).filter(r => r.name && r.url);
  const lesson = { id: Date.now(), title, videoUrl, duration: document.getElementById('nl-dur').value.trim(), notes: document.getElementById('nl-notes').value.trim(), resources };
  const idx = COURSES_DATA.findIndex(x => x.id === courseId);
  if (idx < 0) return;
  COURSES_DATA[idx].lessons.push(lesson);
  COURSES_DATA[idx].duration = COURSES_DATA[idx].lessons.length + ' lessons';
  localStorage.setItem('edutech_courses', JSON.stringify(COURSES_DATA));
  closeModal(); handleRoute();
  showToast('✅ Lesson added!', 'success');
}

function editLesson(courseId, lessonIdx) {
  const c = COURSES_DATA.find(x => x.id === courseId);
  if (!c) return;
  const l = c.lessons[lessonIdx];
  showModal(`
    <h2 style="font-weight:800;margin-bottom:1.25rem;">Edit Lesson</h2>
    <div style="display:grid;gap:0.75rem;">
      <div><label class="ml">Lesson Title</label><input id="el-title" class="mi" value="${l.title}"/></div>
      <div><label class="ml">Video URL</label><input id="el-url" class="mi" value="${l.videoUrl}"/></div>
      <div><label class="ml">Duration</label><input id="el-dur" class="mi" value="${l.duration || ''}"/></div>
      <div><label class="ml">Notes / PDF URL</label><input id="el-notes" class="mi" value="${l.notes || ''}"/></div>
    </div>
    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Cancel</button>
      <button onclick="saveLessonEdit(${courseId},${lessonIdx})" style="flex:2;padding:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Save</button>
    </div>`);
}

function saveLessonEdit(courseId, lessonIdx) {
  const ci = COURSES_DATA.findIndex(x => x.id === courseId);
  if (ci < 0) return;
  COURSES_DATA[ci].lessons[lessonIdx] = {
    ...COURSES_DATA[ci].lessons[lessonIdx],
    title: document.getElementById('el-title').value,
    videoUrl: document.getElementById('el-url').value,
    duration: document.getElementById('el-dur').value,
    notes: document.getElementById('el-notes').value
  };
  localStorage.setItem('edutech_courses', JSON.stringify(COURSES_DATA));
  closeModal(); handleRoute(); showToast('Lesson updated!', 'success');
}

function deleteLesson(courseId, lessonIdx) {
  if (!confirm('Delete this lesson?')) return;
  const ci = COURSES_DATA.findIndex(x => x.id === courseId);
  if (ci < 0) return;
  COURSES_DATA[ci].lessons.splice(lessonIdx, 1);
  localStorage.setItem('edutech_courses', JSON.stringify(COURSES_DATA));
  handleRoute(); showToast('Lesson deleted.');
}

// ─── Students ────────────────────────────────────────────────
function renderAdminStudents(act) {
  const pending = JSON.parse(localStorage.getItem('edutech_pending_enrollments_global') || '[]');
  const isGridView = localStorage.getItem('edutech_admin_grid_view') === 'true';

  // Sort students alphabetically by name
  students.sort((a, b) => a.name.localeCompare(b.name));

  act.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
      <div><h2 style="font-size:1.15rem;font-weight:800;">Student Directory</h2><p style="color:var(--text3);font-size:0.8rem;">Manage users · approve payments · grant access</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="toggleStudentGridView()" style="padding:9px 18px;background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.2);border-radius:9px;font-weight:700;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:8px;">${isGridView ? '📋 List View' : '🔲 Grid View'}</button>
        <button onclick="downloadStudentsCSV()" style="padding:9px 18px;background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-family:var(--font);box-shadow:0 4px 12px rgba(16,185,129,0.3);">📥 Download CSV</button>
        <button onclick="downloadStudentsExcel()" style="padding:9px 18px;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2);border-radius:9px;font-weight:700;cursor:pointer;font-family:var(--font);">📊 Export Excel</button>
        <button onclick="downloadStudentsTXT()" style="padding:9px 18px;background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.2);border-radius:9px;font-weight:700;cursor:pointer;font-family:var(--font);">📄 Export Text</button>
      </div>
    </div>

    ${pending.length > 0 ? `
    <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:1.25rem;margin-bottom:1.25rem;">
      <h3 style="font-weight:800;color:#f59e0b;margin-bottom:0.75rem;">⏳ Pending Payments (${pending.length})</h3>
      <div style="display:grid;gap:0.6rem;">
        ${pending.map((p, i) => `
          <div style="background:var(--card);border:1px solid var(--border2);border-radius:12px;padding:1rem;display:flex;align-items:center;gap:1rem;">
            <div style="flex:1;">
              <div style="font-weight:700;">${p.studentName}</div>
              <div style="font-size:0.75rem;color:var(--text3);">${p.studentEmail} · ${p.courseName} · ₹${p.amount} · UTR: ${p.txnId}</div>
            </div>
            <button onclick="adminApprovePurchase(${i})" style="padding:6px 14px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);border-radius:7px;font-weight:700;cursor:pointer;font-size:0.75rem;">✓ Approve</button>
            <button onclick="adminRejectPurchase(${i})" style="padding:6px 14px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);border-radius:7px;font-weight:700;cursor:pointer;font-size:0.75rem;">✕ Reject</button>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;min-width:${isGridView ? '1200px' : 'auto'};">
        <thead style="background:rgba(255,255,255,0.02);"><tr style="text-align:left;border-bottom:1px solid var(--border2);">
          <th style="padding:12px 1rem;">Student</th>
          ${isGridView ? `
            <th style="padding:12px 1rem;">Phone</th>
            <th style="padding:12px 1rem;">Roll No</th>
            <th style="padding:12px 1rem;">College</th>
            <th style="padding:12px 1rem;">City</th>
            <th style="padding:12px 1rem;">State</th>
          ` : `
            <th style="padding:12px 1rem;">College</th>
          `}
          <th style="padding:12px 1rem;">Actions</th>
        </tr></thead>
        <tbody>${(!students || students.length === 0) ? `<tr><td colspan="10" style="padding:4rem;text-align:center;">
          <div style="font-size:3rem;margin-bottom:1rem;opacity:0.3;">👥</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:0.5rem;">No Students Found</div>
          <p style="color:var(--text3);font-size:0.85rem;max-width:300px;margin:0 auto 1.5rem;">There are no students registered on the platform yet, or the database connection is currently unavailable.</p>
          <button onclick="handleRoute()" style="padding:10px 20px;background:rgba(255,255,255,0.05);border:1px solid var(--border2);border-radius:10px;color:white;font-weight:700;cursor:pointer;">🔄 Refresh Directory</button>
        </td></tr>` :
      students.map(s => `
          <tr style="border-bottom:1px solid var(--border2);cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'" onclick="if(event.target.tagName !== 'BUTTON' && event.target.tagName !== 'INPUT') viewStudentDetails('${s.uid}')">
            <td style="padding:0.85rem 1rem;">
              <div style="font-weight:700;">${s.name}</div>
              <div style="font-size:0.72rem;color:var(--text3);">${s.email}</div>
              <code style="font-size:0.65rem;color:#a78bfa;">${s.uid}</code>
            </td>
            ${isGridView ? `
              <td style="padding:0.85rem 1rem;color:var(--text3);">${s.phone || '—'}</td>
              <td style="padding:0.85rem 1rem;color:var(--text3);">${s.rollNumber || '—'}</td>
              <td style="padding:0.85rem 1rem;color:var(--text3);">${s.college || '—'}</td>
              <td style="padding:0.85rem 1rem;color:var(--text3);">${s.city || '—'}</td>
              <td style="padding:0.85rem 1rem;color:var(--text3);">${s.state || '—'}</td>
            ` : `
              <td style="padding:0.85rem 1rem;color:var(--text3);">${s.college || '—'}</td>
            `}
            <td style="padding:0.85rem 1rem;">
              <div style="display:flex;flex-wrap:wrap;gap:5px;">
                ${COURSES_DATA.map(c => `
                  <button onclick="event.stopPropagation(); adminGrantAccess('${s.email}',${c.id})" title="Grant ${c.title}" style="padding:3px 9px;background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.2);border-radius:6px;font-size:0.68rem;font-weight:700;cursor:pointer;font-family:var(--font);">🎓 ${c.emoji}</button>`).join('')}
                <button onclick="event.stopPropagation(); deleteStudent('${s.uid}')" style="padding:3px 9px;background:rgba(239,68,68,0.08);color:#ef4444;border:1px solid rgba(239,68,68,0.15);border-radius:6px;font-size:0.68rem;font-weight:700;cursor:pointer;font-family:var(--font);">🗑</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function toggleStudentGridView() {
  const current = localStorage.getItem('edutech_admin_grid_view') === 'true';
  localStorage.setItem('edutech_admin_grid_view', !current);
  handleRoute();
}

async function viewStudentDetails(uid) {
  const s = students.find(x => x.uid === uid);
  if (!s) return;

  // Fetch global purchases to calculate "Amount Paid"
  let allPurchases = [];
  try {
    if (typeof dbGetPurchases !== 'undefined') {
      allPurchases = await dbGetPurchases();
    }
  } catch (e) { }

  const myPurchases = allPurchases.filter(p => p.studentEmail === s.email && p.status === 'approved');
  const totalPaid = myPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const ec = JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]');
  const enrolledCourses = ec.map(id => COURSES_DATA.find(c => c.id === id)?.title || id);

  showModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--border2);">
      <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;color:white;flex-shrink:0;">${s.initials || '?'}</div>
      <div style="flex:1;">
        <h2 style="font-weight:800;margin:0;">${s.name}</h2>
        <div style="font-size:0.8rem;color:#a78bfa;font-weight:700;">UID: ${s.uid}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px;">Amount Paid</div>
        <div style="font-size:1.1rem;font-weight:800;color:#10b981;">₹${totalPaid}</div>
      </div>
    </div>

    <!-- Edit Form -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
      <div class="det-box"><label class="det-l">Full Name</label><input id="edt-name" class="det-i" value="${s.name}"></div>
      <div class="det-box"><label class="det-l">Email Address</label><input id="edt-email" class="det-i" value="${s.email}" disabled title="Email cannot be changed"></div>
      <div class="det-box"><label class="det-l">Phone Number</label><input id="edt-phone" class="det-i" value="${s.phone || ''}"></div>
      <div class="det-box"><label class="det-l">Date of Birth</label><input id="edt-dob" type="date" class="det-i" value="${s.dob || ''}"></div>
      <div class="det-box"><label class="det-l">Gender</label>
        <select id="edt-gender" class="det-i" style="background:transparent;">
          <option value="">—</option>
          <option ${s.gender === 'Male' ? 'selected' : ''}>Male</option>
          <option ${s.gender === 'Female' ? 'selected' : ''}>Female</option>
          <option ${s.gender === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div class="det-box"><label class="det-l">Year of Study</label>
        <select id="edt-year" class="det-i" style="background:transparent;">
          <option value="">—</option>
          <option ${s.year === '1st Year' ? 'selected' : ''}>1st Year</option>
          <option ${s.year === '2nd Year' ? 'selected' : ''}>2nd Year</option>
          <option ${s.year === '3rd Year' ? 'selected' : ''}>3rd Year</option>
          <option ${s.year === '4th Year' ? 'selected' : ''}>4th Year</option>
          <option ${s.year === 'Passed Out' ? 'selected' : ''}>Passed Out</option>
        </select>
      </div>
      <div class="det-box"><label class="det-l">Roll Number</label><input id="edt-roll" class="det-i" value="${s.rollNumber || ''}"></div>
      <div class="det-box"><label class="det-l">College / University</label><input id="edt-college" class="det-i" value="${s.college || ''}"></div>
      <div class="det-box"><label class="det-l">Qualification</label><input id="edt-qual" class="det-i" value="${s.qualification || ''}"></div>
      <div class="det-box"><label class="det-l">City</label><input id="edt-city" class="det-i" value="${s.city || ''}"></div>
      <div class="det-box"><label class="det-l">State</label><input id="edt-state" class="det-i" value="${s.state || ''}"></div>
      <div class="det-box"><label class="det-l">Joined Platform</label><div class="det-v" style="padding-top:8px;">${formatDate(s.registerDate)}</div></div>
    </div>

    <!-- Security Section -->
    <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:1rem;margin-bottom:1.5rem;">
      <div style="font-size:0.7rem;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.75rem;">🔐 Security & Password Reset</div>
      <div style="display:flex;gap:0.75rem;">
        <input id="edt-pass" type="password" placeholder="Set new student password" class="det-i" style="flex:1;background:rgba(255,255,255,0.04);">
        <button onclick="adminResetStudentPassword('${s.uid}')" style="padding:0 15px;background:#ef4444;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.8rem;">Reset</button>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border2);border-radius:12px;padding:1rem;margin-bottom:1.5rem;">
      <div style="font-size:0.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.75rem;">Enrolled Courses (${enrolledCourses.length})</div>
      ${enrolledCourses.length === 0 ? `<div style="font-size:0.8rem;color:var(--text3);text-align:center;padding:10px;">No courses enrolled yet.</div>` : `
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
        ${enrolledCourses.map(c => `<span style="background:rgba(124,58,237,0.15);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">${c}</span>`).join('')}
      </div>`}
    </div>

    <div style="display:flex;gap:1rem;">
      <button onclick="saveStudentDetails('${s.uid}')" style="flex:2;padding:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:12px;color:white;font-weight:700;cursor:pointer;font-family:var(--font);">Save Changes</button>
      <button onclick="closeModal()" style="flex:1;padding:12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:12px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Close</button>
    </div>
    
    <style>
      .det-box{background:rgba(255,255,255,0.02);border:1px solid var(--border2);border-radius:10px;padding:0.6rem 0.75rem;}
      .det-l{font-size:0.6rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:2px;}
      .det-v{font-size:0.85rem;font-weight:600;color:var(--text);}
      .det-i{width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.1);color:var(--text);font-size:0.85rem;font-weight:600;padding:4px 0;outline:none;font-family:var(--font);}
      .det-i:focus{border-bottom-color:var(--accent2);}
      .det-i:disabled{color:var(--text3);cursor:not-allowed;}
    </style>
  `);
}

function saveStudentDetails(uid) {
  const sIdx = students.findIndex(x => x.uid === uid);
  if (sIdx === -1) return;

  students[sIdx].name = document.getElementById('edt-name').value;
  students[sIdx].phone = document.getElementById('edt-phone').value;
  students[sIdx].dob = document.getElementById('edt-dob').value;
  students[sIdx].gender = document.getElementById('edt-gender').value;
  students[sIdx].year = document.getElementById('edt-year').value;
  students[sIdx].rollNumber = document.getElementById('edt-roll').value;
  students[sIdx].college = document.getElementById('edt-college').value;
  students[sIdx].qualification = document.getElementById('edt-qual').value;
  students[sIdx].city = document.getElementById('edt-city').value;
  students[sIdx].state = document.getElementById('edt-state').value;

  localStorage.setItem('edutech_students', JSON.stringify(students));
  showToast('✅ Student details updated successfully!', 'success');
  closeModal();
  handleRoute();
}

function adminResetStudentPassword(uid) {
  const pass = document.getElementById('edt-pass').value;
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  const sIdx = students.findIndex(x => x.uid === uid);
  if (sIdx === -1) return;

  students[sIdx].password = btoa(pass);
  localStorage.setItem('edutech_students', JSON.stringify(students));
  showToast('✅ Password reset successfully!', 'success');
  document.getElementById('edt-pass').value = '';
}

// ─── Admin Profile ───────────────────────────────────────────

function renderAdminProfile(act) {
  const admin = JSON.parse(localStorage.getItem('edutech_admin_profile') || '{"name":"Admin","email":"admin@edutech.com","role":"Platform Administrator","bio":"","phone":"","qualification":"","linkedin":"","twitter":"","github":"","instagram":""}');
  act.innerHTML = `
  <style>
    .adm-section{background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:2rem;margin-bottom:1.25rem;}
    .adm-section h3{font-weight:800;margin-bottom:1.25rem;font-size:1rem;}
    .ml2{font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;}
    .mi2{width:100%;box-sizing:border-box;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:0.85rem;font-family:var(--font);outline:none;transition:border-color 0.2s;resize:vertical;}
    .mi2:focus{border-color:#7c3aed;background:rgba(124,58,237,0.06);}
    .adm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
    .adm-full{grid-column:1/-1;}
    .adm-save-btn{width:100%;padding:13px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.9rem;margin-top:0.5rem;transition:opacity 0.2s;}
    .adm-save-btn:hover{opacity:0.9;}
    .social-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.95rem;flex-shrink:0;}
  </style>

  <div style="max-width:680px;">
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1.5rem;">👤 Admin Profile</h2>

    <!-- Avatar & Identity -->
    <div class="adm-section">
      <h3>🪪 Identity & Photo</h3>
      <div style="display:flex;align-items:flex-start;gap:2rem;margin-bottom:1.5rem;">
        <div style="position:relative;cursor:pointer;flex-shrink:0;" onclick="document.getElementById('admin-photo-input').click();" title="Click to change photo">
          <div id="admin-avatar" style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:white;overflow:hidden;border:3px solid rgba(124,58,237,0.5);box-shadow:0 0 0 4px rgba(124,58,237,0.12);">
            ${admin.photoUrl ? `<img src="${admin.photoUrl}" style="width:100%;height:100%;object-fit:cover;">` : `<span>${getInitials(admin.name)}</span>`}
          </div>
          <div style="position:absolute;bottom:2px;right:2px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;border:2px solid var(--bg);">📷</div>
        </div>
        <input id="admin-photo-input" type="file" accept="image/*" style="display:none;" onchange="handleAdminPhotoUpload(event)">
        <div style="flex:1;">
          <div style="font-size:1.1rem;font-weight:800;margin-bottom:0.2rem;">${admin.name}</div>
          <div style="color:var(--text3);font-size:0.82rem;margin-bottom:0.2rem;">${admin.role}</div>
          <div style="color:var(--text3);font-size:0.78rem;">${admin.email}</div>
          <div style="font-size:0.72rem;color:#a78bfa;margin-top:8px;background:rgba(124,58,237,0.1);display:inline-block;padding:3px 10px;border-radius:20px;">Click avatar to change photo</div>
        </div>
      </div>
      <div class="adm-grid">
        <div><label class="ml2">Full Name</label><input id="adm-name" class="mi2" value="${admin.name}"/></div>
        <div><label class="ml2">Job Title / Role</label><input id="adm-role" class="mi2" value="${admin.role}"/></div>
        <div><label class="ml2">Phone</label><input id="adm-phone" class="mi2" value="${admin.phone || ''}"/></div>
        <div><label class="ml2">Qualification</label><input id="adm-qual" class="mi2" value="${admin.qualification || ''}" placeholder="e.g. M.Tech, MBA"/></div>
        <div class="adm-full"><label class="ml2">Bio / About</label><textarea id="adm-bio" class="mi2" rows="2" placeholder="Write a short bio...">${admin.bio || ''}</textarea></div>
      </div>
      <button onclick="saveAdminProfile()" class="adm-save-btn">💾 Save Profile</button>
    </div>

    <!-- Social Links -->
    <div class="adm-section">
      <h3>🔗 Social & Professional Links</h3>
      <div class="adm-grid">
        <div>
          <label class="ml2">LinkedIn Profile URL</label>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <div class="social-icon" style="background:rgba(10,102,194,0.15);color:#0a66c2;">in</div>
            <input id="adm-linkedin" class="mi2" style="flex:1;" placeholder="https://linkedin.com/in/yourname" value="${admin.linkedin || ''}"/>
          </div>
        </div>
        <div>
          <label class="ml2">Twitter / X Profile URL</label>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <div class="social-icon" style="background:rgba(29,155,240,0.15);color:#1d9bf0;">𝕏</div>
            <input id="adm-twitter" class="mi2" style="flex:1;" placeholder="https://twitter.com/yourname" value="${admin.twitter || ''}"/>
          </div>
        </div>
        <div>
          <label class="ml2">GitHub Profile URL</label>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <div class="social-icon" style="background:rgba(255,255,255,0.06);color:#e6edf3;">⌥</div>
            <input id="adm-github" class="mi2" style="flex:1;" placeholder="https://github.com/yourname" value="${admin.github || ''}"/>
          </div>
        </div>
        <div>
          <label class="ml2">Instagram Profile URL</label>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <div class="social-icon" style="background:rgba(225,48,108,0.15);color:#e1306c;">📸</div>
            <input id="adm-instagram" class="mi2" style="flex:1;" placeholder="https://instagram.com/yourname" value="${admin.instagram || ''}"/>
          </div>
        </div>
      </div>
      <button onclick="saveAdminProfile()" class="adm-save-btn">💾 Save Social Links</button>
    </div>

    <!-- Change Password -->
    <div class="adm-section">
      <h3>🔐 Change Admin Password</h3>
      <div class="adm-grid">
        <div class="adm-full"><label class="ml2">Current Password</label><input id="pw-old" type="password" class="mi2" placeholder="Enter current password"/></div>
        <div><label class="ml2">New Password</label><input id="pw-new" type="password" class="mi2" placeholder="Min. 6 characters"/></div>
        <div><label class="ml2">Confirm New Password</label><input id="pw-new2" type="password" class="mi2" placeholder="Re-enter new password"/></div>
      </div>
      <button onclick="changeAdminPassword()" class="adm-save-btn" style="background:linear-gradient(135deg,#059669,#10b981);">🔒 Update Password</button>
    </div>
  </div>`;
}

function handleAdminPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const photoUrl = ev.target.result;
    document.getElementById('admin-avatar').innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;">`;
    const admin = JSON.parse(localStorage.getItem('edutech_admin_profile') || '{}');
    admin.photoUrl = photoUrl;
    localStorage.setItem('edutech_admin_profile', JSON.stringify(admin));
    showToast('✅ Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
}

function saveAdminProfile() {
  const admin = JSON.parse(localStorage.getItem('edutech_admin_profile') || '{}');
  admin.name = document.getElementById('adm-name')?.value || admin.name;
  admin.role = document.getElementById('adm-role')?.value || admin.role;
  admin.phone = document.getElementById('adm-phone')?.value || '';
  admin.qualification = document.getElementById('adm-qual')?.value || '';
  admin.bio = document.getElementById('adm-bio')?.value || '';
  admin.linkedin = document.getElementById('adm-linkedin')?.value || '';
  admin.twitter = document.getElementById('adm-twitter')?.value || '';
  admin.github = document.getElementById('adm-github')?.value || '';
  admin.instagram = document.getElementById('adm-instagram')?.value || '';
  localStorage.setItem('edutech_admin_profile', JSON.stringify(admin));
  showToast('✅ Profile saved successfully!', 'success');
  handleRoute();
}

function changeAdminPassword() {
  const old = document.getElementById('pw-old')?.value;
  const nw = document.getElementById('pw-new')?.value;
  const nw2 = document.getElementById('pw-new2')?.value;
  const stored = localStorage.getItem('edutech_admin_password') || 'admin123';
  if (old !== stored) { showToast('Current password is incorrect', 'error'); return; }
  if (nw.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
  if (nw !== nw2) { showToast('Passwords do not match', 'error'); return; }
  localStorage.setItem('edutech_admin_password', nw);
  showToast('✅ Password changed successfully!', 'success');
  ['pw-old', 'pw-new', 'pw-new2'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// ─── Settings ────────────────────────────────────────────────
function renderAdminSettings(act) {
  const settings = JSON.parse(localStorage.getItem('edutech_platform_settings') || '{}');
  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  act.innerHTML = `
  <style>
    .set-section{background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:1.75rem;margin-bottom:1.25rem;}
    .set-section h3{font-weight:800;margin-bottom:1.25rem;font-size:1rem;}
    .set-row{display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.04);}
    .set-row:last-child{border-bottom:none;padding-bottom:0;}
    .set-label{font-size:0.85rem;font-weight:600;}
    .set-sub{font-size:0.72rem;color:var(--text3);margin-top:2px;}
    .toggle{width:44px;height:24px;background:rgba(255,255,255,0.1);border-radius:12px;position:relative;cursor:pointer;transition:background 0.3s;flex-shrink:0;}
    .toggle.on{background:#7c3aed;}
    .toggle::after{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;left:3px;transition:transform 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.3);}
    .toggle.on::after{transform:translateX(20px);}
    .mi3{width:100%;box-sizing:border-box;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:0.85rem;font-family:var(--font);outline:none;transition:border-color 0.2s;}
    .mi3:focus{border-color:#7c3aed;}
    .ml3{font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;}
    .set-save{padding:11px 24px;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.85rem;transition:opacity 0.2s;}
    .set-save:hover{opacity:0.85;}
  </style>

  <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1.5rem;">⚙️ Platform Settings</h2>

  <!-- Brand & Logo — NEW -->
  <div class="set-section">
    <h3>🎨 Brand &amp; Logo</h3>
    <div style="display:flex;align-items:flex-start;gap:1.5rem;margin-bottom:1.25rem;flex-wrap:wrap;">
      <!-- Logo preview -->
      <div style="flex-shrink:0;">
        <div id="brand-logo-preview" style="width:80px;height:80px;border-radius:18px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:2rem;overflow:hidden;border:2px solid rgba(124,58,237,0.4);">
          ${brand.logo ? `<img src="${brand.logo}" style="width:100%;height:100%;object-fit:cover;">` : `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.3"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
        </div>
        <button onclick="document.getElementById('brand-logo-inp').click()" style="margin-top:8px;width:80px;padding:5px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);border-radius:8px;color:#a78bfa;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:var(--font);">📷 Upload</button>
        <input id="brand-logo-inp" type="file" accept="image/*" style="display:none;" onchange="handleLogoUpload(event)">
      </div>
      <!-- Name + URL fields -->
      <div style="flex:1;min-width:220px;display:grid;gap:0.75rem;">
        <div>
          <label class="ml3">Platform Name</label>
          <input id="brand-name" class="mi3" value="${brand.name || 'EduTech'}" placeholder="EduTech" oninput="document.getElementById('brand-live-name').textContent=this.value||'EduTech'">
          <div style="font-size:0.68rem;color:var(--text3);margin-top:4px;">Live preview: <strong id="brand-live-name" style="color:#a78bfa;">${brand.name || 'EduTech'}</strong></div>
        </div>
        <div>
          <label class="ml3">Logo URL (optional, instead of upload)</label>
          <input id="brand-logo-url" class="mi3" value="${brand.logo || ''}" placeholder="https://example.com/logo.png">
        </div>
      </div>
    </div>
    <button onclick="saveBrandSettings()" class="set-save" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);">💾 Save Brand Settings</button>
  </div>

  <!-- Platform Info -->
  <div class="set-section">
    <h3>🏫 Platform Information</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
      <div><label class="ml3">Platform Name</label><input id="set-platname" class="mi3" value="${settings.platformName || 'EduTech'}" placeholder="EduTech"/></div>
      <div><label class="ml3">Tagline</label><input id="set-tagline" class="mi3" value="${settings.tagline || 'Learn. Grow. Succeed.'}" placeholder="Your tagline"/></div>
      <div><label class="ml3">Contact Email</label><input id="set-contact-email" class="mi3" type="email" value="${settings.contactEmail || ''}" placeholder="contact@edutech.com"/></div>
      <div><label class="ml3">Contact Phone</label><input id="set-contact-phone" class="mi3" value="${settings.contactPhone || ''}" placeholder="+91 98765 43210"/></div>
      <div style="grid-column:1/-1;"><label class="ml3">Platform Description</label><textarea id="set-desc" class="mi3" rows="2" placeholder="Short description of the platform...">${settings.platformDesc || ''}</textarea></div>
    </div>
    <button onclick="savePlatformInfo()" class="set-save" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);">💾 Save Platform Info</button>
  </div>


  <!-- Feature Toggles -->
  <div class="set-section">
    <h3>🔧 Feature Toggles</h3>
    <div class="set-row">
      <div><div class="set-label">📹 Live Classes</div><div class="set-sub">Allow students to join live class sessions</div></div>
      <div class="toggle ${settings.liveClassesEnabled !== false ? 'on' : ''}" onclick="toggleSetting('liveClassesEnabled', this)"></div>
    </div>
    <div class="set-row">
      <div><div class="set-label">📝 Student Registration</div><div class="set-sub">Allow new students to register on the platform</div></div>
      <div class="toggle ${settings.registrationEnabled !== false ? 'on' : ''}" onclick="toggleSetting('registrationEnabled', this)"></div>
    </div>
    <div class="set-row">
      <div><div class="set-label">💳 Online Payments</div><div class="set-sub">Enable UPI payment gateway for courses</div></div>
      <div class="toggle ${settings.paymentsEnabled !== false ? 'on' : ''}" onclick="toggleSetting('paymentsEnabled', this)"></div>
    </div>
    <div class="set-row">
      <div><div class="set-label">📊 Student Analytics</div><div class="set-sub">Show performance analytics to students</div></div>
      <div class="toggle ${settings.analyticsEnabled !== false ? 'on' : ''}" onclick="toggleSetting('analyticsEnabled', this)"></div>
    </div>
    <div class="set-row">
      <div><div class="set-label">🔔 Email Notifications <span style="font-size:0.65rem;background:rgba(251,191,36,0.15);color:#fbbf24;border-radius:4px;padding:1px 5px;">BETA</span></div><div class="set-sub">Send automated emails to students</div></div>
      <div class="toggle ${settings.emailNotifications ? 'on' : ''}" onclick="toggleSetting('emailNotifications', this)"></div>
    </div>
  </div>

  <!-- Payment Settings -->
  <div class="set-section">
    <h3>💳 Payment Settings</h3>
    <div style="display:grid;gap:0.75rem;margin-bottom:1rem;">
      <div><label class="ml3">Admin UPI ID / VPA</label><input id="set-upi" class="mi3" placeholder="yourname@bank" value="${localStorage.getItem('edutech_admin_upi') || 'edutech@upi'}"/></div>
      <div><label class="ml3">Payment Instructions (shown to students)</label><textarea id="set-pay-note" class="mi3" rows="2" placeholder="e.g. Send payment to above UPI ID and share screenshot...">${settings.paymentNote || ''}</textarea></div>
    </div>
    <button onclick="savePaymentSettings()" class="set-save" style="background:linear-gradient(135deg,#059669,#10b981);">💾 Save Payment Settings</button>
  </div>

  <!-- Admin Login Credentials -->
  <div class="set-section">
    <h3>🛡️ Admin Login Credentials</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
      <div><label class="ml3">Admin Email</label><input id="set-admin-email" class="mi3" value="${localStorage.getItem('edutech_admin_email') || 'admin@edutech.com'}"/></div>
      <div><label class="ml3">Admin Password</label><input id="set-admin-pass" type="password" class="mi3" value="${localStorage.getItem('edutech_admin_password') || 'admin123'}"/></div>
    </div>
    <button onclick="saveAdminCredentials()" class="set-save" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);">🔒 Update Admin Login</button>
  </div>

  <!-- Database Settings -->
  <div class="set-section">
    <h3>🗄️ Database Connection</h3>
    <div style="display:grid;gap:0.75rem;margin-bottom:1rem;">
      <div><label class="ml3">Supabase Project URL</label><input id="set-sb-url" class="mi3" placeholder="https://xyz.supabase.co" value="${localStorage.getItem('supabase_url') || ''}"/></div>
      <div><label class="ml3">Supabase Anon Key</label><input id="set-sb-key" type="password" class="mi3" placeholder="eyJhbG..." value="${localStorage.getItem('supabase_key') || ''}"/></div>
    </div>
    <div style="display:flex;gap:0.75rem;">
      <button onclick="saveSupabaseSettings()" class="set-save" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);">💾 Save Database Settings</button>
      <button onclick="testDatabaseConnection()" class="set-save" style="background:rgba(255,255,255,0.06);border:1px solid var(--border2);color:var(--text);">🔍 Test Connection</button>
    </div>
  </div>

  <!-- Danger Zone -->
  <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:18px;padding:1.75rem;">
    <h3 style="font-weight:800;color:#ef4444;margin-bottom:0.5rem;">⚠️ Danger Zone</h3>
    <p style="font-size:0.82rem;color:var(--text3);margin-bottom:1rem;">These actions are irreversible. Proceed with caution.</p>
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
      <button onclick="clearAllData()" style="padding:11px 20px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.85rem;">🗑️ Clear All Student Data</button>
      <button onclick="resetPlatformSettings()" style="padding:11px 20px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.85rem;">🔄 Reset Platform Settings</button>
    </div>
  </div>`;
}

function toggleSetting(key, el) {
  el.classList.toggle('on');
  const settings = JSON.parse(localStorage.getItem('edutech_platform_settings') || '{}');
  settings[key] = el.classList.contains('on');
  localStorage.setItem('edutech_platform_settings', JSON.stringify(settings));
  showToast(`${el.classList.contains('on') ? '✅ Enabled' : '⛔ Disabled'}: ${key.replace(/([A-Z])/g, ' $1').trim()}`, 'info');
}

function savePlatformInfo() {
  const settings = JSON.parse(localStorage.getItem('edutech_platform_settings') || '{}');
  settings.platformName = document.getElementById('set-platname').value;
  settings.tagline = document.getElementById('set-tagline').value;
  settings.contactEmail = document.getElementById('set-contact-email').value;
  settings.contactPhone = document.getElementById('set-contact-phone').value;
  settings.platformDesc = document.getElementById('set-desc').value;
  localStorage.setItem('edutech_platform_settings', JSON.stringify(settings));
  showToast('✅ Platform info saved!', 'success');
}

function savePaymentSettings() {
  const upi = document.getElementById('set-upi').value.trim();
  if (!upi) { showToast('Enter a valid UPI ID', 'error'); return; }
  localStorage.setItem('edutech_admin_upi', upi);
  const settings = JSON.parse(localStorage.getItem('edutech_platform_settings') || '{}');
  settings.paymentNote = document.getElementById('set-pay-note').value;
  localStorage.setItem('edutech_platform_settings', JSON.stringify(settings));
  showToast('✅ Payment settings saved!', 'success');
}

function saveAdminCredentials() {
  const email = document.getElementById('set-admin-email').value.trim();
  const pass = document.getElementById('set-admin-pass').value;
  if (!email || !pass) { showToast('Email and password are required', 'error'); return; }
  localStorage.setItem('edutech_admin_email', email);
  localStorage.setItem('edutech_admin_password', pass);
  showToast('✅ Admin credentials updated! Use new credentials next login.', 'success');
}

function saveSupabaseSettings() {
  localStorage.setItem('supabase_url', document.getElementById('set-sb-url').value);
  localStorage.setItem('supabase_key', document.getElementById('set-sb-key').value);
  showToast('✅ Database settings saved! Reload the page to apply.', 'success');
}

async function testDatabaseConnection() {
  showToast('🔍 Testing database connection...', 'info');
  try {
    const fetched = await dbGetStudents();
    showToast(`✅ Connected! Found ${fetched.length} students in database.`, 'success');
  } catch (e) {
    showToast('❌ Connection failed. Check your Supabase URL and key.', 'error');
  }
}

// ─── Brand & Logo ─────────────────────────────────────────────
function saveBrandSettings() {
  const name = document.getElementById('brand-name')?.value?.trim() || 'EduTech';
  const urlInput = document.getElementById('brand-logo-url')?.value?.trim() || '';
  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  brand.name = name;
  if (urlInput) brand.logo = urlInput;
  localStorage.setItem('edutech_brand', JSON.stringify(brand));
  // Update nav brand name live (in admin shell if present)
  document.querySelectorAll('[data-brand-name]').forEach(el => el.textContent = name);
  showToast(`✅ Brand settings saved! Platform name: "${name}". Reloading landing page will reflect changes.`, 'success');
  handleRoute();
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 500000) { showToast('Image too large. Please use an image under 500KB.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const logoData = ev.target.result;
    const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
    brand.logo = logoData;
    localStorage.setItem('edutech_brand', JSON.stringify(brand));
    // Update preview immediately
    const preview = document.getElementById('brand-logo-preview');
    if (preview) preview.innerHTML = `<img src="${logoData}" style="width:100%;height:100%;object-fit:cover;">`;
    const urlInput = document.getElementById('brand-logo-url');
    if (urlInput) urlInput.value = '';
    showToast('✅ Logo uploaded and saved!', 'success');
  };
  reader.readAsDataURL(file);
}


function resetPlatformSettings() {
  if (!confirm('Reset ALL platform settings to default? This cannot be undone.')) return;
  localStorage.removeItem('edutech_platform_settings');
  handleRoute();
  showToast('Platform settings reset to defaults.', 'info');
}

function clearAllData() {
  if (!confirm('This will DELETE ALL student data forever. Type DELETE in the next prompt to confirm.')) return;
  const confirm2 = prompt('Type DELETE to confirm');
  if (confirm2 !== 'DELETE') { showToast('Cancelled.', 'info'); return; }
  localStorage.removeItem('edutech_students');
  localStorage.removeItem('edutech_pending_enrollments_global');
  students = [];
  handleRoute();
  showToast('All student data cleared.', 'error');
}

// ─── Admin Actions ──────────────────────────────────────────
async function adminGrantAccess(studentEmail, courseId) {
  courseId = parseInt(courseId);
  const c = COURSES_DATA.find(x => x.id === courseId);
  const s = students.find(x => x.email === studentEmail);
  if (!c || !s) return;
  const purchase = { courseId: c.id, courseName: c.title, amount: 0, studentName: s.name, studentEmail: s.email, txnId: 'ADMIN_GRANTED', status: 'approved' };
  await dbSavePurchase(purchase);
  const key = `edutech_user_courses_${s.uid}`;
  const ex = JSON.parse(localStorage.getItem(key) || '[]');
  if (!ex.includes(courseId)) { ex.push(courseId); localStorage.setItem(key, JSON.stringify(ex)); }
  showToast(`✅ Free access granted to ${s.name}!`, 'success');
  handleRoute();
}

async function adminApprovePurchase(idx) {
  const pending = JSON.parse(localStorage.getItem('edutech_pending_enrollments_global') || '[]');
  const p = pending[idx];
  if (!p) return;
  const s = students.find(x => x.email === p.studentEmail);
  if (s) {
    const key = `edutech_user_courses_${s.uid}`;
    const ex = JSON.parse(localStorage.getItem(key) || '[]');
    if (!ex.includes(p.courseId)) { ex.push(p.courseId); localStorage.setItem(key, JSON.stringify(ex)); }
  }
  pending.splice(idx, 1);
  localStorage.setItem('edutech_pending_enrollments_global', JSON.stringify(pending));
  showToast('✅ Payment approved — access granted!', 'success');
  handleRoute();
}

function adminRejectPurchase(idx) {
  const pending = JSON.parse(localStorage.getItem('edutech_pending_enrollments_global') || '[]');
  pending.splice(idx, 1);
  localStorage.setItem('edutech_pending_enrollments_global', JSON.stringify(pending));
  showToast('Payment rejected.', 'error');
  handleRoute();
}

function deleteStudent(uid) {
  if (!confirm('Delete this student permanently?')) return;
  students = students.filter(s => s.uid !== uid);
  localStorage.setItem('edutech_students', JSON.stringify(students));
  handleRoute();
  showToast('Student deleted.');
}

// ─── Shared helper: save a Blob using showSaveFilePicker (opens Save dialog) or URL fallback ─────
async function _triggerSave(blob, suggestedName, fileTypes) {
  // Method 1: File System Access API (Chrome 86+) — opens a real Windows Save dialog
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: fileTypes, startIn: 'downloads' });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true; // success
    } catch (e) {
      if (e.name === 'AbortError') return false; // user cancelled literally
      console.warn('[EduTech] showSaveFilePicker failed, trying fallback:', e);
    }
  }
  // Method 2: Blob URL fallback (may use UUID name in some environments, but guaranteed to download)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

async function downloadStudentsCSV() {
  const localStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  if (localStudents.length > 0) students = localStudents;
  if (!students || students.length === 0) {
    showToast('No student data to export. Students must register first.', 'error');
    return;
  }

  const sorted = [...students].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const fileDate = new Date().toISOString().split('T')[0];
  const esc = (val) => '"' + String(val == null ? '' : val).replace(/"/g, '""') + '"';

  const headers = [
    'S.No', 'Student ID (UID)', 'Full Name', 'Email', 'Phone',
    'Gender', 'Date of Birth', 'Year of Study',
    'Roll Number', 'College / University', 'Qualification',
    'City', 'State', 'Enrolled Courses', 'Total Paid (INR)', 'Registered On'
  ];

  const rows = sorted.map((s, i) => {
    // Calculate total paid
    let paid = 0;
    try {
      if (typeof allPurchases !== 'undefined') {
        paid = allPurchases
          .filter(p => p.studentEmail === s.email && p.status === 'approved')
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      }
    } catch (e) { }

    const ecIds = JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]');
    const courses = ecIds.map(id => COURSES_DATA.find(c => c.id === id)?.title || `Course#${id}`).join('; ') || '0';
    const dob = s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : 'NA';
    const regDate = s.registerDate ? new Date(s.registerDate).toLocaleDateString('en-IN') : 'NA';

    // Add =\' prefix to phone numbers and IDs so Excel forces them to be text, avoiding scientific notation like 9.19E+11
    const pPhone = s.phone ? `="${s.phone}"` : 'NA';
    const pUid = s.uid ? `="${s.uid}"` : 'NA';
    const pRoll = s.rollNumber ? `="${s.rollNumber}"` : 'NA';

    return [
      esc(i + 1), esc(pUid), esc(s.name || 'NA'), esc(s.email || 'NA'),
      esc(pPhone), esc(s.gender || 'NA'), esc(dob), esc(s.year || 'NA'),
      esc(pRoll), esc(s.college || 'NA'), esc(s.qualification || 'NA'),
      esc(s.city || 'NA'), esc(s.state || 'NA'), esc(courses), esc(paid || '0'), esc(regDate)
    ].join(',');
  });

  // UTF-8 BOM + headers + rows
  const csvContent = '\uFEFF' + headers.map(esc).join(',') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `EduTech_Students_${fileDate}.csv`;

  showToast('\u23F3 Preparing... A Save dialog will open.', 'info');
  const saved = await _triggerSave(blob, fileName, [{ description: 'CSV Spreadsheet', accept: { 'text/csv': ['.csv'] } }]);
  if (saved) showToast(`\u2705 ${fileName} saved! Open it with Excel to view and print. (${sorted.length} students)`, 'success');
}

// ─── Export to Excel (XLSX) via SheetJS ─────────────────────────────
async function downloadStudentsExcel() {
  const localStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  if (localStudents.length > 0) students = localStudents;

  if (!students || students.length === 0) {
    showToast('No student data to export.', 'error');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showToast('Excel library not loaded. Using CSV instead...', 'info');
    downloadStudentsCSV();
    return;
  }

  showToast('⏳ Preparing Excel file...', 'info');
  const sorted = [...students].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const fileDate = new Date().toISOString().split('T')[0];

  let allPurchases = [];
  try {
    if (typeof dbGetPurchases !== 'undefined') {
      allPurchases = await dbGetPurchases();
    }
  } catch (e) {
    console.warn('[EduTech] Failed to fetch purchases for export', e);
  }

  const exportData = sorted.map((s, i) => {
    const paid = allPurchases
      .filter(p => p.studentEmail === s.email && p.status === 'approved')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const ecIds = JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]');
    const courses = ecIds.map(id => COURSES_DATA.find(c => c.id === id)?.title || `Course#${id}`).join('; ') || '0';

    return {
      'S.No': i + 1,
      'Student ID': s.uid ? String(s.uid) : 'NA',  // String to prevent scientific notation
      'Full Name': s.name || 'NA',
      'Email': s.email || 'NA',
      'Phone': s.phone ? String(s.phone) : 'NA',   // String to prevent scientific notation
      'Gender': s.gender || 'NA',
      'Date of Birth': s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : 'NA',
      'Year of Study': s.year || 'NA',
      'Roll Number': s.rollNumber ? String(s.rollNumber) : 'NA',
      'College / University': s.college || 'NA',
      'Qualification': s.qualification || 'NA',
      'City': s.city || 'NA',
      'State': s.state || 'NA',
      'Enrolled Courses': courses,
      'Total Paid (INR)': paid || 0,
      'Registered On': s.registerDate ? new Date(s.registerDate).toLocaleDateString('en-IN') : 'NA'
    };
  });

  try {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = Object.keys(exportData[0] || {}).map(k => ({
      wch: Math.max(k.length + 2, ...exportData.map(r => String(r[k] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const xlsxBlob = new Blob([wbArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `EduTech_Students_${fileDate}.xlsx`;
    showToast('\u23F3 Preparing... A Save dialog will open.', 'info');
    const saved = await _triggerSave(xlsxBlob, fileName, [{ description: 'Excel Workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]);
    if (saved) showToast(`\u2705 ${fileName} saved! Open it with Microsoft Excel. (${sorted.length} students)`, 'success');
  } catch (err) {
    console.warn('[EduTech] Excel export failed, falling back to CSV:', err);
    downloadStudentsCSV();
  }
}

// ─── Export to Notepad / Wordpad (Plain Text) ──────────────────
async function downloadStudentsTXT() {
  const localStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  if (localStudents.length > 0 && localStudents.length > students.length) students = localStudents;

  if (!students || students.length === 0) {
    showToast('No student data to export. Register students first.', 'error');
    return;
  }

  let allPurchases = JSON.parse(localStorage.getItem('edutech_purchases') || '[]');
  try {
    if (typeof dbGetPurchases !== 'undefined') {
      const fetched = await dbGetPurchases();
      if (fetched && fetched.length > 0) allPurchases = fetched;
    }
  } catch (e) { }

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

  const lines = [];
  lines.push('============================================================');
  lines.push('        EDUTECH PLATFORM — FULL STUDENT REPORT');
  lines.push(`        Exported on: ${today}`);
  lines.push(`        Total Students: ${sorted.length}`);
  lines.push('============================================================');
  lines.push('');

  sorted.forEach((s, i) => {
    const paid = allPurchases
      .filter(p => p.studentEmail === s.email && p.status === 'approved')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const ecIds = JSON.parse(localStorage.getItem(`edutech_user_courses_${s.uid}`) || '[]');
    const courses = ecIds.map(id => COURSES_DATA.find(c => c.id === id)?.title || `Course#${id}`).join(', ') || '0';

    lines.push(`---- Student #${i + 1} ------------------------------------------------`);
    lines.push(`  Name             : ${s.name || 'NA'}`);
    lines.push(`  Student UID      : ${s.uid || 'NA'}`);
    lines.push(`  Email            : ${s.email || 'NA'}`);
    lines.push(`  Phone            : ${s.phone || 'NA'}`);
    lines.push(`  Date of Birth    : ${s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : 'NA'}`);
    lines.push(`  Gender           : ${s.gender || 'NA'}`);
    lines.push(`  Roll Number      : ${s.rollNumber || 'NA'}`);
    lines.push(`  College          : ${s.college || 'NA'}`);
    lines.push(`  Qualification    : ${s.qualification || 'NA'}`);
    lines.push(`  Year             : ${s.year || 'NA'}`);
    lines.push(`  City             : ${s.city || 'NA'}`);
    lines.push(`  State            : ${s.state || 'NA'}`);
    lines.push(`  Address          : ${s.address || 'NA'}`);
    lines.push(`  Source           : ${s.source || 'NA'}`);
    lines.push(`  LinkedIn         : ${s.linkedin || 'NA'}`);
    lines.push(`  Enrolled Courses : ${courses}`);
    lines.push(`  Total Paid (₹)   : ${paid || 0}`);
    lines.push(`  Registered On    : ${s.registerDate ? new Date(s.registerDate).toLocaleDateString('en-IN') : 'NA'}`);
    lines.push('');
  });

  lines.push('============================================================');
  lines.push('                         END OF REPORT');
  lines.push('============================================================');

  const textContent = lines.join('\r\n');
  const txtBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const txtFileName = `EduTech_Students_${new Date().toISOString().split('T')[0]}.txt`;

  showToast('\u23F3 Preparing... A Save dialog will open.', 'info');
  const saved = await _triggerSave(txtBlob, txtFileName, [{ description: 'Text Document', accept: { 'text/plain': ['.txt'] } }]);
  if (saved) showToast(`\u2705 ${txtFileName} saved! Open with Notepad or WordPad to print.`, 'success');
}

// ─── Modal Helpers ───────────────────────────────────────────

function showModal(html) {
  const ov = document.createElement('div');
  ov.id = 'modal-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:5000;display:flex;align-items:center;justify-content:center;padding:1.5rem;';
  ov.innerHTML = `<div style="background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:2rem;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;">
    <style>.ml{font-size:0.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:5px;}.mi{width:100%;box-sizing:border-box;padding:10px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:0.85rem;font-family:var(--font);outline:none;resize:vertical;transition:border-color 0.2s;}.mi:focus{border-color:#7c3aed;}</style>
    ${html}
  </div>`;
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
  document.body.appendChild(ov);
}

function closeModal() {
  const ov = document.getElementById('modal-overlay');
  if (ov) ov.remove();
}
