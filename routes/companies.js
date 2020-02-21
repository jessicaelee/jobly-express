const express = require('express');
const router = new express.Router();
const ExpressError = require('../helpers/expressError');
const Company = require('../models/company');
const jsonschema = require('jsonschema');
const companySchema = require('../schemas/companySchema');
const updateCompanySchema = require('../schemas/updateCompanySchema');
const { authenticateJWT, ensureLoggedIn, ensureAdminUser } = require('../middleware/auth')

/** GET all companies; returns {companies: [companyData, ...]} */
router.get('/', authenticateJWT, ensureLoggedIn, async function (req, res, next) {
    try {
        const { search, min_employees, max_employees } = req.query;

        if (+min_employees > +max_employees) {
            throw new ExpressError("The parameters are incorrect", 400);
        }

        let resp = await Company.findAll(search, min_employees, max_employees);

        return res.json({ companies: resp });

    } catch (err) {
        return next(err);
    }
});

/** POST new company; returns {company: companyData} */
router.post('/', ensureAdminUser, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, companySchema);

        if (!result.valid) {
            const errorList = result.errors.map(error => error.stack);
            const error = new ExpressError(errorList, 400);
            return next(error);
        }

        const company = await Company.create(req.body);
        return res.status(201).json({ company });

    } catch (err) {
        return next(err);
    }
});

/** GET one company by its handle; returns {company: companyData} */
router.get('/:handle', ensureLoggedIn, async function (req, res, next) {
    try {
        const company = await Company.findOne(req.params.handle);
        return res.json({ company });

    } catch (err) {
        return next(err);
    }
});

/** PATCH one company by its handle; returns {company: companyData} */
router.patch('/:handle', ensureAdminUser, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, updateCompanySchema);

        const { body, params: { handle } } = req;

        if (!result.valid) {
            const errorList = result.errors.map(error => error.stack);
            const error = new ExpressError(errorList, 400);
            return next(error);
        }

        const company = await Company.update(handle, body);
        return res.json({ company });

    } catch (err) {
        return next(err);
    }
});

/** DELETE a company; returns { message: "Company deleted" } */
router.delete('/:handle', ensureAdminUser, async function (req, res, next) {
    try {
        const { handle } = req.params
        await Company.delete(handle);
        return res.json({ message: "Company deleted" });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;