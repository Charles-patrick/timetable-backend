const Course = require("./course.model");
const Lecturer = require("../lecturers/lecturer.model");
const Semester = require("../semesters/semester.model");
const Department = require("../departments/department.model");
const { AppError } = require("../../middleware/errorHandler");

async function validateRefs({ lecturers, semester, departments }) {
  if (lecturers) {
    const count = await Lecturer.countDocuments({ _id: { $in: lecturers } });
    if (count !== lecturers.length)
      throw new AppError("One or more lecturers not found", 404);
  }
  if (semester) {
    const exists = await Semester.findById(semester);
    if (!exists) throw new AppError("Semester not found", 404);
  }
  if (departments) {
    const count = await Department.countDocuments({
      _id: { $in: departments },
    });
    if (count !== departments.length)
      throw new AppError("One or more departments not found", 404);
  }
}

async function createCourse(data) {
  const {
    courseCode,
    courseTitle,
    courseUnit,
    level,
    semester,
    departments,
    lecturers,
  } = data;

  if (
    !courseCode ||
    !courseTitle ||
    !courseUnit ||
    !level ||
    !semester ||
    !departments?.length ||
    !lecturers?.length
  ) {
    throw new AppError(
      "Course code, title, unit, level, semester, at least one department and at least one lecturer are required",
      400,
    );
  }

  await validateRefs({ lecturers, semester, departments });

  return Course.create(data);
}

async function listCourses({
  search,
  level,
  semester,
  department,
  lecturer,
} = {}) {
  const filter = {};
  if (level) filter.level = level;
  if (semester) filter.semester = semester;
  if (department) filter.departments = department; // matches if department is in the array
  if (lecturer) filter.lecturers = lecturer;

  if (search) {
    filter.$or = [
      { courseCode: { $regex: search, $options: "i" } },
      { courseTitle: { $regex: search, $options: "i" } },
    ];
  }

  return Course.find(filter)
    .populate("lecturers", "name email")
    .populate("departments", "name")
    .populate("semester", "name session")
    .sort({ courseCode: 1 });
}

async function getCourseById(id) {
  const course = await Course.findById(id)
    .populate("lecturers", "name email department")
    .populate("departments", "name")
    .populate("semester", "name session");
  if (!course) throw new AppError("Course not found", 404);
  return course;
}

async function updateCourse(id, data) {
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404);

  await validateRefs(data);

  Object.assign(course, data);
  await course.save();
  return course;
}

async function deleteCourse(id) {
  const course = await Course.findByIdAndDelete(id);
  if (!course) throw new AppError("Course not found", 404);
}

module.exports = {
  createCourse,
  listCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
