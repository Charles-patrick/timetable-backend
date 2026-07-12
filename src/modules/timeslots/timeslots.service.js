const TimeSlot = require("./timeslot.model");
const { AppError } = require("../../middleware/errorHandler");

function validateTimes(startTime, endTime) {
  if (startTime >= endTime) {
    throw new AppError("Start time must be before end time", 400);
  }
}

async function createTimeSlot({ day, startTime, endTime }) {
  if (!day || !startTime || !endTime) {
    throw new AppError("Day, start time and end time are required", 400);
  }
  validateTimes(startTime, endTime);
  return TimeSlot.create({ day, startTime, endTime });
}

async function listTimeSlots({ day } = {}) {
  const filter = {};
  if (day) filter.day = day;
  // Sort by day-of-week order, then start time
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const slots = await TimeSlot.find(filter);
  return slots.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

async function getTimeSlotById(id) {
  const slot = await TimeSlot.findById(id);
  if (!slot) throw new AppError("Time slot not found", 404);
  return slot;
}

async function updateTimeSlot(id, { day, startTime, endTime }) {
  const slot = await TimeSlot.findById(id);
  if (!slot) throw new AppError("Time slot not found", 404);

  const newStart = startTime || slot.startTime;
  const newEnd = endTime || slot.endTime;
  validateTimes(newStart, newEnd);

  if (day) slot.day = day;
  slot.startTime = newStart;
  slot.endTime = newEnd;

  await slot.save();
  return slot;
}

async function deleteTimeSlot(id) {
  const slot = await TimeSlot.findByIdAndDelete(id);
  if (!slot) throw new AppError("Time slot not found", 404);
}

module.exports = {
  createTimeSlot,
  listTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
};
