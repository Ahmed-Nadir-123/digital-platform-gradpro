import mongoose from "mongoose";

const requestCounterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const RequestCounter = mongoose.model(
  "RequestCounter",
  requestCounterSchema,
  "requestCounters",
);
