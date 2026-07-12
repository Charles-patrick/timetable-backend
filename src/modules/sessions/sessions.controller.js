const sessionsService = require("./sessions.service");

async function create(req, res, next) {
  try {
    const session = await sessionsService.createSession(req.body);
    res
      .status(201)
      .json({ success: true, message: "Session created", data: { session } });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const sessions = await sessionsService.listSessions();
    res.status(200).json({ success: true, message: "OK", data: { sessions } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const session = await sessionsService.getSessionById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { session } });
  } catch (err) {
    next(err);
  }
}

async function activate(req, res, next) {
  try {
    const session = await sessionsService.activateSession(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Session activated", data: { session } });
  } catch (err) {
    next(err);
  }
}

async function archive(req, res, next) {
  try {
    const session = await sessionsService.archiveSession(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Session archived", data: { session } });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await sessionsService.deleteSession(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Session deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, activate, archive, remove };
