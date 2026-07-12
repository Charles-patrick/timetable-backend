const Timetable = require("./timetable.model");
const { wouldConflict } = require("./conflictChecker.service");
const { AppError } = require("../../middleware/errorHandler");

// If no batchId is given, resolve the most recent generation run for
// this semester so views default to "the current timetable" automatically.
async function resolveLatestBatch(semesterId) {
  const latest = await Timetable.findOne({ semester: semesterId }).sort({
    createdAt: -1,
  });
  return latest ? latest.batchId : null;
}

async function listTimetable({
  semester,
  level,
  day,
  search,
  batchId,
  lecturer,
}) {
  if (!semester) {
    throw new AppError("Semester is required", 400);
  }

  const resolvedBatch = batchId || (await resolveLatestBatch(semester));
  if (!resolvedBatch) return [];

  const filter = { semester, batchId: resolvedBatch };
  if (level) filter.level = level;
  if (lecturer) filter.lecturer = lecturer;

  let query = Timetable.find(filter)
    .populate("course", "courseCode courseTitle courseUnit department")
    .populate("lecturer", "name email")
    .populate("venue", "name type")
    .populate("timeSlot", "day startTime endTime")
    .populate("semester", "name session");

  let entries = await query;

  if (day) {
    entries = entries.filter((e) => e.timeSlot.day === day);
  }

  if (search) {
    const term = search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.course.courseCode.toLowerCase().includes(term) ||
        e.course.courseTitle.toLowerCase().includes(term) ||
        e.lecturer.name.toLowerCase().includes(term) ||
        e.venue.name.toLowerCase().includes(term),
    );
  }

  return entries;
}

async function getTimetableEntryById(id) {
  const entry = await Timetable.findById(id)
    .populate("course", "courseCode courseTitle department")
    .populate("lecturer", "name email")
    .populate("venue", "name type")
    .populate("timeSlot", "day startTime endTime");
  if (!entry) throw new AppError("Timetable entry not found", 404);
  return entry;
}

// Admin manually reassigns lecturer/venue/timeSlot on one entry.
// Re-checks conflicts against every other entry in the same batch first.
async function updateTimetableEntry(id, { lecturer, venue, timeSlot }) {
  const entry = await Timetable.findById(id);
  if (!entry) throw new AppError("Timetable entry not found", 404);

  const newLecturer = lecturer || entry.lecturer;
  const newVenue = venue || entry.venue;
  const newTimeSlot = timeSlot || entry.timeSlot;

  const conflict = await wouldConflict({
    semester: entry.semester,
    batchId: entry.batchId,
    timeSlot: newTimeSlot,
    lecturer: newLecturer,
    venue: newVenue,
    level: entry.level,
    excludeId: entry._id,
  });

  if (conflict) {
    throw new AppError(
      `This change creates a ${conflict} conflict with another entry`,
      409,
    );
  }

  entry.lecturer = newLecturer;
  entry.venue = newVenue;
  entry.timeSlot = newTimeSlot;
  await entry.save();

  return entry;
}

async function deleteTimetableEntry(id) {
  const entry = await Timetable.findByIdAndDelete(id);
  if (!entry) throw new AppError("Timetable entry not found", 404);
}

module.exports = {
  listTimetable,
  getTimetableEntryById,
  updateTimetableEntry,
  deleteTimetableEntry,
  resolveLatestBatch,
};
