const express = require('express')
const router = new express.Router()
const ExpressError = require('../helpers/expressError')
const Company = require('../models/company')

router.get('/', async function (req, res, next) {
    try {
        search = req.query.search;
        min_employees = req.query.min_employees;
        max_employees = req.query.max_employees;

        if (+min_employees > +max_employees) {
            throw new ExpressError("The parameters are incorrect", 400)
        }

        let resp = await Company.findAll(search, min_employees, max_employees)

        return res.json({ companies: resp })

    } catch (err) {
        return next(err)
    }
})


module.exports = router;