const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./modules/auth/auth.routes");
const lecturerRoutes = require("./modules/lecturers/lecturers.routes");
const venueRoutes = require("./modules/venues/venues.routes");
const timeSlotRoutes = require("./modules/timeslots/timeslots.routes");
const sessionRoutes = require("./modules/sessions/sessions.routes");
const semesterRoutes = require("./modules/semesters/semesters.routes");
const courseRoutes = require("./modules/courses/courses.routes");
const timetableRoutes = require("./modules/timetable/timetable.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ── Global middleware ────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// ── Route mounting ───────────────────────────────────────────
// As we build the remaining module (Timetable, Admin), add its
// router here, one line per module — same convention as before.
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/lecturers", lecturerRoutes);
app.use("/api/v1/venues", venueRoutes);
app.use("/api/v1/timeslots", timeSlotRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/semesters", semesterRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/timetable", timetableRoutes);
app.use("/api/v1/admin", adminRoutes); 

// Catch-all for undefined routes
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route not found", errors: [] });
});

// Must be the LAST middleware registered
app.use(errorHandler);

module.exports = app;
