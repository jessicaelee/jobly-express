static async findAll(search, min, max) {
    let filters = [];
    let companyResp;
    let idx = 1;
    let baseURL = "SELECT handle, name FROM companies WHERE";

    if (search !== undefined) {
        baseURL += ` name LIKE '%${search}%'`;
        filters.push(search);
        idx++;
    }
    if (min !== undefined) {
        if (filters.length) {
            baseURL += " AND"
        }
        baseURL += ` num_employees >= $${idx}`;
        filters.push(min);
        idx++;
    }
    if (max !== undefined) {
        if (filters.length) {
            baseURL += " AND"
        }
        baseURL += ` num_employees <= $${idx}`;
        filters.push(max);
        idx++;
    }
    console.log("baseurl", baseURL, filters)

    if (!filters.length) {
        companyResp = await db.query(baseURL.slice(-5))
    }

    companyResp = await db.query(baseURL, filters);
    return companyResp.rows;

}