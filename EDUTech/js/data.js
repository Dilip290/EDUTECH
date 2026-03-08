/* ============================================================
   EduTech Platform - Course Data (2 Sample Courses with Lesson Series)
   ============================================================ */

let COURSES_DATA = [
  {
    id: 1,
    emoji: "🌐",
    category: "Web Development",
    title: "Full Stack Web Development Bootcamp",
    desc: "Master HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and deploy to production. Includes 15+ hands-on projects.",
    instructor: "Rahul Sharma",
    thumbnail: "",
    duration: "48 hrs",
    level: "Beginner",
    rating: 4.8,
    reviews: 2340,
    enrolled: 5200,
    price: 999,
    originalPrice: 9999,
    isFree: false,
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    lessons: [
      {
        id: 1,
        title: "Welcome & Course Overview",
        videoUrl: "https://www.youtube-nocookie.com/embed/ysEN5RaKOlA",
        duration: "12:30",
        notes: "",
        resources: [
          { name: "Course Roadmap PDF", url: "#", type: "pdf" },
          { name: "Setup Guide", url: "#", type: "pdf" }
        ]
      },
      {
        id: 2,
        title: "HTML Fundamentals & Semantic Tags",
        videoUrl: "https://www.youtube-nocookie.com/embed/UB1O30fR-EE",
        duration: "24:15",
        notes: "",
        resources: [
          { name: "HTML Cheat Sheet", url: "#", type: "pdf" }
        ]
      },
      {
        id: 3,
        title: "CSS Styling & Flexbox Layout",
        videoUrl: "https://www.youtube-nocookie.com/embed/1Rs2ND1ryYc",
        duration: "31:45",
        notes: "",
        resources: [
          { name: "CSS Flexbox Guide", url: "#", type: "pdf" },
          { name: "Layout Examples", url: "#", type: "image" }
        ]
      },
      {
        id: 4,
        title: "JavaScript ES6+ Core Concepts",
        videoUrl: "https://www.youtube-nocookie.com/embed/hdI2bqOjy3c",
        duration: "45:20",
        notes: "",
        resources: [
          { name: "JS ES6 Reference Sheet", url: "#", type: "pdf" }
        ]
      }
    ]
  },
  {
    id: 4,
    emoji: "🎨",
    category: "Design",
    title: "UI/UX Design with Figma",
    desc: "Master user interface and experience design. Learn Figma, design systems, prototyping, user research, and design thinking methodology.",
    instructor: "Sneha Gupta",
    thumbnail: "",
    duration: "28 hrs",
    level: "Beginner",
    rating: 4.6,
    reviews: 1560,
    enrolled: 4200,
    price: 0,
    originalPrice: 5999,
    isFree: true,
    tags: ["Figma", "UI", "UX", "Design"],
    lessons: [
      {
        id: 1,
        title: "Introduction to Figma",
        videoUrl: "https://www.youtube-nocookie.com/embed/FTFaQWZBqQ8",
        duration: "18:00",
        notes: "",
        resources: [
          { name: "Figma Getting Started Guide", url: "#", type: "pdf" }
        ]
      },
      {
        id: 2,
        title: "Design Principles & Color Theory",
        videoUrl: "https://www.youtube-nocookie.com/embed/AvgCkHrcj90",
        duration: "22:40",
        notes: "",
        resources: [
          { name: "Color Theory PDF", url: "#", type: "pdf" },
          { name: "Color Palette Examples", url: "#", type: "image" }
        ]
      },
      {
        id: 3,
        title: "Building Components & Design Systems",
        videoUrl: "https://www.youtube-nocookie.com/embed/YmdtXc_bzDw",
        duration: "35:10",
        notes: "",
        resources: [
          { name: "Design System Template", url: "#", type: "figma" }
        ]
      }
    ]
  }
];

// Always reset courses to force 2-course catalogue
localStorage.setItem('edutech_courses', JSON.stringify(COURSES_DATA));

const LIVE_CLASSES_DATA = [
  { id: 1, title: "Advanced React Hooks Deep Dive", instructor: "Rahul Sharma", initials: "RS", time: "Today, 3:00 PM", duration: "90 min", course: "Full Stack Web Dev", isLive: true, meetLink: "#" },
  { id: 2, title: "Figma Advanced Prototyping", instructor: "Sneha Gupta", initials: "SG", time: "Tomorrow, 2:00 PM", duration: "60 min", course: "UI/UX Design", isLive: false, meetLink: "#" },
  { id: 3, title: "Node.js REST APIs with Express", instructor: "Rahul Sharma", initials: "RS", time: "Wed, 5:00 PM", duration: "60 min", course: "Full Stack Web Dev", isLive: false, meetLink: "#" }
];

const SCHEDULE_DATA = [
  { day: "Mon", date: "10", events: [{ title: "React Hooks", time: "3:00 PM", color: "#7c3aed" }] },
  { day: "Tue", date: "11", events: [{ title: "Node.js APIs", time: "5:00 PM", color: "#2563eb" }] },
  { day: "Wed", date: "12", events: [{ title: "Figma Lab", time: "4:00 PM", color: "#059669" }] },
  { day: "Thu", date: "13", events: [{ title: "Code Review", time: "11:00 AM", color: "#d97706" }] },
  { day: "Fri", date: "14", events: [{ title: "Project Lab", time: "3:00 PM", color: "#7c3aed" }, { title: "Q&A Session", time: "5:30 PM", color: "#dc2626" }] },
  { day: "Sat", date: "15", events: [{ title: "Mini Hackathon", time: "10:00 AM", color: "#0891b2" }] },
  { day: "Sun", date: "16", events: [] }
];

const RESOURCES_DATA = [
  { icon: "📄", color: "#3b82f6", title: "HTML & CSS Cheat Sheet", desc: "Quick reference for HTML5 & CSS3 properties", tag: "PDF", url: "#", course: "Full Stack Web Dev" },
  { icon: "📄", color: "#7c3aed", title: "JavaScript ES6+ Guide", desc: "Arrow functions, promises, async/await and more", tag: "PDF", url: "#", course: "Full Stack Web Dev" },
  { icon: "💻", color: "#10b981", title: "React Starter Kit", desc: "Boilerplate code with hooks and routing", tag: "Code", url: "#", course: "Full Stack Web Dev" },
  { icon: "🎨", color: "#f59e0b", title: "Figma Design System Template", desc: "Complete design tokens, components, and templates", tag: "Figma", url: "#", course: "UI/UX Design" },
  { icon: "📄", color: "#ec4899", title: "Color Theory Reference", desc: "Color wheel, palettes, and typography guide", tag: "PDF", url: "#", course: "UI/UX Design" }
];
