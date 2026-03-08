/* ============================================================
   EduTech – Supabase Database Integration
   ============================================================
   
   SETUP INSTRUCTIONS:
   1. Go to https://supabase.com and create a free project
   2. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
   3. Go to SQL Editor in your Supabase dashboard and run:

   CREATE TABLE students (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     uid TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     roll_number TEXT,
     dob TEXT,
     gender TEXT,
     college TEXT,
     institute TEXT,
     qualification TEXT,
     year TEXT,
     city TEXT,
     state TEXT,
     address TEXT,
     courses_interested TEXT,
     goal TEXT,
     learning_mode TEXT,
     linkedin TEXT,
     source TEXT,
     initials TEXT,
     color TEXT,
     photo_url TEXT,
     status TEXT DEFAULT 'Active',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE purchases (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     course_id INT NOT NULL,
     course_name TEXT,
     amount NUMERIC DEFAULT 0,
     student_name TEXT,
     student_email TEXT,
     txn_id TEXT,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable Row Level Security (optional but recommended)
   ALTER TABLE students ENABLE ROW LEVEL SECURITY;
   ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
   
   -- Allow anonymous inserts/reads for demo
   CREATE POLICY "Allow all" ON students FOR ALL USING (true);
   CREATE POLICY "Allow all" ON purchases FOR ALL USING (true);

   ============================================================ */

// ─── Configuration ───────────────────────────────────────────
const SUPABASE_URL = 'https://vdfpmzqoxlwwrlhljyay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZnBtenFveGx3d3JsaGxqeWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDU5MzcsImV4cCI6MjA4ODEyMTkzN30.tjFZD8PUX6yzmT1fKeH4TU8d9loEmzeUTVsFhnpJwvU';

let supabaseClient = null;
let isSupabaseReady = false;

function initSupabase() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_KEY') {
        console.warn('[EduTech] Supabase not configured. Using localStorage fallback.');
        return false;
    }
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSupabaseReady = true;
            console.log('%c[EduTech] ✅ Supabase Connected', 'color: #10b981; font-weight: bold; background: rgba(16,185,129,0.1); padding: 2px 5px;');
            return true;
        }
    } catch (e) {
        console.warn('[EduTech] Supabase init failed:', e);
    }
    return false;
}

// ─── Student Operations ──────────────────────────────────────
async function dbSaveStudent(student) {
    // Always save to localStorage
    let students = JSON.parse(localStorage.getItem('edutech_students') || '[]');
    const idx = students.findIndex(s => s.uid === student.uid);
    if (idx >= 0) students[idx] = student;
    else students.push(student);
    localStorage.setItem('edutech_students', JSON.stringify(students));

    if (!isSupabaseReady) return;
    try {
        await supabaseClient.from('students').upsert({
            uid: student.uid,
            name: student.name,
            email: student.email,
            phone: student.phone,
            roll_number: student.rollNumber,
            dob: student.dob,
            gender: student.gender,
            college: student.college,
            institute: student.institute,
            qualification: student.qualification,
            year: student.year,
            city: student.city,
            state: student.state,
            address: student.address,
            courses_interested: student.coursesInterested,
            goal: student.goal,
            learning_mode: student.learningMode,
            linkedin: student.linkedin,
            source: student.source,
            initials: student.initials,
            color: student.color,
            photo_url: student.photoUrl
        }, { onConflict: 'uid' });
    } catch (e) {
        console.warn('[EduTech] Supabase student save failed:', e);
    }
}

async function dbGetStudents() {
    if (isSupabaseReady) {
        try {
            const { data, error } = await supabaseClient.from('students').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                console.log(`[EduTech] [DB] Fetched ${data.length} students from Supabase`);
                // Sync to localStorage
                const mapped = data.map(s => ({
                    uid: s.uid, name: s.name, email: s.email, phone: s.phone,
                    rollNumber: s.roll_number, dob: s.dob, gender: s.gender,
                    college: s.college, institute: s.institute, qualification: s.qualification,
                    year: s.year, city: s.city, state: s.state, address: s.address,
                    coursesInterested: s.courses_interested, goal: s.goal,
                    learningMode: s.learning_mode, linkedin: s.linkedin, source: s.source,
                    initials: s.initials, color: s.color, photoUrl: s.photo_url,
                    status: s.status, registerDate: s.created_at
                }));
                localStorage.setItem('edutech_students', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) {
            console.warn('[EduTech] Supabase fetch failed:', e);
        }
    }
    return JSON.parse(localStorage.getItem('edutech_students') || '[]');
}

// ─── Purchase Operations ─────────────────────────────────────
async function dbSavePurchase(purchase) {
    let purchases = JSON.parse(localStorage.getItem('edutech_purchases') || '[]');
    purchases.push(purchase);
    localStorage.setItem('edutech_purchases', JSON.stringify(purchases));

    if (!isSupabaseReady) return;
    try {
        await supabaseClient.from('purchases').insert({
            course_id: purchase.courseId,
            course_name: purchase.courseName,
            amount: purchase.amount,
            student_name: purchase.studentName,
            student_email: purchase.studentEmail,
            txn_id: purchase.txnId,
            status: purchase.status || 'pending'
        });
    } catch (e) {
        console.warn('[EduTech] Supabase purchase save failed:', e);
    }
}

async function dbGetPurchases() {
    if (isSupabaseReady) {
        try {
            const { data, error } = await supabaseClient.from('purchases').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                console.log(`[EduTech] [DB] Fetched ${data.length} purchases from Supabase`);
                const mapped = data.map(p => ({
                    courseId: p.course_id, courseName: p.course_name, amount: p.amount,
                    studentName: p.student_name, studentEmail: p.student_email,
                    txnId: p.txn_id, date: p.created_at, status: p.status
                }));
                localStorage.setItem('edutech_purchases', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) {
            console.warn('[EduTech] Supabase purchases fetch failed:', e);
        }
    }
    return JSON.parse(localStorage.getItem('edutech_purchases') || '[]');
}

// ─── Email / Password Auth ──────────────────────────────────
async function dbRegisterStudent(email, password, name) {
    if (!isSupabaseReady) return { error: 'Supabase not configured — using local auth' };
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { name } }
        });
        return { data, error };
    } catch (e) {
        return { error: e.message };
    }
}

async function dbSignInStudent(email, password) {
    if (!isSupabaseReady) return { error: 'Supabase not configured — using local auth' };
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        return { data, user: data?.user, error };
    } catch (e) {
        return { error: e.message };
    }
}

async function dbSignOut() {
    if (!isSupabaseReady) return;
    try { await supabaseClient.auth.signOut(); } catch (e) { }
}
