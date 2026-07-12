const Session = require("./session.model");
const { AppError } = require("../../middleware/errorHandler");

async function createSession({ name }) {
  if (!name) throw new AppError("Session name is required", 400);
  return Session.create({ name });
}

async function listSessions() {
  return Session.find().sort({ createdAt: -1 });
}

async function getSessionById(id) {
  const session = await Session.findById(id);
  if (!session) throw new AppError("Session not found", 404);
  return session;
}

// Only one session can be active at a time. Activating one deactivates
// any other currently-active session (archived ones are left alone).
async function activateSession(id) {
  const session = await Session.findById(id);
  if (!session) throw new AppError("Session not found", 404);

  await Session.updateMany({ status: "active" }, { status: "inactive" });

  session.status = "active";
  await session.save();
  return session;
}

async function archiveSession(id) {
  const session = await Session.findById(id);
  if (!session) throw new AppError("Session not found", 404);

  session.status = "archived";
  await session.save();
  return session;
}

async function deleteSession(id) {
  const session = await Session.findByIdAndDelete(id);
  if (!session) throw new AppError("Session not found", 404);
}

module.exports = {
  createSession,
  listSessions,
  getSessionById,
  activateSession,
  archiveSession,
  deleteSession,
};
