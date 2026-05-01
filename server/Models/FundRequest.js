import mongoose from "mongoose";

const fundRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purposeTitle: { type: String, required: true },
    amountRequested: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "OMR" },
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    justification: { type: String, required: true },
    expectedDateNeeded: { type: Date, default: null },
    additionalNotes: { type: String, default: "" },
    status: {
      
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    currentStep: { type: Number, default: 1 },
    approvalFlow: [
      {
        approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, default: "" },
        action: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        comment: { type: String, default: "" },
        timestamp: { type: Date },
        currentApprover: { type: String, default: "" },
      },
    ],
    assignedHandler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

export const FundRequest = mongoose.model("FundRequest", fundRequestSchema);
