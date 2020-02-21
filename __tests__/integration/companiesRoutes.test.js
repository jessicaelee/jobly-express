process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');
const User = require('../../models/user');
const Job = require('../../models/job');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config');

describe("Company Routes Testing", function () {

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

  describe("GET /companies", function () {
    test("can get list of all companies", async function () {
      const resp = await request(app)
        .get('/companies')
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        'companies':
          [{
            "handle": company1.handle,
            "name": company1.name
          },
          {
            "handle": company2.handle,
            "name": company2.name
          }]
      });
    });

    test("will not get list of companies if min > max employees", async function () {
      const resp = await request(app)
        .get('/companies?min_employees=10&max_employees=5')
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(400);
    });

    test("return 401 if unauthorized", async function () {
      const resp = await request(app)
        .get('/companies?min_employees=10&max_employees=5')
        .send({ _token: '123498qiusadiuhasdfiu' });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("POST /companies", function () {
    test("adds new company", async function () {
      const newCompany = {
        "handle": "nike",
        "name": "Nike",
        "num_employees": 150000,
        "description": "company",
        "logo_url": "hi"
      };

      const resp = await request(app)
        .post('/companies')
        .send({ ...newCompany, _token: testAdminToken });

      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({ 'company': newCompany });

      const newResponse = await request(app)
        .get(`/companies/${newCompany.handle}`)
        .send({ _token: testUser2Token });

      expect(newResponse.statusCode).toBe(200);
    });

    test("doesn't add company missing handle, but authorized", async function () {
      const failCompany = {
        "name": "Nike",
        "num_employees": 150000,
        "description": "company",
        "logo_url": "hi"
      };

      const resp = await request(app).post('/companies')
        .send({ ...failCompany, _token: testAdminToken });

      expect(resp.statusCode).toBe(400);
    });

    test("401: not authorized to add company", async function () {
      const newCompany = {
        "handle": "nike",
        "name": "Nike",
        "num_employees": 150000,
        "description": "company",
        "logo_url": "hi"
      };

      const resp = await request(app).post('/companies')
        .send({ ...newCompany, _token: testUser1Token });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("GET /companies/:handle", function () {
    test("can get company by handle", async function () {
      const resp = await request(app)
        .get(`/companies/${company1.handle}`)
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        company:
        {
          handle: company1.handle,
          name: company1.name,
          num_employees: company1.num_employees,
          description: company1.description,
          logo_url: company1.logo_url,
          jobs: expect.anything()
          //company1.jobs comes back undefined, but receiving the actual array correctly
        }
      });
    });

    test("will not get company that does not exist", async function () {
      const resp = await request(app)
        .get(`/companies/none-here`)
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(404);
    });

    test("401: is not authorized to request company", async function () {
      const resp = await request(app)
        .get(`/companies/none-here`)
        .send({ _token: 'madeuptoken12820823498' });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("PATCH /companies/:handle", function () {
    test("can update company by handle", async function () {
      const resp = await request(app)
        .patch(`/companies/${company1.handle}`)
        .send({ name: "COMPANY!", _token: testAdminToken });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        'company': {
          "handle": company1.handle,
          "name": "COMPANY!",
          "num_employees": company1.num_employees,
          "description": company1.description,
          "logo_url": company1.logo_url
        }
      });

      const newResponse = await request(app)
        .get(`/companies/${company1.handle}`)
        .send({ _token: testUser1Token });
      expect(newResponse.statusCode).toBe(200);
    });

    test("will not update company that does not exist", async function () {
      const resp = await request(app)
        .patch(`/companies/none-here`)
        .send({ name: "COMPANY!", _token: testAdminToken });

      expect(resp.statusCode).toBe(404);
    });

    test("401: not authorized to access path", async function () {
      const resp = await request(app)
        .patch(`/companies/none-here`)
        .send({ name: "COMPANY!", _token: testUser2Token });

      expect(resp.statusCode).toBe(401);
    });
  });

  describe("DELETE /companies/:handle", function () {
    test("can delete company by handle", async function () {
      const resp = await request(app)
        .delete(`/companies/${company1.handle}`)
        .send({ _token: testAdminToken });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ message: "Company deleted" });
    });

    test("will not delete company that does not exist", async function () {
      const resp = await request(app)
        .delete(`/companies/none-here`)
        .send({ _token: testAdminToken });

      expect(resp.statusCode).toBe(404);
    });

    test("401: not authorized to delete a company", async function () {
      const resp = await request(app)
        .delete(`/companies/${company1.handle}`)
        .send({ _token: testUser1Token });

      expect(resp.statusCode).toBe(401);
    });
  });

  afterAll(function () {
    db.end();
  });
});