const express = require("express");
const app = express();
const connectDB = require("./config/db");

//Connect Databanse
connectDB();

//Init Middleware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Runging"));

//Define Routes
app.use("/api/user", require("./routes/api/users"));
app.use("/api/news", require("./routes/api/news"));

//Config Port
const PORT = process.env.PORT || 3500;

app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
