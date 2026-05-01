import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./Models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectString = process.env.MONGODB_URI;

// ─── Test users (password: 123456 for all) ───────────────────────────────────
const TEST_USERS = [
  {
    staffId: "ADMIN001",
    personal_name: "Khalid Al-Balushi",
    initials: "KA",
    national_id: "10000001",
    manpower_id: "MP100",
    gender: "Male",
    nationality: "Omani",
    email: "admin@utas.edu.om",
    mobile_number: "91000001",
    department: "Administration",
    office: "Admin Office",
    office_contact_number: "24000010",
    academic_qualification: "Master",
    year_of_issue: 2015,
    specialization: "Business Administration",
    name_of_university: "SQU",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "admin",
  },
  {
    staffId: "ITS001",
    personal_name: "Salim Al-Kindi",
    initials: "SK",
    national_id: "10000002",
    manpower_id: "MP101",
    gender: "Male",
    nationality: "Omani",
    email: "itstaff@utas.edu.om",
    mobile_number: "91000002",
    department: "IT Department",
    office: "IT Office",
    office_contact_number: "24000011",
    academic_qualification: "Bachelor",
    year_of_issue: 2018,
    specialization: "Information Technology",
    name_of_university: "UTAS",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "IT Staff",
  },
  // ── IT Staff from CSV ──────────────────────────────────────────────────────
  {
    staffId: "ITS002",
    personal_name: "Ahmed Hassan Mohammed",
    initials: "AHM",
    national_id: "28456789012",
    manpower_id: "MP2024001",
    gender: "Male",
    nationality: "Omani",
    email: "ahmed.hassan@utas.edu.om",
    mobile_number: "+968 9123 4567",
    department: "Network Infrastructure",
    office: "Building A, Floor 3, Room 305",
    office_contact_number: "+968 2456 7890",
    academic_qualification: "Bachelor of Computer Science",
    year_of_issue: 2018,
    specialization: "Network Security",
    name_of_university: "Sultan Qaboos University",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "IT Staff",
  },
  {
    staffId: "ITS003",
    personal_name: "Fatima Ali Abdullah",
    initials: "FAA",
    national_id: "29567890123",
    manpower_id: "MP2024002",
    gender: "Female",
    nationality: "Omani",
    email: "fatima.ali@utas.edu.om",
    mobile_number: "+968 9234 5678",
    department: "Software Development",
    office: "Building B, Floor 2, Room 210",
    office_contact_number: "+968 2456 7891",
    academic_qualification: "Master of Information Technology",
    year_of_issue: 2020,
    specialization: "Software Engineering",
    name_of_university: "University of Technology and Applied Sciences",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "IT Staff",
  },
  {
    staffId: "ITS004",
    personal_name: "Rajesh Kumar Sharma",
    initials: "RKS",
    national_id: "87654321098",
    manpower_id: "MP2024003",
    gender: "Male",
    nationality: "Indian",
    email: "rajesh.kumar@utas.edu.om",
    mobile_number: "+968 9345 6789",
    department: "Database Administration",
    office: "Building A, Floor 2, Room 215",
    office_contact_number: "+968 2456 7892",
    academic_qualification: "Bachelor of Computer Applications",
    year_of_issue: 2016,
    specialization: "Database Management Systems",
    name_of_university: "Delhi University",
    country_of_issue: "India",
    photoUrl: "",
    role: "IT Staff",
  },
  {
    staffId: "ITS005",
    personal_name: "Sarah Elizabeth Thompson",
    initials: "SET",
    national_id: "76543210987",
    manpower_id: "MP2024004",
    gender: "Female",
    nationality: "British",
    email: "sarah.thompson@utas.edu.om",
    mobile_number: "+968 9456 7890",
    department: "Cybersecurity",
    office: "Building C, Floor 4, Room 402",
    office_contact_number: "+968 2456 7893",
    academic_qualification: "Master of Cybersecurity",
    year_of_issue: 2019,
    specialization: "Ethical Hacking and Penetration Testing",
    name_of_university: "University of Oxford",
    country_of_issue: "United Kingdom",
    photoUrl: "",
    role: "IT Staff",
  },
  {
    staffId: "ITS006",
    personal_name: "Mohammed Salim Al-Balushi",
    initials: "MSB",
    national_id: "29678901234",
    manpower_id: "MP2024005",
    gender: "Male",
    nationality: "Omani",
    email: "mohammed.salim@utas.edu.om",
    mobile_number: "+968 9567 8901",
    department: "IT Support Services",
    office: "Building A, Floor 1, Room 105",
    office_contact_number: "+968 2456 7894",
    academic_qualification: "Diploma in Information Technology",
    year_of_issue: 2021,
    specialization: "Technical Support and Maintenance",
    name_of_university: "Higher College of Technology",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "IT Staff",
  },
  // ── Employees ──────────────────────────────────────────────────────────────
  {
    staffId: "EMP001",
    personal_name: "Fatima Al-Rashdi",
    initials: "FR",
    national_id: "10000003",
    manpower_id: "MP102",
    gender: "Female",
    nationality: "Omani",
    email: "employee1@utas.edu.om",
    mobile_number: "91000003",
    department: "Finance",
    office: "Finance Office",
    office_contact_number: "24000012",
    academic_qualification: "Bachelor",
    year_of_issue: 2019,
    specialization: "Accounting",
    name_of_university: "UTAS",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "employee",
  },
  {
    staffId: "EMP002",
    personal_name: "Mohammed Al-Amri",
    initials: "MA",
    national_id: "10000004",
    manpower_id: "MP103",
    gender: "Male",
    nationality: "Omani",
    email: "employee2@utas.edu.om",
    mobile_number: "91000004",
    department: "HR Department",
    office: "HR Office",
    office_contact_number: "24000013",
    academic_qualification: "Bachelor",
    year_of_issue: 2020,
    specialization: "Human Resources",
    name_of_university: "UTAS",
    country_of_issue: "Oman",
    photoUrl: "",
    role: "employee",
  },
];

async function seedUsers() {
  try {
    mongoose.set("bufferCommands", false);

    if (
      !connectString ||
      connectString.includes("your_mongodb_connection_string_here")
    ) {
      throw new Error(
        "MONGODB_URI is not configured. Please set it in the .env file.",
      );
    }

    await mongoose.connect(connectString, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB\n");

    const hashedPassword = await bcrypt.hash("123456", 10);
    const results = [];

    for (const userData of TEST_USERS) {
      const existing = await User.findOne({
        $or: [
          { email: userData.email },
          { staffId: userData.staffId },
          { national_id: userData.national_id },
          { manpower_id: userData.manpower_id },
        ],
      });

      if (!existing) {
        await User.create({ ...userData, password: hashedPassword });
        results.push(
          `✅ Created  [${userData.role.padEnd(8)}]  ${userData.email}`,
        );
      } else {
        // Update role in case user already exists with old role
        await User.updateOne(
          { _id: existing._id },
          { $set: { role: userData.role } },
        );
        results.push(
          `⚠️  Updated  [${userData.role.padEnd(8)}]  ${userData.email} (already existed)`,
        );
      }
    }

    console.log("════════════════════════════════════════");
    console.log("         SEED RESULTS");
    console.log("════════════════════════════════════════");
    results.forEach((r) => console.log(r));
    console.log("════════════════════════════════════════");
    console.log("\n📋 Test Credentials (password: 123456 for all)");
    console.log("─────────────────────────────────────────");
    console.log("  ADMIN    → admin@utas.edu.om");
    console.log("  IT STAFF → itstaff@utas.edu.om");
    console.log("  IT STAFF → ahmed.hassan@utas.edu.om");
    console.log("  IT STAFF → fatima.ali@utas.edu.om");
    console.log("  IT STAFF → rajesh.kumar@utas.edu.om");
    console.log("  IT STAFF → sarah.thompson@utas.edu.om");
    console.log("  IT STAFF → mohammed.salim@utas.edu.om");
    console.log("  EMPLOYEE → employee1@utas.edu.om");
    console.log("  EMPLOYEE → employee2@utas.edu.om");
    console.log("─────────────────────────────────────────\n");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    process.exit(1);
  }
}

seedUsers();
