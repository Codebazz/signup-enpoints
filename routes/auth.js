const express = require("express");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_KEY;

//ROUTE1:Create a User using : POST "/api/auth/createuser". Doesn't require auth. no login requried
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
    body("mobileno", "Enter a valid mobile number").isLength({ min: 10 }),
    body("country", "Enter a valid country").isLength({ min: 3 }),
  ],
  async (req, res) => {
    // If there are errors, return bad requests and the errors
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }
    //Check whether the user with this email exists or not
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ success, error: "Sorry a user with this already exists" });
      }
      const salt = await bycrypt.genSalt(10);
      secPass = await bycrypt.hash(req.body.password, salt);

      //Create a new user
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
        mobileno: req.body.mobileno,
        country: req.body.country,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
    }
  }
);
//ROUTE2:Authenticate a User using : POST "/api/auth/login".
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    // If there are errors, return bad requests and the errors
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }
      const passwordCompare = await bycrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res.status(400).json({
          success,
          error: "Please try to login with correct credentials",
        });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
    }
  }
);

//Route 3:Get loggedin User details using: POST "/api/auth/getuser".Login required.
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
});
// Create enpoint to update user details
router.put("/updateuser", fetchuser, async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId);
    user.name = req.body.name;
    user.email = req.body.email;
    user.mobileno = req.body.mobileno;
    user.country = req.body.country;
    user.save();
    res.send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
