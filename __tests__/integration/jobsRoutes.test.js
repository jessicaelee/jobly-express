process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');
const User = require('../../models/user');
const Job = require('../../models/job');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config');

describe("Job Routes Testing", function () {

  let company1;
  let company2;
  let job1;
  let job2;
  let job1id;
  let job2id;
  let user1;
  let admin;
  let testUser1;
  let testAdmin;
  let testUser1Token;
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

    const job1query = await db.query(`SELECT id FROM jobs WHERE company_handle = 
    'comp2'`);

    job1id = job1query.rows[0].id;

    const job2query = await db.query(`SELECT id FROM jobs WHERE company_handle = 
    'comp1'`);

    job2id = job2query.rows[0].id;

    user1 = await User.create({
      username: "user1",
      first_name: "User",
      last_name: "Last",
      password: "secret",
      email: "Test@test.com",
      photo_url: "none",
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
    testAdmin = { username: "admin", is_admin: true };
    testUser1Token = jwt.sign(testUser1, SECRET_KEY);
    testAdminToken = jwt.sign(testAdmin, SECRET_KEY);

  });

  describe("GET /jobs", function () {
    test("can get list of all jobs", async function () {
      const resp = await request(app)
        .get('/jobs')
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        jobs:
          [{
            title: job1.title,
            company_handle: job1.company_handle
          },
          {
            title: job2.title,
            company_handle: job2.company_handle
          }]
      });
    });

    test("will not get list of jobs if min salary is too high", async function () {
      const resp = await request(app)
        .get('/jobs?min_salary=283927391929')
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(400);
    });

    test("401: will not have access", async function () {
      const resp = await request(app)
        .get('/jobs')
        .send({ _token: 'qpwoiapoifoisdjfapoi' });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("POST /jobs", function () {
    test("adds new job", async function () {
      const newJob = {
        title: "clown",
        company_handle: "comp1",
        salary: 150000,
        equity: 0.5
      };

      const resp = await request(app)
        .post('/jobs')
        .send({ ...newJob, _token: testAdminToken });

      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({ 'job': newJob });

      const result = await db.query(`SELECT id FROM jobs WHERE company_handle='comp1'`);
      const newResponse = await request(app)
        .get(`/jobs/${result.rows[0].id}`)
        .send({ _token: testUser1Token });

      expect(newResponse.statusCode).toBe(200);
    });

    test("doesn't add new job; missing required fields", async function () {
      const failJob = {
        title: "clown",
        company_handle: "clowns",
        salary: 150000,
        equity: 0.5
      };

      const resp = await request(app)
        .post('/jobs')
        .send({ ...failJob, _token: testAdminToken });

      expect(resp.statusCode).toBe(400);
    });

    test("401: not authorized to add new job", async function () {
      const failJob = {
        title: "clown",
        company_handle: "clowns",
        salary: 150000,
        equity: 0.5
      };

      const resp = await request(app)
        .post('/jobs')
        .send({ ...failJob, _token: testUser1Token });

      expect(resp.statusCode).toBe(401);
    })
  });

  describe("GET /jobs/:id", function () {
    test("can get job by id", async function () {
      const resp = await request(app)
        .get(`/jobs/${job1id}`)
        .send({ _token: testUser1Token });

      const { description, name, num_employees } = company2

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        job: { ...job1, company: { description, name, num_employees } }
      });
    });

    test("will not get job that does not exist with that id", async function () {
      const resp = await request(app)
        .get(`/jobs/0`)
        .send({ _token: testAdminToken });

      expect(resp.statusCode).toBe(404);
    });

    test("401 unauthorized access to jobs id", async function () {
      const resp = await request(app)
        .get(`/jobs/${job1id}`).send({ _token: 'qp98hfasdhfpawiefapfuh' });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("PATCH /jobs/:id", function () {
    test("can update job by id", async function () {
      const resp = await request(app)
        .patch(`/jobs/${job1id}`)
        .send({ title: "job!", _token: testAdminToken });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        job:
        {
          id: expect.anything(),
          title: 'job!',
          company_handle: job1.company_handle,
          salary: job1.salary,
          equity: job1.equity,
          date_posted: expect.any(String),
          company: {
            description: company2.description,
            name: company2.name,
            num_employees: company2.num_employees
          }
        }
      });

      const newResponse = await request(app)
        .get(`/jobs/${job1id}`)
        .send({ _token: testUser1Token });
      expect(newResponse.statusCode).toBe(200);
    });

    test("will not update job that does not exist", async function () {
      const resp = await request(app)
        .patch(`/jobs/0`)
        .send({ title: "job!", _token: testAdminToken });

      expect(resp.statusCode).toBe(404);
    });

    test("401: unauthorized to update job", async function () {
      const resp = await request(app)
        .patch(`/jobs/${job2id}`)
        .send({ title: "job!", _token: testUser1Token });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("DELETE /jobs/:id", function () {
    test("can delete job by id", async function () {
      const resp = await request(app).delete(`/jobs/${job1id}`)
        .send({ _token: testAdminToken });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ message: "Job deleted" });
    });

    test("will not delete job that does not exist", async function () {
      const resp = await request(app).delete(`/jobs/0`)
        .send({ _token: testAdminToken });

      expect(resp.statusCode).toBe(404);
    });

    test("401: not authorized to delete job", async function () {
      const resp = await request(app)
        .delete(`/jobs/${job1id}`)
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(401);
    });
  });

  afterAll(function () {
    db.end();
  });
});