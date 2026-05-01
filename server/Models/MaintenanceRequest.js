import mongoose from "mongoose";

const maintenanceRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    contactNo: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    dateTime: { type: String },
    description: { type: String, required: true },
    remarks: { type: String, default: "" },
    risk: { type: String, enum: ["Yes", "No"], default: "No" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Approved", "Rejected", "Resolved"],
      default: "Pending",
    },
    currentStep: { type: Number, default: 0 },
    assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalFlow: [
      {
        approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: String,
        action: { type: String, default: "Pending" },
        comment: { type: String, default: "" },
        timestamp: Date,
        currentApprover: String,
      },
    ],
  },
  { timestamps: true },
);

export const MaintenanceRequest = mongoose.model(
  "MaintenanceRequest",
  maintenanceRequestSchema,
  "maintenanceRequests",
);
