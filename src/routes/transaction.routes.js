const {Router} = require('express');
const authMiddleWare = require('../middleware/auth.middleware');
const TransactionController = require('../controllers/transaction.controller');

const transactionRoutes = Router();

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleWare.authMiddleware, TransactionController.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds 
 * - Create initial fund transaction
 */

transactionRoutes.post("/system/initial-funds",authMiddleWare.authSystemUserMiddleware, TransactionController.createInitialFundsTransaction);

/**
 * - GET /api/transactions/history/:accountId
 * - Get transaction history and ledger statements (open access)
 */
transactionRoutes.get("/history/:accountId", TransactionController.getTransactionHistory);

module.exports = transactionRoutes;