const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const User = require("./../../models/User");
const auth = require("./../../middleware/auth");
const roles = require("./../../middleware/roles");

//@route    post api/user
//desc      Register user
//access    Public
router.post(
  "/",
  [
    roles("update", "user"),
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
    const { fullname, unit, username, password } = req.body;
    let authorities = "user";
    if (username === "adminseameo") authorities = "admin";

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
        authorities
      });
      //Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      //Return jsonwebtoken
      const payload = {
        user: { username: user.username, authorities: user.authorities }
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

// @route put api/user
// @desc  Update info user
// @access Private
router.put(
  "/edit-:username",
  [roles("update", "user", "loginRequired")],
  async (req, res) => {
    let username;
    const {
      fullname,
      unit,
      phones,
      address,
      skills,
      bio,
      authorities
    } = req.body;
    if (!(req.params.username === "me")) {
      if (req.user.username === "adminseameo") {
        username = req.params.username;
      } else if (req.user.username === req.params.username) {
        username = req.params.username;
      } else {
        return res.status(401).json({
          msg: "You do not have access adminseameo."
        });
      }
    } else {
      username = req.user.username;
    }
    try {
      const user = await User.findOne({ username: username }).select(
        "-password -__v"
      );
      //Build profile object
      const info = {};
      if (phones) info.phones = phones.split(",").map(phone => phone.trim());
      if (skills) info.skills = skills.split(",").map(skill => skill.trim());
      if (address) info.address = address;
      if (bio) info.bio = bio;
      if (fullname) user.fullname = fullname;
      if (unit) user.unit = unit;
      if (info) user.info = info;
      if (authorities !== undefined) {
        if (req.user.username === "adminseameo") user.authorities = authorities;
        else {
          return res.status(401).json({
            msg: "Do not change authorities. You do not have access adminseameo"
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

// @route put api/user/password:me or :userid
// @desc  Change password user
// @access Private
router.put(
  "/password-:username",
  [auth, [check("newpassword", "newpassword is not Empty!").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { oldpassword, newpassword } = req.body;
    let username;
    if (!(req.params.username === "me")) {
      if (req.user.username === "adminseameo") {
        username = req.params.username;
      } else if (req.user.username === req.params.username) {
        username = req.params.username;
      } else {
        return res.status(401).json({
          msg: "You do not have access adminseameo."
        });
      }
    } else {
      username = req.user.username;
    }
    try {
      const user = await User.findOne({ username: username }).select(
        "-__v -info -_id -authorities -createdate"
      );
      if (req.user.username === "adminseameo") {
        if (
          req.user.username !== req.params.username &&
          req.params.username !== "me"
        ) {
          user.password = newpassword;
        } else {
          return res.status(401).json({
            msg: "Cannot change adminseameo password"
          });
        }
      } else {
      }
      res.json(user);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route get api/user/:username or get api/user/me or get api/user/all
// @desc  Get current user
// @access Private
router.get("/:username", auth, async (req, res) => {
  try {
    let user;
    if (
      req.params.username === "me" ||
      req.params.username === req.user.username
    ) {
      user = await User.findOne({
        username: req.user.username
      }).select("-__v -_id -createdate -password ");
    } else if (req.params.username === "all") {
      user = await User.find().select(
        "-password -__v -_id -authorities -createdate"
      );
    } else {
      user = await User.findOne({
        username: req.params.username
      }).select("-password -__v -_id -authorities -createdate");
    }
    res.json(user);
  } catch (err) {
    console.error("Error:");
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

module.exports = router;
