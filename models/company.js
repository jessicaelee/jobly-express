const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Company {

    /** finds all companies based on query parameters */
    static async findAll(search, min, max) {
        let filters = [];
        let companyResp;

        if (search !== undefined) {
            filters.push(`name LIKE '%${search}%'`);
        }
        if (min !== undefined) {
            filters.push(`num_employees >= ${min}`);
        }
        if (max !== undefined) {
            filters.push(`num_employees >= ${max}`);
        }

        if (filters.length) {
            let queryString = `SELECT handle, name FROM companies WHERE ` + filters.join("AND ");
            companyResp = await db.query(queryString);
        } else {
            companyResp = await db.query(`SELECT handle, name FROM companies`);
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