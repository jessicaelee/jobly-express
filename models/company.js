const db = require('../db')

class Company {

    static async findAll(search, min, max) {
        let filters = [];
        if (search !== undefined) {
            filters.push(`name LIKE '%${search}%'`);
        }
        if (min !== undefined) {
            filters.push(`num_employees >= ${min}`);
        }
        if (max !== undefined) {
            filters.push(`num_employees >= ${max}`);
        }

        let companyResp

        if (filters.length > 0) {
            let queryString = `SELECT handle, name FROM companies WHERE ` + filters.join("AND ")
            console.log(queryString)
            companyResp = await db.query(queryString);
        } else {
            companyResp = await db.query(`SELECT handle, name FROM companies`);
        }

        return companyResp.rows;

    }

    static async create(data) {
        const result = await db.query(`INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING handle, name, num_employees, description, logo_url`, [data.handle, data.name, data.num_employees, data.description, data.logo_url]);

        return result.rows[0];
    }

}



module.exports = Company