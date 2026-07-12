const timeslotsService = require("./timeslots.service");

async function create(req, res, next) {
  try {
    const timeSlot = await timeslotsService.createTimeSlot(req.body);
    res
      .status(201)
      .json({
        success: true,
        message: "Time slot created",
        data: { timeSlot },
      });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { day } = req.query;
    const timeSlots = await timeslotsService.listTimeSlots({ day });
    res.status(200).json({ success: true, message: "OK", data: { timeSlots } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const timeSlot = await timeslotsService.getTimeSlotById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { timeSlot } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const timeSlot = await timeslotsService.updateTimeSlot(
      req.params.id,
      req.body,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Time slot updated",
        data: { timeSlot },
      });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await timeslotsService.deleteTimeSlot(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Time slot deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
