const venuesService = require("./venues.service");

async function create(req, res, next) {
  try {
    const venue = await venuesService.createVenue(req.body);
    res
      .status(201)
      .json({ success: true, message: "Venue created", data: { venue } });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { search, type } = req.query;
    const venues = await venuesService.listVenues({ search, type });
    res.status(200).json({ success: true, message: "OK", data: { venues } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const venue = await venuesService.getVenueById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { venue } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const venue = await venuesService.updateVenue(req.params.id, req.body);
    res
      .status(200)
      .json({ success: true, message: "Venue updated", data: { venue } });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await venuesService.deleteVenue(req.params.id);
    res.status(200).json({ success: true, message: "Venue deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
