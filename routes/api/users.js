const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const User = require("./../../models/User");
const roles = require("./../../middleware/roles");
const CONSTANT = require("./../../config/constant");

//@route    post api/user
//desc      Register user
//access    Public
router.post(
  "/register",
  [
    roles(CONSTANT.CRUD.CREATE, CONSTANT.TASK.USER),
    [
      (check("fullname", "Full name is not Empty!").notEmpty(),
      check("unit", "Unit is not Empty!").notEmpty(),
      check("username")
        .isAlphanumeric()
        .withMessage("username phải là chữ cái, chữ số")
        .isLength({ min: 4, max: 30 })
        .withMessage("username từ 3~30 ký tự!")
        .exists()
        .withMessage("userame is exits!"),
      check("password")
        .isLength({ min: 6 })
        .withMessage("Please enter a password with 6 or more characters!"))
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { fullname, unit, username, password } = req.body;
    username = username.toLowerCase();
    let role = CONSTANT.ROLES.USER;
    if (username === "adminseameo") role = CONSTANT.ROLES.SPADMIN;
    try {
      //Seee if user exists
      let user = await User.findOne({ username });
      if (user) {
        res.status(400).json({ errors: [{ msg: "User already exists!" }] });
      }
      user = new User({
        username,
        password,
        fullname,
        unit,
        role
      });
      //Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      //Return jsonwebtoken
      const payload = {
        user: { username: user.username, role: user.role }
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { algorithm: "HS256", expiresIn: config.get("tokenLife") },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

//@route    post api/user/login
//desc      Authenticate user & get token (Login)
//access    Public
router.post(
  "/login",
  [
    (check("username", "Username is required!")
      .not()
      .isEmpty(),
    check("password", "Password is required!").exists())
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { username, password } = req.body;
    username = username.toLowerCase();
    try {
      //Seee if user exists
      let user = await User.findOne({ username });
      if (!user) {
        res
          .status(400)
          .json({ errors: [{ msg: "Invalid user credentials!" }] });
      }
      //check Password is match
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid password credentials!" }] });
      }
      //Return jsonwebtoken
      const payload = {
        user: { username: user.username, role: user.role }
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { algorithm: "HS256", expiresIn: config.get("tokenLife") },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

//@route    get api/user/logout
//desc      Logout (logout)
//access    Public
router.get(
  "/logout",
  [roles(CONSTANT.CRUD.READ, CONSTANT.TASK.USER)],
  async (req, res) => {
    try {
      //Return jsonwebtoken
      const payload = {
        user: {}
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { algorithm: "HS256", expiresIn: 0 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route put api/user/edit-username
// @desc  Update info user
// @access Private
router.put(
  "/edit-:username",
  [roles(CONSTANT.CRUD.UPDATE, CONSTANT.TASK.USER)],
  async (req, res) => {
    const { fullname, unit, phones, address, skills, bio, role } = req.body;
    const username = req.params.username.toLowerCase();
    try {
      const user = await User.findOne({ username }).select("-password -__v");
      //Build profile object
      const info = {};
      if (phones) info.phones = phones.split(",").map(phone => phone.trim());
      if (skills) info.skills = skills.split(",").map(skill => skill.trim());
      if (address) info.address = address;
      if (bio) info.bio = bio;
      if (fullname) user.fullname = fullname;
      if (unit) user.unit = unit;
      if (info) user.info = info;
      if (role !== undefined) {
        if (req.user.role === CONSTANT.ROLES.SPADMIN) user.role = role;
        else {
          return res.status(401).json({
            msg: "Do not change authorities. You do not have access superadmin"
          });
        }
      }
      await user.save();
      res.json(user);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route put api/user/password-username
// @desc  Change password user
// @access Private
router.put(
  "/password-:username",
  [
    roles(CONSTANT.CRUD.UPDATE, CONSTANT.TASK.USER),
    [check("newpassword", "newpassword is not Empty!").notEmpty()]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { oldpassword, newpassword } = req.body;
    const username = req.params.username.toLowerCase();
    try {
      const user = await User.findOne({ username }).select(
        "-__v -info -authorities -createdate"
      );
      if (req.user.role !== CONSTANT.ROLES.SPADMIN) {
        //check Password is match
        const isMatch = await bcrypt.compare(oldpassword, user.password);
        if (!isMatch) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Invalid password credentials!" }] });
        }
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newpassword, salt);
      await user.save();
      res.json(user);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route delete api/user/delete-user
// @desc  delete user
// @access Private
router.delete(
  "/username-:username",
  [roles(CONSTANT.CRUD.DELETE, CONSTANT.TASK.USER)],
  async (req, res) => {
    const username = req.params.username.toLowerCase();
    try {
      await User.findOneAndRemove({ username });
      res.json({ msg: `User ${username} is delete success` });
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route get api/user/username-username
// @desc  Get current user
// @access Private
router.get(
  "/username-:username",
  roles(CONSTANT.CRUD.READ, CONSTANT.TASK.USER),
  async (req, res) => {
    const username = req.params.username.toLowerCase();
    try {
      if (req.user.role === CONSTANT.ROLES.SPADMIN)
        user = await User.findOne({
          username: username
        }).select("-__v -password");
      else if (req.user.role === CONSTANT.ROLES.ADMIN)
        user = await User.findOne({
          username: username
        }).select("-__v -authorities -password -createdate");
      else if (req.user.username === username)
        user = await User.findOne({
          username: username
        }).select("-__v -authorities -password");
      else
        user = await User.findOne({
          username: username
        }).select("-__v -info -authorities -password -createdate");
      res.json(user);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route get api/user/users
// @desc  Get current user
// @access Private
router.get(
  "/users",
  roles(CONSTANT.CRUD.READ, CONSTANT.TASK.USER),
  async (req, res) => {
    try {
      if (req.user.role === CONSTANT.ROLES.SPADMIN)
        user = await User.find().select("-__v -password");
      else if (req.user.role === CONSTANT.ROLES.ADMIN)
        user = await User.find().select(
          "-__v -authorities -password -createdate -info"
        );
      else if (req.user.role === CONSTANT.ROLES.USER)
        return res.status(401).json({ errors: [{ msg: "Not have access!" }] });
      res.json(user);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

module.exports = router;
