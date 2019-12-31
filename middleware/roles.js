const jwt = require("jsonwebtoken");
const config = require("config");
const CONSTANT = require("./../config/constant");

const ROLE = CONSTANT.ROLES;
const taskManager = {
  USER: {
    CREATE: [ROLE.GUEST],
    READ: [ROLE.USER, ROLE.ADMIN, ROLE.SPADMIN],
    UPDATE: [ROLE.ADMIN, ROLE.SPADMIN],
    DELETE: [ROLE.SPADMIN]
  },
  NEWS: {
    CREATE: [ROLE.USER, ROLE.ADMIN, ROLE.SPADMIN],
    READ: [ROLE.GUEST],
    UPDATE: [ROLE.USER, ROLE.ADMIN, ROLE.SPADMIN],
    DELETE: [ROLE.USER, ROLE.ADMIN, ROLE.SPADMIN]
  }
};

module.exports = function(action, source) {
  return function(req, res, next) {
    if (taskManager[source][action].indexOf(ROLE.GUEST) !== -1) {
      next();
    } else {
      //Get token from header
      const token = req.header(config.get("tokenKey"));
      //Check if not token
      if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
      }
      //Verify token
      try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));
        if (
          req.params &&
          req.params.username &&
          decoded.user.username === req.params.username.toLowerCase()
        ) {
          req.user = decoded.user;
          next();
        } else if (
          taskManager[source][action].indexOf(decoded.user.role) !== -1
        ) {
          req.user = decoded.user;
          next();
        } else {
          res.status(401).json({ msg: "not have access" });
        }
      } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
      }
    }
  };
};
