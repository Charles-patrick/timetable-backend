const Venue = require("./venue.model");
const { AppError } = require("../../middleware/errorHandler");

async function createVenue({ name, capacity, type }) {
  if (!name || !capacity || !type) {
    throw new AppError("Name, capacity and type are required", 400);
  }
  return Venue.create({ name, capacity, type });
}

async function listVenues({ search, type } = {}) {
  const filter = {};
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };
  return Venue.find(filter).sort({ name: 1 });
}

async function getVenueById(id) {
  const venue = await Venue.findById(id);
  if (!venue) throw new AppError("Venue not found", 404);
  return venue;
}

async function updateVenue(id, { name, capacity, type }) {
  const venue = await Venue.findById(id);
  if (!venue) throw new AppError("Venue not found", 404);

  if (name) venue.name = name;
  if (capacity) venue.capacity = capacity;
  if (type) venue.type = type;

  await venue.save();
  return venue;
}

async function deleteVenue(id) {
  const venue = await Venue.findByIdAndDelete(id);
  if (!venue) throw new AppError("Venue not found", 404);
}

module.exports = {
  createVenue,
  listVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
};
