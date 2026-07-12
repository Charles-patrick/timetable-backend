const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: [true, "Day is required"],
    },
    startTime: {
      type: String, // "08:00" 24hr format, kept as string for simple display/sorting
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
  },
  { timestamps: true },
);

// Prevent creating the exact same slot twice
timeSlotSchema.index({ day: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
