const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Company {

    /** finds all companies based on query parameters */
    static async findAll(search, min, max) {
        let filters = [];
        let companyResp;
        let idx = 1;
        let baseURL = `SELECT handle, name FROM companies`

        if (search !== undefined) {
            baseURL += ` WHERE name ILIKE $1`
            filters.push(`%${search}%`);
            idx++
        }
        if (min !== undefined) {
            if (filters.length) {
                baseURL += ` AND num_employees >= $${idx}`
            } else {
                baseURL += ` WHERE num_employees >= $${idx}`
            }
            idx++;
            filters.push(min);
        }
        if (max !== undefined) {
            if (filters.length) {
                baseURL += ` AND num_employees <= $${idx}`
            } else {
                baseURL += ` WHERE num_employees <= $${idx}`
            }
            idx++;
            filters.push(max);
        }

        if (filters.length) {
            companyResp = await db.query(baseURL, filters)
        } else {
            companyResp = await db.query(baseURL)
        }


        return companyResp.rows;
    }

    /** creates new company based on data passed in */
    static async create(company) {
        const { handle, name, num_employees, description, logo_url } = company
        const result = await db.query(
            `INSERT INTO companies (handle, name, num_employees, description, logo_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING handle, name, num_employees, description, logo_url`,
            [handle, name, num_employees, description, logo_url]);

        return result.rows[0];
    }

    /** finds a company based on its handle */
    static async findOne(handle) {
        const results = await db.query(
            `SELECT handle, name, num_employees, description, logo_url
      FROM companies
      WHERE handle=$1`,
            [handle]
        );

        if (!results.rows.length) {
            throw { message: `There is no company with the handle, ${handle}`, status: 404 }
        }

        return results.rows[0];
    }

    /** updates a company based on its handle */
    static async update(handle, body) {
        const { query, values } = sqlForPartialUpdate("companies", body, "handle", handle);
        const results = await db.query(query, values);

        if (!results.rows.length) {
            throw { message: `There is no company with the handle, ${handle}`, status: 404 }
        }

        return results.rows[0];
    }

    /** deletes a company from db based on its handle */
    static async delete(handle) {
        const results = await db.query(
            `DELETE FROM companies
      WHERE handle=$1
      RETURNING handle`,
            [handle]);

        if (!results.rows.length) {
            throw { message: `There is no company with the handle, ${handle}`, status: 404 }
        }
    }
}



module.exports = Company;