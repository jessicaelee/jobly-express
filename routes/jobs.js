const express = require('express');
const router = new express.Router();
const ExpressError = require('../helpers/expressError');
const Job = require('../models/job');
const jsonschema = require('jsonschema');
const jobSchema = require('../schemas/jobSchema');
// const updateCompanySchema = require('../schemas/updateCompanySchema');


router.post('/', async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, jobSchema);

        if (!result.valid) {
            const errorList = result.errors.map(error => error.stack);
            const error = new ExpressError(errorList, 400);
            return next(error);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });

    } catch (err) {
        return next(err);
    }
});

router.get('/', async function (req, res, next) {
    try {
        const { search, min_salary, min_equity } = req.query;

        let resp = await Job.findAll(search, min_salary, min_equity);

        return res.json({ jobs: resp });

    } catch (err) {
        return next(err);
    }
});

// router.get('/:id', async function (req, res, next) {
//     try {


//     } catch (err) {
//         return next(err);
//     }
// });

// router.patch('/:id', async function (req, res, next) {
//     try {


//     } catch (err) {
//         return next(err);
//     }
// });

// router.deelte('/:id', async function (req, res, next) {
//     try {


//     } catch (err) {
//         return next(err);
//     }
// });


module.exports = router;