const Course = require("../courses/course.model");
const Venue = require("../venues/venue.model");
const TimeSlot = require("../timeslots/timeslot.model");
const Semester = require("../semesters/semester.model");
const Timetable = require("./timetable.model");
const UnscheduledEntry = require("./unscheduledEntry.model");
const { findConflictInMemory } = require("./conflictChecker.service");
const { AppError } = require("../../middleware/errorHandler");

// Checks whether a lecturer marked themselves unavailable for a given
// time slot (enhancement: Lecturer Availability). Simple overlap check.
function isLecturerUnavailable(lecturer, timeSlot) {
  if (!lecturer.unavailability || lecturer.unavailability.length === 0)
    return false;

  return lecturer.unavailability.some((u) => {
    if (u.day !== timeSlot.day) return false;
    return !(
      timeSlot.endTime <= u.startTime || timeSlot.startTime >= u.endTime
    );
  });
}

// Picks venues eligible for a course: lab courses only get laboratory
// venues (enhancement: Laboratory Course Support), and if the course
// specifies an expected class size, venues below that capacity are
// skipped (enhancement: Venue Capacity Validation).
function eligibleVenues(course, venues) {
  return venues.filter((v) => {
    if (course.isLab && v.type !== "laboratory") return false;
    if (course.expectedClassSize && v.capacity < course.expectedClassSize)
      return false;
    return true;
  });
}

async function generateTimetable(semesterId) {
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new AppError("Semester not found", 404);

  const courses = await Course.find({ semester: semesterId }).populate(
    "lecturers",
  );
  if (courses.length === 0) {
    throw new AppError("No courses found for this semester", 400);
  }

  const venues = await Venue.find();
  const timeSlots = await TimeSlot.find();

  if (venues.length === 0 || timeSlots.length === 0) {
    throw new AppError(
      "Venues and time slots must be set up before generating",
      400,
    );
  }

  // Heuristic ordering: lab courses and higher-unit courses are harder to
  // place (fewer eligible venues / bigger classes), so schedule them first
  // while the most options are still open.
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.isLab !== b.isLab) return a.isLab ? -1 : 1;
    return b.courseUnit - a.courseUnit;
  });

  const batchId = `batch_${Date.now()}`;
  const placed = [];
  const unscheduled = [];

  for (const course of sortedCourses) {
    const candidateVenues = eligibleVenues(course, venues);
    let wasPlaced = false;

    // A course may have several lecturers able to teach it — try each one,
    // since a lecturer being busy at a given slot no longer rules out the
    // course entirely, just that particular lecturer for that slot.
    outer: for (const lecturer of course.lecturers) {
      for (const timeSlot of timeSlots) {
        if (isLecturerUnavailable(lecturer, timeSlot)) continue;

        for (const venue of candidateVenues) {
          const candidate = {
            course: course._id,
            lecturer: lecturer._id,
            venue: venue._id,
            timeSlot: timeSlot._id,
            semester: semesterId,
            level: course.level,
            batchId,
            // Extra fields used only for in-memory conflict checking below —
            // Mongoose silently drops them on insertMany since they aren't
            // part of the Timetable schema.
            timeSlotInfo: {
              day: timeSlot.day,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
            },
            departments: course.departments,
          };

          const conflict = findConflictInMemory(candidate, placed);
          if (!conflict) {
            placed.push(candidate);
            wasPlaced = true;
            break outer;
          }
        }
      }
    }

    if (!wasPlaced) {
      const reason =
        candidateVenues.length === 0
          ? "No eligible venue (check lab requirement or capacity)"
          : "No time slot available without a lecturer, venue, or level conflict, across all assignable lecturers";

      unscheduled.push({
        course: course._id,
        semester: semesterId,
        batchId,
        reason,
      });
    }
  }

  if (placed.length > 0) {
    await Timetable.insertMany(placed);
  }
  if (unscheduled.length > 0) {
    await UnscheduledEntry.insertMany(unscheduled);
  }

  const populatedUnscheduled = await UnscheduledEntry.find({
    batchId,
  }).populate("course", "courseCode courseTitle");

  return {
    batchId,
    totalCourses: courses.length,
    scheduledCount: placed.length,
    unscheduledCount: unscheduled.length,
    unscheduled: populatedUnscheduled,
  };
}

module.exports = { generateTimetable };
