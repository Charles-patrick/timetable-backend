const semestersService = require("./semesters.service");

async function create(req, res, next) {
  try {
    const semester = await semestersService.createSemester(req.body);
    res
      .status(201)
      .json({ success: true, message: "Semester created", data: { semester } });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { session } = req.query;
    const semesters = await semestersService.listSemesters({ session });
    res.status(200).json({ success: true, message: "OK", data: { semesters } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const semester = await semestersService.getSemesterById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { semester } });
  } catch (err) {
    next(err);
  }
}

async function activate(req, res, next) {
  try {
    const semester = await semestersService.activateSemester(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "Semester activated",
        data: { semester },
      });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await semestersService.deleteSemester(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Semester deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, activate, remove };
