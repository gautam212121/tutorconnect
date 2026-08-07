import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const createAppModule = async () => {
  const { createApp } = await import('../src/app.js');
  return createApp;
};

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
    server.close();
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
    server.close();
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
    server.close();
  }
});

test('bookings persist across module reloads', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'tutorconnect-'));
  process.env.TUTORCONNECT_DATA_FILE = path.join(tempDir, 'store.json');

  try {
    const createApp = await createAppModule();
    const app = createApp();
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/bookings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ student: 'Riya', tutor: 'Meera Verma', time: 'Today', status: 'Pending', message: 'Need English help' }),
      });

      assert.equal(response.status, 201);
    } finally {
      server.close();
    }

    const { createApp: createAppReloaded } = await import(`../src/app.js?reload=${Date.now()}`);
    const reloadedApp = createAppReloaded();
    const reloadedServer = reloadedApp.listen(0);
    const reloadedPort = reloadedServer.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${reloadedPort}/api/v1/bookings`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.ok(body.some((booking) => booking.student === 'Riya' && booking.tutor === 'Meera Verma'));
    } finally {
      reloadedServer.close();
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    delete process.env.TUTORCONNECT_DATA_FILE;
  }
});
