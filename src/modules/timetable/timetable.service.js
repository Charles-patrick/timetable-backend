const Timetable = require("./timetable.model");
const Course = require("../courses/course.model");
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

// Admin manually places a course into a specific time slot (clicking an
// empty cell in the grid). Level is always taken from the course itself —
// never trusted from the client — so level-conflict checks stay accurate.
// If this is the first entry ever created for the semester, a fresh batch
// is started; otherwise it joins whatever the current batch already is.
async function createTimetableEntry({
  course,
  lecturer,
  venue,
  timeSlot,
  semester,
}) {
  if (!course || !venue || !timeSlot || !semester) {
    throw new AppError(
      "Course, venue, time slot and semester are required",
      400,
    );
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) throw new AppError("Course not found", 404);

  const finalLecturer = lecturer || courseDoc.lecturer;
  const batchId = (await resolveLatestBatch(semester)) || `batch_${Date.now()}`;

  const conflict = await wouldConflict({
    semester,
    batchId,
    timeSlot,
    lecturer: finalLecturer,
    venue,
    level: courseDoc.level,
  });

  if (conflict) {
    throw new AppError(`This slot already has a ${conflict} conflict`, 409);
  }

  const entry = await Timetable.create({
    course,
    lecturer: finalLecturer,
    venue,
    timeSlot,
    semester,
    level: courseDoc.level,
    batchId,
  });

  return getTimetableEntryById(entry._id);
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
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  resolveLatestBatch,
};
