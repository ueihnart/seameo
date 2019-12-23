const mongoose = require("mongoose");
const schema = mongoose.Schema;

const UserSchema = new schema({
  fullname: { type: String, require: true },
  unit: { type: String, required: true },
  username: { type: String, require: true, unique: true },
  password: { type: String, require: true },
  role: { type: String, require: true },
  info: {
    phones: { type: [String] },
    skills: { type: [String] },
    address: { type: String },
    bio: { type: String }
  },
  createdate: { type: Date, default: Date.now }
});

module.exports = User = mongoose.model("user", UserSchema);
