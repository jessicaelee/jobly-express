process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');
const Job = require('../../models/job');

describe("Jobs Routes Testing", function () {

  let company1;
  let company2;
  let job1;
  let job2;

  beforeEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM jobs");
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
  });

  describe("GET /jobs", function () {
    test("can get list of all jobs", async function () {
      const resp = await request(app).get('/jobs');

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
        .get('/jobs?min_salary=283927391929');

      expect(resp.statusCode).toBe(400);
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

      const resp = await request(app).post('/jobs').send(newJob);

      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({ 'job': newJob });

      const result = await db.query(`SELECT id FROM jobs WHERE company_handle='comp1'`);
      const newResponse = await request(app)
        .get(`/jobs/${result.rows[0].id}`);

      expect(newResponse.statusCode).toBe(200);
    });

    test("doesn't add new job", async function () {
      const failJob = {
        title: "clown",
        company_handle: "clowns",
        salary: 150000,
        equity: 0.5
      };

      const resp = await request(app).post('/jobs').send(failJob);

      expect(resp.statusCode).toBe(400);
    })
  });

  describe("GET /jobs/:id", function () {
    test("can get job by id", async function () {
      const resp = await request(app).get(`/jobs/1`);

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        'job':
        {
          title: job1.title,
          company_handle: job1.company_handle,
          salary: job1.salary,
          equity: job1.equity,
          company: {
            description: company2.description,
            name: company2.name,
            num_employees: company2.num_employees
          }
        }
      });
    });

    test("will not get job that does not exist with that id", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toBe(404);
    });
  });

  describe("PATCH /jobs/:id", function () {
    test("can update job by id", async function () {
      const resp = await request(app)
        .patch(`/jobs/1`)
        .send({ title: "job!" });

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

      const newResponse = await request(app).get(`/jobs/1`);
      expect(newResponse.statusCode).toBe(200);
    });

    test("will not update job that does not exist", async function () {
      const resp = await request(app)
        .patch(`/jobs/0`)
        .send({ title: "job!" });

      expect(resp.statusCode).toBe(404);
    });
  });

  describe("DELETE /jobs/:id", function () {
    test("can delete job by id", async function () {
      const resp = await request(app).delete(`/jobs/1`);

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ message: "Job deleted" });
    });

    test("will not delete job that does not exist", async function () {
      const resp = await request(app).delete(`/jobs/0`);
      expect(resp.statusCode).toBe(404);
    });
  });

  afterAll(function () {
    db.end();
  });
});