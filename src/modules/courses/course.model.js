const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    courseUnit: {
      type: Number,
      required: [true, "Course unit is required"],
      min: 1,
    },
    level: {
      type: Number,
      required: [true, "Level is required"], // e.g. 100, 200, 300, 400
      enum: [100, 200, 300, 400, 500],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: [true, "Semester is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: [true, "Lecturer is required"],
    },
    // Enhancement: lab courses can only be assigned laboratory venues
    isLab: {
      type: Boolean,
      default: false,
    },
    // Enhancement: used for venue capacity validation during generation
    expectedClassSize: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Course", courseSchema);
