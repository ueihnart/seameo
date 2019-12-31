const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const roles = require("./../../middleware/roles");
const CONSTANT = require("./../../config/constant");
const User = require("./../../models/User");
const News = require("./../../models/News");

//@route    get api/news
//desc      Register all news
//access    Public
router.get(
  "/",
  [roles(CONSTANT.CRUD.READ, CONSTANT.TASK.NEWS)],
  async (req, res) => {
    try {
      const news = await News.find().sort({ date: -1 });
      res.json(news);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

//@route    get api/news/id:id
//desc      Register news id
//access    Public
router.get(
  "/id:id",
  [roles(CONSTANT.CRUD.READ, CONSTANT.TASK.NEWS)],
  async (req, res) => {
    try {
      const news = await News.findById(req.params.id);
      res.json(news);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

//@route    get api/news/search-key
//desc      Register user
//access    Public
router.get(
  "/search",
  [
    roles(CONSTANT.CRUD.READ, CONSTANT.TASK.NEWS),
    check("key", "Key is not empty").notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { key, value } = req.body;
      const news = await News.find({ [key]: value });
      res.json(news);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

//@route    post api/news
//desc      Register user
//access    Private
router.post(
  "/",
  [
    roles(CONSTANT.CRUD.CREATE, CONSTANT.TASK.NEWS),
    [
      check("title", "Title is not empty"),
      check("content", "Content is not empty")
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { title, content, picture, status, hotnews, tag } = req.body;
      const date = Date.now();
      const user = await User.findOne({ username: req.user.username });
      newsPost = new News({
        userid: user.id,
        title,
        content,
        picture,
        status,
        hotnews,
        tag,
        updatedate: date
      });
      const news = await newsPost.save();
      res.json(news);
    } catch (err) {
      console.error("Error:");
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

module.exports = router;
