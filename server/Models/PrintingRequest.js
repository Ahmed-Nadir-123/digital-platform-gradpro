import mongoose from "mongoose";

const printingRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: { type: String, required: true },
    orientation: { type: String, required: true },
    stapling: { type: String, required: true },
    numPages: { type: Number, required: true },
    numSets: { type: Number, required: true },
    notes: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Approved", "Completed", "Rejected"],
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

export const PrintingRequest = mongoose.model(
  "PrintingRequest",
  printingRequestSchema,
  "printingRequests",
);
