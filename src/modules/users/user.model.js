const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned by default on find()
    },
    role: {
      type: String,
      enum: ["admin", "lecturer"],
      required: true,
    },
    // If role === "lecturer", links to the corresponding Lecturer profile doc
    // (built in Module 3). Left as a loose ref now so auth doesn't depend on
    // the lecturers module existing yet.
    lecturerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
