import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    departmentCode: {
      type: String,
      required: true,
      unique: true,
    },
    departmentName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
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

export const Department = mongoose.model("Department", departmentSchema, "departments");
