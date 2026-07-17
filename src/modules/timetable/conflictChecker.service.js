const Timetable = require("./timetable.model");
const TimeSlot = require("../timeslots/timeslot.model");

// Two time slots conflict if they're on the same day and their time ranges
// actually overlap — NOT just if they're the exact same TimeSlot document.
// Times are "HH:MM" strings, which compare correctly as plain strings.
// This is what makes 8:00-10:00, 8:30-9:30, and 9:00-10:00 correctly seen
// as overlapping, even though they're three different Time Slot records.
function timeRangesOverlap(a, b) {
  if (a.day !== b.day) return false;
  return !(a.endTime <= b.startTime || a.startTime >= b.endTime);
}

// A "level conflict" only makes sense within the same student cohort. Two
// different departments both running a 300-level class at the same time is
// completely fine — they're different students. So level conflicts only
// count when the two courses actually share at least one department.
function departmentsIntersect(a = [], b = []) {
  const setB = new Set(b.map((id) => id.toString()));
  return a.some((id) => setB.has(id.toString()));
}

// Used WHILE generating: checks a candidate assignment against everything
// already placed in this run (kept in memory, not yet saved to the DB).
// candidate/placed shape: { lecturer, venue, level, departments, timeSlotInfo: {day,startTime,endTime} }
function findConflictInMemory(candidate, placedSoFar) {
  for (const existing of placedSoFar) {
    if (!timeRangesOverlap(candidate.timeSlotInfo, existing.timeSlotInfo))
      continue;

    if (existing.lecturer.toString() === candidate.lecturer.toString()) {
      return "lecturer";
    }
    if (existing.venue.toString() === candidate.venue.toString()) {
      return "venue";
    }
    if (
      existing.level === candidate.level &&
      departmentsIntersect(candidate.departments, existing.departments)
    ) {
      return "level";
    }
  }
  return null;
}

// Used by the Conflict Reports page: scans entries ALREADY SAVED in the DB
// for a given semester/batch and finds real conflicts — checked pairwise,
// since time-overlap isn't transitive (A overlapping B and B overlapping C
// doesn't mean A overlaps C), so entries can't be bucketed into simple groups.
async function detectSavedConflicts(semesterId, batchId) {
  const resolvedBatch =
    batchId || (await resolveLatestBatchForSemester(semesterId));
  if (!resolvedBatch) {
    return { lecturerConflicts: [], venueConflicts: [], levelConflicts: [] };
  }

  const entries = await Timetable.find({
    semester: semesterId,
    batchId: resolvedBatch,
  })
    .populate("course", "courseCode courseTitle departments")
    .populate("lecturer", "name")
    .populate("venue", "name")
    .populate("timeSlot", "day startTime endTime");

  const lecturerConflicts = [];
  const venueConflicts = [];
  const levelConflicts = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (!timeRangesOverlap(a.timeSlot, b.timeSlot)) continue;

      if (a.lecturer._id.toString() === b.lecturer._id.toString()) {
        lecturerConflicts.push([a, b]);
      }
      if (a.venue._id.toString() === b.venue._id.toString()) {
        venueConflicts.push([a, b]);
      }
      if (
        a.level === b.level &&
        departmentsIntersect(a.course.departments, b.course.departments)
      ) {
        levelConflicts.push([a, b]);
      }
    }
  }

  return { lecturerConflicts, venueConflicts, levelConflicts };
}

async function resolveLatestBatchForSemester(semesterId) {
  const latest = await Timetable.findOne({ semester: semesterId }).sort({
    createdAt: -1,
  });
  return latest ? latest.batchId : null;
}

// Used when an admin manually creates or edits a saved timetable entry:
// checks the new lecturer/venue/timeSlot/department combo against every
// OTHER saved entry in the same semester+batch (excluding the entry being
// edited, if any), using real time overlap rather than exact slot match.
async function wouldConflict({
  semester,
  batchId,
  timeSlot,
  lecturer,
  venue,
  level,
  departments,
  excludeId,
}) {
  const candidateSlot = await TimeSlot.findById(timeSlot);
  if (!candidateSlot) return null;

  const filter = { semester, batchId };
  if (excludeId) filter._id = { $ne: excludeId };

  const existingEntries = await Timetable.find(filter)
    .populate("timeSlot", "day startTime endTime")
    .populate("course", "departments");

  for (const entry of existingEntries) {
    if (!timeRangesOverlap(candidateSlot, entry.timeSlot)) continue;

    if (entry.lecturer.toString() === lecturer.toString()) return "lecturer";
    if (entry.venue.toString() === venue.toString()) return "venue";
    if (
      entry.level === level &&
      departmentsIntersect(departments, entry.course.departments)
    ) {
      return "level";
    }
  }

  return null;
}

module.exports = { findConflictInMemory, detectSavedConflicts, wouldConflict };
