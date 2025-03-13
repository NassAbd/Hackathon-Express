const express = require("express");
const { register, login, loginAdmin, registerAdmin } = require("../controllers/authController");

const router = express.Router();

router.post("/registerAdmin", registerAdmin);
router.post("/register", register);
router.post("/login", login);
router.post("/loginAdmin", loginAdmin);


module.exports = router;
