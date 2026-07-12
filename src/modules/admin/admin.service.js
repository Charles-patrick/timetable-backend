const Course = require("../courses/course.model");
const Lecturer = require("../lecturers/lecturer.model");
const Venue = require("../venues/venue.model");
const TimeSlot = require("../timeslots/timeslot.model");
const Session = require("../sessions/session.model");
const Semester = require("../semesters/semester.model");
const Timetable = require("../timetable/timetable.model");
const UnscheduledEntry = require("../timetable/unscheduledEntry.model");
const { resolveLatestBatch } = require("../timetable/timetable.service");

async function getDashboardStats() {
  const [
    totalCourses,
    totalLecturers,
    totalVenues,
    totalTimeSlots,
    activeSession,
    activeSemester,
  ] = await Promise.all([
    Course.countDocuments(),
    Lecturer.countDocuments(),
    Venue.countDocuments(),
    TimeSlot.countDocuments(),
    Session.findOne({ status: "active" }),
    Semester.findOne({ active: true }).populate("session", "name status"),
  ]);

  // Timetable entry count / unscheduled count are scoped to whichever
  // semester is currently active, since that's "the current timetable"
  // from the admin's point of view.
  let totalTimetableEntries = 0;
  let totalUnscheduled = 0;
  let latestBatchId = null;

  if (activeSemester) {
    latestBatchId = await resolveLatestBatch(activeSemester._id);
    if (latestBatchId) {
      [totalTimetableEntries, totalUnscheduled] = await Promise.all([
        Timetable.countDocuments({
          semester: activeSemester._id,
          batchId: latestBatchId,
        }),
        UnscheduledEntry.countDocuments({
          semester: activeSemester._id,
          batchId: latestBatchId,
        }),
      ]);
    }
  }

  return {
    totalCourses,
    totalLecturers,
    totalVenues,
    totalTimeSlots,
    activeSession: activeSession
      ? {
          id: activeSession._id,
          name: activeSession.name,
          status: activeSession.status,
        }
      : null,
    activeSemester: activeSemester
      ? {
          id: activeSemester._id,
          name: activeSemester.name,
          session: activeSemester.session,
        }
      : null,
    totalTimetableEntries,
    totalUnscheduled,
    latestBatchId,
  };
}

module.exports = { getDashboardStats };
