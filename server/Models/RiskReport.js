import mongoose from "mongoose";

const riskReportSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: { type: String, required: true },
    riskType: { type: String, required: true },
    urgency: { type: String, default: "Medium" },
    description: { type: String, required: true },
    actionRequested: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Rejected", "Resolved"],
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

export const RiskReport = mongoose.model(
  "RiskReport",
  riskReportSchema,
  "riskReports",
);
