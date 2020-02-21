const express = require('express');
const jwt = require('jsonwebtoken');
const router = new express.Router();
const ExpressError = require('../helpers/expressError');
const User = require('../models/user');
const jsonschema = require('jsonschema');
const userSchema = require('../schemas/userSchema');
const updateUserSchema = require('../schemas/updateUserSchema');
const { SECRET_KEY } = require("../config");
const { ensureCorrectUser } = require('../middleware/auth')


router.post('/', async function (req, res, next) {
  try {
    console.log('hi')
    const result = jsonschema.validate(req.body, userSchema);

    if (!result.valid) {
      const errorList = result.errors.map(error => error.stack);
      const error = new ExpressError(errorList, 400);
      return next(error);
    }

    const user = await User.create(req.body);
    const { first_name, last_name, email, photo_url, ...payload } = user;
    let token = jwt.sign(payload, SECRET_KEY);

    return res.status(201).json({ token });

  } catch (err) {
    return next(err);
  }
});

router.get('/', async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });

  } catch (err) {
    return next(err);
  }
});

router.get('/:username', async function (req, res, next) {
  try {
    const user = await User.findOne(req.params.username);
    return res.json({ user });

  } catch (err) {
    return next(err);
  }
});

router.patch('/:username', ensureCorrectUser, async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, updateUserSchema);

    const { body, params: { username } } = req;

    if (body.username) {
      throw new ExpressError(`Cannot change username`, 400);
    }

    if (!result.valid) {
      const errorList = result.errors.map(error => error.stack);
      const error = new ExpressError(errorList, 400);
      return next(error);
    }

    const user = await User.update(username, body);
    return res.json({ user });


  } catch (err) {
    return next(err);
  }
});

router.delete('/:username', ensureCorrectUser, async function (req, res, next) {
  try {
    const { username } = req.params;
    await User.delete(username);
    return res.json({ message: "User deleted" })

  } catch (err) {
    return next(err);
  }
});




module.exports = router;