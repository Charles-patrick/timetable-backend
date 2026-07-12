const coursesService = require("./courses.service");

async function create(req, res, next) {
  try {
    const course = await coursesService.createCourse(req.body);
    res
      .status(201)
      .json({ success: true, message: "Course created", data: { course } });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { search, level, semester, department, lecturer } = req.query;
    const courses = await coursesService.listCourses({
      search,
      level,
      semester,
      department,
      lecturer,
    });
    res.status(200).json({ success: true, message: "OK", data: { courses } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const course = await coursesService.getCourseById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { course } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const course = await coursesService.updateCourse(req.params.id, req.body);
    res
      .status(200)
      .json({ success: true, message: "Course updated", data: { course } });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await coursesService.deleteCourse(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Course deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
