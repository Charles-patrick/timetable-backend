const Timetable = require("./timetable.model");

// Used WHILE generating: checks a candidate assignment against everything
// already placed in this run (kept in memory, not yet saved to the DB).
// Returns a conflict reason string, or null if the candidate is clear.
function findConflictInMemory(candidate, placedSoFar) {
  for (const existing of placedSoFar) {
    if (existing.timeSlot.toString() !== candidate.timeSlot.toString())
      continue;

    if (existing.lecturer.toString() === candidate.lecturer.toString()) {
      return "lecturer";
    }
    if (existing.venue.toString() === candidate.venue.toString()) {
      return "venue";
    }
    if (existing.level === candidate.level) {
      return "level";
    }
  }
  return null;
}

// Used by the Conflict Reports page: scans entries ALREADY SAVED in the DB
// for a given semester/batch and finds real conflicts. This matters because
// the generator guarantees no conflicts on creation, but an admin manually
// editing a timetable entry afterwards could still introduce one.
// Defaults to the CURRENT (latest) batch only — otherwise every past
// regeneration would get compared against every other, which always looks
// like a pile of conflicts even when nothing is actually wrong.
async function detectSavedConflicts(semesterId, batchId) {
  const resolvedBatch = batchId || (await resolveLatestBatchForSemester(semesterId));
  if (!resolvedBatch) {
    return { lecturerConflicts: [], venueConflicts: [], levelConflicts: [] };
  }

  const filter = { semester: semesterId, batchId: resolvedBatch };

  const entries = await Timetable.find(filter)
    .populate("course", "courseCode courseTitle")
    .populate("lecturer", "name")
    .populate("venue", "name")
    .populate("timeSlot", "day startTime endTime");

  const lecturerConflicts = groupConflicts(entries, (e) => `${e.timeSlot._id}-${e.lecturer._id}`);
  const venueConflicts = groupConflicts(entries, (e) => `${e.timeSlot._id}-${e.venue._id}`);
  const levelConflicts = groupConflicts(entries, (e) => `${e.timeSlot._id}-${e.level}`);

  return {
    lecturerConflicts,
    venueConflicts,
    levelConflicts,
  };
}

async function resolveLatestBatchForSemester(semesterId) {
  const latest = await Timetable.findOne({ semester: semesterId }).sort({ createdAt: -1 });
  return latest ? latest.batchId : null;
}

// Groups entries by a key; any group with more than one entry is a conflict.
function groupConflicts(entries, keyFn) {
  const groups = {};
  for (const entry of entries) {
    const key = keyFn(entry);
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return Object.values(groups).filter((group) => group.length > 1);
}

// Used when an admin manually edits a saved timetable entry: checks the
// new lecturer/venue/timeSlot combo against every OTHER saved entry in the
// same semester+batch (excluding the entry being edited).
async function wouldConflict({
  semester,
  batchId,
  timeSlot,
  lecturer,
  venue,
  level,
  excludeId,
}) {
  const filter = { semester, batchId, timeSlot, _id: { $ne: excludeId } };

  const clashes = await Timetable.find({
    ...filter,
    $or: [{ lecturer }, { venue }, { level }],
  });

  if (clashes.length === 0) return null;

  const lecturerClash = clashes.find(
    (c) => c.lecturer.toString() === lecturer.toString(),
  );
  if (lecturerClash) return "lecturer";

  const venueClash = clashes.find(
    (c) => c.venue.toString() === venue.toString(),
  );
  if (venueClash) return "venue";

  return "level";
}

module.exports = { findConflictInMemory, detectSavedConflicts, wouldConflict };
