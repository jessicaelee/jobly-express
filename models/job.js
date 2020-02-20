const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Job {
    static async create(job) {
        const { title, salary, equity, company_handle } = job;

        const foreignKeyCheck = await db.query(
            `SELECT handle FROM companies WHERE handle=$1`, [company_handle]
        );

        if (!foreignKeyCheck.rows.length) {
            throw { message: `Your input is not correct`, status: 400 }
        }

        const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle, date_posted) 
             VALUES ($1, $2, $3, $4, current_timestamp) 
             RETURNING title, salary, equity, company_handle`,
            [title, salary, equity, company_handle]);

        return result.rows[0];
    }

    static async findAll(search, salary, equity) {
        let filters = [];
        let jobResp;
        let idx = 1;
        let baseURL = `SELECT title, company_handle FROM jobs`;

        if (search !== undefined) {
            baseURL += ` WHERE title ILIKE $1`;
            filters.push(`%${search}%`);
            idx++;
        }
        if (salary !== undefined) {
            if (filters.length) {
                baseURL += ` AND salary >= $${idx}`;
            } else {
                baseURL += ` WHERE salary >= $${idx}`;
            }
            idx++;
            filters.push(salary);
        }
        if (equity !== undefined) {
            if (filters.length) {
                baseURL += ` AND equity >= $${idx}`;
            } else {
                baseURL += ` WHERE equity >= $${idx}`;
            }
            idx++;
            filters.push(equity);
        }

        if (!filters.length) {
            jobResp = await db.query(baseURL);
        } else {
            jobResp = await db.query(baseURL, filters);
        }

        if (jobResp.rows.length) {
            return jobResp.rows;
        } else {
            throw { message: `There are no jobs that match those parameters`, status: 400 }
        }

    }

    static async findOne(id) {
        const jobResult = await db.query(`
            SELECT title, company_handle, salary, equity 
            FROM jobs 
            WHERE id=$1`, [id]);

        if (!jobResult.rows.length) {
            throw { message: `There is no job with the id, ${id}`, status: 404 }
        }

        const companyHandle = jobResult.rows[0].company_handle;

        const companyResult = await db.query(
            `SELECT name, num_employees, description 
            FROM companies 
            WHERE handle = $1`, [companyHandle]);

        jobResult.rows[0].company = companyResult.rows[0];

        return jobResult.rows[0];
    }

    static async update(id, body) {
        const { query, values } = sqlForPartialUpdate("jobs", body, "id", id);
        const results = await db.query(query, values);

        if (!results.rows.length) {
            throw { message: `There is no job with the id, ${id}`, status: 404 }
        }

        const companyHandle = results.rows[0].company_handle;

        const companyResult = await db.query(`
            SELECT name, num_employees, description 
            FROM companies 
            WHERE handle = $1`, [companyHandle]);

        results.rows[0].company = companyResult.rows[0];

        return results.rows[0];
    }

    static async delete(id) {
        const results = await db.query(
            `DELETE FROM jobs
            WHERE id=$1
            RETURNING id`, [id]);

        if (!results.rows.length) {
            throw { message: `There is no job with the id, ${id}`, status: 404 }
        }
    }
}

module.exports = Job;