import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fullName: { type: String, required: true },
    initials: { type: String, default: "" },
    staffId: { type: String, required: true, unique: true },
    manpowerId: { type: String, required: true, unique: true },
    nationalId: { type: String, unique: true, sparse: true },
    mobileNumber: { type: String, default: "" },
    officeContactNumber: { type: String, default: "" },
    office_contact_number: { type: String, default: "" },
    office: { type: String, default: "" },
    departmentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    specialization: { type: String, default: "" },
    academicQualification: { type: String, default: "" },
    academic_qualification: { type: String, default: "" },
    countryOfIssue: { type: String, default: "" },
    country_of_issue: { type: String, default: "" },
    yearOfIssue: { type: Number },
    year_of_issue: { type: Number },
    photoUrl: { type: String, default: "uploads/profiles/person.png" },
    roles: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("users", userSchema, "users");
