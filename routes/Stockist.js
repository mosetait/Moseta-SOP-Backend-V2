const express = require("express");
const { loginStk } = require("../controllers/Auth");
const { auth, isStockist } = require("../middleware/auth");
const { setupProfile, updateProfile } = require("../controllers/Stockist/profile");
const { BalanceTransferStk, clientTransferStk, stockTransferStk } = require("../controllers/Stockist/transaction");
const { getStock, getClients } = require("../controllers/Stockist/get");
const { createClient, updateClient, deleteClient } = require("../controllers/Stockist/client");
const router = express.Router();


router.route("/stockist-login").post(loginStk);

// setup profile
router.route("/setup-profile").post(auth , isStockist , setupProfile);
router.route("/update-profile").put(auth , isStockist , updateProfile);


// Transactions
router.route("/balance-transfer-stk").post(auth , isStockist , BalanceTransferStk);
router.route("/client-transfer-stk").post(auth , isStockist , clientTransferStk);
router.route("/stock-transfer-stk").post(auth , isStockist , stockTransferStk);


// Client
router.route("/create-client").post(auth , isStockist , createClient);
router.route("/update-client").put(auth , isStockist , updateClient);
router.route("/delete-client").delete(auth , isStockist , deleteClient);


// get
router.route("/get-stock-stockist").get(auth,isStockist,getStock)
router.route("/get-clients").get(auth , isStockist, getClients)




module.exports = router;