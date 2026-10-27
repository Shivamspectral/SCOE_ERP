export const college = {
  name: "Siddhant College of Engineering",
  group: "Siddhant Group of Institutions",
  trust: "Chanakya Education Society (CAYMET)",
  motto: "॥ ज्ञानम सर्वार्थ साधनम् ॥",
  short: "SCOE",
  system: "Student Council & College Management System",
  developer: "ASTRA Developers Team",
  academicYear: "2025-26",
  semester: "Semester V",
  campus: "Sudumbare, Chakan-Talegaon Road, Pune, Maharashtra 412109",
  affiliation: "Approved by AICTE New Delhi, Recognized by Govt. of Maharashtra & Affiliated to SPPU Pune",
  dpuCode: "EN6149",
};

export const student = {
  id: "SCOE2023CE042",
  prn: "72124589H",
  name: "Rahul Patil",
  firstName: "Rahul",
  role: "Student",
  branch: "Computer Engineering",
  branchShort: "CE",
  year: "Third Year (TE)",
  semester: "Semester V",
  division: "A",
  rollNo: "TE-CE-A-42",
  email: "rahul.patil@siddhantcoe.edu.in",
  personalEmail: "rahul.patil2005@gmail.com",
  phone: "+91 98220 41042",
  cgpa: 8.64,
  attendance: 92,
  bloodGroup: "B+",
  dob: "14 Aug 2005",
  address: "A-402, Shradha Residency, Chakan-Talegaon Road, Pune 410501",
  permanentAddress: "At Post Sudumbare, Maval, Dist. Pune 412109",
  mentor: "Prof. R. Kale",
  mentorEmail: "r.kale@siddhantcoe.edu.in",
  mentorPhone: "+91 94230 11223",
  admissionYear: 2023,
  validThru: "June 2027",
  emergencyContact: "Mr. Suresh Patil (Father) — +91 98221 88990",
  councilRole: "Technical Secretary & ASTRA Lead",
  category: "General",
  hostelResident: false,
  busRoute: "Route 04 (Chakan - Talegaon - SCOE Campus)",
  sgpaHistory: [
    { sem: "Sem I", sgpa: 8.35, credits: 20, status: "Passed" },
    { sem: "Sem II", sgpa: 8.50, credits: 20, status: "Passed" },
    { sem: "Sem III", sgpa: 8.82, credits: 22, status: "Passed" },
    { sem: "Sem IV", sgpa: 8.90, credits: 22, status: "Passed" },
  ]
};

export const attendanceData = {
  overall: 92,
  totalConducted: 278,
  totalAttended: 256,
  totalAbsent: 22,
  defaulterThreshold: 75,
  subjects: [
    {
      code: "CE-501",
      subject: "Data Structures",
      faculty: "Prof. R. Kale",
      conducted: 48,
      attended: 45,
      absent: 3,
      percentage: 93.8,
      type: "Theory",
      status: "Safe",
      room: "CE-201"
    },
    {
      code: "CE-502",
      subject: "Database Management Systems",
      faculty: "Prof. A. Deshmukh",
      conducted: 48,
      attended: 46,
      absent: 2,
      percentage: 95.8,
      type: "Theory",
      status: "Safe",
      room: "CE-201"
    },
    {
      code: "CE-503",
      subject: "Operating Systems",
      faculty: "Dr. S. Pawar",
      conducted: 48,
      attended: 42,
      absent: 6,
      percentage: 87.5,
      type: "Theory",
      status: "Safe",
      room: "CE-204"
    },
    {
      code: "CE-504",
      subject: "Computer Networks",
      faculty: "Dr. M. Joshi",
      conducted: 48,
      attended: 41,
      absent: 7,
      percentage: 85.4,
      type: "Theory",
      status: "Safe",
      room: "CE-105"
    },
    {
      code: "CE-505",
      subject: "Software Engineering",
      faculty: "Prof. N. Kulkarni",
      conducted: 46,
      attended: 43,
      absent: 3,
      percentage: 93.5,
      type: "Theory",
      status: "Safe",
      room: "CE-202"
    },
    {
      code: "CE-506",
      subject: "Theory of Computation",
      faculty: "Dr. V. Shinde",
      conducted: 40,
      attended: 28,
      absent: 12,
      percentage: 70.0,
      type: "Theory",
      status: "Warning",
      room: "CE-203"
    },
    {
      code: "CE-507L",
      subject: "DBMS Laboratory",
      faculty: "Prof. A. Deshmukh",
      conducted: 18,
      attended: 18,
      absent: 0,
      percentage: 100.0,
      type: "Practical",
      status: "Safe",
      room: "Lab-3"
    },
    {
      code: "CE-508L",
      subject: "OS Laboratory",
      faculty: "Dr. S. Pawar",
      conducted: 18,
      attended: 17,
      absent: 1,
      percentage: 94.4,
      type: "Practical",
      status: "Safe",
      room: "Lab-2"
    },
    {
      code: "CE-509L",
      subject: "CN Laboratory",
      faculty: "Dr. M. Joshi",
      conducted: 18,
      attended: 16,
      absent: 2,
      percentage: 88.9,
      type: "Practical",
      status: "Safe",
      room: "Lab-4"
    }
  ],
  recentLogs: [
    { date: "15 Sep 2026", subject: "Theory of Computation", time: "10:15 - 11:15", faculty: "Dr. V. Shinde", status: "Present" },
    { date: "15 Sep 2026", subject: "Software Engineering", time: "09:00 - 10:00", faculty: "Prof. N. Kulkarni", status: "Present" },
    { date: "14 Sep 2026", subject: "Data Structures", time: "09:00 - 10:00", faculty: "Prof. R. Kale", status: "Present" },
    { date: "14 Sep 2026", subject: "Operating Systems", time: "10:15 - 11:15", faculty: "Dr. S. Pawar", status: "Present" },
    { date: "14 Sep 2026", subject: "DBMS Lab", time: "11:30 - 12:30", faculty: "Prof. A. Deshmukh", status: "Present" },
    { date: "14 Sep 2026", subject: "Computer Networks", time: "01:30 - 02:30", faculty: "Dr. M. Joshi", status: "Absent" },
    { date: "12 Sep 2026", subject: "Theory of Computation", time: "10:15 - 11:15", faculty: "Dr. V. Shinde", status: "Duty Leave" },
    { date: "11 Sep 2026", subject: "Database Management", time: "09:00 - 10:00", faculty: "Prof. A. Deshmukh", status: "Present" },
    { date: "11 Sep 2026", subject: "CN Lab", time: "11:30 - 12:30", faculty: "Dr. M. Joshi", status: "Present" },
    { date: "10 Sep 2026", subject: "Theory of Computation", time: "09:00 - 10:00", faculty: "Dr. V. Shinde", status: "Absent" },
  ]
};

export const attendanceTrend = [
  { month: "Jul", percent: 84 },
  { month: "Aug", percent: 86 },
  { month: "Sep", percent: 85 },
  { month: "Oct", percent: 90 },
  { month: "Nov", percent: 89 },
  { month: "Dec", percent: 92 },
];

export const departmentStrength = [
  { dept: "CE", students: 480 },
  { dept: "IT", students: 390 },
  { dept: "ENTC", students: 350 },
  { dept: "MECH", students: 420 },
  { dept: "CIVIL", students: 300 },
  { dept: "AIDS", students: 280 },
];

export const timetable = [
  { time: "09:00 - 10:00", subject: "Data Structures", room: "CE-201", faculty: "Prof. R. Kale", type: "Lecture" },
  { time: "10:15 - 11:15", subject: "Operating Systems", room: "CE-204", faculty: "Dr. S. Pawar", type: "Lecture" },
  { time: "11:30 - 12:30", subject: "DBMS Laboratory", room: "Lab-3", faculty: "Prof. A. Deshmukh", type: "Lab" },
  { time: "01:30 - 02:30", subject: "Computer Networks", room: "CE-105", faculty: "Dr. M. Joshi", type: "Lecture" },
  { time: "02:45 - 03:45", subject: "Software Engineering", room: "CE-202", faculty: "Prof. N. Kulkarni", type: "Lecture" },
];

export const weeklyTimetable = {
  Monday: [
    { subject: "Data Structures", time: "09:00 - 10:00", room: "CE-201", faculty: "Prof. R. Kale", type: "Lecture" },
    { subject: "Operating Systems", time: "10:15 - 11:15", room: "CE-204", faculty: "Dr. S. Pawar", type: "Lecture" },
    { subject: "DBMS Lab", time: "11:30 - 12:30", room: "Lab-3", faculty: "Prof. A. Deshmukh", type: "Lab" },
    { subject: "Computer Networks", time: "01:30 - 02:30", room: "CE-105", faculty: "Dr. M. Joshi", type: "Lecture" },
  ],
  Tuesday: [
    { subject: "Software Engineering", time: "09:00 - 10:00", room: "CE-202", faculty: "Prof. N. Kulkarni", type: "Lecture" },
    { subject: "Theory of Computation", time: "10:15 - 11:15", room: "CE-203", faculty: "Dr. V. Shinde", type: "Lecture" },
    { subject: "Data Structures Lab", time: "11:30 - 12:30", room: "Lab-1", faculty: "Prof. R. Kale", type: "Lab" },
    { subject: "Database Management", time: "01:30 - 02:30", room: "CE-201", faculty: "Prof. A. Deshmukh", type: "Lecture" },
  ],
  Wednesday: [
    { subject: "Computer Networks", time: "09:00 - 10:00", room: "CE-105", faculty: "Dr. M. Joshi", type: "Lecture" },
    { subject: "Operating Systems", time: "10:15 - 11:15", room: "CE-204", faculty: "Dr. S. Pawar", type: "Lecture" },
    { subject: "Mini Project", time: "11:30 - 12:30", room: "Lab-5", faculty: "Prof. R. Kale", type: "Project" },
    { subject: "Software Engineering", time: "01:30 - 02:30", room: "CE-202", faculty: "Prof. N. Kulkarni", type: "Lecture" },
  ],
  Thursday: [
    { subject: "Theory of Computation", time: "09:00 - 10:00", room: "CE-203", faculty: "Dr. V. Shinde", type: "Lecture" },
    { subject: "Data Structures", time: "10:15 - 11:15", room: "CE-201", faculty: "Prof. R. Kale", type: "Lecture" },
    { subject: "OS Lab", time: "11:30 - 12:30", room: "Lab-2", faculty: "Dr. S. Pawar", type: "Lab" },
    { subject: "Database Management", time: "01:30 - 02:30", room: "CE-201", faculty: "Prof. A. Deshmukh", type: "Lecture" },
  ],
  Friday: [
    { subject: "Database Management", time: "09:00 - 10:00", room: "CE-201", faculty: "Prof. A. Deshmukh", type: "Lecture" },
    { subject: "Computer Networks", time: "10:15 - 11:15", room: "CE-105", faculty: "Dr. M. Joshi", type: "Lecture" },
    { subject: "CN Lab", time: "11:30 - 12:30", room: "Lab-4", faculty: "Dr. M. Joshi", type: "Lab" },
    { subject: "Aptitude & Soft Skills", time: "01:30 - 02:30", room: "Seminar Hall", faculty: "Training Cell", type: "Seminar" },
  ],
  Saturday: [
    { subject: "Seminar / Guest Lecture", time: "09:00 - 10:00", room: "Auditorium", faculty: "Industry Expert", type: "Guest" },
    { subject: "Club Activities", time: "10:15 - 11:15", room: "Various", faculty: "Faculty Mentors", type: "Activity" },
  ],
};


export const events = [
  {
    id: "ev1",
    name: "Innovatia 2026 — Technical Symposium",
    date: "26 Sep 2026",
    time: "09:00 AM",
    venue: "Main Auditorium",
    category: "Technical",
    organizer: "Computer Engineering Dept. & Student Council",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    description: "The annual flagship technical symposium of Siddhant College of Engineering featuring project exhibitions, national hackathon, paper presentations, and tech talks from leaders across Hinjewadi and Talawade IT parks.",
    schedule: [
      { time: "09:00 AM", activity: "Inauguration & Keynote Speech by Industry Guest" },
      { time: "10:30 AM", activity: "National Level Paper Presentations" },
      { time: "01:00 PM", activity: "6-Hour ASTRA Hackathon Sprint begins" },
      { time: "05:00 PM", activity: "Project Evaluation & Grand Prize Distribution (₹50,000 Pool)" },
    ],
    participants: 420,
    maxCapacity: 500,
    entryFee: "Free for SCOE Students",
    coordinator: "Prof. R. Kale & Rahul Patil (ASTRA Lead)"
  },
  {
    id: "ev2",
    name: "Annual Sports Week 'KHEL-SCOE 2026'",
    date: "01 Oct 2026",
    time: "08:00 AM",
    venue: "SCOE Sports Ground & Complex",
    category: "Sports",
    organizer: "Sports Committee & Student Council",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60",
    description: "A week-long inter-department sports championship covering Cricket, Football, Volleyball, Badminton, Kabaddi, Chess, Table Tennis and Track Athletics. Trophies and zonal qualifications for best department.",
    schedule: [
      { time: "08:00 AM", activity: "Torch Relay & March Past by all Departments" },
      { time: "10:00 AM", activity: "Inter-department Cricket & Football Prelims" },
      { time: "02:00 PM", activity: "Indoor Arena: Badminton & Table Tennis" },
      { time: "05:00 PM", activity: "Athletics 100m, 200m, 400m Heats" },
    ],
    participants: 650,
    maxCapacity: 800,
    entryFee: "₹100 per team",
    coordinator: "Mr. D. Gaikwad & Aditya Jagtap (Sports Secretary)"
  },
  {
    id: "ev3",
    name: "Rangtarang 2026 — Annual Cultural Fest",
    date: "10 Oct 2026",
    time: "05:00 PM",
    venue: "Open Air Theatre (OAT)",
    category: "Cultural",
    organizer: "Cultural Club & Student Council",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60",
    description: "SCOE's biggest cultural extravaganza with drama, dance, battle of bands, fashion showcase, traditional Maharashtrian folk presentations, and a celebrity DJ night.",
    schedule: [
      { time: "05:00 PM", activity: "Ganesh Vandana & Classical Dance Showcase" },
      { time: "06:30 PM", activity: "Battle of the Bands (Western & Bollywood Fusion)" },
      { time: "08:30 PM", activity: "Annual Runway Fashion Show & DJ EDM Night" },
    ],
    participants: 800,
    maxCapacity: 1200,
    entryFee: "Free with Student ID",
    coordinator: "Prof. N. Kulkarni & Riya Sharma (Cultural Sec)"
  },
  {
    id: "ev4",
    name: "AWS Cloud Practitioner Workshop",
    date: "18 Sep 2026",
    time: "11:00 AM",
    venue: "Seminar Hall 2 & Cloud Lab",
    category: "Workshop",
    organizer: "AWS Student Builder Group",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    description: "A hands-on workshop covering core AWS cloud services (EC2, S3, RDS, Lambda, VPC) and guided preparation for the AWS Certified Cloud Practitioner examination with 50% discount vouchers.",
    schedule: [
      { time: "11:00 AM", activity: "Cloud Fundamentals & Architecture Principles" },
      { time: "12:30 PM", activity: "Live Hands-on Lab: Deploying 3-tier App on EC2 & S3" },
      { time: "02:30 PM", activity: "Free Voucher Distribution & Certification Roadmap Q&A" },
    ],
    participants: 180,
    maxCapacity: 200,
    entryFee: "Free",
    coordinator: "Prof. A. Deshmukh & AWS Student Ambassador"
  },
  {
    id: "ev5",
    name: "Industry Visit — MIDC Chakan Automotive & IT Units",
    date: "05 Oct 2026",
    time: "08:30 AM",
    venue: "Assembly at SCOE Main Gate",
    category: "Academics",
    organizer: "Training & Placement Cell",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60",
    description: "An industrial immersion tour for TE students to leading smart-manufacturing, robotics and industrial IoT facilities in the Chakan automobile hub.",
    schedule: [
      { time: "08:30 AM", activity: "Bus Departure from campus" },
      { time: "10:30 AM", activity: "Plant Tour, Automated Assembly Line & Robotics Demo" },
      { time: "01:00 PM", activity: "Q&A with Lead Systems Engineers & HR Team" },
      { time: "02:30 PM", activity: "Return to campus" }
    ],
    participants: 90,
    maxCapacity: 100,
    entryFee: "₹150 (Transport included)",
    coordinator: "T&P Cell & Department HODs"
  },
  {
    id: "ev6",
    name: "Grand Alumni Meet 2026",
    date: "15 Oct 2026",
    time: "04:00 PM",
    venue: "Central Lawn & Amphitheatre",
    category: "Networking",
    organizer: "SCOE Alumni Association",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60",
    description: "Reconnect with over 500 alumni working at Google, Microsoft, TCS, Infosys, Cognizant, and entrepreneur alumni. Mentorship circles and career networking.",
    schedule: [
      { time: "04:00 PM", activity: "Welcome & Felicitation of Distinguished Alumni" },
      { time: "05:00 PM", activity: "Panel Discussion: Engineering Careers in the AI Era" },
      { time: "06:30 PM", activity: "Networking Hi-Tea & Campus Memories Walk" }
    ],
    participants: 300,
    maxCapacity: 450,
    entryFee: "Free",
    coordinator: "Alumni In-charge & Student Council"
  }
];

export const noticeCategoryColor = {
  Academics: "bg-primary/10 text-primary border-primary/20",
  Events: "bg-accent/15 text-accent-foreground border-accent/30",
  Accounts: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  Library: "bg-success/10 text-success border-success/20",
  Council: "bg-primary/15 text-primary border-primary/30",
  Placements: "bg-warning/15 text-warning-foreground border-warning/30",
  General: "bg-muted text-muted-foreground border-border",
};

export const notices = [
  {
    id: "n1",
    title: "Semester V In-sem Examination Timetable Published",
    category: "Academics",
    date: "14 Sep 2026",
    pinned: true,
    important: true,
    issuedBy: "Office of the Controller of Examinations",
    description: "The in-semester theory examination schedule for Semester V (All Branches) for AY 2025-26 has been published. Exams commence from 28 Sep 2026. Hall tickets will be issued through the student portal from 22 Sep. Students with attendance below 75% must contact their respective HODs immediately.",
    attachment: "Insem_Exam_Schedule_Sep2026.pdf",
    attachmentSize: "320 KB"
  },
  {
    id: "n2",
    title: "Student Council Official Body 2025-26 Confirmed",
    category: "Council",
    date: "12 Sep 2026",
    pinned: true,
    important: true,
    issuedBy: "Principal & Student Welfare Committee",
    description: "The official Student Council for Siddhant College of Engineering for Academic Year 2025-26 has been duly constituted in accordance with Maharashtra Public Universities Act guidelines. We congratulate President Tanmay Patil, VP Shruti Kulkarni, Tech Lead Rahul Patil and the entire executive board.",
    attachment: "Student_Council_Notification_2025-26.pdf",
    attachmentSize: "210 KB"
  },
  {
    id: "n3",
    title: "Annual Sports Week 'KHEL-SCOE 2026' Registrations Open",
    category: "Events",
    date: "10 Sep 2026",
    pinned: false,
    important: true,
    issuedBy: "Sports Department & Council Sports Secretary",
    description: "Department team entries for Cricket, Football, Volleyball, Table Tennis, Badminton and Athletics must be submitted to the sports department by 22 Sep 2026. Inter-department fixtures will be drawn on 25 Sep.",
    attachment: "Khel_SCOE_Rules_and_Entry_Form.pdf",
    attachmentSize: "450 KB"
  },
  {
    id: "n4",
    title: "Academic Fee Payment Last Date Extended to 30 September",
    category: "Accounts",
    date: "08 Sep 2026",
    pinned: false,
    important: false,
    issuedBy: "Accounts Section, Siddhant Group of Institutions",
    description: "In view of student requests, the competent authority has extended the deadline for the payment of the second installment of college fees to 30 September 2026 without late fee. Online fee payment can be completed via the student portal or ERP gateway.",
    attachment: "Fee_Circular_Extension_Sep2026.pdf",
    attachmentSize: "180 KB"
  },
  {
    id: "n5",
    title: "Campus Placement Drives — Infosys & TCS Digital Schedule",
    category: "Placements",
    date: "06 Sep 2026",
    pinned: false,
    important: true,
    issuedBy: "Training & Placement Cell (T&P)",
    description: "Infosys Systems Engineer drive is scheduled for 24 Sep 2026 (Packages ₹4.5 - ₹6.5 LPA) and TCS Digital drive on 27 Sep 2026 (Package ₹7.0 LPA). Eligible registered students must attend the mandatory pre-placement briefing on 20 Sep at 10 AM in the Auditorium.",
    attachment: "Infosys_TCS_Drive_Guidelines.pdf",
    attachmentSize: "520 KB"
  },
  {
    id: "n6",
    title: "Central Library Membership Card Renewal & E-Library Access",
    category: "Library",
    date: "02 Sep 2026",
    pinned: false,
    important: false,
    issuedBy: "Librarian, SCOE Central Library",
    description: "All students are instructed to renew their physical barcoded library cards at the circulation counter before 20 Sep 2026. DELNET and IEEE Xplore digital access credentials have been reset for the new academic semester.",
    attachment: "E_Resources_Access_Manual.pdf",
    attachmentSize: "290 KB"
  },
  {
    id: "n7",
    title: "Campus High-Speed Wi-Fi Upgrade & Student Portal App",
    category: "Council",
    date: "28 Aug 2026",
    pinned: false,
    important: false,
    issuedBy: "Student Council IT Cell & System Admin",
    description: "In response to council grievance #GRV-2026-042, new Wi-Fi 6 access points have been deployed across academic blocks, labs, and library. Use your college ID credentials to authenticate to 'SCOE-Campus-Secure'.",
    attachment: "Campus_WiFi_Setup_Guide.pdf",
    attachmentSize: "140 KB"
  }
];

export const notifications = [
  {
    id: "nt1",
    title: "Attendance below 75% in Theory of Computation",
    description: "Your attendance in TOC (CE-506) is 70.0% (28/40). Attend the upcoming 4 lectures to get back above the mandatory 75% threshold.",
    time: "2h ago",
    type: "warning",
    href: "/attendance",
    unread: true
  },
  {
    id: "nt2",
    title: "Unit test scheduled tomorrow",
    description: "SQL Queries & Joins (CE-502) is due on 16 Sep 2026 at 11:59 PM.",
    time: "5h ago",
    type: "academic",
    href: "/notices",
    unread: true
  },
  {
    id: "nt3",
    title: "In-sem exam schedule published",
    description: "The Semester V in-semester examination timetable is now available for download.",
    time: "1d ago",
    type: "academic",
    href: "/examinations",
    unread: true
  },
  {
    id: "nt4",
    title: "New placement drive — Infosys",
    description: "Infosys is conducting a campus drive on 24 Sep 2026. Check your eligibility criteria now.",
    time: "1d ago",
    type: "placement",
    href: "/placements",
    unread: false
  },
  {
    id: "nt5",
    title: "Event registration confirmed",
    description: "You are registered for the AWS Cloud Practitioner Workshop on 18 Sep 2026.",
    time: "2d ago",
    type: "success",
    href: "/events",
    unread: false
  },
  {
    id: "nt6",
    title: "Student Council Meeting Minutes",
    description: "Minutes for the September Student Council general body meeting have been published.",
    time: "3d ago",
    type: "event",
    href: "/student-council",
    unread: false
  }
];

export const councilMembers = [
  {
    id: "cm1",
    name: "Tanmay Patil",
    role: "President",
    committee: "Executive Council",
    branch: "Computer Engineering",
    year: "Final Year (BE)",
    email: "president.council@siddhantcoe.edu.in",
    phone: "+91 98231 44550",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Chief representative of the student body to the Principal & Management; Presides over all general body sessions; Coordinates campus development and policy matters.",
    quote: "Empowering every student voice to foster an innovative, supportive campus ecosystem.",
    initiatives: ["Campus Wi-Fi upgrade", "Extended library timings", "Annual tech-cultural budget increase"],
    achievements: ["Smart India Hackathon Finalist", "Best Student Leader 2025"]
  },
  {
    id: "cm2",
    name: "Shruti Kulkarni",
    role: "Vice President",
    committee: "Executive Council",
    branch: "Electronics & Telecomm (ENTC)",
    year: "Final Year (BE)",
    email: "vp.council@siddhantcoe.edu.in",
    phone: "+91 98223 99881",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Assists the President in administrative affairs; Oversees inter-department coordination and student grievance escalation.",
    quote: "Building bridges between departments and ensuring equal opportunity across all branches.",
    initiatives: ["Inter-department lab sharing", "Girls' hostel amenity enhancement"],
    achievements: ["Robocon West Zone Winner", "University Merit Ranker"]
  },
  {
    id: "cm3",
    name: "Omkar Shinde",
    role: "General Secretary",
    committee: "Executive Council",
    branch: "Information Technology",
    year: "Third Year (TE)",
    email: "gensec.council@siddhantcoe.edu.in",
    phone: "+91 97654 33210",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Official documentation, notice circulation, inter-committee meeting schedules, council budget auditing, and university liaison.",
    quote: "Transparency, speed, and accountability in student governance.",
    initiatives: ["Online student grievance tracker", "Council monthly newsletter"],
    achievements: ["Lead organizer Innovatia 2025", "State level debater"]
  },
  {
    id: "cm4",
    name: "Rahul Patil",
    role: "Technical Secretary & ASTRA Lead",
    committee: "Technical Committee",
    branch: "Computer Engineering",
    year: "Third Year (TE)",
    isCurrentUser: true,
    email: "rahul.patil@siddhantcoe.edu.in",
    phone: "+91 98220 41042",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Heads the ASTRA Developers Team; Manages college portal, automated timetable and attendance modules; Conducts weekly coding contests and hackathons.",
    quote: "Building open technology that solves real problems for our students and faculty every single day.",
    initiatives: ["SCOE Student Council Portal v2", "Weekly DSA Bootcamps", "Cloud Certification vouchers"],
    achievements: ["Winner Pune Web3 Hackathon 2025", "Full-stack architect of CMS"]
  },
  {
    id: "cm5",
    name: "Riya Sharma",
    role: "Cultural Secretary",
    committee: "Cultural Committee",
    branch: "Computer Engineering",
    year: "Third Year (TE)",
    email: "cultural.sec@siddhantcoe.edu.in",
    phone: "+91 98901 22334",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Orchestrates Rangtarang cultural fest, Garba nights, music bands, theater troupes, and represents SCOE at university youth festivals.",
    quote: "Celebrating art, expression and the rich cultural soul of Siddhant campus.",
    initiatives: ["Rangtarang 2026 expansion", "College Acoustic Band formation"],
    achievements: ["Purushottam Karandak Best Actress", "Classical Bharatnatyam Visharad"]
  },
  {
    id: "cm6",
    name: "Aditya Jagtap",
    role: "Sports Secretary",
    committee: "Sports Committee",
    branch: "Mechanical Engineering",
    year: "Final Year (BE)",
    email: "sports.sec@siddhantcoe.edu.in",
    phone: "+91 98224 55667",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Leads inter-collegiate sports teams, annual sports week, equipment maintenance, and indoor/outdoor gymnasium facilities.",
    quote: "Discipline, teamwork, and athletic excellence both on the field and in academics.",
    initiatives: ["New floodlights on cricket ground", "Inter-college football cup"],
    achievements: ["Zonal Cricket Captain", "Inter-college 200m Gold"]
  },
  {
    id: "cm7",
    name: "Pooja Chavan",
    role: "Ladies Representative (LR)",
    committee: "Welfare Committee",
    branch: "AI & Data Science",
    year: "Third Year (TE)",
    email: "lr.council@siddhantcoe.edu.in",
    phone: "+91 97665 44332",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Advocates for female students' security, hygiene, hostel amenities, mentorship circles and leadership workshops.",
    quote: "Ensuring an inspiring, safe, and progressive environment for all women engineers at SCOE.",
    initiatives: ["Women in Tech mentorship", "Hostel 24/7 medical access"],
    achievements: ["Grace Hopper Celebration Scholar", "Top 5% SPPU AI branch"]
  },
  {
    id: "cm8",
    name: "Parth Gaikwad",
    role: "NSS & Social Outreach Lead",
    committee: "Social Welfare",
    branch: "Civil Engineering",
    year: "Second Year (SE)",
    email: "nss.lead@siddhantcoe.edu.in",
    phone: "+91 98601 77889",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Organizes blood donation drives, tree plantation around Maval hills, village digital literacy camps, and disaster relief.",
    quote: "Service to society is the highest calling of an engineer.",
    initiatives: ["Gram Vikas Camp in Sudumbare", "Annual Mega Blood Donation"],
    achievements: ["State NSS Commendation", "500+ units blood collected"]
  },
  {
    id: "cm9",
    name: "Prof. Dr. R. B. Kamthe",
    role: "Faculty Council Advisor",
    committee: "Advisory Board",
    branch: "Principal Nominee & Dean Academics",
    year: "Faculty",
    email: "dean.academics@siddhantcoe.edu.in",
    phone: "+91 94220 88776",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    responsibilities: "Guides the student council on institutional norms, university regulations, budgetary sanction, and faculty-student coordination.",
    quote: "Student leadership is the cornerstone of academic excellence and campus vibrancy.",
    initiatives: ["Faculty-Student dialogue forum", "Council activity accreditation"],
    achievements: ["25+ years teaching excellence", "PhD SPPU Pune"]
  }
];

export const feedbackTickets = [
  {
    id: "GRV-2026-089",
    title: "Lab 3 AC unit and LAN port switch faulty",
    category: "Infrastructure & Labs",
    urgency: "Medium",
    date: "08 Sep 2026",
    status: "Resolved",
    description: "In DBMS Lab (Lab 3), system #14 and #15 LAN ports were disconnecting frequently during practicals. Also the rear AC was not cooling properly.",
    location: "Computer Dept, Lab 3, 2nd Floor",
    assignedTo: "Network & Facility Maintenance Cell",
    timeline: [
      { date: "08 Sep 2026, 11:30 AM", event: "Grievance lodged by Rahul Patil" },
      { date: "09 Sep 2026, 10:00 AM", event: "Assigned to Network Admin (Mr. Shinde)" },
      { date: "10 Sep 2026, 04:30 PM", event: "LAN switch port crimped & AC compressor gas recharged" },
      { date: "11 Sep 2026, 09:00 AM", event: "Resolved & verified by Lab In-charge" }
    ],
    resolutionNote: "Replaced faulty RJ45 patch cable, configured switch port VLAN, and HVAC technician serviced the split unit. Tested and confirmed operational."
  },
  {
    id: "GRV-2026-104",
    title: "Request for extended library study hours for In-sem Exams",
    category: "Library",
    urgency: "High",
    date: "11 Sep 2026",
    status: "In Progress",
    description: "With in-sem exams starting on 28 Sep, students requested the reading hall to remain open until 9:00 PM instead of closing at 5:30 PM.",
    location: "SCOE Central Library",
    assignedTo: "Chief Librarian & Student Council",
    timeline: [
      { date: "11 Sep 2026, 02:15 PM", event: "Petition submitted with 140 student signatures" },
      { date: "12 Sep 2026, 11:00 AM", event: "Student Council discussed in Executive meeting" },
      { date: "14 Sep 2026, 03:00 PM", event: "Principal granted provisional approval for security staff" }
    ],
    resolutionNote: "Library committee in coordination with Security Office has approved extension to 9:00 PM starting Monday, 21 Sep through exam period."
  },
  {
    id: "GRV-2026-118",
    title: "Hostel Block B Hot Water Solar Geyser intermittent",
    category: "Hostel & Canteen",
    urgency: "Low",
    date: "13 Sep 2026",
    status: "Under Review",
    description: "2nd floor hostel boys reported insufficient hot water during early morning hours (6:30 AM to 8:00 AM) over the past two days.",
    location: "Boys Hostel Block B, Floor 2",
    assignedTo: "Hostel Rector & Estate Office",
    timeline: [
      { date: "13 Sep 2026, 08:30 AM", event: "Grievance received" },
      { date: "14 Sep 2026, 09:30 AM", event: "Estate officer scheduled inspection" }
    ],
    resolutionNote: "Solar thermal backup electric heater element under inspection. Rectification expected by 16 Sep."
  }
];

export const clubs = [
  {
    id: "c1",
    name: "AWS Student Builder Group",
    category: "Technical",
    coordinator: "Prof. A. Deshmukh",
    members: 142,
    achievements: ["120+ cloud certifications", "Winner — AWS DeepRacer 2025", "3 community day events hosted"],
    description: "A student community focused on cloud computing, hands-on AWS labs and certification support, backed by the AWS Educate program.",
    accent: "oklch(0.72 0.15 55)"
  },
  {
    id: "c2",
    name: "Coding Club (ASTRA Devs)",
    category: "Technical",
    coordinator: "Prof. R. Kale",
    members: 210,
    achievements: ["ICPC Regionals 2025 qualifiers", "Weekly competitive rounds", "2 inter-college hackathon wins"],
    description: "The competitive programming and open-source engineering hub of SCOE, running weekly contests, DSA bootcamps and building campus systems.",
    accent: "oklch(0.55 0.12 260)"
  },
  {
    id: "c3",
    name: "Robotics & IoT Club",
    category: "Technical",
    coordinator: "Dr. S. Pawar",
    members: 96,
    achievements: ["2nd place — Robocon West Zone", "Built autonomous line-follower fleet", "IoT lab established"],
    description: "Design and build autonomous robots, drones and embedded systems for national-level competitions like Robocon and eYantra.",
    accent: "oklch(0.44 0.145 25)"
  },
  {
    id: "c4",
    name: "Cultural Club 'Rangtarang'",
    category: "Cultural",
    coordinator: "Prof. N. Kulkarni",
    members: 260,
    achievements: ["Rangtarang fest — 5000+ footfall", "Winner — Purushottam Karandak", "State-level dance champions"],
    description: "Home to dance, music, drama and fine-arts troupes that represent SCOE at inter-collegiate cultural festivals across Maharashtra.",
    accent: "oklch(0.62 0.18 350)"
  },
  {
    id: "c5",
    name: "Sports & Fitness Club",
    category: "Sports",
    coordinator: "Mr. D. Gaikwad",
    members: 320,
    achievements: ["Zonal cricket champions 2025", "Inter-college athletics gold", "New indoor sports complex"],
    description: "Promotes fitness and competitive sports across cricket, football, athletics, volleyball, kabaddi and indoor chess/badminton.",
    accent: "oklch(0.62 0.13 155)"
  },
  {
    id: "c6",
    name: "Entrepreneurship Cell (E-Cell)",
    category: "Business",
    coordinator: "Dr. M. Joshi",
    members: 118,
    achievements: ["5 student startups incubated", "E-Summit with 30+ mentors", "₹5L seed grant facilitated"],
    description: "The innovation and startup ecosystem of SCOE, offering incubation, mentorship, pitch events and direct venture capital connects.",
    accent: "oklch(0.72 0.15 55)"
  }
];

export const books = [
  { id: "b1", title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest, Stein", category: "Algorithms", isbn: "978-0262046305", copies: 12, available: 4, status: "Available", cover: "oklch(0.44 0.145 25)" },
  { id: "b2", title: "Operating System Concepts", author: "Silberschatz, Galvin, Gagne", category: "Operating Systems", isbn: "978-1118063330", copies: 8, available: 0, status: "Issued", cover: "oklch(0.55 0.12 260)" },
  { id: "b3", title: "Database System Concepts", author: "Silberschatz, Korth, Sudarshan", category: "Databases", isbn: "978-0078022159", copies: 10, available: 3, status: "Available", cover: "oklch(0.62 0.13 155)" },
  { id: "b4", title: "Computer Networking: A Top-Down Approach", author: "Kurose & Ross", category: "Networks", isbn: "978-0133594140", copies: 9, available: 2, status: "Available", cover: "oklch(0.72 0.15 55)" },
  { id: "b5", title: "Clean Code: Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", category: "Software Engineering", isbn: "978-0132350884", copies: 6, available: 0, status: "Reserved", cover: "oklch(0.5 0.1 30)" },
  { id: "b6", title: "The C Programming Language", author: "Kernighan & Ritchie", category: "Programming", isbn: "978-0131103627", copies: 15, available: 7, status: "Available", cover: "oklch(0.62 0.18 350)" },
  { id: "b7", title: "Compilers: Principles, Techniques & Tools", author: "Aho, Lam, Sethi, Ullman", category: "Compilers", isbn: "978-0321486813", copies: 5, available: 1, status: "Available", cover: "oklch(0.4 0.1 260)" },
  { id: "b8", title: "Artificial Intelligence: A Modern Approach", author: "Russell & Norvig", category: "AI/ML", isbn: "978-0134610993", copies: 7, available: 3, status: "Available", cover: "oklch(0.58 0.13 40)" }
];

export const companies = [
  {
    id: "co1",
    name: "Infosys",
    role: "Systems Engineer",
    package: "₹4.5 - 6.5 LPA",
    eligibility: "60% & above, no active backlogs",
    driveDate: "24 Sep 2026",
    location: "Pune (Hinjewadi Phase 2)",
    type: "Full-time",
    status: "Open",
    description: "Infosys is hiring Systems Engineers for its Pune development centre. Selected candidates join the Infosys Springboard training program before project allocation.",
    rounds: ["Online aptitude & coding", "Technical interview", "HR interview"]
  },
  {
    id: "co2",
    name: "TCS Digital",
    role: "Digital Cadre Engineer",
    package: "₹7.0 LPA",
    eligibility: "65% & above across X, XII, UG",
    driveDate: "27 Sep 2026",
    location: "Pune / Mumbai",
    type: "Full-time",
    status: "Open",
    description: "TCS Digital hires high-performing engineers into premium digital roles across cloud, data and full-stack streams with accelerated growth tracks.",
    rounds: ["TCS NQT", "Technical + Managerial round", "HR round"]
  },
  {
    id: "co3",
    name: "Persistent Systems",
    role: "Software Engineer Trainee",
    package: "₹6.0 LPA",
    eligibility: "60% & above, CE/IT/AIDS",
    driveDate: "01 Oct 2026",
    location: "Pune (Senapati Bapat Rd)",
    type: "Full-time",
    status: "Upcoming",
    description: "Persistent Systems recruits software engineers for product engineering teams working with global enterprise clients in cloud and AI.",
    rounds: ["Coding assessment", "Technical interview", "HR discussion"]
  },
  {
    id: "co4",
    name: "Amazon",
    role: "SDE Intern",
    package: "₹1.2L / month (Internship)",
    eligibility: "70% & above, strong DSA",
    driveDate: "08 Oct 2026",
    location: "Bengaluru (Remote screening)",
    type: "Internship",
    status: "Upcoming",
    description: "Amazon offers a 6-month SDE internship with potential for a full-time PPO. Candidates are evaluated primarily on data structures, algorithms and system design fundamentals.",
    rounds: ["Online assessment (2 coding + MCQ)", "2 technical interviews", "Bar-raiser round"]
  },
  {
    id: "co5",
    name: "Deloitte",
    role: "Analyst — Technology",
    package: "₹6.8 LPA",
    eligibility: "60% & above, no gap > 1 year",
    driveDate: "15 Sep 2026",
    location: "Pune / Hyderabad",
    type: "Full-time",
    status: "Closed",
    description: "Deloitte hires technology analysts for consulting engagements across enterprise platforms, cloud modernisation and data analytics.",
    rounds: ["Aptitude test", "Group case discussion", "Technical + HR interview"]
  }
];

export const placementStats = {
  companies: 48,
  openDrives: 6,
  applications: 12,
  interviews: 3,
  offers: 1,
  placedStudents: 312,
  totalEligible: 480,
  highestPackage: "₹24 LPA",
  averagePackage: "₹6.4 LPA"
};

export const syllabusCompletion = [
  { subject: "Data Structures", percent: 78 },
  { subject: "Operating Systems", percent: 64 },
  { subject: "Computer Networks", percent: 52 },
  { subject: "Database Management Systems", percent: 71 },
];

export const faculty = [
  { id: "f1", name: "Prof. R. Kale", dept: "Computer Engineering", subject: "Data Structures", email: "r.kale@siddhantcoe.edu.in", designation: "Assistant Professor", cabin: "CE-Cabin 04" },
  { id: "f2", name: "Prof. A. Deshmukh", dept: "Computer Engineering", subject: "DBMS", email: "a.deshmukh@siddhantcoe.edu.in", designation: "Associate Professor", cabin: "CE-Cabin 08" },
  { id: "f3", name: "Dr. S. Pawar", dept: "Computer Engineering", subject: "Operating Systems", email: "s.pawar@siddhantcoe.edu.in", designation: "Professor & HOD", cabin: "CE-HOD Room" },
  { id: "f4", name: "Dr. M. Joshi", dept: "Computer Engineering", subject: "Computer Networks", email: "m.joshi@siddhantcoe.edu.in", designation: "Associate Professor", cabin: "CE-Cabin 02" },
  { id: "f5", name: "Prof. N. Kulkarni", dept: "Computer Engineering", subject: "Software Engineering", email: "n.kulkarni@siddhantcoe.edu.in", designation: "Assistant Professor", cabin: "CE-Cabin 06" },
  { id: "f6", name: "Dr. V. Shinde", dept: "Computer Engineering", subject: "Theory of Computation", email: "v.shinde@siddhantcoe.edu.in", designation: "Associate Professor", cabin: "CE-Cabin 03" },
];

export const students = [
  { id: "SCOE2023CE042", name: "Rahul Patil", branch: "Computer Engineering", year: "TE", rollNo: "TE-CE-A-42", cgpa: 8.64, email: "rahul.patil@siddhantcoe.edu.in" },
  { id: "SCOE2023CE018", name: "Sneha Kulkarni", branch: "Computer Engineering", year: "TE", rollNo: "TE-CE-A-18", cgpa: 9.12, email: "sneha.kulkarni@siddhantcoe.edu.in" },
  { id: "SCOE2023IT007", name: "Aditya Deshmukh", branch: "Information Technology", year: "TE", rollNo: "TE-IT-A-07", cgpa: 8.35, email: "aditya.deshmukh@siddhantcoe.edu.in" },
  { id: "SCOE2022CE101", name: "Priya Mane", branch: "Computer Engineering", year: "BE", rollNo: "BE-CE-B-01", cgpa: 8.90, email: "priya.mane@siddhantcoe.edu.in" },
  { id: "SCOE2024EN055", name: "Karan Shah", branch: "ENTC", year: "SE", rollNo: "SE-EN-A-55", cgpa: 7.98, email: "karan.shah@siddhantcoe.edu.in" },
  { id: "SCOE2023AI023", name: "Ananya Iyer", branch: "AI & Data Science", year: "TE", rollNo: "TE-AI-A-23", cgpa: 9.01, email: "ananya.iyer@siddhantcoe.edu.in" }
];

export const departments = [
  {
    id: "dept-ce",
    code: "CE",
    name: "Computer Engineering",
    hod: "Dr. S. Pawar",
    facultyCount: 28,
    studentCount: 540,
    labsCount: 9,
    avgAttendance: 84.6,
    avgPlacement: 89.2,
    syllabusProgress: 76,
    established: 2008,
    intake: 180,
    accreditation: "NBA Accredited (2024-2027)",
    description: "State-of-the-art labs in Artificial Intelligence, High Performance Computing, Cloud & Cyber Security.",
  },
  {
    id: "dept-it",
    code: "IT",
    name: "Information Technology",
    hod: "Dr. A. Sharma",
    facultyCount: 22,
    studentCount: 420,
    labsCount: 7,
    avgAttendance: 82.1,
    avgPlacement: 86.5,
    syllabusProgress: 73,
    established: 2009,
    intake: 120,
    accreditation: "NBA Accredited",
    description: "Focus on Full Stack Engineering, DevOps, Cloud Infrastructure, and Data Engineering.",
  },
  {
    id: "dept-entc",
    code: "ENTC",
    name: "Electronics & Telecommunication",
    hod: "Dr. P. Deshmukh",
    facultyCount: 18,
    studentCount: 360,
    labsCount: 8,
    avgAttendance: 80.4,
    avgPlacement: 78.9,
    syllabusProgress: 70,
    established: 2008,
    intake: 120,
    accreditation: "NAAC 'A+' Grade",
    description: "VLSI Design, Embedded IoT, Wireless Communications & Robotics Automation center.",
  },
  {
    id: "dept-mech",
    code: "MECH",
    name: "Mechanical Engineering",
    hod: "Dr. R. Jadhav",
    facultyCount: 24,
    studentCount: 480,
    labsCount: 10,
    avgAttendance: 79.5,
    avgPlacement: 76.2,
    syllabusProgress: 68,
    established: 2008,
    intake: 120,
    accreditation: "NBA Accredited",
    description: "CAD/CAM/CAE Labs, Robotics, Thermal Analysis, and Center of Excellence with Tata Motors.",
  },
  {
    id: "dept-civil",
    code: "CIVIL",
    name: "Civil Engineering",
    hod: "Prof. M. Kulkarni",
    facultyCount: 16,
    studentCount: 320,
    labsCount: 6,
    avgAttendance: 81.0,
    avgPlacement: 72.4,
    syllabusProgress: 72,
    established: 2010,
    intake: 60,
    accreditation: "NAAC 'A+' Grade",
    description: "Structural Testing, GIS & Remote Sensing, Environmental Engineering and Smart Cities Lab.",
  },
  {
    id: "dept-aids",
    code: "AI&DS",
    name: "Artificial Intelligence & Data Science",
    hod: "Dr. V. Joshi",
    facultyCount: 14,
    studentCount: 240,
    labsCount: 5,
    avgAttendance: 86.3,
    avgPlacement: 91.5,
    syllabusProgress: 79,
    established: 2021,
    intake: 120,
    accreditation: "AICTE Approved New-Age Tech",
    description: "Deep Learning, Generative AI clusters, NLP, and Big Data Analytics Lab.",
  },
];

export const facultyClasses = [
  {
    id: "cls-1",
    courseCode: "310242",
    courseName: "Data Structures & Algorithms",
    branch: "Computer Engineering",
    year: "TE",
    division: "Div A",
    batch: "All Batches",
    studentsCount: 68,
    presentToday: 62,
    time: "10:00 AM - 11:00 AM",
    room: "LH-302",
    syllabusCompleted: 78,
    nextSession: "Tomorrow, 10:00 AM",
  },
  {
    id: "cls-2",
    courseCode: "310243",
    courseName: "Database Management Systems Lab",
    branch: "Computer Engineering",
    year: "TE",
    division: "Div A",
    batch: "Batch A2",
    studentsCount: 24,
    presentToday: 23,
    time: "01:00 PM - 03:00 PM",
    room: "Lab 04 (Database Lab)",
    syllabusCompleted: 82,
    nextSession: "Thursday, 01:00 PM",
  },
  {
    id: "cls-3",
    courseCode: "410251",
    courseName: "Advanced Cloud Computing",
    branch: "Computer Engineering",
    year: "BE",
    division: "Div B",
    batch: "All Batches",
    studentsCount: 72,
    presentToday: 65,
    time: "11:15 AM - 12:15 PM",
    room: "LH-305",
    syllabusCompleted: 64,
    nextSession: "Friday, 11:15 AM",
  },
  {
    id: "cls-4",
    courseCode: "210244",
    courseName: "Object Oriented Programming Lab",
    branch: "Computer Engineering",
    year: "SE",
    division: "Div A",
    batch: "Batch A1",
    studentsCount: 22,
    presentToday: 21,
    time: "03:15 PM - 05:15 PM",
    room: "Lab 02 (Software Lab)",
    syllabusCompleted: 70,
    nextSession: "Wednesday, 03:15 PM",
  },
];

export const classStudents = [
  { id: "SCOE2023CE042", rollNo: "TE-CE-A-42", name: "Rahul Patil", branch: "Computer", year: "TE", attendance: "91%", status: "Present", avatar: "RP", marksInSem: 28, marksEndSem: 62 },
  { id: "SCOE2023CE018", rollNo: "TE-CE-A-18", name: "Sneha Kulkarni", branch: "Computer", year: "TE", attendance: "94%", status: "Present", avatar: "SK", marksInSem: 29, marksEndSem: 66 },
  { id: "SCOE2023CE005", rollNo: "TE-CE-A-05", name: "Amit Shinde", branch: "Computer", year: "TE", attendance: "78%", status: "Present", avatar: "AS", marksInSem: 22, marksEndSem: 54 },
  { id: "SCOE2023CE012", rollNo: "TE-CE-A-12", name: "Pooja Deshmukh", branch: "Computer", year: "TE", attendance: "68%", status: "Absent", avatar: "PD", marksInSem: 19, marksEndSem: 48 },
  { id: "SCOE2023CE027", rollNo: "TE-CE-A-27", name: "Rohan Joshi", branch: "Computer", year: "TE", attendance: "85%", status: "Present", avatar: "RJ", marksInSem: 26, marksEndSem: 58 },
  { id: "SCOE2023CE033", rollNo: "TE-CE-A-33", name: "Tanvi More", branch: "Computer", year: "TE", attendance: "88%", status: "Present", avatar: "TM", marksInSem: 27, marksEndSem: 60 },
  { id: "SCOE2023CE009", rollNo: "TE-CE-A-09", name: "Omkar Jadhav", branch: "Computer", year: "TE", attendance: "71%", status: "Late", avatar: "OJ", marksInSem: 20, marksEndSem: 50 },
  { id: "SCOE2023CE051", rollNo: "TE-CE-A-51", name: "Neha Pawar", branch: "Computer", year: "TE", attendance: "92%", status: "Present", avatar: "NP", marksInSem: 28, marksEndSem: 65 },
  { id: "SCOE2023CE015", rollNo: "TE-CE-A-15", name: "Aditya Chavan", branch: "Computer", year: "TE", attendance: "65%", status: "Absent", avatar: "AC", marksInSem: 18, marksEndSem: 45 },
  { id: "SCOE2023CE038", rollNo: "TE-CE-A-38", name: "Priya Gholap", branch: "Computer", year: "TE", attendance: "89%", status: "Present", avatar: "PG", marksInSem: 25, marksEndSem: 59 },
  { id: "SCOE2023CE045", rollNo: "TE-CE-A-45", name: "Kunal Sawant", branch: "Computer", year: "TE", attendance: "83%", status: "Present", avatar: "KS", marksInSem: 24, marksEndSem: 55 },
  { id: "SCOE2023CE060", rollNo: "TE-CE-A-60", name: "Shruti Jagtap", branch: "Computer", year: "TE", attendance: "90%", status: "Present", avatar: "SJ", marksInSem: 28, marksEndSem: 63 }
];

export const menteesList = [
  {
    id: "SCOE2023CE042",
    name: "Rahul Patil",
    rollNo: "TE-CE-A-42",
    cgpa: 8.64,
    attendance: "91%",
    backlogs: 0,
    status: "Good Standing",
    lastMeeting: "04 Sep 2026",
    concerns: "Career counselling for Cloud Architect certification & Innovatia project leadership.",
    phone: "+91 98230 44521"
  },
  {
    id: "SCOE2023CE012",
    name: "Pooja Deshmukh",
    rollNo: "TE-CE-A-12",
    cgpa: 6.82,
    attendance: "68%",
    backlogs: 1,
    status: "Needs Monitoring",
    lastMeeting: "01 Sep 2026",
    concerns: "Attendance below 75% threshold in TOC. Remedial sessions assigned.",
    phone: "+91 94221 88310"
  },
  {
    id: "SCOE2023CE005",
    name: "Amit Shinde",
    rollNo: "TE-CE-A-05",
    cgpa: 7.45,
    attendance: "78%",
    backlogs: 0,
    status: "Good Standing",
    lastMeeting: "28 Aug 2026",
    concerns: "Seeking internship guidance for TCS CodeVita preparation.",
    phone: "+91 98765 11200"
  },
  {
    id: "SCOE2023CE015",
    name: "Aditya Chavan",
    rollNo: "TE-CE-A-15",
    cgpa: 6.40,
    attendance: "65%",
    backlogs: 2,
    status: "Critical Defaulter",
    lastMeeting: "10 Sep 2026",
    concerns: "Parent-teacher meeting called regarding backlogs in M-III and Microprocessors.",
    phone: "+91 97654 32190"
  },
  {
    id: "SCOE2023CE033",
    name: "Tanvi More",
    rollNo: "TE-CE-A-33",
    cgpa: 8.42,
    attendance: "88%",
    backlogs: 0,
    status: "Good Standing",
    lastMeeting: "05 Sep 2026",
    concerns: "Applying for Smart India Hackathon internal scrutiny.",
    phone: "+91 98112 33455"
  }
];

export const initialTasks = [
  { id: "tsk-1", title: "Upload In-Sem Marks on SPPU Exam Portal", priority: "High", dueDate: "Tomorrow, 5:00 PM", completed: false, category: "Examinations" },
  { id: "tsk-2", title: "Verify TE Database Lab Term-Work Submissions", priority: "Medium", dueDate: "18 Sep 2026", completed: false, category: "Academics" },
  { id: "tsk-3", title: "Submit NBA Criterion 3 Course Outcomes (CO-PO Matrix)", priority: "High", dueDate: "20 Sep 2026", completed: true, category: "Accreditation" },
  { id: "tsk-4", title: "Conduct Mentor-Mentee Meeting for Defaulters (<75%)", priority: "Medium", dueDate: "22 Sep 2026", completed: false, category: "Mentoring" },
  { id: "tsk-5", title: "Review Innovatia Hackathon Problem Statements", priority: "Low", dueDate: "25 Sep 2026", completed: false, category: "Events" }
];

export const initialApprovals = [
  {
    id: "APP-2026-104",
    type: "Faculty Medical Leave",
    applicant: "Prof. Anita Deshmukh",
    role: "Associate Professor, CE",
    department: "Computer Engineering",
    details: "Medical leave for 3 days (17 Sep to 19 Sep 2026) due to viral fever. Substitute load assigned to Prof. N. Kulkarni.",
    date: "15 Sep 2026",
    status: "Pending",
    urgency: "High",
    budget: null,
  },
  {
    id: "APP-2026-103",
    type: "Budget & Sponsorship Clearance",
    applicant: "Rahul Patil",
    role: "Technical Secretary, Student Council",
    department: "Campus Council",
    details: "Requisition for Innovatia 2026 National Hackathon prize pool and cloud infrastructure vouchers (₹45,000 sanctioned under student activity fund).",
    date: "14 Sep 2026",
    status: "Pending",
    urgency: "Medium",
    budget: "₹45,000",
  },
  {
    id: "APP-2026-102",
    type: "Industrial Visit Sanction",
    applicant: "Dr. R. Jadhav",
    role: "HOD, Mechanical",
    department: "Mechanical Engineering",
    details: "One-day industrial exposure visit for TE Mechanical (120 students + 4 faculty) to Tata Motors Manufacturing Plant, Chakan.",
    date: "13 Sep 2026",
    status: "Pending",
    urgency: "Medium",
    budget: "₹18,500",
  },
  {
    id: "APP-2026-101",
    type: "Bonafide & Passport Clearance",
    applicant: "Sneha Kulkarni",
    role: "Student (SCOE2023CE018)",
    department: "Computer Engineering",
    details: "Issue of official bonafide certificate for Passport Application and international conference travel grant.",
    date: "12 Sep 2026",
    status: "Approved",
    urgency: "Low",
    budget: null,
  },
  {
    id: "APP-2026-100",
    type: "Lab Hardware Requisition",
    applicant: "Dr. S. Pawar",
    role: "HOD, Computer Engineering",
    department: "Computer Engineering",
    details: "Requisition for 4x NVIDIA RTX 4090 GPU workstations for new Generative AI & Deep Learning Research Center.",
    date: "10 Sep 2026",
    status: "Pending",
    urgency: "High",
    budget: "₹6,80,000",
  },
  {
    id: "APP-2026-099",
    type: "On-Duty (OD) Sports Leave",
    applicant: "Karan Shah",
    role: "Sports Representative (SCOE2024EN055)",
    department: "ENTC",
    details: "OD attendance exemption for 8 college basketball team members representing SCOE at SPPU Zonal Tournament (18-20 Sep).",
    date: "11 Sep 2026",
    status: "Approved",
    urgency: "Medium",
    budget: null,
  }
];

export const institutionalReports = [
  {
    id: "rep-1",
    title: "SPPU Academic Performance & Result Audit 2025-26",
    category: "Academic",
    department: "Institutional (All Departments)",
    publishedDate: "10 Sep 2026",
    author: "Academic Dean & Controller of Examinations",
    fileSize: "4.8 MB",
    downloads: 342,
    summary: "Consolidated SGPA distribution, subject pass percentages, university rank holders, and remedial action tracking across FE to BE."
  },
  {
    id: "rep-2",
    title: "NBA Tier-II Accreditation Self-Assessment Report (SAR)",
    category: "Accreditation",
    department: "Computer & Mechanical",
    publishedDate: "02 Sep 2026",
    author: "Internal Quality Assurance Cell (IQAC)",
    fileSize: "12.4 MB",
    downloads: 189,
    summary: "Compliance analysis for Criteria 1 to 10 covering curriculum attainment, PO/PSO mapping, faculty research publications, and infrastructure audit."
  },
  {
    id: "rep-3",
    title: "Consolidated Training & Campus Placement Report 2025-26",
    category: "Placement",
    department: "Training & Placement Cell",
    publishedDate: "05 Sep 2026",
    author: "Head T&P Cell (Prof. S. Rane)",
    fileSize: "3.2 MB",
    downloads: 512,
    summary: "Complete statistics of 42 recruiting companies, highest CTC ₹18.5 LPA, average package ₹5.8 LPA, and 84.6% eligible student placement."
  },
  {
    id: "rep-4",
    title: "Institutional Attendance & Defaulters Analysis (Term I)",
    category: "Attendance",
    department: "Student Welfare Committee",
    publishedDate: "01 Sep 2026",
    author: "Chief Proctor & Academic Monitoring Committee",
    fileSize: "2.1 MB",
    downloads: 275,
    summary: "Detailed review of 3,420 students. Identified 142 defaulters (<75%) with registered parent communications and remedial lecture schedules."
  },
  {
    id: "rep-5",
    title: "NAAC SSR Criterion 2 - Teaching-Learning Evaluation",
    category: "Accreditation",
    department: "IQAC Directorate",
    publishedDate: "28 Aug 2026",
    author: "Principal & IQAC Coordinator",
    fileSize: "8.7 MB",
    downloads: 145,
    summary: "Quantitative and qualitative metrics for student diversity, student-teacher ratio (1:15), ICT-enabled pedagogical tools, and mentor-mentee system."
  }
];

export const adminUsersList = [
  { id: "SCOE2023CE042", name: "Rahul Patil", role: "Student", email: "rahul.patil@siddhantcoe.edu.in", dept: "Computer Engineering", status: "Active", lastLogin: "Just now" },
  { id: "SCOEFAC-CE08", name: "Prof. R. Kale", role: "Faculty", email: "r.kale@siddhantcoe.edu.in", dept: "Computer Engineering", status: "Active", lastLogin: "Today, 10:15 AM" },
  { id: "SCOE-HOD-CE", name: "Dr. S. Pawar", role: "HOD", email: "hod.computer@siddhantcoe.edu.in", dept: "Computer Engineering", status: "Active", lastLogin: "Today, 09:30 AM" },
  { id: "SCOE-VP-01", name: "Dr. A. Sharma", role: "Vice-Principal", email: "vp@siddhantcoe.edu.in", dept: "Administration", status: "Active", lastLogin: "Today, 08:45 AM" },
  { id: "SCOE-PRIN-01", name: "Dr. V. Patil", role: "Principal", email: "principal@siddhantcoe.edu.in", dept: "Executive Office", status: "Active", lastLogin: "Today, 08:15 AM" },
  { id: "SCOE-ADMIN-ROOT", name: "ASTRA SysAdmin", role: "Super Admin", email: "admin@siddhantcoe.edu.in", dept: "IT & Systems Cell", status: "Active", lastLogin: "Active Now" },
  { id: "SCOE2023CE018", name: "Sneha Kulkarni", role: "Student", email: "sneha.kulkarni@siddhantcoe.edu.in", dept: "Computer Engineering", status: "Active", lastLogin: "Yesterday, 4:20 PM" },
  { id: "SCOEFAC-IT04", name: "Prof. M. Joshi", role: "Faculty", email: "m.joshi@siddhantcoe.edu.in", dept: "Information Technology", status: "Active", lastLogin: "14 Sep 2026" },
  { id: "SCOE-HOD-MECH", name: "Dr. R. Jadhav", role: "HOD", email: "hod.mech@siddhantcoe.edu.in", dept: "Mechanical Engineering", status: "Active", lastLogin: "13 Sep 2026" }
];

export const systemLogs = [
  { id: "log-1", timestamp: "16 Sep 2026, 11:24 AM", user: "Dr. V. Patil (Principal)", action: "Approved Request APP-2026-101 (Bonafide Clearance)", ip: "192.168.1.15", severity: "Info" },
  { id: "log-2", timestamp: "16 Sep 2026, 10:45 AM", user: "Prof. R. Kale (Faculty)", action: "Marked Attendance for TE Computer Div A (62 Present, 6 Absent)", ip: "192.168.2.88", severity: "Success" },
  { id: "log-3", timestamp: "16 Sep 2026, 10:12 AM", user: "ASTRA SysAdmin", action: "Updated Firewall & API Rate Limit Policies", ip: "10.0.0.1", severity: "Security" },
  { id: "log-4", timestamp: "16 Sep 2026, 09:30 AM", user: "Dr. S. Pawar (HOD)", action: "Generated Mid-Term Attendance Defaulter Report", ip: "192.168.1.42", severity: "Info" },
  { id: "log-5", timestamp: "16 Sep 2026, 08:50 AM", user: "Rahul Patil (Student)", action: "Registered for Innovatia 2026 Tech Fest", ip: "172.16.4.12", severity: "Info" },
  { id: "log-6", timestamp: "15 Sep 2026, 04:30 PM", user: "System Scheduler", action: "Automated Daily Database Snapshot & Cloud Backup", ip: "127.0.0.1", severity: "System" }
];
