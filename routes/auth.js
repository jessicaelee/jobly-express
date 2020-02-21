const jwt = require('jsonwebtoken');
const express = require('express');
// const Router = require('express').Router();
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const User = require('../models/user');
const { SECRET_KEY } = require("../config");

router.post('/login', async function (req, res, next) {
    console.log('*****************************',req.body)
    try {
        const { username, password } = req.body;
        let query = await User.authenticate(username, password);
        if (query) {
            const { username, is_admin } = query;
            const payload = { username, is_admin };
            let token = jwt.sign(payload, SECRET_KEY);
            return res.json({ token })
        } else {
            throw new ExpressError("Invalid username/password", 400)
        }

    } catch (err) {
        return next(err);
    }
})

module.exports = router;