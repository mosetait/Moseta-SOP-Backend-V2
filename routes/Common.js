const express = require("express");
const { auth } = require("../middleware/auth");
const { getAllCategories, getAllProducts, fetchProof, fetchTransaction, fetchRejectedTransaction } = require("../controllers/Common/get");
const router = express.Router();


router.route("/get-all-categories").get(auth,getAllCategories);
router.route("/get-all-products").get(auth,getAllProducts);
router.route("/fetch-proof").post(fetchProof);
router.route("/fetch-transaction").post(auth , fetchTransaction);
router.route("/fetch-rejectedTransaction").post(auth , fetchRejectedTransaction);




module.exports = router;


