const express = require("express");
const { auth } = require("../middleware/auth");
const { getAllCategories, getAllProducts } = require("../controllers/Common/get");
const router = express.Router();


router.route("/get-all-categories").get(auth,getAllCategories);
router.route("/get-all-products").get(auth,getAllProducts);



module.exports = router;


