const adminService = require("./admin.service");

async function dashboardStats(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, message: "OK", data: { stats } });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboardStats };
