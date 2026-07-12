const Course = require("./course.model");
const Lecturer = require("../lecturers/lecturer.model");
const Semester = require("../semesters/semester.model");
const { AppError } = require("../../middleware/errorHandler");

async function validateRefs({ lecturer, semester }) {
  if (lecturer) {
    const exists = await Lecturer.findById(lecturer);
    if (!exists) throw new AppError("Lecturer not found", 404);
  }
  if (semester) {
    const exists = await Semester.findById(semester);
    if (!exists) throw new AppError("Semester not found", 404);
  }
}

async function createCourse(data) {
  const {
    courseCode,
    courseTitle,
    courseUnit,
    level,
    semester,
    department,
    lecturer,
  } = data;

  if (
    !courseCode ||
    !courseTitle ||
    !courseUnit ||
    !level ||
    !semester ||
    !department ||
    !lecturer
  ) {
    throw new AppError(
      "Course code, title, unit, level, semester, department and lecturer are required",
      400,
    );
  }

  await validateRefs({ lecturer, semester });

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
  if (department) filter.department = department;
  if (lecturer) filter.lecturer = lecturer;

  if (search) {
    filter.$or = [
      { courseCode: { $regex: search, $options: "i" } },
      { courseTitle: { $regex: search, $options: "i" } },
    ];
  }

  return Course.find(filter)
    .populate("lecturer", "name email department")
    .populate("semester", "name session")
    .sort({ courseCode: 1 });
}

async function getCourseById(id) {
  const course = await Course.findById(id)
    .populate("lecturer", "name email department")
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
