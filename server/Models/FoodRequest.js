import mongoose from "mongoose";

const foodRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    occasionName: { type: String, required: true },
    eventDate: { type: Date, required: true },
    numberOfPersons: { type: Number, required: true, min: 1 },
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snacks"],
      required: true,
    },
    location: { type: String, required: true },
    dietaryRequirements: { type: String, default: "" },
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

export const FoodRequest = mongoose.model("FoodRequest", foodRequestSchema);
