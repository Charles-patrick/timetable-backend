const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    type: {
      type: String,
      enum: ["lecture_hall", "laboratory"],
      required: [true, "Venue type is required"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Venue", venueSchema);
