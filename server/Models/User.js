import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
    },
    personal_name: {
      type: String,
      required: true,
    },
    initials: {
      type: String,
    },
    national_id: {
      type: String,
    },
    manpower_id: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    nationality: {
      type: String,
    },
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
    mobile_number: {
      type: String,
    },
    department: {
      type: String,
    },
    office: {
      type: String,
    },
    office_contact_number: {
      type: String,
    },
    academic_qualification: {
      type: String,
    },
    year_of_issue: {
      type: Number,
    },
    specialization: {
      type: String,
    },
    name_of_university: {
      type: String,
    },
    country_of_issue: {
      type: String,
    },
    photoUrl: {
      type: String,
      default: "",
    },
    // "itstaff" for regular employees; other values (e.g. "IT Staff", "IT Manager") for
    // managers / handlers — mirrors the old Manager.role field.
    role: {
      type: String,
      default: "itstaff",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema, "users");
