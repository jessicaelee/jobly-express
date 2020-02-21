process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');
const User = require('../../models/user');
const Job = require('../../models/job');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config');

describe("Authorization Route Testing", function () {

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
    admin = await db.query(`UPDATE users SET is_admin=true WHERE username='admin'`);

    // we'll need tokens for future requests
    testUser1 = { username: "user1", is_admin: false };
    testUser2 = { username: "user2", is_admin: false };
    testAdmin = { username: "admin", is_admin: true };
    testUser1Token = jwt.sign(testUser1, SECRET_KEY);
    testUser2Token = jwt.sign(testUser2, SECRET_KEY);
    testAdminToken = jwt.sign(testAdmin, SECRET_KEY);

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