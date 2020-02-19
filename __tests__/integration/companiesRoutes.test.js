process.env.NODE_ENV = "test"

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Company = require('../../models/company');

describe("Company Routes Testing", function () {

    let company1;
    let company2;

    beforeEach(async function () {
        await db.query("DELETE FROM companies")

        company1 = await Company.create({ "handle": "comp1", "name": "testcompany1", "num_employees": 1000 })
        company2 = await Company.create({ "handle": "comp2", "name": "testcompany2", "num_employees": 2000 })
    });

    describe("GET /companies", function () {
        test("can get list of all companies", async function () {
            let resp = await request(app).get('/companies');

            expect(resp.statusCode).toBe(200);
            expect(resp.body).toEqual({ 'companies': [{ "handle": company1.handle, "name": company1.name }, { "handle": company2.handle, "name": company2.name }] })
        })
    })

    afterAll(function () {
        db.end();
    });

});