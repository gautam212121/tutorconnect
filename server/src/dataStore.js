import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';

const defaultDataFile = process.env.TUTORCONNECT_DATA_FILE || path.join(process.cwd(), 'data', 'store.json');
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || 'tutorconnect';

const initialState = {
  bookings: [
    {
      id: 'b1',
      student: 'Asha',
      tutor: 'Aisha Khan',
      time: 'Yesterday',
      status: 'Completed',
      message: 'Need support for mathematics revision.',
    },
    {
      id: 'b2',
      student: 'Nikhil',
      tutor: 'Rajat Sharma',
      time: '2 days ago',
      status: 'Confirmed',
      message: 'Looking for physics exam prep.',
    },
  ],
  users: [],
};

let state = initialState;
let dataFile = defaultDataFile;
let mongoClient = null;
let mongoDb = null;

async function ensureStore() {
  const dir = path.dirname(dataFile);
  await mkdir(dir, { recursive: true });
  try {
    const serialized = await readFile(dataFile, 'utf8');
    if (serialized) {
      state = JSON.parse(serialized);
    }
  } catch {
    await writeFile(dataFile, JSON.stringify(initialState, null, 2));
  }
}

async function persistStore() {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(state, null, 2));
}

export async function ensureMongoConnection() {
  if (mongoDb) {
    return true;
  }

  const mongoUri = process.env.MONGODB_URI;
  const mongoDbName = process.env.MONGODB_DB_NAME || 'tutorconnect';

  if (!mongoUri) {
    return false;
  }

  try {
    mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(mongoDbName);
    return true;
  } catch (error) {
    console.warn('MongoDB unavailable, falling back to local file store:', error.message);
    return false;
  }
}

function normalizeRecord(record) {
  if (!record) {
    return record;
  }

  const { _id, ...rest } = record;
  return { ...rest, id: rest.id || _id?.toString() };
}

const ensureStorePromise = ensureStore();

export async function getBookings() {
  if (await ensureMongoConnection()) {
    const docs = await mongoDb.collection('bookings').find({}).sort({ _id: -1 }).toArray();
    return docs.map((doc) => normalizeRecord(doc));
  }

  await ensureStorePromise;
  return state.bookings;
}

export async function addBooking(booking) {
  if (await ensureMongoConnection()) {
    const created = { id: `b${Date.now()}`, ...booking };
    await mongoDb.collection('bookings').insertOne(created);
    return created;
  }

  await ensureStorePromise;
  const created = { id: `b${state.bookings.length + 1}`, ...booking };
  state.bookings.unshift(created);
  await persistStore();
  return created;
}

export async function updateBookingStatus(id, status) {
  if (await ensureMongoConnection()) {
    const updated = await mongoDb.collection('bookings').findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: 'after' },
    );
    return updated.value ? normalizeRecord(updated.value) : null;
  }

  await ensureStorePromise;
  const booking = state.bookings.find((entry) => entry.id === id);
  if (booking) {
    booking.status = status;
    await persistStore();
    return booking;
  }
  return null;
}

export async function createUser(user) {
  if (await ensureMongoConnection()) {
    const created = { id: `u${Date.now()}`, ...user };
    await mongoDb.collection('users').insertOne(created);
    return created;
  }

  await ensureStorePromise;
  const created = { id: `${state.users.length + 1}`, ...user };
  state.users.push(created);
  await persistStore();
  return created;
}

export async function findUserByEmail(email) {
  if (await ensureMongoConnection()) {
    const user = await mongoDb.collection('users').findOne({ email });
    return user ? normalizeRecord(user) : null;
  }

  await ensureStorePromise;
  return state.users.find((user) => user.email === email);
}

export async function listUsers() {
  if (await ensureMongoConnection()) {
    const docs = await mongoDb.collection('users').find({}).toArray();
    return docs.map((doc) => normalizeRecord(doc));
  }

  await ensureStorePromise;
  return state.users;
}
