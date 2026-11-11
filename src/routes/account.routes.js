const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller")

const router = express.Router() ;

/**
 * - POST /api/accounts/
 * - Create a new Account 
 * - Protected Route 
 */

router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/**
 * - GET /api/accounts/
 * - Get all accounts (open access)
 */
router.get("/", accountController.getUserAccountsController);

/**
 * - GET /api/accounts/balance/:accountId
 * - Get balance for an account (open access)
 */
router.get("/balance/:accountId", accountController.getAccountBalanceController);

module.exports = router;