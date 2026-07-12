// Custom error class services/controllers can throw for predictable,
// well-formatted API errors, e.g. throw new AppError("Course not found", 404)
class AppError extends Error {
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Must be registered LAST in app.js, after all routes.
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errors = err.errors || [];

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Mongoose duplicate key error (e.g. duplicate email/courseCode)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? field : "Field"} already exists`;
    errors = [err.keyValue];
  }

  // Invalid ObjectId cast
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = errorHandler;
module.exports.AppError = AppError;
