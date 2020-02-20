const express = require('express');
const router = new express.Router();
const ExpressError = require('../helpers/expressError');
const Job = require('../models/job');
const jsonschema = require('jsonschema');
const jobSchema = require('../schemas/jobSchema');
const updateJobSchema = require('../schemas/updateJobSchema');


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
        const jobs = await Job.findAll(search, min_salary, min_equity);
        return res.json({ jobs });

    } catch (err) {
        return next(err);
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        const job = await Job.findOne(req.params.id);
        return res.json({ job });

    } catch (err) {
        return next(err);
    }
});

router.patch('/:id', async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, updateJobSchema);

        const { body, params: { id } } = req;

        if (!result.valid) {
            const errorList = result.errors.map(error => error.stack);
            const error = new ExpressError(errorList, 400);
            return next(error);
        }

        const job = await Job.update(id, body);
        return res.json({ job });


    } catch (err) {
        return next(err);
    }
});

router.delete('/:id', async function (req, res, next) {
    try {
        const { id } = req.params;
        await Job.delete(id);
        return res.json({ message: "Job deleted" })

    } catch (err) {
        return next(err);
    }
});


module.exports = router;