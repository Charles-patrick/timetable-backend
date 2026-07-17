const departmentsService = require("./departments.service");

async function create(req, res, next) {
  try {
    const department = await departmentsService.createDepartment(req.body);
    res
      .status(201)
      .json({
        success: true,
        message: "Department created",
        data: { department },
      });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const departments = await departmentsService.listDepartments();
    res
      .status(200)
      .json({ success: true, message: "OK", data: { departments } });
  } catch (err) {
    next(err);
  }
}

// Public — no login. Students need this to populate the department picker
// on the public timetable view.
async function publicList(req, res, next) {
  try {
    const departments = await departmentsService.listDepartments();
    res
      .status(200)
      .json({ success: true, message: "OK", data: { departments } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const department = await departmentsService.getDepartmentById(
      req.params.id,
    );
    res
      .status(200)
      .json({ success: true, message: "OK", data: { department } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const department = await departmentsService.updateDepartment(
      req.params.id,
      req.body,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Department updated",
        data: { department },
      });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await departmentsService.deleteDepartment(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Department deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, publicList, getOne, update, remove };
