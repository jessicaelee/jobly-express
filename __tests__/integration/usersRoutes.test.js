process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');
const User = require('../../models/user');
const Job = require('../../models/job');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config');

describe("Users Routes Testing", function () {

  let company1;
  let company2;
  let job1;
  let job2;
  let user1;
  let user2;
  let admin;
  let testUser1;
  let testUser2;
  let testAdmin;
  let testUser1Token;
  let testUser2Token;
  let testAdminToken;

  beforeEach(async function () {
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

    company1 = await Company.create(
      {
        handle: "comp1",
        name: "testcompany1",
        num_employees: 1000
      });

    company2 = await Company.create(
      {
        handle: "comp2",
        name: "testcompany2",
        num_employees: 2000
      });

    job1 = await Job.create(
      {
        title: "developer",
        salary: 1295387,
        equity: 0.8,
        company_handle: "comp2"
      });

    job2 = await Job.create(
      {
        title: "developer",
        salary: 500000,
        equity: 0.3,
        company_handle: "comp1"
      });

    user1 = await User.create({
      username: "user1",
      first_name: "User",
      last_name: "Last",
      password: "secret",
      email: "Test@test.com",
      photo_url: "none",
      is_admin: false
    });

    user2 = await User.create({
      username: "user2",
      first_name: "User2",
      last_name: "Last2",
      password: "secret",
      email: "Test2@test.com",
      photo_url: "ndfsdfvfgdgone",
      is_admin: false
    });

    admin = await User.create({
      username: "admin",
      first_name: "Admin",
      last_name: "Admin",
      password: "secret",
      email: "Admin@test.com",
      photo_url: "ne",
      is_admin: false
    });

    //updates admin to is_admin: true
    await db.query(`UPDATE users SET is_admin=true WHERE username='admin'`);

    // we'll need tokens for future requests
    testUser1 = { username: "user1", is_admin: false };
    testUser2 = { username: "user2", is_admin: false };
    testAdmin = { username: "admin", is_admin: true };
    testUser1Token = jwt.sign(testUser1, SECRET_KEY);
    testUser2Token = jwt.sign(testUser2, SECRET_KEY);
    testAdminToken = jwt.sign(testAdmin, SECRET_KEY);

  });

  describe("GET /users", function () {
    test("can get list of all users", async function () {
      const resp = await request(app).get('/users');

      expect(resp.statusCode).toBe(200);
      expect(resp.body.users.sort()).toEqual(
        [
          {
            username: user1.username,
            first_name: user1.first_name,
            last_name: user1.last_name,
            email: user1.email
          },
          {
            username: user2.username,
            first_name: user2.first_name,
            last_name: user2.last_name,
            email: user2.email
          },
          {
            username: admin.username,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email
          }
        ]);
    });

  });

  describe("POST /users", function () {
    test("creating new user", async function () {
      const user = {
        username: "user3",
        first_name: "User3",
        last_name: "Last3",
        password: "123456",
        email: "Test3@test.com",
        photo_url: "ndfsffsdfvfgdgone",
        is_admin: false
      };

      const resp = await request(app).post('/users').send(user);

      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({ token: expect.any(String) });

      const newResponse = await request(app)
        .get(`/users/${user.username}`);

      expect(newResponse.statusCode).toBe(200);
    });

    test("doesn't add new user without required fields of pw/email", async function () {
      const failUser = {
        username: "user3",
        first_name: "User3",
        last_name: "Last3",
        photo_url: "ndfsffsdfvfgdgone",
        is_admin: false
      };

      const resp = await request(app).post('/users').send(failUser);

      expect(resp.statusCode).toBe(400);
    })
  });

  describe("GET /users/:username", function () {
    test("can get user by username", async function () {
      const resp = await request(app).get(`/users/${user1.username}`);
      const { email, first_name, last_name, photo_url, username } = user1

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        user: { email, first_name, last_name, photo_url, username }
      });
    });

    test("will not get user that does not exist with that username", async function () {
      const resp = await request(app).get(`/users/0`);
      expect(resp.statusCode).toBe(404);
    });
  });

  describe("PATCH /users/:id", function () {
    test("can update user by id", async function () {
      const resp = await request(app)
        .patch(`/users/${user1.username}`)
        .send({ first_name: "NEW NAME!", _token: testUser1Token });
      const { username, last_name, email, photo_url } = user1

      const expected = {
        username,
        first_name: "NEW NAME!",
        last_name,
        email,
        photo_url
      }

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ user: expected });

      const newResponse = await request(app).get(`/users/${user1.username}`);
      expect(newResponse.statusCode).toBe(200);
      expect(newResponse.body).toEqual({ user: expected })
    });

    test("will not update username field", async function () {
      const resp = await request(app)
        .patch(`/users/${user1.username}`)
        .send({ username: "NEW NAME!", _token: testUser1Token });

      expect(resp.statusCode).toBe(400);
    });

    //401 unauthorized - middleware prevents the route from being accessed
    test("will not update user that does not exist", async function () {
      const resp = await request(app)
        .patch(`/users/0`)
        .send({ first_name: "job!", _token: testAdminToken });

      expect(resp.statusCode).toBe(401);
    });

    test("401: cannot update another user", async function () {
      const resp = await request(app)
        .patch(`/users/${user1.username}`)
        .send({ last_name: "NEW NAME!", _token: testUser2Token });

      expect(resp.statusCode).toBe(401);
    });


  });

  describe("DELETE /users/:username", function () {
    test("can delete user by username", async function () {
      const resp = await request(app)
        .delete(`/users/${user1.username}`)
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ message: "User deleted" });
    });

    //401 unauthorized - middleware prevents the route from being accessed
    test("will not delete user that does not exist", async function () {
      const resp = await request(app)
        .delete(`/users/0`)
        .send({ _token: testAdminToken });

      expect(resp.statusCode).toBe(401);
    });

    test("401 cannot delete another user", async function () {
      const resp = await request(app)
        .delete(`/users/${user1.username}`)
        .send({ _token: testUser2Token });

      expect(resp.statusCode).toBe(401);
    });
  });

  afterAll(function () {
    db.end();
  });
});