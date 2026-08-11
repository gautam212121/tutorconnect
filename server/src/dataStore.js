import Booking from './models/Booking.js';
import User from './models/User.js';

export async function ensureMongoConnection() {
  // Kept for backward compatibility if imported anywhere; returns false as Mongo is removed
  return false;
}

export async function getBookings() {
  return Booking.find();
}

export async function addBooking(booking) {
  return Booking.create(booking);
}

export async function updateBookingStatus(id, status) {
  return Booking.findByIdAndUpdate(id, { status });
}

export async function createUser(userData) {
  return User.create(userData);
}

export async function findUserByEmail(email) {
  return User.findOne({ email });
}

export async function listUsers() {
  return User.find();
}
