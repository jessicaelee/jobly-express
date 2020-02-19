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

}



module.exports = Company