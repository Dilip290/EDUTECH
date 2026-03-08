/* ============================================================
   EduTech – Views v2.0
   Profile Setup · Student Shell · All Functional Tabs
   ============================================================ */

// ═══ PROFILE SETUP ═══
function renderSetup() {
  if (!currentStudent) { navigate('#login'); return; }
  const s = currentStudent;
  document.getElementById('app').innerHTML = `
  <div class="page active page-transition" style="min-height:100vh;background:linear-gradient(135deg,#0a0a1a 0%,#1a1145 50%,#0a0a1a 100%);display:flex;align-items:center;justify-content:center;padding:2rem;">
    <div style="background:rgba(255,255,255,0.04);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:2.5rem;max-width:580px;width:100%;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;color:white;margin:0 auto 1rem;">${s.initials || '?'}</div>
        <h2 style="font-weight:800;font-size:1.3rem;margin-bottom:0.25rem;">Complete Your Profile</h2>
        <p style="color:var(--text3);font-size:0.82rem;">UID: <strong style="color:#a78bfa;">${s.uid}</strong></p>
      </div>
      <form onsubmit="completeProfile(event)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
          <div><label class="fl">Full Name *</label><input id="f-name" value="${s.name || ''}" required class="fi" placeholder="John Doe"/></div>
          <div><label class="fl">Email</label><input id="f-email" value="${s.email || ''}" readonly class="fi" style="opacity:0.6;"/></div>
          <div><label class="fl">Phone *</label><input id="f-phone" type="tel" required class="fi" placeholder="+91 9876543210"/></div>
          <div><label class="fl">Date of Birth *</label><input id="f-dob" type="date" required class="fi" style="color:var(--text);"/></div>
          <div><label class="fl">Gender *</label>
            <select id="f-gender" required class="fi">
              <option value="">Select Gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div><label class="fl">Year of Study *</label>
            <select id="f-year" required class="fi">
              <option value="">Select Year</option>
              <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Passed Out</option>
            </select>
          </div>
          <div><label class="fl">Roll Number *</label><input id="f-roll" required class="fi" placeholder="e.g. 21CS101"/></div>
          <div><label class="fl">College / University *</label><input id="f-college" required class="fi" placeholder="e.g. IIT Delhi"/></div>
          <div><label class="fl">Qualification *</label>
            <select id="f-qual" required class="fi">
              <option value="">Select</option>
              <option>B.Tech</option><option>B.Sc</option><option>BCA</option>
              <option>MCA</option><option>M.Tech</option><option>MBA</option><option>Other</option>
            </select>
          </div>
          <div><label class="fl">City *</label><input id="f-city" required class="fi" placeholder="e.g. Hyderabad"/></div>
          <div><label class="fl">State *</label><input id="f-state" required class="fi" placeholder="e.g. Telangana"/></div>
        </div>
        <button type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;font-family:var(--font);cursor:pointer;margin-top:0.5rem;">
          Complete Registration & Enter Platform →
        </button>
      </form>
    </div>
  </div>
  <style>
    .fl{font-size:0.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:5px;}
    .fi{width:100%;box-sizing:border-box;padding:10px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:var(--text);font-size:0.85rem;font-family:var(--font);outline:none;transition:border-color 0.2s;color-scheme:dark;}
    .fi:focus{border-color:#7c3aed;}
  </style>`;
}

async function completeProfile(e) {
  e.preventDefault();
  const s = currentStudent;
  s.name = document.getElementById('f-name').value.trim();
  s.phone = document.getElementById('f-phone').value.trim();
  s.dob = document.getElementById('f-dob').value;
  s.gender = document.getElementById('f-gender').value;
  s.year = document.getElementById('f-year').value;
  s.rollNumber = document.getElementById('f-roll').value.trim();
  s.college = document.getElementById('f-college').value.trim();
  s.qualification = document.getElementById('f-qual').value;
  s.city = document.getElementById('f-city').value.trim();
  s.state = document.getElementById('f-state').value.trim();
  s.initials = getInitials(s.name);
  s.institute = s.college;
  s.profileComplete = true;
  // Use YYYY-MM-DD for consistency and Excel parsing
  s.registerDate = new Date().toLocaleDateString('en-CA');
  s.status = 'Active';
  const existing = students.findIndex(x => x.uid === s.uid || x.email === s.email);
  if (existing >= 0) students[existing] = s; else students.push(s);
  localStorage.setItem('edutech_students', JSON.stringify(students));
  localStorage.setItem('edutech_session', JSON.stringify({ role: 'student', student: s }));
  await dbSaveStudent(s);
  currentStudent = s;
  showToast('🎉 Profile created! Welcome to EduTech!', 'success');
  navigate('#dashboard');
}

// ═══ STUDENT SHELL ═══
function renderStudentShell(tab, param) {
  if (!currentStudent) { navigate('#login'); return; }
  applyTheme();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const s = currentStudent;
  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  const platName = brand.name || 'EduTech';
  const platLogo = brand.logo || null;
  const logoHTML = platLogo
    ? `<img src="${platLogo}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;">`
    : `<div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center;">
         <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.25"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </div>`;

  document.getElementById('app').innerHTML = `
  <div class="page active page-transition" style="display:flex;height:100vh;overflow:hidden;">
    <!-- Sidebar -->
    <aside style="width:220px;background:rgba(10,10,26,0.98);border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;flex-shrink:0;">
      <div style="padding:1.25rem 1rem 1rem;">
        <div style="display:flex;align-items:center;gap:8px;">
          ${logoHTML}
          <span style="font-weight:800;font-size:0.95rem;color:white;">${platName}</span>
        </div>
      </div>
      <nav style="flex:1;padding:0.5rem 0.75rem;overflow-y:auto;">
        ${[
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', route: '#dashboard' },
      { id: 'courses', icon: '🔍', label: 'Browse Courses', route: '#courses' },
      { id: 'mycourses', icon: '📚', label: 'My Courses', route: '#mycourses' },
      { id: 'live', icon: '🔴', label: 'Live Classes', route: '#live' },
      { id: 'schedule', icon: '📅', label: 'Schedule', route: '#schedule' },
      { id: 'resources', icon: '📁', label: 'Resources', route: '#resources' },
      { id: 'performance', icon: '📈', label: 'Performance', route: '#performance' },
      { id: 'profile', icon: '👤', label: 'Profile', route: '#profile' }
    ].map(item => `
          <button onclick="navigate('${item.route}')" style="${stuNavStyle(tab === item.id)}">
            <span>${item.icon}</span> <span>${item.label}</span>
          </button>`).join('')}
      </nav>
      <div style="padding:0.75rem;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;align-items:center;gap:8px;padding:0.75rem;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:8px;">
          <div style="width:30px;height:30px;border-radius:50%;background:${s.color || '#7c3aed'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem;color:white;flex-shrink:0;">${s.initials}</div>
          <div style="min-width:0;"><div style="font-size:0.78rem;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</div><div style="font-size:0.65rem;color:rgba(255,255,255,0.3);">${s.uid}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
          <button onclick="logout()" style="flex:1;padding:7px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:var(--font);">Logout</button>
          <button onclick="toggleTheme()" class="theme-toggle-btn" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}" style="padding:7px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;font-size:0.9rem;flex-shrink:0;">${isDark ? '☀️' : '🌙'}</button>
        </div>
      </div>
    </aside>
    <!-- Main content -->
    <main style="flex:1;overflow-y:auto;background:var(--bg);">
      <div id="student-content" style="padding:0;"></div>
    </main>
  </div>`;

  const ct = document.getElementById('student-content');
  if (tab === 'dashboard') renderDashboard(ct);
  else if (tab === 'courses') renderBrowseCourses(ct);
  else if (tab === 'mycourses') renderMyCourses(ct);
  else if (tab === 'live') renderLiveClasses(ct);
  else if (tab === 'schedule') renderSchedule(ct);
  else if (tab === 'resources') renderResources(ct);
  else if (tab === 'performance') renderPerformance(ct);
  else if (tab === 'profile') renderStudentProfile(ct);
}

function stuNavStyle(act) {
  return `width:100%;display:flex;align-items:center;gap:9px;padding:10px 0.85rem;border:none;background:${act ? 'rgba(124,58,237,0.15)' : 'transparent'};color:${act ? '#a78bfa' : 'rgba(255,255,255,0.45)'};font-weight:${act ? '700' : '400'};font-size:0.83rem;cursor:pointer;font-family:var(--font);border-radius:9px;margin-bottom:2px;border-left:3px solid ${act ? '#7c3aed' : 'transparent'};transition:all 0.15s;text-align:left;`;
}

// ─── Dashboard ────────────────────────────────────────────────
function renderDashboard(ct) {
  const s = currentStudent;
  const myCourses = COURSES_DATA.filter(c => enrolledCourses.includes(c.id));

  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <!-- Welcome Banner -->
      <div style="background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.15));border:1px solid rgba(124,58,237,0.25);border-radius:20px;padding:1.75rem;margin-bottom:1.5rem;position:relative;overflow:hidden;">
        <div style="position:absolute;right:-20px;top:-20px;width:150px;height:150px;background:rgba(124,58,237,0.1);border-radius:50%;"></div>
        <div style="position:absolute;right:30px;bottom:-30px;width:100px;height:100px;background:rgba(79,70,229,0.1);border-radius:50%;"></div>
        <div style="font-size:0.75rem;color:#a78bfa;font-weight:700;letter-spacing:1px;margin-bottom:4px;">WELCOME BACK</div>
        <h1 style="font-size:1.6rem;font-weight:800;margin-bottom:0.25rem;">${s.name} 👋</h1>
        <p style="color:var(--text3);font-size:0.85rem;">Continue your learning journey · <strong style="color:#a78bfa;">${myCourses.length}</strong> course${myCourses.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
        ${[
      { icon: '📚', val: myCourses.length, label: 'Enrolled' },
      { icon: '⏱️', val: `${myCourses.reduce((a, c) => a + parseInt(c.duration), 0)}h`, label: 'Total Hours' },
      { icon: '🏅', val: myCourses.length > 0 ? 'Active' : 'New', label: 'Status' }
    ].map(st => `
          <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:1.25rem;text-align:center;">
            <div style="font-size:1.5rem;margin-bottom:0.4rem;">${st.icon}</div>
            <div style="font-size:1.4rem;font-weight:800;color:var(--text);">${st.val}</div>
            <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px;">${st.label}</div>
          </div>`).join('')}
      </div>

      ${myCourses.length > 0 ? `
      <!-- Continue Learning -->
      <div style="margin-bottom:1.5rem;">
        <h2 style="font-size:1rem;font-weight:800;margin-bottom:0.75rem;">Continue Learning</h2>
        <div style="display:grid;gap:0.75rem;">
          ${myCourses.map((c, i) => `
            <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:1.25rem;display:flex;align-items:center;gap:1rem;">
              <div style="width:48px;height:48px;border-radius:12px;background:${courseColors(i)};display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">${c.emoji}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.title}</div>
                <div style="font-size:0.75rem;color:var(--text3);">${c.lessons.length} lessons · ${c.duration}</div>
              </div>
              <button onclick="navigate('#lesson/${c.id}-0')" style="padding:8px 16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:var(--font);white-space:nowrap;">Continue ▶</button>
            </div>`).join('')}
        </div>
      </div>` : `
      <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:3rem;text-align:center;margin-bottom:1.5rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">🎓</div>
        <h3 style="font-weight:800;margin-bottom:0.5rem;">Start Your Learning Journey</h3>
        <p style="color:var(--text3);font-size:0.85rem;margin-bottom:1rem;">Explore our courses and enroll to begin.</p>
        <button onclick="navigate('#courses')" style="padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Browse Courses →</button>
      </div>`}

      <!-- Live Now -->
      ${LIVE_CLASSES_DATA.filter(l => l.isLive).length > 0 ? `
      <div>
        <h2 style="font-size:1rem;font-weight:800;margin-bottom:0.75rem;">🔴 Live Now</h2>
        ${LIVE_CLASSES_DATA.filter(l => l.isLive).map(l => `
          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:16px;padding:1.25rem;display:flex;align-items:center;gap:1rem;">
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(239,68,68,0.2);display:flex;align-items:center;justify-content:center;color:#ef4444;font-weight:800;font-size:0.85rem;flex-shrink:0;">${l.initials}</div>
            <div style="flex:1;"><div style="font-weight:700;">${l.title}</div><div style="font-size:0.75rem;color:var(--text3);">${l.instructor} · ${l.duration}</div></div>
            <a href="${l.meetLink}" style="padding:8px 16px;background:#ef4444;color:white;border:none;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;text-decoration:none;">Join Now</a>
          </div>`).join('')}
      </div>` : ''}
    </div>`;
}

// ─── Browse Courses ──────────────────────────────────────────
function renderBrowseCourses(ct) {
  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.25rem;">Browse Courses</h2>
      <p style="color:var(--text3);font-size:0.82rem;margin-bottom:1.5rem;">${COURSES_DATA.length} courses available</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem;">
        ${COURSES_DATA.map((c, i) => `
          <div style="background:var(--card);border:1px solid var(--border2);border-radius:20px;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
            <div style="height:140px;background:linear-gradient(135deg,${courseColors(i)},${courseColors(i + 2)});display:flex;align-items:center;justify-content:center;font-size:3rem;position:relative;">
              ${c.emoji}
              <div style="position:absolute;top:10px;right:10px;background:${c.isFree ? 'rgba(16,185,129,0.9)' : 'rgba(124,58,237,0.9)'};color:white;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:800;">${c.isFree ? 'FREE' : '₹' + c.price}</div>
            </div>
            <div style="padding:1.25rem;">
              <div style="font-size:0.7rem;font-weight:700;color:var(--accent2);letter-spacing:1px;margin-bottom:0.4rem;">${c.category}</div>
              <h3 style="font-size:0.95rem;font-weight:800;margin-bottom:0.5rem;line-height:1.3;">${c.title}</h3>
              <p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c.desc}</p>
              <div style="display:flex;gap:0.75rem;font-size:0.72rem;color:var(--text3);margin-bottom:1rem;">
                <span>⏱ ${c.duration}</span>
                <span>📖 ${c.lessons.length} lessons</span>
                <span>📊 ${c.level}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="font-size:0.8rem;"><span style="font-weight:700;color:#f59e0b;">★</span> ${c.rating} <span style="color:var(--text3);">(${c.reviews})</span></div>
                <button onclick="enrollCourse(${c.id})" style="padding:9px 18px;background:${enrolledCourses.includes(c.id) ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)'};color:${enrolledCourses.includes(c.id) ? '#10b981' : 'white'};border:${enrolledCourses.includes(c.id) ? '1px solid rgba(16,185,129,0.3)' : 'none'};border-radius:9px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:var(--font);">
                  ${enrolledCourses.includes(c.id) ? '▶ Continue' : c.isFree ? 'Enroll Free' : 'Enroll ₹' + c.price}
                </button>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── My Courses ───────────────────────────────────────────────
function renderMyCourses(ct) {
  const myCourses = COURSES_DATA.filter(c => enrolledCourses.includes(c.id));
  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.25rem;">My Courses</h2>
      <p style="color:var(--text3);font-size:0.82rem;margin-bottom:1.5rem;">${myCourses.length} enrolled</p>
      ${myCourses.length === 0 ? `
        <div style="text-align:center;padding:4rem;background:var(--card);border:1px solid var(--border2);border-radius:20px;">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <h3 style="font-weight:800;margin-bottom:0.5rem;">No courses yet</h3>
          <p style="color:var(--text3);font-size:0.85rem;margin-bottom:1.25rem;">Explore and enroll in courses to see them here.</p>
          <button onclick="navigate('#courses')" style="padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Browse Courses</button>
        </div>` :
      `<div style="display:grid;gap:1rem;">
        ${myCourses.map((c, i) => {
        const progress = getCourseProgress(c.id);
        const complete = isCourseComplete(c.id);
        const watched = JSON.parse(localStorage.getItem(`edutech_watched_${currentStudent.uid}_${c.id}`) || '[]');
        return `
          <div style="background:var(--card);border:1px solid ${complete ? 'rgba(16,185,129,0.35)' : 'var(--border2)'};border-radius:18px;padding:1.5rem;position:relative;overflow:hidden;">
            ${complete ? `<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#059669,#10b981);"></div>` : ''}
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
              <div style="width:56px;height:56px;border-radius:14px;background:${courseColors(i)};display:flex;align-items:center;justify-content:center;font-size:1.6rem;position:relative;">
                ${c.emoji}
                ${complete ? `<div style="position:absolute;bottom:-4px;right:-4px;background:#10b981;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;border:2px solid var(--card);">✓</div>` : ''}
              </div>
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.2rem;">
                  <h3 style="font-weight:800;font-size:0.95rem;">${c.title}</h3>
                  ${complete ? `<span style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.3);border-radius:6px;font-size:0.65rem;font-weight:800;padding:2px 8px;">🏆 COMPLETED</span>` : ''}
                </div>
                <div style="font-size:0.75rem;color:var(--text3);">${c.instructor} · ${c.lessons.length} lessons</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end;">
                <button onclick="navigate('#lesson/${c.id}-0')" style="padding:9px 18px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.8rem;">▶ Watch</button>
                ${complete ? `<button onclick="showCertificatePreview(${c.id})" style="padding:7px 14px;background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.15));color:#10b981;border:1px solid rgba(16,185,129,0.35);border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.75rem;">🏆 Certificate</button>` : ''}
              </div>
            </div>
            <!-- Progress Bar -->
            <div style="margin-bottom:0.75rem;">
              <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text3);margin-bottom:5px;">
                <span>Progress</span>
                <span style="font-weight:700;color:${complete ? '#10b981' : '#a78bfa'};">${progress}%</span>
              </div>
              <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${progress}%;background:${complete ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)'};border-radius:3px;transition:width 0.5s ease;"></div>
              </div>
            </div>
            <!-- Lessons list -->
            <div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.6rem;">${watched.length}/${c.lessons.length} lessons completed:</div>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
              ${c.lessons.map((l, li) => {
          const done = watched.includes(li);
          return `<button onclick="navigate('#lesson/${c.id}-${li}')" style="padding:5px 12px;background:${done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'};border:1px solid ${done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'};border-radius:20px;color:${done ? '#10b981' : 'var(--text2)'};font-size:0.72rem;cursor:pointer;font-family:var(--font);">
                  ${done ? '✅' : ''} ${li + 1}. ${l.title}
                </button>`;
        }).join('')}
            </div>
          </div>`;
      }).join('')}
      </div>`}
    </div>`;
}

// ─── Live Classes ──────────────────────────────────────────────────────
function renderLiveClasses(ct) {
  const sessions = JSON.parse(localStorage.getItem('edutech_live_sessions') || '[]');
  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
        <div>
          <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.25rem;">📹 Live Classes</h2>
          <p style="color:var(--text3);font-size:0.82rem;">${sessions.filter(s => s.isLive).length} live now &middot; ${sessions.filter(s => !s.isLive).length} upcoming</p>
        </div>
      </div>
      ${sessions.length === 0 ? `
      <div style="text-align:center;padding:4rem 2rem;background:var(--card);border:1px solid var(--border2);border-radius:20px;">
        <div style="font-size:3rem;margin-bottom:1rem;">📹</div>
        <h3 style="font-weight:800;margin-bottom:0.5rem;">No Live Classes Yet</h3>
        <p style="color:var(--text3);font-size:0.85rem;">Your admin hasn't scheduled any live sessions yet.<br>Check back soon!</p>
      </div>` : `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${sessions.map(s => `
        <div style="background:var(--card);border:1px solid ${s.isLive ? 'rgba(239,68,68,0.4)' : 'var(--border2)'};border-radius:18px;padding:1.5rem;${s.isLive ? 'background:rgba(239,68,68,0.03);' : ''}">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="width:52px;height:52px;border-radius:14px;background:${s.isLive ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)'};display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">${s.emoji || '📹'}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;flex-wrap:wrap;">
                ${s.isLive ? `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:2px 8px;border-radius:99px;font-size:0.62rem;font-weight:800;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;animation:lc-pulse 1s infinite;display:inline-block;"></span>LIVE NOW</span>` : `<span style="background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.2);padding:2px 8px;border-radius:99px;font-size:0.62rem;font-weight:800;">UPCOMING</span>`}
                <span style="font-size:0.9rem;font-weight:800;">${s.title}</span>
              </div>
              <div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.25rem;">👨‍🏫 ${s.instructor || 'Instructor'} &middot; 📚 ${s.courseName || 'General'} &middot; ⏱ ${s.duration || '60 min'}</div>
              <div style="font-size:0.75rem;color:var(--text3);">📅 ${s.scheduledTime || 'TBD'}</div>
              ${s.description ? `<div style="font-size:0.8rem;color:var(--text2);margin-top:0.5rem;">${s.description}</div>` : ''}
            </div>
            <div style="flex-shrink:0;">
              ${s.isLive ? `<a href="${s.meetLink}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;font-size:0.82rem;font-weight:800;cursor:pointer;text-decoration:none;">
                🔴 Join Now
              </a>` : `<button style="padding:10px 18px;background:rgba(124,58,237,0.1);color:#a78bfa;border:1px solid rgba(124,58,237,0.25);border-radius:10px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:var(--font);">
                🔔 Remind Me
              </button>`}
            </div>
          </div>
        </div>`).join('')}
      </div>`}
    </div>
    <style>@keyframes lc-pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}</style>`;
}

// ─── Schedule ─────────────────────────────────────────────────
function renderSchedule(ct) {
  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.25rem;">Weekly Schedule</h2>
      <p style="color:var(--text3);font-size:0.82rem;margin-bottom:1.5rem;">Your class timetable for this week</p>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0.5rem;">
        ${SCHEDULE_DATA.map((d, i) => `
          <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:1rem;min-height:120px;">
            <div style="text-align:center;margin-bottom:0.75rem;">
              <div style="font-size:0.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;">${d.day}</div>
              <div style="font-size:1.2rem;font-weight:800;color:${i === new Date().getDay() - 1 ? '#a78bfa' : 'var(--text)'};">${d.date}</div>
            </div>
            ${d.events.length === 0 ? '<div style="font-size:0.68rem;color:rgba(255,255,255,0.2);text-align:center;">—</div>' :
      d.events.map(ev => `
                <div style="background:${ev.color}22;border-left:3px solid ${ev.color};padding:5px 7px;border-radius:0 6px 6px 0;margin-bottom:4px;">
                  <div style="font-size:0.68rem;font-weight:700;color:white;line-height:1.2;">${ev.title}</div>
                  <div style="font-size:0.62rem;color:rgba(255,255,255,0.5);">${ev.time}</div>
                </div>`).join('')}
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── Resources ───────────────────────────────────────────────
function renderResources(ct) {
  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.25rem;">Learning Resources</h2>
      <p style="color:var(--text3);font-size:0.82rem;margin-bottom:1.5rem;">${RESOURCES_DATA.length} resources available</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${RESOURCES_DATA.map(r => `
          <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:1.25rem;display:flex;gap:1rem;align-items:flex-start;">
            <div style="width:44px;height:44px;border-radius:12px;background:${r.color}22;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">${r.icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:0.88rem;margin-bottom:0.25rem;">${r.title}</div>
              <div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.5rem;">${r.desc}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:0.65rem;background:rgba(255,255,255,0.08);padding:2px 8px;border-radius:20px;color:var(--text3);">${r.tag}</span>
                <a href="${r.url || '#'}" target="_blank" style="font-size:0.75rem;color:var(--accent2);font-weight:700;text-decoration:none;">Download ↗</a>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── Performance ─────────────────────────────────────────────
function renderPerformance(ct) {
  const myCourses = COURSES_DATA.filter(c => enrolledCourses.includes(c.id));
  ct.innerHTML = `
    <div style="padding:1.5rem;">
      <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:0.25rem;">My Performance</h2>
      <p style="color:var(--text3);font-size:0.82rem;margin-bottom:1.5rem;">Track your learning progress</p>

      ${myCourses.length === 0 ? `
        <div style="text-align:center;padding:4rem;background:var(--card);border:1px solid var(--border2);border-radius:20px;">
          <div style="font-size:3rem;margin-bottom:1rem;">📈</div>
          <h3 style="font-weight:800;margin-bottom:0.5rem;">No data yet</h3>
          <p style="color:var(--text3);font-size:0.85rem;">Enroll in courses to track your progress.</p>
        </div>` : `
      <div style="display:grid;gap:1.25rem;">
        ${myCourses.map((c, i) => {
    const pct = Math.floor(Math.random() * 60 + 20); // Simulated progress
    return `
          <div style="background:var(--card);border:1px solid var(--border2);border-radius:18px;padding:1.5rem;">
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
              <div style="font-size:1.5rem;">${c.emoji}</div>
              <div style="flex:1;">
                <div style="font-weight:700;font-size:0.9rem;">${c.title}</div>
                <div style="font-size:0.75rem;color:var(--text3);">${c.lessons.length} lessons · ${c.level}</div>
              </div>
              <div style="font-size:1.2rem;font-weight:800;color:#a78bfa;">${pct}%</div>
            </div>
            <div style="background:rgba(255,255,255,0.06);border-radius:999px;height:8px;overflow:hidden;margin-bottom:0.75rem;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:999px;transition:width 0.8s ease;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.73rem;color:var(--text3);">
              <span>${Math.floor(pct / 100 * c.lessons.length)} of ${c.lessons.length} lessons complete</span>
              <button onclick="navigate('#lesson/${c.id}-0')" style="background:none;border:none;color:var(--accent2);font-weight:700;cursor:pointer;font-size:0.73rem;font-family:var(--font);">Continue →</button>
            </div>
          </div>`;
  }).join('')}
      </div>`}
    </div>`;
}

// ─── Profile ──────────────────────────────────────────────────────
function renderStudentProfile(ct) {
  const s = currentStudent;
  if (!s) { navigate('#login'); return; }

  // Calculate profile completion %
  const fields = [
    s.name, s.email, s.phone, s.dob, s.rollNumber, s.college,
    s.qualification, s.city, s.state, s.linkedin, s.github, s.twitter
  ];
  const filled = fields.filter(f => f && String(f).trim()).length;
  const pct = Math.round((filled / fields.length) * 100);
  const pctColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  ct.innerHTML = `
  <style>
    .sp-card{background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:1.75rem;margin-bottom:1rem;}
    .sp-card h3{font-weight:800;font-size:0.95rem;margin-bottom:1.25rem;}
    .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
    .sp-field{background:rgba(255,255,255,0.03);border:1px solid var(--border2);border-radius:12px;padding:0.75rem;}
    .sp-label{font-size:0.62rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:3px;}
    .sp-value{font-size:0.88rem;font-weight:600;color:var(--text);}
    .sp-input{width:100%;background:transparent;border:none;border-bottom:1.5px solid rgba(124,58,237,0.4);color:var(--text);font-size:0.88rem;font-weight:600;padding:3px 0;outline:none;font-family:var(--font);color-scheme:dark;}
    .sp-input:focus{border-bottom-color:#7c3aed;}
    .sp-social-link{display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;background:rgba(255,255,255,0.03);border:1px solid var(--border2);border-radius:10px;margin-bottom:0.5rem;}
    .sp-soc-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;font-weight:700;}
    .sp-soc-input{flex:1;background:transparent;border:none;color:var(--text);font-size:0.82rem;outline:none;font-family:var(--font);}
    .sp-save-btn{padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-family:var(--font);font-size:0.88rem;transition:opacity 0.2s;}
    .sp-save-btn:hover{opacity:0.88;}
    .sp-req-badge{font-size:0.65rem;font-weight:700;background:rgba(251,191,36,0.12);color:#fbbf24;border:1px solid rgba(251,191,36,0.25);border-radius:4px;padding:1px 6px;margin-left:4px;}
  </style>

  <div style="padding:1.5rem;max-width:700px;">
    <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1.25rem;">👤 My Profile</h2>

    <!-- Identity Card + Progress -->
    <div class="sp-card">
      <div style="display:flex;align-items:flex-start;gap:1.25rem;margin-bottom:1.5rem;">
        <div style="width:80px;height:80px;border-radius:50%;background:${s.color || 'linear-gradient(135deg,#7c3aed,#4f46e5)'};display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:800;color:white;flex-shrink:0;border:3px solid rgba(124,58,237,0.4);overflow:hidden;">
          ${s.photoUrl ? `<img src="${s.photoUrl}" style="width:100%;height:100%;object-fit:cover;">` : s.initials}
        </div>
        <div style="flex:1;">
          <div style="font-size:1.15rem;font-weight:800;margin-bottom:0.2rem;">${s.name}</div>
          <div style="font-size:0.82rem;color:var(--text3);margin-bottom:0.2rem;">${s.email}</div>
          <div style="font-size:0.75rem;color:#a78bfa;font-weight:700;">UID: ${s.uid}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.65rem;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Profile Complete</div>
          <div style="font-size:1.5rem;font-weight:800;color:${pctColor};">${pct}%</div>
        </div>
      </div>
      <!-- Completion Bar -->
      <div style="margin-bottom:0.5rem;">
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text3);margin-bottom:5px;">
          <span>Profile Completion</span>
          <span style="color:${pctColor};font-weight:700;">${pct}% — ${pct < 50 ? 'Add more details' : pct < 80 ? 'Looking good!' : 'Excellent!'}</span>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:99px;height:10px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${pct < 50 ? '#ef4444,#f97316' : pct < 80 ? '#f59e0b,#fbbf24' : '#10b981,#34d399'});border-radius:99px;transition:width 1s ease;"></div>
        </div>
        ${pct < 100 ? `<div style="font-size:0.72rem;color:var(--text3);margin-top:6px;">💡 Add your LinkedIn, GitHub, and Twitter links to reach 100%</div>` : ''}
      </div>
    </div>

    <!-- Editable Info -->
    <div class="sp-card">
      <h3>✏️ Editable Details</h3>
      <div class="sp-grid" style="margin-bottom:1rem;">
        <div class="sp-field">
          <label class="sp-label">Full Name</label>
          <input id="sp-name" class="sp-input" value="${s.name}" placeholder="Your full name"/>
        </div>
        <div class="sp-field">
          <label class="sp-label">Email <span class="sp-req-badge">Admin Only</span></label>
          <div class="sp-value" style="color:var(--text3);">${s.email}</div>
        </div>
        <div class="sp-field">
          <label class="sp-label">Phone</label>
          <input id="sp-phone" class="sp-input" value="${s.phone || ''}" placeholder="+91 9876543210"/>
        </div>
        <div class="sp-field">
          <label class="sp-label">Date of Birth</label>
          <input id="sp-dob" type="date" class="sp-input" value="${s.dob || ''}"/>
        </div>
        <div class="sp-field">
          <label class="sp-label">City</label>
          <input id="sp-city" class="sp-input" value="${s.city || ''}" placeholder="e.g. Hyderabad"/>
        </div>
        <div class="sp-field">
          <label class="sp-label">State</label>
          <input id="sp-state" class="sp-input" value="${s.state || ''}" placeholder="e.g. Telangana"/>
        </div>
        <div class="sp-field">
          <label class="sp-label">Gender</label>
          <select id="sp-gender" class="sp-input">
            <option value="Male" ${s.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Female" ${s.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Other" ${s.gender === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="sp-field">
          <label class="sp-label">Year of Study</label>
          <select id="sp-year" class="sp-input">
            <option value="1st Year" ${s.year === '1st Year' ? 'selected' : ''}>1st Year</option>
            <option value="2nd Year" ${s.year === '2nd Year' ? 'selected' : ''}>2nd Year</option>
            <option value="3rd Year" ${s.year === '3rd Year' ? 'selected' : ''}>3rd Year</option>
            <option value="4th Year" ${s.year === '4th Year' ? 'selected' : ''}>4th Year</option>
            <option value="Passed Out" ${s.year === 'Passed Out' ? 'selected' : ''}>Passed Out</option>
          </select>
        </div>
        <div class="sp-field">
          <label class="sp-label">College / University <span class="sp-req-badge">Admin Only</span></label>
          <div class="sp-value" style="color:var(--text3);">${s.college || '—'}</div>
        </div>
        <div class="sp-field">
          <label class="sp-label">Qualification <span class="sp-req-badge">Admin Only</span></label>
          <div class="sp-value" style="color:var(--text3);">${s.qualification || '—'}</div>
        </div>
      </div>
      <button onclick="saveStudentProfile()" class="sp-save-btn">💾 Save Changes</button>
    </div>

    <!-- Social Links -->
    <div class="sp-card">
      <h3>🔗 Social & Professional Links</h3>
      <div class="sp-social-link">
        <div class="sp-soc-icon" style="background:rgba(10,102,194,0.15);color:#0a66c2;">in</div>
        <div style="flex:1;">
          <div style="font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">LinkedIn</div>
          <input id="sp-linkedin" class="sp-soc-input" placeholder="https://linkedin.com/in/yourname" value="${s.linkedin || ''}"/>
        </div>
        ${s.linkedin ? `<a href="${s.linkedin}" target="_blank" style="font-size:0.72rem;color:#a78bfa;font-weight:700;text-decoration:none;padding:4px 10px;background:rgba(124,58,237,0.1);border-radius:6px;">Open ↗</a>` : ''}
      </div>
      <div class="sp-social-link">
        <div class="sp-soc-icon" style="background:rgba(29,155,240,0.15);color:#1d9bf0;">𝕏</div>
        <div style="flex:1;">
          <div style="font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Twitter / X</div>
          <input id="sp-twitter" class="sp-soc-input" placeholder="https://twitter.com/yourname" value="${s.twitter || ''}"/>
        </div>
        ${s.twitter ? `<a href="${s.twitter}" target="_blank" style="font-size:0.72rem;color:#a78bfa;font-weight:700;text-decoration:none;padding:4px 10px;background:rgba(124,58,237,0.1);border-radius:6px;">Open ↗</a>` : ''}
      </div>
      <div class="sp-social-link">
        <div class="sp-soc-icon" style="background:rgba(255,255,255,0.06);color:#e6edf3;">⌥</div>
        <div style="flex:1;">
          <div style="font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">GitHub</div>
          <input id="sp-github" class="sp-soc-input" placeholder="https://github.com/yourname" value="${s.github || ''}"/>
        </div>
        ${s.github ? `<a href="${s.github}" target="_blank" style="font-size:0.72rem;color:#a78bfa;font-weight:700;text-decoration:none;padding:4px 10px;background:rgba(124,58,237,0.1);border-radius:6px;">Open ↗</a>` : ''}
      </div>
      <div class="sp-social-link">
        <div class="sp-soc-icon" style="background:rgba(225,48,108,0.15);color:#e1306c;">📸</div>
        <div style="flex:1;">
          <div style="font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Instagram</div>
          <input id="sp-instagram" class="sp-soc-input" placeholder="https://instagram.com/yourname" value="${s.instagram || ''}"/>
        </div>
        ${s.instagram ? `<a href="${s.instagram}" target="_blank" style="font-size:0.72rem;color:#a78bfa;font-weight:700;text-decoration:none;padding:4px 10px;background:rgba(124,58,237,0.1);border-radius:6px;">Open ↗</a>` : ''}
      </div>
      <button onclick="saveStudentProfile()" class="sp-save-btn" style="margin-top:0.5rem;">💾 Save Social Links</button>
    </div>

    <!-- Read-only info -->
    <div class="sp-card">
      <h3>📋 Academic Details <span style="font-size:0.72rem;font-weight:600;color:var(--text3);">(contact admin to change)</span></h3>
      <div class="sp-grid">
        ${[['Roll Number', s.rollNumber || '—'], ['College', s.college || '—'], ['Qualification', s.qualification || '—'], ['Registered On (Auto)', s.registerDate ? new Date(s.registerDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')], ['Status', s.status || 'Active']].map(([k, v]) => `
        <div class="sp-field"><label class="sp-label">${k}</label><div class="sp-value">${v}</div></div>`).join('')}
      </div>
    </div>
  </div>`;
}

function saveStudentProfile() {
  const s = currentStudent;
  if (!s) return;
  s.name = document.getElementById('sp-name')?.value || s.name;
  s.phone = document.getElementById('sp-phone')?.value || '';
  s.dob = document.getElementById('sp-dob')?.value || '';
  s.city = document.getElementById('sp-city')?.value || '';
  s.state = document.getElementById('sp-state')?.value || '';
  s.gender = document.getElementById('sp-gender')?.value || s.gender;
  s.year = document.getElementById('sp-year')?.value || s.year;
  s.linkedin = document.getElementById('sp-linkedin')?.value || '';
  s.twitter = document.getElementById('sp-twitter')?.value || '';
  s.github = document.getElementById('sp-github')?.value || '';
  s.instagram = document.getElementById('sp-instagram')?.value || '';
  s.initials = getInitials(s.name);

  const idx = students.findIndex(x => x.uid === s.uid);
  if (idx >= 0) students[idx] = s;
  localStorage.setItem('edutech_students', JSON.stringify(students));
  localStorage.setItem('edutech_session', JSON.stringify({ role: 'student', student: s }));
  currentStudent = s;
  showToast('✅ Profile updated!', 'success');
  navigate('#profile');
}

// ═══════════════════════════════════════════════════════════════
//  CERTIFICATE GENERATION
// ═══════════════════════════════════════════════════════════════

function getCourseProgress(courseId) {
  if (!currentStudent) return 0;
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course) return 0;
  const watched = JSON.parse(localStorage.getItem(`edutech_watched_${currentStudent.uid}_${courseId}`) || '[]');
  return Math.round((watched.length / course.lessons.length) * 100);
}

function isCourseComplete(courseId) {
  if (!currentStudent) return false;
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course || course.lessons.length === 0) return false;
  const watched = JSON.parse(localStorage.getItem(`edutech_watched_${currentStudent.uid}_${courseId}`) || '[]');
  return watched.length >= course.lessons.length;
}

function generateCertificate(courseId) {
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course || !currentStudent) return;

  if (!isCourseComplete(courseId)) {
    showToast('Complete all lessons to unlock your certificate!', 'error');
    return;
  }

  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  const platName = brand.name || 'EduTech';
  const studentName = currentStudent.name || 'Student';
  const completionDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const credId = 'EDT-' + (currentStudent.uid || 'USR').toUpperCase().slice(-4) + '-' + courseId.toString().padStart(2, '0') + '-' + new Date().getFullYear();

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, 1200, 850);

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 1200, 850);
  grad.addColorStop(0, 'rgba(124,58,237,0.12)');
  grad.addColorStop(0.5, 'rgba(79,70,229,0.08)');
  grad.addColorStop(1, 'rgba(124,58,237,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 850);

  // Decorative corner circles
  const drawCircle = (x, y, r, color) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawCircle(0, 0, 250, 'rgba(124,58,237,0.12)');
  drawCircle(1200, 850, 280, 'rgba(79,70,229,0.12)');
  drawCircle(1200, 0, 150, 'rgba(167,139,250,0.08)');
  drawCircle(0, 850, 130, 'rgba(79,70,229,0.08)');

  // Outer border
  ctx.strokeStyle = 'rgba(124,58,237,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 790);

  // Inner border
  ctx.strokeStyle = 'rgba(124,58,237,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, 1112, 762);

  // Platform name / logo area at top
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 28px Inter, Arial, sans-serif';
  ctx.fillText(platName.toUpperCase(), 600, 110);

  // Divider line
  const lineGrad = ctx.createLinearGradient(300, 120, 900, 120);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, 'rgba(167,139,250,0.6)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(300, 128);
  ctx.lineTo(900, 128);
  ctx.stroke();

  // Certificate of Completion title
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '500 18px Inter, Arial, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('CERTIFICATE  OF  COMPLETION', 600, 175);

  // Emoji/badge
  ctx.font = '56px Arial';
  ctx.fillText('🏆', 600, 258);

  // "This certifies that"
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '300 18px Inter, Arial, sans-serif';
  ctx.fillText('This is to certify that', 600, 310);

  // Student Name
  const nameGrad2 = ctx.createLinearGradient(300, 340, 900, 400);
  nameGrad2.addColorStop(0, '#c4b5fd');
  nameGrad2.addColorStop(0.5, '#a78bfa');
  nameGrad2.addColorStop(1, '#7c3aed');
  ctx.fillStyle = nameGrad2;
  ctx.font = 'bold 56px Georgia, Inter, serif';
  ctx.fillText(studentName, 600, 385);

  // Underline under name
  const nameWidth = ctx.measureText(studentName).width;
  ctx.strokeStyle = 'rgba(167,139,250,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(600 - nameWidth / 2, 398);
  ctx.lineTo(600 + nameWidth / 2, 398);
  ctx.stroke();

  // "has successfully completed"
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '300 18px Inter, Arial, sans-serif';
  ctx.fillText('has successfully completed the course', 600, 440);

  // Course Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Inter, Arial, sans-serif';
  ctx.fillText(course.title, 600, 494);

  // Course emoji row
  ctx.font = '24px Arial';
  ctx.fillText(`${course.emoji}  |  ${course.category}  |  ${course.lessons.length} Lessons  |  ${course.duration}`, 600, 540);

  // Divider
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, 570);
  ctx.lineTo(900, 570);
  ctx.stroke();

  // Footer info row
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`📅 Completion Date`, 180, 630);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 15px Inter, Arial, sans-serif';
  ctx.fillText(completionDate, 180, 650);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Instructor`, 600, 630);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 15px Inter, Arial, sans-serif';
  ctx.fillText(course.instructor || platName + ' Team', 600, 650);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`🔐 Credential ID`, 1020, 630);
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(credId, 1020, 650);

  // Signature line
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(180, 740);
  ctx.lineTo(400, 740);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '13px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Authorised Signatory', 290, 760);
  ctx.fillText(platName, 290, 778);

  // Seal / stamp circle
  ctx.beginPath();
  ctx.arc(920, 700, 65, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(124,58,237,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(920, 700, 55, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(124,58,237,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎓', 920, 712);
  ctx.fillStyle = 'rgba(167,139,250,0.7)';
  ctx.font = 'bold 11px Inter, Arial, sans-serif';
  ctx.fillText('VERIFIED', 920, 750);

  // Download
  const link = document.createElement('a');
  link.download = `${platName}_Certificate_${studentName.replace(/\s+/g, '_')}_${course.title.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();

  showToast(`🎓 Certificate downloaded! Credential ID: ${credId}`, 'success');
}

// Show preview of certificate in modal before download
function showCertificatePreview(courseId) {
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course || !currentStudent) return;

  if (!isCourseComplete(courseId)) {
    showToast('⚠️ Complete all lessons first to earn your certificate!', 'error');
    return;
  }

  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  const platName = brand.name || 'EduTech';
  const credId = 'EDT-' + (currentStudent.uid || 'USR').toUpperCase().slice(-4) + '-' + courseId.toString().padStart(2, '0') + '-' + new Date().getFullYear();

  showModal(`
    <div style="text-align:center;">
      <div style="font-size:3.5rem;margin-bottom:0.75rem;">🏆</div>
      <h2 style="font-weight:900;font-size:1.4rem;margin-bottom:0.4rem;">Congratulations, ${currentStudent.name}!</h2>
      <p style="color:var(--text3);font-size:0.85rem;margin-bottom:1.5rem;">You have successfully completed <strong style="color:#a78bfa;">${course.title}</strong></p>
      <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);border-radius:14px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;text-align:left;font-size:0.82rem;">
          <div><div style="color:var(--text3);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Student</div><div style="font-weight:700;">${currentStudent.name}</div></div>
          <div><div style="color:var(--text3);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Course</div><div style="font-weight:700;">${course.title}</div></div>
          <div><div style="color:var(--text3);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Issued By</div><div style="font-weight:700;">${platName}</div></div>
          <div><div style="color:var(--text3);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Credential ID</div><div style="font-weight:700;color:#a78bfa;font-family:monospace;">${credId}</div></div>
        </div>
      </div>
      <div style="display:flex;gap:0.75rem;">
        <button onclick="generateCertificate(${courseId});closeModal();" style="flex:2;padding:13px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:12px;color:white;font-weight:800;cursor:pointer;font-family:var(--font);font-size:0.9rem;">📥 Download Certificate</button>
        <button onclick="closeModal()" style="flex:1;padding:13px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:12px;color:var(--text);font-weight:700;cursor:pointer;font-family:var(--font);">Close</button>
      </div>
    </div>
  `);
}

