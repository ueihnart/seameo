const express = require("express");
const router = express.Router();
const auth = require("./../../middleware/auth");
const User = require("./../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

//@route    post api/auth
//desc      Authenticate user & get token (Login)
//access    Public
router.post(
  "/",
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

    const { username, password } = req.body;
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

module.exports = router;
