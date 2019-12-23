module.exports = {
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
