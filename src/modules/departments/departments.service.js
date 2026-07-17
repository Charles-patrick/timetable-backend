const Department = require("./department.model");
const { AppError } = require("../../middleware/errorHandler");

async function createDepartment({ name }) {
  if (!name) throw new AppError("Department name is required", 400);
  return Department.create({ name });
}

async function listDepartments() {
  return Department.find().sort({ name: 1 });
}

async function getDepartmentById(id) {
  const department = await Department.findById(id);
  if (!department) throw new AppError("Department not found", 404);
  return department;
}

async function updateDepartment(id, { name }) {
  const department = await Department.findById(id);
  if (!department) throw new AppError("Department not found", 404);
  if (name) department.name = name;
  await department.save();
  return department;
}

async function deleteDepartment(id) {
  const department = await Department.findByIdAndDelete(id);
  if (!department) throw new AppError("Department not found", 404);
}

module.exports = {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
