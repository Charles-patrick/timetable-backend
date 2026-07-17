const mongoose = require("mongoose");

const unavailabilitySchema = new mongoose.Schema(
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
      required: true,
    },
    startTime: { type: String, required: true }, // e.g. "08:00"
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const lecturerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Enhancement: periods this lecturer is NOT available.
    // The timetable generator skips these when assigning slots.
    unavailability: {
      type: [unavailabilitySchema],
      default: [],
    },
    // Linked login account (role: 'lecturer')
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lecturer", lecturerSchema);
