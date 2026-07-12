const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["first", "second"],
      required: [true, "Semester name is required"],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session is required"],
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Only one "first" and one "second" semester per session
semesterSchema.index({ name: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Semester", semesterSchema);
