const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Lecturer = require("./lecturer.model");
const User = require("../users/user.model");
const { AppError } = require("../../middleware/errorHandler");

// Creating a lecturer also creates their login account (role: 'lecturer'),
// since the project spec's Lecturer Management includes a Password field.
// Done inside a transaction so we never end up with one doc but not the other.
async function createLecturer({ name, email, department, password }) {
  if (!name || !email || !department || !password) {
    throw new AppError(
      "Name, email, department and password are required",
      400,
    );
  }

  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const session = await mongoose.startSession();
  try {
    let lecturer;
    await session.withTransaction(async () => {
      const hashedPassword = await bcrypt.hash(password, 10);

      const [user] = await User.create(
        [
          {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "lecturer",
          },
        ],
        { session },
      );

      const [createdLecturer] = await Lecturer.create(
        [{ name, email: normalizedEmail, department, user: user._id }],
        { session },
      );

      user.lecturerRef = createdLecturer._id;
      await user.save({ session });

      lecturer = createdLecturer;
    });
    return lecturer;
  } finally {
    session.endSession();
  }
}

async function listLecturers({ search, department } = {}) {
  const filter = {};

  if (department) filter.department = department;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }

  return Lecturer.find(filter).sort({ name: 1 });
}

async function getLecturerById(id) {
  const lecturer = await Lecturer.findById(id);
  if (!lecturer) throw new AppError("Lecturer not found", 404);
  return lecturer;
}

async function updateLecturer(
  id,
  { name, email, department, password, unavailability },
) {
  const lecturer = await Lecturer.findById(id);
  if (!lecturer) throw new AppError("Lecturer not found", 404);

  const user = await User.findById(lecturer.user);
  if (!user) throw new AppError("Linked user account not found", 404);

  if (email && email.toLowerCase() !== lecturer.email) {
    const emailTaken = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (emailTaken)
      throw new AppError("A user with this email already exists", 409);
    lecturer.email = email.toLowerCase();
    user.email = email.toLowerCase();
  }

  if (name) {
    lecturer.name = name;
    user.name = name;
  }
  if (department) lecturer.department = department;
  if (unavailability) lecturer.unavailability = unavailability;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  await lecturer.save();
  await user.save();

  return lecturer;
}

async function deleteLecturer(id) {
  const lecturer = await Lecturer.findById(id);
  if (!lecturer) throw new AppError("Lecturer not found", 404);

  await User.findByIdAndDelete(lecturer.user);
  await Lecturer.findByIdAndDelete(id);
}

module.exports = {
  createLecturer,
  listLecturers,
  getLecturerById,
  updateLecturer,
  deleteLecturer,
};
