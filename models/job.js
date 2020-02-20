const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Job {

    static async create(job) {
        const { title, salary, equity, company_handle } = job;
        console.log(equity, typeof equity)

        const result = await db.query('INSERT INTO jobs (title, salary, equity, company_handle, date_posted) VALUES ($1, $2, $3, $4, current_timestamp) RETURNING title, salary, equity, company_handle', [title, salary, equity, company_handle]);

        return result.rows[0];
    }

    static async findAll(search, salary, equity) {
        let filters = [];
        let jobResp;

        if (search !== undefined) {
            filters.push(`name LIKE '%${search}%'`);
        }
        if (salary !== undefined) {
            filters.push(`salary >= ${salary}`);
        }
        if (equity !== undefined) {
            filters.push(`equity >= ${equity}`);
        }

        if (filters.length) {
            filters = filters.join(" AND ")
            let queryString = `SELECT title, company_handle FROM jobs WHERE ` + filters + ' ORDER BY date_posted DESC';
            jobResp = await db.query(queryString);
        } else {
            let queryString = `SELECT title, company_handle FROM jobs ORDER BY date_posted DESC`
            jobResp = await db.query(queryString);
        }

        return jobResp.rows;
    }


}



module.exports = Job;