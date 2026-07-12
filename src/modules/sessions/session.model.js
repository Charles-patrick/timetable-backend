const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    name: {
      type: String, // e.g. "2025/2026"
      required: [true, "Session name is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "inactive",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Session", sessionSchema);
