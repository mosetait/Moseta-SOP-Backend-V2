const express = require("express");
const { auth, isAdmin } = require("../middleware/auth");
const { signUpAdmin, loginAdmin, logout, getUserInfo } = require("../controllers/Auth");
const { BalanceTransferAdmin, stockTransferAdmin, confirmTransaction } = require("../controllers/Admin/transaction");
const { getAllStockistInfo, getStockistInfo, getAllNotifications, getStockAdmin, getTransactions } = require("../controllers/Admin/get");
const { createProduct, createCategory, updateCategory, deleteCategory, updateProduct, deleteProduct } = require("../controllers/Admin/product");
const { signUpStk, deleteStockist } = require("../controllers/Admin/stockist");
const router = express.Router();


// auth
router.route("/create-admin").post(auth, isAdmin, signUpAdmin);
router.route("/login-admin").post(loginAdmin);
router.route("/logout").post(logout);


// CRUD stockist 
router.route("/create-stockist").post(auth, isAdmin, signUpStk);
router.route("/delete-stockist/:id").delete(auth , isAdmin , deleteStockist);



// commiting transaction
router.route("/commit-bl-transaction-admin").post(auth , isAdmin , BalanceTransferAdmin);
router.route("/commit-st-transaction-admin").post(auth , isAdmin , stockTransferAdmin);
router.route("/confirm-transaction").put(auth , isAdmin , confirmTransaction);


// get routes
router.route("/get-all-stockists").get(auth , isAdmin , getAllStockistInfo);
router.route("/get-single-stockist/:id").get(auth , isAdmin , getStockistInfo);
router.route("/get-all-notifications").get(auth , isAdmin , getAllNotifications);
router.route("/load-user").get(auth,getUserInfo);
router.route("/get-stock-admin").get(auth , isAdmin , getStockAdmin);
router.route("/get-stockist-transactions").post(auth , isAdmin , getTransactions)




// product routes
router.route("/create-product").post(auth , isAdmin ,createProduct);
router.route("/update-product").put(auth , isAdmin ,updateProduct);
router.route("/delete-product").delete(auth , isAdmin ,deleteProduct);
router.route("/create-category").post(auth , isAdmin ,createCategory);
router.route("/update-category").put(auth , isAdmin ,updateCategory);
router.route("/delete-category").delete(auth , isAdmin ,deleteCategory);


module.exports = router;


