const mongoose = require("mongoose");
const schema = mongoose.Schema;

const UserSchema = new schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  title: { type: String, require: true },
  content: { type: String, require: true },
  picture: { type: String },
  status: { type: Boolean, default: true },
  hotnews: { type: Boolean, default: false },
  tag: { type: String },
  updatedate: { type: Date },
  createdate: { type: Date, default: Date.now }
});

module.exports = User = mongoose.model("new", UserSchema);
