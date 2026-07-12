const jwt = require("jsonwebtoken");
const { AppError } = require("./errorHandler");

// Reads the JWT from the httpOnly cookie set at login, verifies it,
// and attaches the decoded payload ({ id, role }) to req.user.
function verifyToken(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new AppError("Not authenticated. Please log in.", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid or expired session. Please log in again.", 401));
  }
}

// Usage: router.get("/", verifyToken, requireRole("admin"), handler)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Not authenticated.", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to do this.", 403));
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
