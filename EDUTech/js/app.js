/* ============================================================
   EduTech Platform – Core Application Logic v2.0
   Email/Password Auth · Multi-Lesson Player · UPI Payments
   ============================================================ */

let currentRole = null, currentStudent = null;
let students = JSON.parse(localStorage.getItem('edutech_students') || '[]');
let enrolledCourses = JSON.parse(localStorage.getItem('edutech_enrolled') || '[]');
let currentCourseVideo = null, currentLessonIdx = 0, paymentCourseId = null;

const ADMIN_UPI_ID = localStorage.getItem('edutech_admin_upi') || 'edutech@upi';

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  window.addEventListener('hashchange', handleRoute);

  const session = JSON.parse(localStorage.getItem('edutech_session') || 'null');
  if (session) {
    if (session.role === 'admin') {
      currentRole = 'admin';
    } else if (session.role === 'student' && session.student) {
      currentRole = 'student';
      currentStudent = session.student;
    }
  }

  await syncPlatformData();

  if (session) {
    if (session.role === 'admin') {
      if (!location.hash.startsWith('#admin')) navigate('#admin');
      else handleRoute();
    } else if (currentRole === 'student' && currentStudent) {
      const reg = students.find(s => s.uid === currentStudent.uid);
      if (reg && reg.profileComplete) {
        currentStudent = reg;
        if (!location.hash || location.hash === '#login' || location.hash === '#') navigate('#dashboard');
        else handleRoute();
      } else navigate('#setup');
    }
  } else if (!location.hash || location.hash === '#login' || location.hash === '#') {
    navigate('#landing');
  } else {
    handleRoute();
  }
});

async function syncPlatformData() {
  // Always load from localStorage first so admin data is never empty
  const localStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  if (localStudents.length > 0) students = localStudents;

  try {
    const fetched = await dbGetStudents();
    if (fetched && fetched.length > 0) students = fetched;
  } catch (e) {
    console.warn('[EduTech] Supabase sync failed, staying on localStorage data:', e);
  }

  if (currentStudent) {
    try {
      const allPurchases = await dbGetPurchases();
      const sbEnrollments = allPurchases
        .filter(p => p.studentEmail === currentStudent.email && p.status === 'approved')
        .map(p => p.courseId);
      const localEnrollments = JSON.parse(localStorage.getItem(`edutech_user_courses_${currentStudent.uid}`) || '[]');
      enrolledCourses = [...new Set([...sbEnrollments, ...localEnrollments])];
    } catch (e) {
      enrolledCourses = JSON.parse(localStorage.getItem(`edutech_user_courses_${currentStudent.uid}`) || '[]');
    }
  }
}

function navigate(hash) { window.location.hash = hash; }
function handleRoute() {
  const hash = location.hash || '#landing';
  const [route, param] = hash.replace('#', '').split('/');
  const app = document.getElementById('app');
  app.innerHTML = '';
  const views = {
    'landing': renderLanding,
    'login': renderLogin, 'register': renderRegister, 'setup': renderSetup,
    'browse': renderPublicCourses,
    'dashboard': () => renderStudentShell('dashboard'),
    'courses': () => renderStudentShell('courses'),
    'course': () => renderStudentShell('course', param),
    'mycourses': () => renderStudentShell('mycourses'),
    'live': () => renderStudentShell('live'),
    'schedule': () => renderStudentShell('schedule'),
    'resources': () => renderStudentShell('resources'),
    'performance': () => renderStudentShell('performance'),
    'profile': () => renderStudentShell('profile'),
    'video': () => renderVideoPlayer(param, 0),
    'lesson': () => { const [cid, lid] = (param || '0-0').split('-'); renderVideoPlayer(cid, parseInt(lid)); },
    'admin': () => renderAdminShell('overview'),
    'admin-courses': () => renderAdminShell('courses'),
    'admin-students': () => renderAdminShell('students'),
    'admin-live': () => renderAdminShell('live'),
    'admin-settings': () => renderAdminShell('settings'),
    'admin-profile': () => renderAdminShell('profile'),
  };
  (views[route] || renderLanding)();
}

// ─── Utilities ─────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = type === 'error' ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : type === 'success' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)';
  t.classList.remove('hidden');
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = 'slideIn 0.3s ease';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}
function getInitials(n) { return (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }
function formatDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return iso; } }
function generateUID() {
  const d = new Date();
  const year = d.getFullYear();
  const allStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  const count = allStudents.length + 1;
  const seq = String(count).padStart(4, '0');
  return `ET${year}-${seq}`;
}
function logout() { localStorage.removeItem('edutech_session'); currentRole = null; currentStudent = null; enrolledCourses = []; navigate('#login'); showToast('Logged out'); }
function courseColors(i) { const c = ['#312e81', '#1e3a5f', '#14532d', '#7f1d1d', '#3b0764', '#064e3b']; return c[i % c.length]; }

// ─── Theme Toggle (Day/Night) ───────────────────────────────────
function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const newTheme = isLight ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('edutech_theme', newTheme);
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.textContent = newTheme === 'light' ? '🌙' : '☀️';
    btn.title = newTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  });
}
function applyTheme() {
  const t = localStorage.getItem('edutech_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
}
function showLoading(btn, text = 'Loading...') { if (btn) { btn.disabled = true; btn._orig = btn.innerHTML; btn.innerHTML = `<span style="opacity:0.7">${text}</span>`; } }
function hideLoading(btn) { if (btn && btn._orig) { btn.disabled = false; btn.innerHTML = btn._orig; } }
function extractYoutubeId(url) {
  const m = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([^?&"'>]+)/);
  return m ? m[1] : null;
}
function makeEmbedUrl(url) {
  const id = extractYoutubeId(url);
  if (id) return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&color=white&controls=0&disablekb=1&playsinline=1&enablejsapi=1`;
  if (url.includes('youtube-nocookie.com')) return url + (url.includes('?') ? '&' : '?') + 'enablejsapi=1&controls=0';
  return url;
}

// ═══════════════════════════════════════════════════════════════
//  LANDING PAGE (Public-facing homepage) — Premium Design
// ═══════════════════════════════════════════════════════════════
function renderLanding() {
  const totalStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]').length;
  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  const platName = brand.name || 'EduTech';
  const platLogo = brand.logo || null;
  const logoHTML = platLogo
    ? `<img src="${platLogo}" style="width:36px;height:36px;border-radius:10px;object-fit:cover;">`
    : `<div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:10px;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.3"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;

  document.getElementById('app').innerHTML = `
  <div class="page active page-transition" id="landing-root" style="background:#04040e;min-height:100vh;font-family:var(--font);overflow-x:hidden;">

    <!-- ANIMATED BACKGROUND -->
    <div style="position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;background:#04040e;display:flex;justify-content:center;">
      <!-- Glowing Orbs -->
      <div style="position:absolute;top:-20%;left:-10%;width:600px;height:600px;background:radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%);animation:orb1 8s ease-in-out infinite alternate;"></div>
      <div style="position:absolute;top:30%;right:-15%;width:500px;height:500px;background:radial-gradient(circle,rgba(79,70,229,0.15),transparent 70%);animation:orb2 10s ease-in-out infinite alternate;"></div>
      <!-- Huge Destination Logo overlay watermark -->
      <div style="position:absolute;top:10vh;width:600px;height:600px;opacity:0.03;display:flex;align-items:center;justify-content:center;pointer-events:none;">
        ${platLogo ? `<img src="${platLogo}" style="width:100%;height:100%;object-fit:contain;filter:blur(3px);">` : ''}
      </div>
    </div>

    <!-- The Snake/Ladder Journey Path SVG (Absolute so it scrolls, not fixed) -->
    <div style="position:absolute; top:80px; left:0; width:100%; height:1300px; pointer-events:none; z-index:0; display:flex; justify-content:center; overflow:hidden;">
      <svg width="1000" height="1300" viewBox="0 0 1000 1300" style="opacity:0.8; flex-shrink:0;">
        <defs>
          <linearGradient id="pathGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.1" />
            <stop offset="30%" stop-color="#7c3aed" stop-opacity="0.5" />
            <stop offset="70%" stop-color="#a78bfa" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        <!-- Ladder/Snake winding path -->
        <!-- Start at 1200 (bottom), go up to 150 (top Destination) -->
        <path d="M 500,1200 C 800,1100 800,950 500,850 C 200,750 200,600 500,500 C 800,400 800,250 500,150" 
              fill="none" stroke="url(#pathGrad)" stroke-width="8" stroke-dasharray="24, 16" 
              filter="url(#glow)">
          <animate attributeName="stroke-dashoffset" from="80" to="0" dur="1.2s" repeatCount="indefinite" />
        </path>
        
        <!-- Node 1: Start -->
        <circle cx="500" cy="1200" r="16" fill="#04040e" stroke="#4f46e5" stroke-width="6" />
        <text x="535" y="1206" fill="rgba(255,255,255,0.4)" font-size="18" font-weight="800" font-family="var(--font)">1. Start Journey</text>

        <!-- Node 2 -->
        <circle cx="280" cy="675" r="20" fill="#04040e" stroke="#7c3aed" stroke-width="6" filter="url(#glow)"/>
        <text x="60" y="682" fill="rgba(255,255,255,0.6)" font-size="22" font-weight="900" font-family="var(--font)">2. Learn Skills</text>

        <!-- Node 3 -->
        <circle cx="720" cy="325" r="22" fill="#04040e" stroke="#c4b5fd" stroke-width="6" filter="url(#glow)"/>
        <text x="760" y="333" fill="rgba(255,255,255,0.8)" font-size="24" font-weight="900" font-family="var(--font)">3. Get Certified</text>

        <!-- Node 4: Destination Peak -->
        <circle cx="500" cy="150" r="50" fill="rgba(255,255,255,0.05)" stroke="url(#pathGrad)" stroke-width="3" filter="url(#glow)"/>
      </svg>
    </div>

    <!-- NAV -->
    <nav style="position:sticky;top:0;z-index:100;padding:1rem 2.5rem;display:flex;align-items:center;justify-content:space-between;background:rgba(4,4,14,0.8);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.06);">
      <div style="display:flex;align-items:center;gap:10px;">
        ${logoHTML}
        <span style="font-size:1.25rem;font-weight:900;color:white;letter-spacing:-0.5px;">${platName}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <button onclick="navigate('#browse')" style="background:transparent;border:none;color:rgba(255,255,255,0.55);font-weight:600;font-size:0.88rem;cursor:pointer;font-family:var(--font);padding:8px 16px;border-radius:8px;transition:all 0.2s;" onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.color='rgba(255,255,255,0.55)';this.style.background='transparent'">Browse Courses</button>
        <button onclick="navigate('#login')" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.85);font-weight:700;font-size:0.88rem;cursor:pointer;font-family:var(--font);padding:9px 20px;border-radius:10px;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.07)'">Sign In</button>
        <button onclick="navigate('#register')" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;color:white;font-weight:800;font-size:0.88rem;cursor:pointer;font-family:var(--font);padding:10px 22px;border-radius:10px;box-shadow:0 4px 20px rgba(124,58,237,0.45);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 8px 28px rgba(124,58,237,0.6)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 20px rgba(124,58,237,0.45)'">Get Started →</button>
      </div>
    </nav>

    <!-- HERO (Destination logo shown above the title) -->
    <section style="position:relative;z-index:1;padding:4rem 2rem 5rem;text-align:center;">
      <div style="max-width:820px;margin:0 auto;position:relative;">
        
        <!-- The Final Destination: App Logo Centered -->
        <div style="width:130px;height:130px;margin:0 auto 2rem;border-radius:30px;background:rgba(255,255,255,0.03);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;box-shadow:0 0 50px rgba(167,139,250,0.5), inset 0 0 20px rgba(255,255,255,0.1);animation:pulse 3s infinite;position:relative;z-index:10;">
           ${platLogo ? `<img src="${platLogo}" style="width:90px;height:90px;object-fit:contain;border-radius:18px;">` : `<div style="font-size:2.8rem;font-weight:900;color:white;">ET</div>`}
           <!-- Little destination flag badge -->
           <div style="position:absolute;bottom:-12px;background:white;color:#4f46e5;font-size:0.75rem;font-weight:900;padding:4px 12px;border-radius:99px;letter-spacing:1px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">DESTINATION</div>
        </div>

        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:99px;padding:6px 18px;font-size:0.78rem;font-weight:700;color:#c4b5fd;letter-spacing:0.5px;margin-bottom:1.5rem;animation:slideDown 0.6s ease;">
          <span style="width:8px;height:8px;border-radius:50%;background:#a78bfa;display:inline-block;animation:pulse 2s infinite;"></span>
          ${totalStudents > 0 ? totalStudents + ' Students Currently Learning' : '🎓 India\'s Next-Gen Learning Platform'}
        </div>
        <h1 style="font-size:clamp(2.6rem,6.5vw,4.5rem);font-weight:900;color:white;line-height:1.12;margin-bottom:1.5rem;letter-spacing:-1px;animation:slideDown 0.7s ease;text-shadow:0 10px 30px rgba(0,0,0,0.8);">
          Master Skills That<br>
          <span style="background:linear-gradient(135deg,#c4b5fd 0%,#a78bfa 30%,#7c3aed 70%,#4f46e5 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Pay The Bills</span>
        </h1>
        <p style="font-size:1.15rem;color:rgba(255,255,255,0.65);line-height:1.75;max-width:580px;margin:0 auto 3rem;animation:slideDown 0.8s ease;text-shadow:0 4px 10px rgba(0,0,0,0.8);">Follow the path to success. Professional-grade courses taught by experts. Build real projects, earn certificates, land your dream job faster.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;animation:slideDown 0.9s ease;">
          <button onclick="navigate('#browse')" style="padding:16px 38px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:14px;font-size:1.05rem;font-weight:800;cursor:pointer;font-family:var(--font);box-shadow:0 10px 30px rgba(124,58,237,0.5);transition:all 0.25s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 16px 40px rgba(124,58,237,0.65)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 10px 30px rgba(124,58,237,0.5)'">🚀 Start Your Journey</button>
          <button onclick="navigate('#register')" style="padding:16px 38px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;font-family:var(--font);transition:all 0.25s;backdrop-filter:blur(10px);" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">Create Free Account</button>
        </div>
        <!-- Trust badges -->
        <div style="display:flex;align-items:center;justify-content:center;gap:2rem;margin-top:2.5rem;flex-wrap:wrap;animation:slideDown 1s ease;">
          ${[['✅', 'No Credit Card'], ['⚡', 'Instant Access'], ['🎓', 'Certified Courses'], ['🔒', 'Secure Platform']].map(b => `
          <div style="display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.55);text-shadow:0 2px 4px rgba(0,0,0,0.8);font-size:0.78rem;font-weight:600;">
            <span>${b[0]}</span><span>${b[1]}</span>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ANIMATED STATS -->
    <section style="position:relative;z-index:1;padding:1rem 2rem 3rem;max-width:1000px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;">
        ${(() => {
      const stats = [
        { v: totalStudents > 0 ? totalStudents + '+' : '12,500+', l: 'Students', icon: '👨‍🎓' },
        { v: COURSES_DATA.length + '', l: 'Courses', icon: '📚' },
        { v: '98%', l: 'Satisfaction', icon: '⭐' },
        { v: '24/7', l: 'Support', icon: '💬' }
      ];
      return stats.map(s => `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.75rem 1rem;text-align:center;transition:all 0.3s;" onmouseover="this.style.background='rgba(124,58,237,0.08)';this.style.borderColor='rgba(124,58,237,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.03)';this.style.borderColor='rgba(255,255,255,0.07)'">
            <div style="font-size:1.75rem;margin-bottom:0.5rem;">${s.icon}</div>
            <div style="font-size:2rem;font-weight:900;color:white;margin-bottom:0.2rem;">${s.v}</div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">${s.l}</div>
          </div>`).join('');
    })()}
      </div>
    </section>

    <!-- COURSES SECTION with 3D hover cards -->
    <section style="position:relative;z-index:1;padding:2rem 2rem 4rem;max-width:1150px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:3rem;">
        <div style="font-size:0.72rem;font-weight:700;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.75rem;">WHAT WE OFFER</div>
        <h2 style="font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:white;margin-bottom:0.75rem;letter-spacing:-0.5px;">Premium Courses</h2>
        <p style="color:rgba(255,255,255,0.4);font-size:0.95rem;max-width:480px;margin:0 auto;">Industry-aligned curriculum built by experts, updated regularly to keep you ahead of the curve.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:1.75rem;margin-bottom:2.5rem;">
        ${COURSES_DATA.map((c, i) => {
      const gradients = [
        'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
        'linear-gradient(135deg,#064e3b,#065f46,#059669)',
        'linear-gradient(135deg,#7f1d1d,#991b1b,#dc2626)',
        'linear-gradient(135deg,#1e3a5f,#1d4ed8,#2563eb)',
        'linear-gradient(135deg,#3b0764,#6d28d9,#7c3aed)',
        'linear-gradient(135deg,#78350f,#b45309,#d97706)'
      ];
      const g = gradients[i % gradients.length];
      return `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:24px;overflow:hidden;transition:all 0.35s;cursor:pointer;position:relative;" onclick="navigate('#browse')" onmouseover="this.style.transform='translateY(-8px) scale(1.01)';this.style.boxShadow='0 30px 60px rgba(0,0,0,0.5)';this.style.borderColor='rgba(124,58,237,0.35)'" onmouseout="this.style.transform='none';this.style.boxShadow='none';this.style.borderColor='rgba(255,255,255,0.07)'">
            <div style="height:180px;background:${g};display:flex;align-items:center;justify-content:center;font-size:4.5rem;position:relative;overflow:hidden;">
              <div style="position:absolute;inset:0;background:rgba(0,0,0,0.15);"></div>
              <span style="position:relative;z-index:1;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5));">${c.emoji}</span>
              <div style="position:absolute;top:14px;right:14px;background:${c.isFree ? 'rgba(16,185,129,0.95)' : 'rgba(245,158,11,0.95)'};color:white;padding:5px 14px;border-radius:99px;font-size:0.7rem;font-weight:900;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">${c.isFree ? '🆓 FREE' : '₹' + c.price}</div>
            </div>
            <div style="padding:1.4rem;">
              <div style="font-size:0.68rem;font-weight:800;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.5rem;">${c.category}</div>
              <div style="font-size:1.05rem;font-weight:900;color:white;margin-bottom:0.5rem;line-height:1.35;">${c.title}</div>
              <div style="font-size:0.8rem;color:rgba(255,255,255,0.4);line-height:1.55;margin-bottom:1rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c.desc}</div>
              <div style="display:flex;gap:1rem;font-size:0.72rem;color:rgba(255,255,255,0.35);margin-bottom:1.1rem;flex-wrap:wrap;">
                <span>👤 ${c.instructor}</span><span>⏱ ${c.duration}</span><span>📖 ${c.lessons.length} lessons</span><span>⭐ ${c.rating}</span>
              </div>
              <button onclick="event.stopPropagation();navigate('#register')" style="width:100%;padding:11px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:11px;font-weight:800;font-size:0.88rem;cursor:pointer;font-family:var(--font);box-shadow:0 4px 16px rgba(124,58,237,0.35);transition:all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Enroll Now →</button>
            </div>
          </div>`;
    }).join('')}
      </div>
      <div style="text-align:center;">
        <button onclick="navigate('#browse')" style="padding:13px 36px;background:transparent;border:2px solid rgba(124,58,237,0.4);color:#a78bfa;border-radius:13px;font-weight:800;font-size:0.92rem;cursor:pointer;font-family:var(--font);transition:all 0.2s;" onmouseover="this.style.borderColor='rgba(124,58,237,0.8)';this.style.background='rgba(124,58,237,0.08)'" onmouseout="this.style.borderColor='rgba(124,58,237,0.4)';this.style.background='transparent'">View All Courses →</button>
      </div>
    </section>

    <!-- FEATURES GRID -->
    <section style="position:relative;z-index:1;padding:2rem 2rem 4rem;max-width:1050px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:3rem;">
        <div style="font-size:0.72rem;font-weight:700;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.75rem;">WHY CHOOSE US</div>
        <h2 style="font-size:clamp(1.8rem,4vw,2.4rem);font-weight:900;color:white;letter-spacing:-0.5px;">Built for Your Success</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1.25rem;">
        ${[
      { i: '🚀', t: 'Job-Ready Curriculum', d: 'Skills mapped to actual job descriptions from top companies.' },
      { i: '📹', t: 'Live Interactive Classes', d: 'Join weekly live sessions, ask questions, get real answers.' },
      { i: '🏆', t: 'Verified Certificates', d: 'Get industry-recognized digital certificates on completion.' },
      { i: '💬', t: 'Mentor Support', d: 'Dedicated mentors available 24/7 for your doubts.' },
      { i: '📱', t: 'Learn Anywhere', d: 'Access all content from any device, anytime, anywhere.' },
      { i: '♾️', t: 'Lifetime Access', d: 'Once enrolled, access your courses forever — no expiry.' },
    ].map(f => `
        <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:1.75rem 1.5rem;transition:all 0.3s;" onmouseover="this.style.background='rgba(124,58,237,0.07)';this.style.borderColor='rgba(124,58,237,0.2)';this.style.transform='translateY(-4px)'" onmouseout="this.style.background='rgba(255,255,255,0.025)';this.style.borderColor='rgba(255,255,255,0.06)';this.style.transform='none'">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:1rem;">${f.i}</div>
          <div style="font-weight:800;font-size:0.95rem;color:white;margin-bottom:0.4rem;">${f.t}</div>
          <div style="font-size:0.8rem;color:rgba(255,255,255,0.4);line-height:1.55;">${f.d}</div>
        </div>`).join('')}
      </div>
    </section>

    <!-- TESTIMONIALS -->
    <section style="position:relative;z-index:1;padding:2rem 2rem 4rem;max-width:1050px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:3rem;">
        <div style="font-size:0.72rem;font-weight:700;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.75rem;">SUCCESS STORIES</div>
        <h2 style="font-size:clamp(1.8rem,4vw,2.4rem);font-weight:900;color:white;letter-spacing:-0.5px;">Our Students Love Us</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem;">
        ${[
      { name: 'Priya Sharma', role: 'Software Engineer @ TCS', img: 'PS', rating: '5', text: 'EduTech completely changed my career path. The UI/UX course was incredibly detailed and the live sessions were a game-changer!' },
      { name: 'Rahul Verma', role: 'Data Analyst @ Infosys', img: 'RV', rating: '5', text: 'Got placed within 2 months of finishing the Data Science course. The certificate was recognized immediately by HR.' },
      { name: 'Ananya Singh', role: 'Digital Marketer @ Startup', img: 'AS', rating: '5', text: 'The best investment I made! The Digital Marketing course is hands-on and super practical. Highly recommended!' },
    ].map((t, i) => {
      const colors = ['#7c3aed', '#059669', '#dc2626'];
      return `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.75rem;position:relative;">
            <div style="font-size:1.5rem;color:#f59e0b;margin-bottom:1rem;">${'★'.repeat(parseInt(t.rating))}</div>
            <p style="font-size:0.88rem;color:rgba(255,255,255,0.6);line-height:1.65;margin-bottom:1.25rem;font-style:italic;">"${t.text}"</p>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:38px;height:38px;border-radius:50%;background:${colors[i]};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.78rem;color:white;flex-shrink:0;">${t.img}</div>
              <div>
                <div style="font-weight:800;font-size:0.88rem;color:white;">${t.name}</div>
                <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);">${t.role}</div>
              </div>
            </div>
          </div>`;
    }).join('')}
      </div>
    </section>

    <!-- CTA BANNER -->
    <section style="position:relative;z-index:1;padding:3rem 2rem 5rem;max-width:780px;margin:0 auto;text-align:center;">
      <div style="background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.15));border:1px solid rgba(124,58,237,0.3);border-radius:30px;padding:4rem 2rem;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(124,58,237,0.3),transparent);border-radius:50%;"></div>
        <div style="position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;background:radial-gradient(circle,rgba(79,70,229,0.3),transparent);border-radius:50%;"></div>
        <div style="position:relative;z-index:1;">
          <div style="font-size:3rem;margin-bottom:1rem;">🎓</div>
          <h2 style="font-size:2.2rem;font-weight:900;color:white;margin-bottom:0.75rem;letter-spacing:-0.5px;">Start Your Journey Today</h2>
          <p style="color:rgba(255,255,255,0.5);font-size:1rem;margin-bottom:2.5rem;line-height:1.65;">Join thousands of students already building their future with ${platName}. Free to start, no credit card required.</p>
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            <button onclick="navigate('#register')" style="padding:15px 42px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:14px;font-size:1.05rem;font-weight:900;cursor:pointer;font-family:var(--font);box-shadow:0 10px 30px rgba(124,58,237,0.5);transition:all 0.25s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">Create Free Account →</button>
            <button onclick="navigate('#login')" style="padding:15px 30px;background:transparent;border:2px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;font-family:var(--font);" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'">Sign In</button>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer style="position:relative;z-index:1;padding:1.75rem 2rem;border-top:1px solid rgba(255,255,255,0.05);">
      <div style="max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div style="display:flex;align-items:center;gap:8px;">
          ${logoHTML}
          <span style="font-weight:800;color:rgba(255,255,255,0.5);font-size:0.88rem;">${platName}</span>
        </div>
        <p style="color:rgba(255,255,255,0.2);font-size:0.78rem;">© ${new Date().getFullYear()} ${platName}. All rights reserved.</p>
        <button onclick="navigate('#login')" style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:0.75rem;font-family:var(--font);">Admin Portal</button>
      </div>
    </footer>

    <style>
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
      @keyframes orb1{from{transform:translate(0,0) scale(1);}to{transform:translate(80px,60px) scale(1.15);}}
      @keyframes orb2{from{transform:translate(0,0) scale(1);}to{transform:translate(-60px,80px) scale(0.9);}}
      @keyframes orb3{from{transform:translate(0,0) scale(1);}to{transform:translate(40px,-50px) scale(1.1);}}
      @keyframes slideDown{from{opacity:0;transform:translateY(-16px);}to{opacity:1;transform:none;}}
    </style>
  </div>`;
}



// ░░ PUBLIC COURSE BROWSER (without login) ░░
function renderPublicCourses() {
  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  const platName = brand.name || 'EduTech';
  const platLogo = brand.logo || null;
  const logoHTML = platLogo
    ? `<img src="${platLogo}" style="width:32px;height:32px;border-radius:9px;object-fit:cover;">`
    : `<div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:9px;display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.3"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;

  document.getElementById('app').innerHTML = `
  <div class="page active page-transition" style="background:#04040e;min-height:100vh;font-family:var(--font);">
    <nav style="position:sticky;top:0;z-index:100;padding:1rem 2.5rem;display:flex;align-items:center;justify-content:space-between;background:rgba(4,4,14,0.88);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.06);">
      <button onclick="navigate('#landing')" style="display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;">
        ${logoHTML}
        <span style="font-size:1.15rem;font-weight:900;color:white;letter-spacing:-0.5px;">${platName}</span>
      </button>
      <div style="display:flex;gap:0.75rem;align-items:center;">
        <button onclick="navigate('#login')" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.85);font-weight:700;font-size:0.85rem;cursor:pointer;font-family:var(--font);padding:9px 20px;border-radius:10px;">Sign In</button>
        <button onclick="navigate('#register')" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;color:white;font-weight:800;font-size:0.85rem;cursor:pointer;font-family:var(--font);padding:10px 20px;border-radius:10px;box-shadow:0 4px 16px rgba(124,58,237,0.4);">Join Free →</button>
      </div>
    </nav>
    <div style="padding:2.5rem 2rem;max-width:1150px;margin:0 auto;">
      <div style="margin-bottom:2.5rem;">
        <div style="font-size:0.7rem;font-weight:700;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.5rem;">COURSE CATALOGUE</div>
        <h1 style="font-size:2rem;font-weight:900;color:white;margin-bottom:0.4rem;letter-spacing:-0.5px;">All Courses</h1>
        <p style="color:rgba(255,255,255,0.4);font-size:0.9rem;">${COURSES_DATA.length} courses available · <span style="color:#a78bfa;font-weight:700;">Join free to enroll</span></p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.75rem;">
        ${COURSES_DATA.map((c, i) => {
    const gradients = [
      'linear-gradient(135deg,#1e1b4b,#4338ca)',
      'linear-gradient(135deg,#064e3b,#059669)',
      'linear-gradient(135deg,#7f1d1d,#dc2626)',
      'linear-gradient(135deg,#1e3a5f,#2563eb)',
      'linear-gradient(135deg,#3b0764,#7c3aed)',
      'linear-gradient(135deg,#78350f,#d97706)'
    ];
    const g = gradients[i % gradients.length];
    return `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:22px;overflow:hidden;transition:all 0.3s;cursor:pointer;" onclick="navigate('#register')" onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 24px 48px rgba(0,0,0,0.5)';this.style.borderColor='rgba(124,58,237,0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='none';this.style.borderColor='rgba(255,255,255,0.07)'">
            <div style="height:160px;background:${g};display:flex;align-items:center;justify-content:center;font-size:4rem;position:relative;">
              <div style="position:absolute;inset:0;background:rgba(0,0,0,0.15);"></div>
              <span style="position:relative;z-index:1;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">${c.emoji}</span>
              <div style="position:absolute;top:12px;right:12px;background:${c.isFree ? 'rgba(16,185,129,0.95)' : 'rgba(245,158,11,0.95)'};color:white;padding:4px 13px;border-radius:99px;font-size:0.68rem;font-weight:900;">${c.isFree ? '🆓 FREE' : '₹' + c.price}</div>
            </div>
            <div style="padding:1.25rem;">
              <div style="font-size:0.68rem;font-weight:700;color:#a78bfa;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:0.4rem;">${c.category}</div>
              <div style="font-size:1rem;font-weight:900;color:white;margin-bottom:0.5rem;line-height:1.3;">${c.title}</div>
              <div style="font-size:0.78rem;color:rgba(255,255,255,0.4);line-height:1.55;margin-bottom:0.75rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c.desc}</div>
              <div style="display:flex;gap:0.75rem;font-size:0.72rem;color:rgba(255,255,255,0.35);margin-bottom:1rem;">
                <span>👤 ${c.instructor}</span><span>⏱ ${c.duration}</span><span>📖 ${c.lessons.length} lessons</span><span>⭐ ${c.rating}</span>
              </div>
              <div style="display:flex;gap:0.5rem;">
                <button onclick="event.stopPropagation();navigate('#register')" style="flex:2;padding:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:10px;font-weight:800;font-size:0.82rem;cursor:pointer;font-family:var(--font);">Enroll Now →</button>
                <button onclick="event.stopPropagation();navigate('#login')" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;font-family:var(--font);">Sign In</button>
              </div>
            </div>
          </div>`;
  }).join('')}
      </div>
      <div style="text-align:center;margin-top:3rem;padding:2rem;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);border-radius:20px;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🎓</div>
        <div style="font-weight:800;color:white;margin-bottom:0.4rem;font-size:1rem;">Ready to start learning?</div>
        <div style="color:rgba(255,255,255,0.45);font-size:0.82rem;margin-bottom:1.25rem;">Create your free account and get instant access to all courses</div>
        <button onclick="navigate('#register')" style="padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-weight:800;font-size:0.92rem;cursor:pointer;font-family:var(--font);box-shadow:0 6px 20px rgba(124,58,237,0.4);">Create Free Account →</button>
      </div>
    </div>
    <footer style="padding:1.5rem 2rem;border-top:1px solid rgba(255,255,255,0.05);text-align:center;margin-top:2rem;">
      <p style="color:rgba(255,255,255,0.2);font-size:0.78rem;">© ${new Date().getFullYear()} ${platName}. All rights reserved.</p>
    </footer>
  </div>`;
}


// ═══════════════════════════════════════════════════════════════
//  LOGIN PAGE (Unified — auto-detects admin vs student)
// ═══════════════════════════════════════════════════════════════
function renderLogin() {
  document.getElementById('app').innerHTML = `
  <div class="page active page-transition" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#060612 0%,#12082e 50%,#060612 100%);padding:2rem;">
    <div style="width:100%;max-width:420px;">
      <div style="text-align:center;margin-bottom:2rem;">
        <button onclick="navigate('#landing')" style="background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">
          <div style="width:42px;height:42px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;display:flex;align-items:center;justify-content:center;">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.25" /><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </div>
          <span style="font-size:1.4rem;font-weight:800;color:white;">EduTech</span>
        </button>
      </div>
      <div style="background:rgba(255,255,255,0.04);backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:2.25rem;">
        <h2 style="font-size:1.3rem;font-weight:800;color:white;margin-bottom:0.3rem;">Welcome Back</h2>
        <p style="color:rgba(255,255,255,0.45);font-size:0.82rem;margin-bottom:1.75rem;">Sign in to continue to your account</p>
        <form onsubmit="doUnifiedLogin(event)">
          <div style="margin-bottom:0.75rem;">
            <label class="fls">Email Address</label>
            <input id="uni-email" type="email" placeholder="you@example.com" class="fli" required autocomplete="email" />
          </div>
          <div style="margin-bottom:1.25rem;">
            <label class="fls">Password</label>
            <input id="uni-pass" type="password" placeholder="Your password" class="fli" required autocomplete="current-password" />
          </div>
          <div id="uni-err" class="hidden" style="color:#ef4444;font-size:0.8rem;margin-bottom:0.75rem;padding:10px 12px;background:rgba(239,68,68,0.1);border-radius:9px;"></div>
          <button type="submit" id="btn-uni-login" style="width:100%;padding:13px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-size:0.95rem;font-weight:800;font-family:var(--font);cursor:pointer;box-shadow:0 6px 20px rgba(124,58,237,0.4);">Sign In →</button>
        </form>
        <div style="display:flex;align-items:center;gap:10px;margin:1.25rem 0;">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
          <span style="font-size:0.72rem;color:rgba(255,255,255,0.3);">NEW TO EDUTECH?</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
        </div>
        <button onclick="navigate('#register')" style="width:100%;padding:12px;background:transparent;border:1px solid rgba(124,58,237,0.35);border-radius:12px;color:#a78bfa;font-weight:700;font-size:0.9rem;font-family:var(--font);cursor:pointer;">Create Account →</button>
        <div style="text-align:center;margin-top:1rem;">
          <button onclick="navigate('#browse')" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:0.78rem;cursor:pointer;font-family:var(--font);">← Browse courses without signing in</button>
        </div>
      </div>
    </div>
  </div >
  <style>
    .fls{font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:5px;}
    .fli{width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:0.88rem;font-family:var(--font);outline:none;transition:border-color 0.2s;}
    .fli:focus{border-color:#7c3aed;}
    .btn-primary{padding:13px 20px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:12px;font-size:0.9rem;font-weight:700;font-family:var(--font);cursor:pointer;transition:opacity 0.2s;}
    .btn-primary:hover{opacity:0.9;}
  </style>`;
}

function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="page active page-transition" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a0a1a 0%,#1a1145 50%,#0a0a1a 100%);padding:2rem;">
      <div style="background:rgba(255,255,255,0.04);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:2.5rem;max-width:460px;width:100%;">
        <div style="text-align:center;margin-bottom:1.75rem;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.25" /><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </div>
          <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:0.25rem;">Create Your Account</h2>
          <p style="color:var(--text3);font-size:0.82rem;">Join EduTech and start learning today</p>
        </div>
        <form onsubmit="doStudentRegister(event)">
          <div style="margin-bottom:0.75rem;"><label class="fls">Full Name *</label><input id="reg-name" type="text" placeholder="John Doe" class="fli" required autocomplete="name" /></div>
          <div style="margin-bottom:0.75rem;"><label class="fls">Email Address *</label><input id="reg-email" type="email" placeholder="you@example.com" class="fli" required autocomplete="email" /></div>
          <div style="margin-bottom:0.75rem;"><label class="fls">Password *</label><input id="reg-pass" type="password" placeholder="Min. 6 characters" class="fli" required minlength="6" autocomplete="new-password" /></div>
          <div style="margin-bottom:1.25rem;"><label class="fls">Confirm Password *</label><input id="reg-pass2" type="password" placeholder="Re-enter password" class="fli" required autocomplete="new-password" /></div>
          <div id="reg-err" class="hidden" style="color:#ef4444;font-size:0.8rem;margin-bottom:0.75rem;padding:10px;background:rgba(239,68,68,0.1);border-radius:8px;"></div>
          <button type="submit" id="btn-register" class="btn-primary" style="width:100%;margin-bottom:0.75rem;">Create Account & Continue →</button>
        </form>
        <p style="text-align:center;font-size:0.8rem;color:var(--text3);">Already have an account? <button onclick="navigate('#login')" style="background:none;border:none;color:var(--accent2);font-weight:700;cursor:pointer;">Sign In</button></p>
      </div>
  </div >
  <style>
    .fls{font - size:0.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:5px;}
    .fli{width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:0.88rem;font-family:var(--font);outline:none;transition:border-color 0.2s;}
    .fli:focus{border - color:var(--primary-light);}
    .btn-primary{padding:13px 20px;background:linear-gradient(135deg,var(--primary-light),var(--primary));color:white;border:none;border-radius:12px;font-size:0.9rem;font-weight:700;font-family:var(--font);cursor:pointer;}
  </style>`;
}

// Unified login handler — auto-detects admin vs student
async function doUnifiedLogin(e) {
  e.preventDefault();
  const email = document.getElementById('uni-email').value.trim();
  const pass = document.getElementById('uni-pass').value;
  const err = document.getElementById('uni-err');
  const btn = document.getElementById('btn-uni-login');

  err.classList.add('hidden');
  if (!email || !pass) { err.textContent = 'Please enter your email and password.'; err.classList.remove('hidden'); return; }

  // Check if this is admin
  const adminEmail = localStorage.getItem('edutech_admin_email') || 'admin@edutech.com';
  const adminPass = localStorage.getItem('edutech_admin_password') || 'admin123';
  if (email === adminEmail && pass === adminPass) {
    currentRole = 'admin';
    localStorage.setItem('edutech_session', JSON.stringify({ role: 'admin' }));
    showToast('Welcome back, Admin! 👋', 'success');
    navigate('#admin');
    return;
  }

  showLoading(btn, 'Signing in...');

  // Try Supabase student auth
  const res = await dbSignInStudent(email, pass);
  if (res && !res.error) {
    await processStudentAuth(res.user?.user_metadata?.name || email.split('@')[0], email);
    return;
  }

  // Fallback: local store
  const localStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  const found = localStudents.find(s => s.email === email && s.password === btoa(pass));
  if (found) {
    await processStudentAuth(found.name, email);
    return;
  }

  // Nothing worked
  err.innerHTML = 'Invalid email or password. <button onclick="navigate(\'#register\')" style="background:none;border:none;color:#a78bfa;font-weight:700;cursor:pointer;font-family:var(--font);">Create an account?</button>';
  err.classList.remove('hidden');
  hideLoading(btn);
}

// Keep old individual handlers for backward compat
function doAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email')?.value?.trim() || '';
  const pass = document.getElementById('admin-pass')?.value?.trim() || '';
  const storedPass = localStorage.getItem('edutech_admin_password') || 'admin123';
  if (email === 'admin@edutech.com' && pass === storedPass) {
    currentRole = 'admin';
    localStorage.setItem('edutech_session', JSON.stringify({ role: 'admin' }));
    showToast('Welcome back, Admin!', 'success');
    navigate('#admin');
  } else {
    const err = document.getElementById('admin-err');
    if (err) { err.textContent = 'Invalid credentials.'; err.classList.remove('hidden'); }
  }
}
function switchLoginTab(tab) { }

async function doStudentLogin(e) {
  e.preventDefault();
  const email = document.getElementById('stu-login-email').value.trim();
  const pass = document.getElementById('stu-login-pass').value.trim();
  if (!email || !pass) { showToast('Enter email and password', 'error'); return; }

  const btn = document.getElementById('btn-stu-login');
  showLoading(btn, 'Signing in...');

  // Try Supabase auth first
  const res = await dbSignInStudent(email, pass);
  if (res && !res.error) {
    await processStudentAuth(res.user?.user_metadata?.name || email.split('@')[0], email);
  } else {
    // Fallback: check local store
    const localStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
    const found = localStudents.find(s => s.email === email && s.password === btoa(pass));
    if (found) {
      await processStudentAuth(found.name, email);
    } else {
      const err = document.getElementById('stu-err');
      err.textContent = 'Invalid email or password. Please register first.'; err.classList.remove('hidden');
      hideLoading(btn);
    }
  }
}

async function doStudentRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const err = document.getElementById('reg-err');

  err.classList.add('hidden'); // Clear previous errors

  if (pass !== pass2) { err.textContent = 'Passwords do not match.'; err.classList.remove('hidden'); return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.remove('hidden'); return; }

  const existingStudents = JSON.parse(localStorage.getItem('edutech_students') || '[]');
  if (existingStudents.find(s => s.email === email)) {
    err.textContent = 'An account with this email already exists.'; err.classList.remove('hidden'); return;
  }

  const btn = document.getElementById('btn-register');
  showLoading(btn, 'Creating account...');

  // Try Supabase auth
  const res = await dbRegisterStudent(email, pass, name);

  // Handle Supabase errors properly to prevent continuing if registration failed
  if (res && res.error) {
    const msg = res.error.message || res.error.toString();
    if (msg.toLowerCase().includes('rate limit')) {
      err.innerHTML = '<b>Testing rate limit exceeded!</b><br>To fix this, go to your Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Email, and disable <b>"Confirm email"</b>.';
    } else {
      err.textContent = msg;
    }
    err.classList.remove('hidden');
    hideLoading(btn);
    return;
  }

  // Auth successful or local auth processing
  const uid = generateUID();
  currentStudent = { uid, name, email, password: btoa(pass), initials: getInitials(name), color: '#7c3aed', photoUrl: '' };
  showToast('Account created! Complete your profile.', 'success');
  navigate('#setup');
}

async function processStudentAuth(name, email) {
  currentRole = 'student';
  const existing = students.find(s => s.email === email);
  if (existing && existing.profileComplete) {
    currentStudent = existing;
    await syncPlatformData();
    localStorage.setItem('edutech_session', JSON.stringify({ role: 'student', student: existing }));
    showToast(`Welcome back, ${existing.name} !`, 'success');
    navigate('#dashboard');
  } else if (existing) {
    currentStudent = existing;
    navigate('#setup');
  } else {
    const uid = generateUID();
    currentStudent = { uid, name, email, initials: getInitials(name), color: '#7c3aed', photoUrl: '' };
    navigate('#setup');
  }
}

// ─── Enrollment & Payment ──────────────────────────────────────
function enrollCourse(id) {
  id = parseInt(id);
  const c = COURSES_DATA.find(x => x.id === id);
  if (!c) return;
  if (!currentStudent) { showToast('Please login to enroll', 'error'); navigate('#login'); return; }
  if (enrolledCourses.includes(id)) { showToast('Already enrolled!'); navigate(`#video / ${id} -0`); return; }
  if (c.isFree) {
    doEnroll(id);
  } else {
    openPaymentOverlay(id);
  }
}

async function doEnroll(id) {
  id = parseInt(id);
  const c = COURSES_DATA.find(x => x.id === id);
  if (!c || enrolledCourses.includes(id)) return;
  enrolledCourses.push(id);
  const purchase = { courseId: c.id, courseName: c.title, amount: 0, studentName: currentStudent.name, studentEmail: currentStudent.email, txnId: 'FREE_ENROLL', status: 'approved' };
  await dbSavePurchase(purchase);
  localStorage.setItem(`edutech_user_courses_${currentStudent.uid}`, JSON.stringify(enrolledCourses));
  showToast(`🎉 Enrolled in ${c.title} !`, 'success');
  handleRoute();
}

function openPaymentOverlay(id) {
  id = parseInt(id);
  const c = COURSES_DATA.find(x => x.id === id);
  if (!c) return;
  paymentCourseId = id;
  const overlay = document.createElement('div');
  overlay.className = 'payment-overlay';
  overlay.id = 'payment-overlay';
  overlay.innerHTML = `
  < div class="payment-card" style = "max-width:460px;" >
      <div class="pm-header">
        <div><h2 style="font-weight:800;">Pay via UPI</h2><p style="color:var(--text3);font-size:0.8rem;">Enrolling in <strong>${c.title}</strong></p></div>
        <button onclick="closePayment()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:1.5rem;">&times;</button>
      </div>
      <div class="pm-body">
        <div id="pay-step1">
          <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:14px;padding:1.25rem;margin-bottom:1.25rem;text-align:center;">
            <div style="font-size:0.7rem;color:var(--text3);margin-bottom:4px;letter-spacing:1px;">COURSE FEE</div>
            <div style="font-size:2.4rem;font-weight:800;">₹${c.price}</div>
            <div style="font-size:0.75rem;color:var(--text3);margin-top:2px;"><s>₹${c.originalPrice}</s> &nbsp;•&nbsp; Save ₹${c.originalPrice - c.price}</div>
          </div>
          <div style="margin-bottom:1.25rem;">
            <label class="fls">Your UPI ID / VPA</label>
            <input id="pay-upi-id" placeholder="yourname@okicici" class="fli" style="text-align:center;font-size:1rem;"/>
          </div>
          <button onclick="showUPIPaymentDetails()" class="btn-primary" style="width:100%;">Generate Payment Request →</button>
        </div>
        <div id="pay-step2" class="hidden">
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:1rem;margin-bottom:1rem;">
            <div style="font-size:0.72rem;font-weight:700;color:#10b981;margin-bottom:8px;">📌 SEND PAYMENT</div>
            <div style="font-size:0.85rem;">Transfer <strong>₹${c.price}</strong> to:</div>
            <div style="font-size:1.15rem;font-weight:800;color:#10b981;margin:4px 0;">${ADMIN_UPI_ID}</div>
            <div style="font-size:0.76rem;color:var(--text3);">From your UPI: <span id="pay-from-upi" style="color:var(--text);"></span></div>
          </div>
          <div style="text-align:center;margin-bottom:1rem;">
            <img id="pay-qr" src="" style="border-radius:12px;border:4px solid white;width:150px;" />
            <div style="font-size:0.72rem;color:var(--text3);margin-top:6px;">Scan with any UPI app</div>
          </div>
          <div style="margin-bottom:1rem;">
            <label class="fls">UTR / Transaction ID</label>
            <input id="payment-txn" placeholder="12-digit UTR number" class="fli" style="text-align:center;letter-spacing:2px;font-weight:700;font-size:1rem;"/>
          </div>
          <div id="pm-proc" class="hidden" style="text-align:center;margin-bottom:1rem;color:var(--accent2);font-weight:700;font-size:0.85rem;">Submitting...</div>
          <button onclick="submitPayment()" id="pm-btn" class="btn-primary" style="width:100%;background:linear-gradient(135deg,#10b981,#059669);">Submit for Admin Verification ✓</button>
          <button onclick="document.getElementById('pay-step1').classList.remove('hidden');document.getElementById('pay-step2').classList.add('hidden');" style="width:100%;background:none;border:none;color:var(--text3);font-size:0.8rem;margin-top:10px;cursor:pointer;">← Change UPI ID</button>
        </div>
      </div>
    </div >
  <style>.fls{font - size:0.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:5px;}.fli{width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:0.88rem;font-family:var(--font);outline:none;}.btn-primary{padding:13px 20px;background:linear-gradient(135deg,var(--primary-light),var(--primary));color:white;border:none;border-radius:12px;font-size:0.9rem;font-weight:700;font-family:var(--font);cursor:pointer;}</style>`;
  document.body.appendChild(overlay);
}

function showUPIPaymentDetails() {
  const upiId = document.getElementById('pay-upi-id').value.trim();
  if (!upiId || !upiId.includes('@')) { showToast('Enter a valid UPI ID (e.g. name@bank)', 'error'); return; }
  const c = COURSES_DATA.find(x => x.id == paymentCourseId);
  const qrData = `upi://pay?pa=${ADMIN_UPI_ID}&pn=EduTech&am=${c.price}&cu=INR&tn=EduTech_${c.id}`;
  document.getElementById('pay-from-upi').textContent = upiId;
  document.getElementById('pay-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  document.getElementById('pay-step1').classList.add('hidden');
  document.getElementById('pay-step2').classList.remove('hidden');
}

async function submitPayment() {
  const txn = document.getElementById('payment-txn').value.trim();
  if (txn.length < 6) { showToast('Enter a valid UTR number', 'error'); return; }
  const btn = document.getElementById('pm-btn');
  const proc = document.getElementById('pm-proc');
  btn.disabled = true; btn.style.opacity = '0.5';
  proc.classList.remove('hidden');
  const c = COURSES_DATA.find(x => x.id == paymentCourseId);
  const upiId = document.getElementById('pay-upi-id')?.value || '';
  const purchase = { courseId: c.id, courseName: c.title, amount: c.price, studentName: currentStudent.name, studentEmail: currentStudent.email, txnId: txn, studentUpiId: upiId, status: 'pending' };
  await dbSavePurchase(purchase);
  const gp = JSON.parse(localStorage.getItem('edutech_pending_enrollments_global') || '[]');
  gp.push({ ...purchase, studentName: currentStudent.name });
  localStorage.setItem('edutech_pending_enrollments_global', JSON.stringify(gp));
  closePayment();
  showToast('⏳ Payment submitted! Awaiting admin verification.');
  handleRoute();
}

function closePayment() { document.getElementById('payment-overlay')?.remove(); }

// ─── Video Player ──────────────────────────────────────────────
function renderVideoPlayer(courseId, lessonIdx) {
  courseId = parseInt(courseId); lessonIdx = parseInt(lessonIdx) || 0;
  const c = COURSES_DATA.find(x => x.id === courseId);
  if (!c) { navigate('#courses'); return; }
  if (!enrolledCourses.includes(courseId) && currentRole !== 'admin') { navigate('#courses'); return; }

  const lesson = c.lessons[lessonIdx] || c.lessons[0];

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="page active page-transition" style="background:#050510;height:100vh;display:flex;flex-direction:column;overflow:hidden;">
    <header style="padding:0.75rem 1.5rem;background:rgba(10,10,26,0.95);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;z-index:10;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:1.25rem;">
        <button onclick="navigate('#mycourses')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:white;cursor:pointer;font-size:0.85rem;padding:6px 14px;border-radius:8px;font-family:var(--font);">← Back</button>
        <div>
          <div style="font-weight:700;color:white;font-size:0.95rem;">${c.title}</div>
          <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);">Lesson ${lessonIdx + 1} of ${c.lessons.length}: ${lesson.title}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:800;letter-spacing:1px;">▶ EduTech</span>
      </div>
    </header>

    <div style="flex:1;display:flex;overflow:hidden;">
      <div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;position:relative;">
        <div id="player-wrap" style="width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;background:#000;" onmousemove="document.getElementById('video-controls').style.opacity='1'; clearTimeout(window.ctrlTimeout); window.ctrlTimeout=setTimeout(()=>document.getElementById('video-controls').style.opacity='0', 2500);" onmouseleave="document.getElementById('video-controls').style.opacity='0'">
          <!-- 300% height hack to physically push YouTube top/bottom branding out of the visible 16:9 container -->
          <iframe id="course-iframe"
            src="${makeEmbedUrl(lesson.videoUrl)}&autoplay=1"
            frameborder="0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            style="width:100%;height:300%;position:absolute;top:-100%;left:0;pointer-events:none;border:none;display:block;">
          </iframe>
          <!-- Custom Play/Pause Overlay -->
          <div id="video-overlay" onclick="ytTogglePlay()" style="position:absolute;inset:0;z-index:10;cursor:pointer;display:flex;align-items:center;justify-content:center;">
             <div id="play-btn" style="width:64px;height:64px;background:rgba(124,58,237,0.85);backdrop-filter:blur(4px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:white;opacity:0;transition:opacity 0.2s;box-shadow:0 10px 25px rgba(0,0,0,0.5);">▶</div>
          </div>
          <!-- Top Watermark -->
          <div style="position:absolute;top:20px;left:20px;z-index:20;pointer-events:none;display:flex;align-items:center;gap:8px;">
             <div style="width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:6px;display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.25"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
             <span style="color:white;font-weight:800;font-size:0.9rem;text-shadow:0 2px 4px rgba(0,0,0,0.8);">EduTech</span>
          </div>
          <!-- Custom Control Bar -->
          <div id="video-controls" style="position:absolute;bottom:0;left:0;width:100%;padding:30px 20px 15px;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);z-index:30;display:flex;flex-direction:column;gap:8px;transition:opacity 0.4s;opacity:0;">
            <div style="display:flex;align-items:center;gap:15px;" onclick="event.stopPropagation()">
              <span id="video-time" style="color:white;font-size:0.75rem;font-weight:700;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px rgba(0,0,0,0.8);">0:00 / 0:00</span>
              <input type="range" id="video-progress" oninput="ytSeek(event)" value="0" min="0" max="100" style="flex:1;height:5px;border-radius:3px;cursor:pointer;accent-color:#7c3aed;background:rgba(255,255,255,0.2);-webkit-appearance:none;outline:none;">
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;" onclick="event.stopPropagation()">
              <div style="display:flex;gap:15px;align-items:center;">
                <button onclick="ytTogglePlay()" id="ctrl-play" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;width:30px;height:30px;">⏸</button>
                <button onclick="ytToggleMute()" id="ctrl-mute" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.5);">🔊</button>
                <div style="color:white;font-size:0.85rem;font-weight:700;margin-left:10px;">${lesson.title.replace(/'/g, "\\'")}</div>
              </div>
              <button onclick="ytFullscreen('player-wrap')" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.5);">⛶</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside style="width:320px;background:rgba(10,10,26,0.95);border-left:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;overflow:hidden;">
        <!-- Tabs -->
        <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;">
          <button onclick="switchPlayerTab('lessons')" id="ptab-lessons" style="flex:1;padding:12px;border:none;background:transparent;color:white;font-weight:700;font-size:0.78rem;cursor:pointer;border-bottom:2px solid #7c3aed;">Lessons</button>
          <button onclick="switchPlayerTab('resources')" id="ptab-resources" style="flex:1;padding:12px;border:none;background:transparent;color:rgba(255,255,255,0.4);font-weight:700;font-size:0.78rem;cursor:pointer;border-bottom:2px solid transparent;">Resources</button>
        </div>

        <!-- Lessons Panel -->
        <div id="panel-lessons" style="flex:1;overflow-y:auto;padding:1rem;">
          <div style="font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:0.75rem;">${c.lessons.length} LESSONS</div>
          ${c.lessons.map((l, i) => `
            <div onclick="navigate('#lesson/${courseId}-${i}')"
              style="padding:12px;border-radius:10px;margin-bottom:6px;cursor:pointer;display:flex;align-items:center;gap:10px;
              background:${i === lessonIdx ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.02)'};
              border:1px solid ${i === lessonIdx ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'};
              transition:all 0.15s;">
              <div style="width:28px;height:28px;border-radius:50%;background:${i === lessonIdx ? '#7c3aed' : 'rgba(255,255,255,0.08)'};
                display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:white;flex-shrink:0;">${i + 1}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.82rem;font-weight:${i === lessonIdx ? '700' : '500'};color:${i === lessonIdx ? 'white' : 'rgba(255,255,255,0.7)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.title}</div>
                <div style="font-size:0.7rem;color:rgba(255,255,255,0.3);">${l.duration || ''}</div>
              </div>
              ${i === lessonIdx ? '<div style="width:6px;height:6px;border-radius:50%;background:#7c3aed;flex-shrink:0;"></div>' : ''}
            </div>`).join('')}
        </div>

        <!-- Resources Panel -->
        <div id="panel-resources" class="hidden" style="flex:1;overflow-y:auto;padding:1rem;">
          <div style="font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:0.75rem;">LESSON RESOURCES</div>
          ${(lesson.resources || []).length === 0 ? `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,0.3);">No resources for this lesson.</div>` :
      (lesson.resources || []).map(r => `
              <a href="${r.url}" target="_blank" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);margin-bottom:8px;text-decoration:none;background:rgba(255,255,255,0.02);transition:all 0.15s;">
                <div style="font-size:1.2rem;">${r.type === 'pdf' ? '📄' : r.type === 'image' ? '🖼️' : r.type === 'figma' ? '🎨' : '🔗'}</div>
                <div style="flex:1;"><div style="font-size:0.82rem;font-weight:600;color:white;">${r.name}</div>
                <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);text-transform:uppercase;">${r.type}</div></div>
                <span style="font-size:0.7rem;color:#7c3aed;font-weight:700;">↓ Download</span>
              </a>`).join('')}
        </div>

        <!-- Navigation -->
        <div style="padding:1rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:8px;flex-shrink:0;">
          ${lessonIdx > 0 ? `<button onclick="navigate('#lesson/${courseId}-${lessonIdx - 1}')" style="flex:1;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:8px;font-family:var(--font);font-weight:700;font-size:0.8rem;cursor:pointer;">← Prev</button>` : '<div style="flex:1;"></div>'}
          ${lessonIdx < c.lessons.length - 1 ? `<button onclick="navigate('#lesson/${courseId}-${lessonIdx + 1}')" style="flex:1;padding:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;color:white;border-radius:8px;font-family:var(--font);font-weight:700;font-size:0.8rem;cursor:pointer;">Next →</button>` : '<button style="flex:1;padding:10px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.3);color:#10b981;border-radius:8px;font-family:var(--font);font-weight:700;font-size:0.8rem;cursor:pointer;">✓ Completed</button>'}
        </div>
      </aside>
    </div>
  </div>`;
  setTimeout(() => setupCustomPlayer('course-iframe', ''), 200);
}

function switchPlayerTab(tab) {
  document.getElementById('panel-lessons').classList.toggle('hidden', tab !== 'lessons');
  document.getElementById('panel-resources').classList.toggle('hidden', tab !== 'resources');
  document.getElementById('ptab-lessons').style.color = tab === 'lessons' ? 'white' : 'rgba(255,255,255,0.4)';
  document.getElementById('ptab-lessons').style.borderBottomColor = tab === 'lessons' ? '#7c3aed' : 'transparent';
  document.getElementById('ptab-resources').style.color = tab === 'resources' ? 'white' : 'rgba(255,255,255,0.4)';
  document.getElementById('ptab-resources').style.borderBottomColor = tab === 'resources' ? '#7c3aed' : 'transparent';
}

// ─── Custom YouTube API Controller ────────────────────────────
let ytPlayer = null;
let ytTimer = null;
let ytCurrentPrefix = '';

function setupCustomPlayer(iframeId, prefix = '') {
  if (ytTimer) clearInterval(ytTimer);
  ytPlayer = null;
  ytCurrentPrefix = prefix;
  const init = () => {
    const iframe = document.getElementById(iframeId);
    if (!iframe) return;
    if (window.YT && window.YT.Player) {
      ytPlayer = new YT.Player(iframeId, {
        events: {
          'onStateChange': (e) => {
            const playing = e.data === YT.PlayerState.PLAYING;
            const cPlay = document.getElementById(prefix + 'ctrl-play');
            if (cPlay) cPlay.innerText = playing ? '⏸' : '▶';
            const pBtn = document.getElementById(prefix + 'play-btn');
            if (pBtn) {
              pBtn.style.opacity = playing ? '0' : '1';
              pBtn.innerText = playing ? '⏸' : '▶';
            }
          }
        }
      });

      ytTimer = setInterval(() => {
        if (ytPlayer && ytPlayer.getCurrentTime) {
          const cur = ytPlayer.getCurrentTime() || 0;
          const dur = ytPlayer.getDuration() || 0;
          if (dur > 0) {
            const pct = (cur / dur) * 100;
            const prog = document.getElementById(prefix + 'video-progress');
            if (prog && document.activeElement !== prog) {
              prog.value = pct;
              prog.style.background = `linear-gradient(to right, #7c3aed ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;
            }
            const t = document.getElementById(prefix + 'video-time');
            if (t) t.innerText = formatTime(cur) + ' / ' + formatTime(dur);
          }
        }
      }, 500);
    } else {
      setTimeout(init, 200);
    }
  };
  init();
}

function ytTogglePlay() {
  if (!ytPlayer || !ytPlayer.getPlayerState) return;
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
}

function ytToggleMute() {
  if (!ytPlayer || !ytPlayer.isMuted) return;
  const btn = document.getElementById(ytCurrentPrefix + 'ctrl-mute');
  if (ytPlayer.isMuted()) { ytPlayer.unMute(); if (btn) btn.innerText = '🔊'; }
  else { ytPlayer.mute(); if (btn) btn.innerText = '🔇'; }
}

function ytSeek(e) {
  if (!ytPlayer || !ytPlayer.getDuration) return;
  const val = e.target.value;
  const dur = ytPlayer.getDuration();
  if (dur) ytPlayer.seekTo((val / 100) * dur, true);
}

function ytFullscreen(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else wrap.requestFullscreen();
}

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Ensure old play buttons work
function togglePlayPause() { ytTogglePlay(); }
function toggleAdminPlayPause() { ytTogglePlay(); }

// ─── Admin Shell ───────────────────────────────────────────────
function renderAdminShell(tab) {
  if (currentRole !== 'admin') { navigate('#login'); return; }
  applyTheme();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const profile = JSON.parse(localStorage.getItem('edutech_admin_profile') || '{"name":"Admin","email":"admin@edutech.com","role":"Platform Administrator","bio":"","phone":""}');
  const pendingCount = JSON.parse(localStorage.getItem('edutech_pending_enrollments_global') || '[]').length;
  const liveSessions = JSON.parse(localStorage.getItem('edutech_live_sessions') || '[]');
  const liveNow = liveSessions.filter(s => s.isLive).length;

  const brand = JSON.parse(localStorage.getItem('edutech_brand') || '{}');
  const platName = brand.name || 'EduTech';
  const platLogo = brand.logo || null;
  const logoHTML = platLogo
    ? `<img src="${platLogo}" style="width:34px;height:34px;border-radius:9px;object-fit:cover;">`
    : `<div style="width:34px;height:34px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:9px;display:flex;align-items:center;justify-content:center;">
         <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="white" fill-opacity="0.25"/><path d="M10 14L14 18L22 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </div>`;

  document.getElementById('app').innerHTML = `
  <div class="page active page-transition" style="display:flex;height:100vh;overflow:hidden;">
    <aside style="width:240px;background:rgba(10,10,26,0.98);border-right:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;flex-shrink:0;">
      <div style="padding:1.25rem 1.25rem 1rem;">
        <div style="display:flex;align-items:center;gap:8px;">
          ${logoHTML}
          <div>
            <div style="font-weight:800;font-size:0.95rem;color:white;">${platName}</div>
            <div style="font-size:0.6rem;background:rgba(124,58,237,0.3);color:#a78bfa;padding:1px 6px;border-radius:4px;font-weight:700;letter-spacing:1px;display:inline-block;">ADMIN</div>
          </div>
        </div>
      </div>
      <nav style="flex:1;padding:0.5rem 0.75rem;overflow-y:auto;">
        ${[
      { id: 'overview', icon: '📊', label: 'Overview' },
      { id: 'courses', icon: '📚', label: 'Courses' },
      { id: 'students', icon: '👥', label: 'Students', badge: pendingCount },
      { id: 'live', icon: '📹', label: 'Live Classes', badge: liveNow, badgeColor: '#ef4444' },
      { id: 'profile', icon: '👤', label: 'Admin Profile' },
      { id: 'settings', icon: '⚙️', label: 'Settings' }
    ].map(item => `
          <button onclick="navigate('#admin-${item.id === 'overview' ? '' : item.id}${item.id === 'overview' ? '' : ''}')" 
            style="${adNavStyle(tab === item.id)}position:relative;">
            <span>${item.icon}</span>
            <span>${item.label}</span>
            ${item.badge ? `<span style="position:absolute;right:12px;background:${item.badgeColor || '#ef4444'};color:white;border-radius:10px;font-size:0.65rem;font-weight:800;padding:1px 6px;">${item.badge}</span>` : ''}
          </button>`).join('')}
      </nav>
      <div style="padding:0.75rem;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;align-items:center;gap:8px;padding:0.75rem;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:8px;">
          <div style="width:32px;height:32px;border-radius:50%;background:${profile.photoUrl ? 'transparent' : 'linear-gradient(135deg,#7c3aed,#4f46e5)'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8rem;color:white;flex-shrink:0;overflow:hidden;">
            ${profile.photoUrl ? `<img src="${profile.photoUrl}" style="width:100%;height:100%;object-fit:cover;">` : getInitials(profile.name)}
          </div>
          <div><div style="font-size:0.8rem;font-weight:700;color:white;">${profile.name}</div><div style="font-size:0.67rem;color:rgba(255,255,255,0.3);">${profile.role}</div></div>
        </div>
        <button onclick="logout()" style="width:100%;padding:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:var(--font);">Logout</button>
      </div>
    </aside>
    <main style="flex:1;overflow-y:auto;background:var(--bg);">
      <header style="padding:1rem 1.5rem;border-bottom:1px solid var(--border2);background:var(--card);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:5;">
        <div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text);">${tab === 'overview' ? '📊 Overview' : tab === 'courses' ? '📚 Course Management' : tab === 'students' ? '👥 Students' : tab === 'live' ? '📹 Live Classes' : tab === 'profile' ? '👤 Admin Profile' : '⚙️ Settings'}</div>
          <div style="font-size:0.75rem;color:var(--text3);">EduTech Administration</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="font-size:0.8rem;color:var(--text3);">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <button onclick="toggleTheme()" class="theme-toggle-btn" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}" style="background:rgba(255,255,255,0.06);border:1px solid var(--border2);border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;transition:background 0.2s;">${isDark ? '☀️' : '🌙'}</button>
        </div>
      </header>
      <div id="admin-content" style="padding:1.5rem;"></div>
    </main>
  </div>`;

  // Wire nav buttons with proper routes
  const navBtns = document.querySelectorAll('aside nav button');
  const routes = ['#admin', '#admin-courses', '#admin-students', '#admin-live', '#admin-profile', '#admin-settings'];
  navBtns.forEach((btn, i) => { btn.onclick = () => navigate(routes[i]); });

  const act = document.getElementById('admin-content');
  if (tab === 'overview') renderAdminOverview(act);
  else if (tab === 'courses') renderAdminCourses(act);
  else if (tab === 'students') renderAdminStudents(act);
  else if (tab === 'live') renderAdminLiveClasses(act);
  else if (tab === 'settings') renderAdminSettings(act);
  else if (tab === 'profile') renderAdminProfile(act);
}

function adNavStyle(act) {
  return `width:100%;display:flex;align-items:center;gap:10px;padding:11px 1rem;border:none;background:${act ? 'rgba(124,58,237,0.15)' : 'transparent'};color:${act ? '#a78bfa' : 'rgba(255,255,255,0.45)'};font-weight:${act ? '700' : '500'};font-size:0.85rem;cursor:pointer;font-family:var(--font);border-radius:10px;margin-bottom:2px;border-left:3px solid ${act ? '#7c3aed' : 'transparent'};transition:all 0.15s;`;
}
