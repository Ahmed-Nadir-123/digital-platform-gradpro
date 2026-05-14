import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./Models/User.js";
import { Department } from "./Models/Department.js";
import { WorkflowSettings } from "./Models/WorkflowSettings.js";
import { AssignmentRule } from "./Models/assignmentRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const connectString = process.env.MONGODB_URI;

const ensureConnection = async () => {
  if (!connectString || connectString.includes("your_mongodb_connection_string_here")) {
    throw new Error("MONGODB_URI is not configured. Please set it in the .env file.");
  }
  await mongoose.connect(connectString, { serverSelectionTimeoutMS: 10000 });
};

const buildDeptMap = (departments) => {
  const map = new Map();
  departments.forEach((dept) => {
    map.set(dept.departmentCode, dept);
  });
  return map;
};

const seed = async () => {
  await ensureConnection();

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    WorkflowSettings.deleteMany({}),
    AssignmentRule.deleteMany({}),
  ]);

  const departments = await Department.insertMany([
    { departmentCode: "IT",   departmentName: "Information Technology", description: "IT services and infrastructure." },
    { departmentCode: "ENG",  departmentName: "Engineering",           description: "Engineering department." },
    { departmentCode: "GR",   departmentName: "General Requirements",  description: "General requirements and foundation studies." },
    { departmentCode: "EN",   departmentName: "English Language",      description: "English language studies." },
    { departmentCode: "AVC",  departmentName: "AVC Office",            description: "Office of the Assistant Vice Chancellor." },
    { departmentCode: "FIN",  departmentName: "Finance",               description: "Finance and budgeting." },
    { departmentCode: "PR",   departmentName: "Public Relations",      description: "Public relations and communications." },
    { departmentCode: "RISK", departmentName: "Risk Management",       description: "Health, safety and risk management." },
  ]);

  const deptMap = buildDeptMap(departments);
  const defaultPassword = await bcrypt.hash("Password@123", 10);

  const users = await User.insertMany([
    {
      email: "admin@utas.edu.om",
      password: defaultPassword,
      fullName: "Khalid Al-Rashidi",
      initials: "KR",
      staffId: "STF0001",
      manpowerId: "MP0001",
      nationalId: "20312345",
      mobileNumber: "+968 91234567",
      officeContactNumber: "+968 24110001",
      office: "A101",
      specialization: "System Administration",
      academicQualification: "MSc Computer Science",
      countryOfIssue: "Oman",
      yearOfIssue: 2018,
      roles: ["admin"],
      departmentRef: deptMap.get("AVC")._id,
    },
    {
      email: "it.hod@utas.edu.om",
      password: defaultPassword,
      fullName: "Mohammed Al-Balushi",
      initials: "MB",
      staffId: "STF0002",
      manpowerId: "MP0002",
      nationalId: "20423456",
      mobileNumber: "+968 92345678",
      officeContactNumber: "+968 24110002",
      office: "B201",
      specialization: "Network Engineering",
      academicQualification: "PhD Information Technology",
      countryOfIssue: "Oman",
      yearOfIssue: 2016,
      roles: ["staff", "hod", "it_hod"],
      departmentRef: deptMap.get("IT")._id,
    },
    {
      email: "eng.hod@utas.edu.om",
      password: defaultPassword,
      fullName: "Ahmed Al-Harthi",
      initials: "AH",
      staffId: "STF0003",
      manpowerId: "MP0003",
      nationalId: "20534567",
      mobileNumber: "+968 93456789",
      officeContactNumber: "+968 24110003",
      office: "C301",
      specialization: "Civil Engineering",
      academicQualification: "PhD Engineering",
      countryOfIssue: "Oman",
      yearOfIssue: 2015,
      roles: ["staff", "hod"],
      departmentRef: deptMap.get("ENG")._id,
    },
    {
      email: "gr.hod@utas.edu.om",
      password: defaultPassword,
      fullName: "Fatima Al-Mawali",
      initials: "FM",
      staffId: "STF0004",
      manpowerId: "MP0004",
      nationalId: "30645678",
      mobileNumber: "+968 94567890",
      officeContactNumber: "+968 24110004",
      office: "D101",
      specialization: "Mathematics",
      academicQualification: "PhD Mathematics",
      countryOfIssue: "Oman",
      yearOfIssue: 2019,
      roles: ["staff", "hod"],
      departmentRef: deptMap.get("GR")._id,
    },
    {
      email: "en.hod@utas.edu.om",
      password: defaultPassword,
      fullName: "Sara Al-Zadjali",
      initials: "SZ",
      staffId: "STF0005",
      manpowerId: "MP0005",
      nationalId: "30756789",
      mobileNumber: "+968 95678901",
      officeContactNumber: "+968 24110005",
      office: "E201",
      specialization: "Applied Linguistics",
      academicQualification: "PhD English Literature",
      countryOfIssue: "Oman",
      yearOfIssue: 2017,
      roles: ["staff", "hod"],
      departmentRef: deptMap.get("EN")._id,
    },
    {
      email: "head.academic@utas.edu.om",
      password: defaultPassword,
      fullName: "Abdullah Al-Kindi",
      initials: "AK",
      staffId: "STF0006",
      manpowerId: "MP0006",
      nationalId: "20867890",
      mobileNumber: "+968 96789012",
      officeContactNumber: "+968 24110006",
      office: "A205",
      specialization: "Academic Affairs",
      academicQualification: "PhD Education Management",
      countryOfIssue: "Oman",
      yearOfIssue: 2014,
      roles: ["head_academic"],
      departmentRef: deptMap.get("AVC")._id,
    },
    {
      email: "avc@utas.edu.om",
      password: defaultPassword,
      fullName: "Hamad Al-Busaidi",
      initials: "HB",
      staffId: "STF0007",
      manpowerId: "MP0007",
      nationalId: "20978901",
      mobileNumber: "+968 97890123",
      officeContactNumber: "+968 24110007",
      office: "A301",
      specialization: "University Management",
      academicQualification: "PhD Business Administration",
      countryOfIssue: "Oman",
      yearOfIssue: 2013,
      roles: ["avc"],
      departmentRef: deptMap.get("AVC")._id,
    },
    {
      email: "dean@utas.edu.om",
      password: defaultPassword,
      fullName: "Yousuf Al-Farsi",
      initials: "YF",
      staffId: "STF0008",
      manpowerId: "MP0008",
      nationalId: "21089012",
      mobileNumber: "+968 98901234",
      officeContactNumber: "+968 24110008",
      office: "A401",
      specialization: "Academic Leadership",
      academicQualification: "PhD Engineering Management",
      countryOfIssue: "Oman",
      yearOfIssue: 2015,
      roles: ["dean"],
      departmentRef: deptMap.get("AVC")._id,
    },
    {
      email: "finance@utas.edu.om",
      password: defaultPassword,
      fullName: "Noura Al-Habsi",
      initials: "NH",
      staffId: "STF0009",
      manpowerId: "MP0009",
      nationalId: "31190123",
      mobileNumber: "+968 91123456",
      officeContactNumber: "+968 24110009",
      office: "F101",
      specialization: "Financial Management",
      academicQualification: "MSc Accounting",
      countryOfIssue: "Oman",
      yearOfIssue: 2020,
      roles: ["finance"],
      departmentRef: deptMap.get("FIN")._id,
    },
    {
      email: "pr@utas.edu.om",
      password: defaultPassword,
      fullName: "Mariam Al-Shukaili",
      initials: "MS",
      staffId: "STF0010",
      manpowerId: "MP0010",
      nationalId: "31201234",
      mobileNumber: "+968 92234567",
      officeContactNumber: "+968 24110010",
      office: "P101",
      specialization: "Public Relations",
      academicQualification: "BSc Communications",
      countryOfIssue: "Oman",
      yearOfIssue: 2021,
      roles: ["public_relations"],
      departmentRef: deptMap.get("PR")._id,
    },
    {
      email: "it.staff1@utas.edu.om",
      password: defaultPassword,
      fullName: "Ali Al-Amri",
      initials: "AA",
      staffId: "STF0011",
      manpowerId: "MP0011",
      nationalId: "21312345",
      mobileNumber: "+968 93345678",
      officeContactNumber: "+968 24110011",
      office: "B102",
      specialization: "Systems Support",
      academicQualification: "BSc Information Technology",
      countryOfIssue: "Oman",
      yearOfIssue: 2022,
      roles: ["it_staff"],
      departmentRef: deptMap.get("IT")._id,
    },
    {
      email: "it.staff2@utas.edu.om",
      password: defaultPassword,
      fullName: "Salim Al-Mahrouqi",
      initials: "SM",
      staffId: "STF0012",
      manpowerId: "MP0012",
      nationalId: "21423456",
      mobileNumber: "+968 94456789",
      officeContactNumber: "+968 24110012",
      office: "B103",
      specialization: "Network Support",
      academicQualification: "BSc Computer Networks",
      countryOfIssue: "Oman",
      yearOfIssue: 2021,
      roles: ["it_staff"],
      departmentRef: deptMap.get("IT")._id,
    },
    {
      email: "print@utas.edu.om",
      password: defaultPassword,
      fullName: "Hanan Al-Rawahi",
      initials: "HR",
      staffId: "STF0013",
      manpowerId: "MP0013",
      nationalId: "31534567",
      mobileNumber: "+968 95567890",
      officeContactNumber: "+968 24110013",
      office: "G101",
      specialization: "Document Management",
      academicQualification: "Diploma Office Management",
      countryOfIssue: "Oman",
      yearOfIssue: 2019,
      roles: ["print_officer"],
      departmentRef: deptMap.get("AVC")._id,
    },
    {
      email: "risk@utas.edu.om",
      password: defaultPassword,
      fullName: "Badr Al-Ghafri",
      initials: "BG",
      staffId: "STF0014",
      manpowerId: "MP0014",
      nationalId: "21645678",
      mobileNumber: "+968 96678901",
      officeContactNumber: "+968 24110014",
      office: "R101",
      specialization: "Risk Assessment",
      academicQualification: "MSc Safety Engineering",
      countryOfIssue: "Oman",
      yearOfIssue: 2018,
      roles: ["safety_officer"],
      departmentRef: deptMap.get("RISK")._id,
    },
    {
      email: "staff.it@utas.edu.om",
      password: defaultPassword,
      fullName: "Layla Al-Nabhani",
      initials: "LN",
      staffId: "STF0015",
      manpowerId: "MP0015",
      nationalId: "31756789",
      mobileNumber: "+968 97789012",
      officeContactNumber: "+968 24110015",
      office: "B205",
      specialization: "Web Development",
      academicQualification: "BSc Computer Science",
      countryOfIssue: "Oman",
      yearOfIssue: 2023,
      roles: ["staff"],
      departmentRef: deptMap.get("IT")._id,
    },
    {
      email: "staff.eng@utas.edu.om",
      password: defaultPassword,
      fullName: "Omar Al-Jabri",
      initials: "OJ",
      staffId: "STF0016",
      manpowerId: "MP0016",
      nationalId: "21867890",
      mobileNumber: "+968 98890123",
      officeContactNumber: "+968 24110016",
      office: "C205",
      specialization: "Mechanical Engineering",
      academicQualification: "BSc Mechanical Engineering",
      countryOfIssue: "Oman",
      yearOfIssue: 2022,
      roles: ["staff"],
      departmentRef: deptMap.get("ENG")._id,
    },
  ]);

  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  await Promise.all([
    Department.findByIdAndUpdate(deptMap.get("IT")._id,   { headOfDepartment: usersByEmail.get("it.hod@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("ENG")._id,  { headOfDepartment: usersByEmail.get("eng.hod@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("GR")._id,   { headOfDepartment: usersByEmail.get("gr.hod@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("EN")._id,   { headOfDepartment: usersByEmail.get("en.hod@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("AVC")._id,  { headOfDepartment: usersByEmail.get("avc@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("FIN")._id,  { headOfDepartment: usersByEmail.get("finance@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("PR")._id,   { headOfDepartment: usersByEmail.get("pr@utas.edu.om")._id }),
    Department.findByIdAndUpdate(deptMap.get("RISK")._id, { headOfDepartment: usersByEmail.get("risk@utas.edu.om")._id }),
  ]);

  await WorkflowSettings.insertMany([
    {
      requestType: "purchase",
      workflowName: "Purchase Approval Workflow",
      approvalLevels: [
        { level: 1, roleName: "hod", isRequired: true },
        { level: 2, roleName: "finance", isRequired: true },
      ],
    },
    {
      requestType: "transportation",
      workflowName: "Transportation Approval Workflow",
      approvalLevels: [
        { level: 1, roleName: "hod", isRequired: true },
        { level: 2, roleName: "avc", isRequired: true },
        { level: 3, roleName: "public_relations", isRequired: true },
      ],
    },
    {
      requestType: "food",
      workflowName: "Food Approval Workflow",
      approvalLevels: [
        { level: 1, roleName: "hod", isRequired: true },
        { level: 2, roleName: "avc", isRequired: true },
        { level: 3, roleName: "finance", isRequired: true },
      ],
    },
    {
      requestType: "fund",
      workflowName: "Fund Approval Workflow",
      approvalLevels: [
        { level: 1, roleName: "head_academic", isRequired: true },
        { level: 2, roleName: "dean", isRequired: true },
        { level: 3, roleName: "finance", isRequired: true },
      ],
    },
    {
      requestType: "install_software",
      workflowName: "Install Software Workflow",
      approvalLevels: [{ level: 1, roleName: "it_staff", isRequired: true }],
    },
    {
      requestType: "printing",
      workflowName: "Printing Workflow",
      approvalLevels: [{ level: 1, roleName: "print_officer", isRequired: true }],
    },
    {
      requestType: "risk_report",
      workflowName: "Risk Report Workflow",
      approvalLevels: [{ level: 1, roleName: "safety_officer", isRequired: true }],
    },
  ]);

  await AssignmentRule.insertMany([
    {
      serviceType: "install_software",
      targetRole: "it_staff",
      assignmentMode: "round_robin",
      description: "Rotate between IT staff handlers.",
    },
    {
      serviceType: "printing",
      targetRole: "print_officer",
      assignmentMode: "least_load",
      description: "Assign to print officer with the lowest load.",
    },
    {
      serviceType: "risk_report",
      targetRole: "safety_officer",
      assignmentMode: "department",
      description: "Prefer safety officer from the same department.",
    },
  ]);

  console.log("Seed complete.");
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  mongoose.disconnect();
  process.exit(1);
});
