process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');
const Job = require('../../models/job');
const User = require('../../models/user');

describe("Jobs Routes Testing", function () {

  let company1;
  let company2;
  let job1;
  let job2;
  let user1;
  let user2;

  beforeEach(async function () {
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

    company1 = await Company.create(
      {
        "handle": "comp1",
        "name": "testcompany1",
        "num_employees": 1000
      });

    company2 = await Company.create(
      {
        "handle": "comp2",
        "name": "testcompany2",
        "num_employees": 2000
      });

    job1 = await Job.create(
      {
        "title": "developer",
        "salary": 1295387,
        "equity": 0.8,
        "company_handle": "comp2"
      });

    job2 = await Job.create(
      {
        "title": "developer",
        "salary": 500000,
        "equity": 0.3,
        "company_handle": "comp1"
      });

    user1 = await User.create({
      username: "user1",
      first_name: "User",
      last_name: "Last",
      password: "123456",
      email: "Test@test.com",
      photo_url: "none",
      is_admin: false
    });

    user2 = await User.create({
      username: "user2",
      first_name: "User2",
      last_name: "Last2",
      password: "123456",
      email: "Test2@test.com",
      photo_url: "ndfsdfvfgdgone",
      is_admin: false
    });

  });

  describe("GET /users", function () {
    test("can get list of all users", async function () {
      const resp = await request(app).get('/users');

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        users:
          [{
            username: user1.username,
            first_name: user1.first_name,
            last_name: user1.last_name,
            email: user1.email,
          },
          {
            username: user2.username,
            first_name: user2.first_name,
            last_name: user2.last_name,
            email: user2.email,
          }]
      });
    });

  });

  describe("POST /users", function () {
    test("adds new user", async function () {
      const user = {
        username: "user3",
        first_name: "User3",
        last_name: "Last3",
        password: "123456",
        email: "Test3@test.com",
        photo_url: "ndfsffsdfvfgdgone",
        is_admin: false
      };

      const expected = {
        username: "user3",
        first_name: "User3",
        last_name: "Last3",
        email: "Test3@test.com",
        photo_url: "ndfsffsdfvfgdgone",
        is_admin: false
      };

      const resp = await request(app).post('/users').send(user);

      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({ "user": expected });

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
      const { username, first_name, last_name, email, photo_url } = user1

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        'user':
        {
          username: username,
          first_name: first_name,
          last_name: last_name,
          email: email,
          photo_url: photo_url
        }
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
        .send({ first_name: "NEW NAME!" });
      const { username, last_name, email, photo_url } = user1

      const expected = {
        username: username,
        first_name: "NEW NAME!",
        last_name: last_name,
        email: email,
        photo_url: photo_url
      }

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ user: expected });

      const newResponse = await request(app).get(`/users/${user1.username}`);
      expect(newResponse.statusCode).toBe(200);
      expect(newResponse.body).toEqual({ user: expected })
    });

    test("will not update username", async function () {
      const resp = await request(app)
        .patch(`/users/${user1.username}`)
        .send({ username: "NEW NAME!" });

      expect(resp.statusCode).toBe(400);
    });

    test("will not update user that does not exist", async function () {
      const resp = await request(app)
        .patch(`/users/0`)
        .send({ first_name: "job!" });

      expect(resp.statusCode).toBe(404);
    });


  });

  describe("DELETE /users/:username", function () {
    test("can delete user by username", async function () {
      const resp = await request(app).delete(`/users/${user1.username}`);

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ message: "User deleted" });
    });

    test("will not delete user that does not exist", async function () {
      const resp = await request(app).delete(`/users/0`);
      expect(resp.statusCode).toBe(404);
    });
  });

  afterAll(function () {
    db.end();
  });
});