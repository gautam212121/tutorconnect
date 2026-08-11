process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import Category from '../src/models/Category.js';

const createAppModule = async () => {
  const { createApp } = await import('../src/app.js');
  return createApp;
};
const closeServer = (server) => new Promise((resolve) => server.close(resolve));

test('category image survives the no-MySQL fallback path', async () => {
  const image = 'data:image/jpeg;base64,AAAA';
  const created = await Category.create({
    name: `FallbackCategory-${Date.now()}`,
    image,
    description: 'Demo',
    priority: 'High',
    status: 'active',
    type: 'Academics',
    curriculum: [{ title: 'Algebra' }],
  });

  assert.equal(created.image, image);
  assert.equal(created.name, created.name);
  const found = await Category.findOne({ id: created.id });
  assert.equal(found.image, image);
});

test('health endpoint responds with service metadata', async () => {
  const createApp = await createAppModule();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.service, 'tutorconnect-server');
  } finally {
    await closeServer(server);
  }
});

test('tutor search endpoint returns filtered results', async () => {
  const createApp = await createAppModule();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/tutors/search?subject=math`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.tutors.length >= 1);
    assert.ok(body.tutors.every((tutor) => tutor.subjects.includes('math')));
  } finally {
    await closeServer(server);
  }
});

test('registration endpoint creates a user profile', async () => {
  const createApp = await createAppModule();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const email = `naina+${Date.now()}@example.com`;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Naina Rao', email, password: 'secret123', role: 'student' }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.user.email, email);
    assert.equal(body.user.role, 'student');
  } finally {
    await closeServer(server);
  }
});

test('student portal registration creates a pending student and credentials email request', async () => {
  const createApp = await createAppModule();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const email = `studentportal+${Date.now()}@example.com`;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/student-register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Riya Singh',
        phone: '+91 9999999999',
        email,
        grade: 'Class 10',
        address: 'Sector 15, Noida',
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.user.email, email);
    assert.equal(body.user.role, 'student');
    assert.equal(body.user.status, 'pending');
  } finally {
    await closeServer(server);
  }
});

test('callback request creates a consultation booking record', async () => {
  const createApp = await createAppModule();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/callback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Aman Verma',
        phone: '9876543210',
        role: 'student',
        classLevel: 'Class 10',
        subject: 'Maths',
        location: 'Lucknow',
        mode: 'Home',
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.ok(body.message.startsWith('Callback request submitted successfully'));

    // Create Admin User Token
    const adminEmail = `admin+${Date.now()}@example.com`;
    const adminRegRes = await fetch(`http://127.0.0.1:${port}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Admin Test', email: adminEmail, password: 'secretpassword', role: 'admin' }),
    });
    const adminRegData = await adminRegRes.json();
    const adminToken = adminRegData.token;

    // Fetch Admin Bookings
    const adminBookingsRes = await fetch(`http://127.0.0.1:${port}/api/v1/admin/bookings`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminBookingsRes.status, 200);
    const bookingsList = await adminBookingsRes.json();
    const callbackRecord = bookingsList.find(b => b.studentSnapshot?.name === 'Aman Verma' || b.studentSnapshot?.phone === '9876543210');
    assert.ok(callbackRecord, 'Callback record must be visible in admin bookings');
    assert.equal(callbackRecord.studentSnapshot.name, 'Aman Verma');
    assert.equal(callbackRecord.studentSnapshot.phone, '9876543210');
    assert.equal(callbackRecord.studentSnapshot.classLevel, 'Class 10');
    assert.equal(callbackRecord.studentSnapshot.subject, 'Maths');
    assert.equal(callbackRecord.studentSnapshot.location, 'Lucknow');
    assert.equal(callbackRecord.studentSnapshot.mode, 'Home');

    // Update Status to Confirmed
    const updateRes = await fetch(`http://127.0.0.1:${port}/api/v1/admin/bookings/${callbackRecord._id || callbackRecord.id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'Confirmed' }),
    });
    assert.equal(updateRes.status, 200);
    const updatedData = await updateRes.json();
    assert.equal(updatedData.status, 'Confirmed');
  } finally {
    await closeServer(server);
  }
});

test('bookings persist across module reloads', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'tutorconnect-'));
  process.env.TUTORCONNECT_DATA_FILE = path.join(tempDir, 'store.json');
  let authToken = '';

  try {
    const createApp = await createAppModule();
    const app = createApp();
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const email = `persist+${Date.now()}@example.com`;
      const registrationResponse = await fetch(`http://127.0.0.1:${port}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Riya', email, password: 'secret123' }),
      });

      assert.equal(registrationResponse.status, 201);
      const registrationBody = await registrationResponse.json();
      authToken = registrationBody.token;

      const response = await fetch(`http://127.0.0.1:${port}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          studentId: registrationBody.user.id,
          tutorId: '2',
          subject: 'English',
          grade: 'Class 10',
          examType: 'Board Prep',
          amount: 500,
          mode: 'Home',
          message: 'Need English help',
        }),
      });

      assert.equal(response.status, 201);
    } finally {
      await closeServer(server);
    }

    const { createApp: createAppReloaded } = await import(`../src/app.js?reload=${Date.now()}`);
    const reloadedApp = createAppReloaded();
    const reloadedServer = reloadedApp.listen(0);
    const reloadedPort = reloadedServer.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${reloadedPort}/api/v1/student/dashboard`, {
        headers: { authorization: `Bearer ${authToken}` },
      });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.ok(body.recentBookings.some((booking) => booking.subject === 'English' && booking.message === 'Need English help'));
    } finally {
      await closeServer(reloadedServer);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    delete process.env.TUTORCONNECT_DATA_FILE;
  }
});
