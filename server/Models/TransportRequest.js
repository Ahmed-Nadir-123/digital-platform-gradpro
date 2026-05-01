import mongoose from "mongoose";

const transportRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: { type: String, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    numberOfPassengers: { type: Number, required: true, min: 1 },
    purpose: { type: String, required: true },
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
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

export const TransportRequest = mongoose.model(
  "TransportRequest",
  transportRequestSchema,
);
