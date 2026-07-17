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
    // A course can be offered to more than one department (e.g. a shared
    // core course), so this is a list rather than a single value.
    departments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one department is required",
      },
    },
    // Likewise, more than one lecturer may be able to teach a course —
    // the specific lecturer for a given timetable slot is chosen when it's
    // scheduled (manually or by the generator), not fixed here.
    lecturers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecturer" }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one lecturer is required",
      },
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
