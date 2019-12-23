const jwt = require("jsonwebtoken");
const config = require("config");

const rolesMap = {
  superadmin: {
    id: "superadmin",
    name: "Super Admin",
    description: "",
    resource: [
      {
        id: "news",
        permissions: ["create", "read", "update", "delete"]
      },
      {
        id: "user",
        permissions: ["create", "read", "update", "delete"]
      },
      {
        id: "journal",
        permissions: ["create", "read", "update", "delete"]
      }
    ]
  },
  admin: {
    id: "admin",
    name: "Admin",
    description: "",
    resource: [
      {
        id: "news",
        permissions: ["create", "read", "update", "delete"]
      },
      {
        id: "user",
        permissions: ["read"]
      },
      {
        id: "journal",
        permissions: ["create", "read", "update"]
      }
    ]
  },
  user: {
    id: "user",
    name: "User",
    description: "",
    resource: [
      {
        id: "new",
        permissions: ["create", "read", "update", "delete"]
      },
      {
        id: "user",
        permissions: ["read"]
      },
      {
        id: "journal",
        permissions: ["create", "read", "update"]
      }
    ]
  }
};

module.exports = function(action, source, loginRequired) {
  return function(req, res, next) {
    if (loginRequired) {
      console.log("isnauthor");
      //Get token from header
      const token = req.header(config.get("tokenKey"));
      //Check if not token
      if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
      }
      //Verify token
      try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));
        req.user = decoded.user;
      } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
      }
      res.json("a islogin");
    } else {
      res.json("a isnologin");
    }
    next();
  };
};
