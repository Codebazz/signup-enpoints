require("dotenv").config();
const connectToMongo = require("./db");
const express = require("express");
var cors = require("cors");

const jwt = process.env.JWT_KEY;

const app = express();
const port = 5000;
connectToMongo();
app.use(cors());
app.use(express.json());
//Avaliable Routes
app.use("/api/auth", require("./routes/auth"));
app.listen(port, () => {
  console.log(`Crud Operation Endpoints listening at http://localhost:${port}`);
  console.log(jwt);
});
//console.log("hello");
