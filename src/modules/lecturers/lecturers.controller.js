const lecturersService = require("./lecturers.service");

async function create(req, res, next) {
  try {
    const lecturer = await lecturersService.createLecturer(req.body);
    res
      .status(201)
      .json({ success: true, message: "Lecturer created", data: { lecturer } });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { search, department } = req.query;
    const lecturers = await lecturersService.listLecturers({
      search,
      department,
    });
    res.status(200).json({ success: true, message: "OK", data: { lecturers } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const lecturer = await lecturersService.getLecturerById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { lecturer } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const lecturer = await lecturersService.updateLecturer(
      req.params.id,
      req.body,
    );
    res
      .status(200)
      .json({ success: true, message: "Lecturer updated", data: { lecturer } });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await lecturersService.deleteLecturer(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Lecturer deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
