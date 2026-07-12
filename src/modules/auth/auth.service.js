const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const { AppError } = require("../../middleware/errorHandler");

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lecturerRef: user.lecturerRef,
  };

  return { token, user: safeUser };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lecturerRef: user.lecturerRef,
  };
}

module.exports = { login, getCurrentUser };
