process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const User = require('../../models/user');

describe("Authorization Route Testing", function () {

  let user1;

  beforeEach(async function () {
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

    user1 = await User.create({
      username: "user1",
      first_name: "User",
      last_name: "Last",
      password: "secret",
      email: "Test@test.com",
      photo_url: "none",
      is_admin: false
    });
  });

  describe("POST /login", function () {
    test("can log in", async function () {
      const resp = await request(app)
        .post('/auth/login')
        .send({ username: user1.username, password: 'secret' });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        token: expect.any(String)
      });
    });

    test("cannot log in with incorrect password", async function () {
      const resp = await request(app)
        .post('/auth/login')
        .send({ username: user1.username, password: 'wrong_password' });

      expect(resp.statusCode).toBe(404);
    });
  });

  afterAll(function () {
    db.end();
  });

});