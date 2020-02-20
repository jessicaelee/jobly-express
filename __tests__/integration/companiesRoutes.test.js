process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');

describe("Company Routes Testing", function () {

    let company1;
    let company2;

    beforeEach(async function () {
        await db.query("DELETE FROM companies");

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
    });

    describe("GET /companies", function () {
        test("can get list of all companies", async function () {
            const resp = await request(app).get('/companies');

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
                .get('/companies?min_employees=10&max_employees=5');

            expect(resp.statusCode).toBe(400);
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

            const resp = await request(app).post('/companies').send(newCompany);

            expect(resp.statusCode).toBe(201);
            expect(resp.body).toEqual({ 'company': newCompany });

            const newResponse = await request(app)
                .get(`/companies/${newCompany.handle}`);

            expect(newResponse.statusCode).toBe(200);
        });

        test("doesn't add new company", async function () {
            const failCompany = {
                "name": "Nike",
                "num_employees": 150000,
                "description": "company",
                "logo_url": "hi"
            };

            const resp = await request(app).post('/companies').send(failCompany);

            expect(resp.statusCode).toBe(400);
        })
    });

    describe("GET /companies/:handle", function () {
        test("can get company by handle", async function () {
            const resp = await request(app).get(`/companies/${company1.handle}`);

            expect(resp.statusCode).toBe(200);
            expect(resp.body).toEqual({ 'company': company1 });
        });

        test("will not get company that does not exist", async function () {
            const resp = await request(app).get(`/companies/none-here`);
            expect(resp.statusCode).toBe(404);
        });
    });

    describe("PATCH /companies/:handle", function () {
        test("can update company by handle", async function () {
            const resp = await request(app)
                .patch(`/companies/${company1.handle}`)
                .send({ "name": "COMPANY!" });

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

            const newResponse = await request(app).get(`/companies/${company1.handle}`);
            expect(newResponse.statusCode).toBe(200);
        });

        test("will not update company that does not exist", async function () {
            const resp = await request(app)
                .patch(`/companies/none-here`)
                .send({ "name": "COMPANY!" });

            expect(resp.statusCode).toBe(404);
        });
    });

    describe("DELETE /companies/:handle", function () {
        test("can delete company by handle", async function () {
            const resp = await request(app).delete(`/companies/${company1.handle}`);

            expect(resp.statusCode).toBe(200);
            expect(resp.body).toEqual({ message: "Company deleted" });
        });

        test("will not delete company that does not exist", async function () {
            const resp = await request(app).delete(`/companies/none-here`);
            expect(resp.statusCode).toBe(404);
        });
    });

    afterAll(function () {
        db.end();
    });
});