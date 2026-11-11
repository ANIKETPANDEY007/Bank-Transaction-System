const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");

/**
 * - Create a new Transaction 
 * The 10 step transfer flow 
 * 1. Validate request 
 * 2. Validate Idempotency key 
 * 3. Check account status 
 * 4. Derive sender balance from ledger 
 * 5. Create transaction Pending 
 * 6. Create Debit ledger entry 
 * 7. Create Credit ledger entry 
 * 8. Mark Transaction Completed 
 * 9. Commit MongoDb Session
 * 10. Send Email Notification.
 */

async function createTransaction(req, res) {
    /**
     * 1. Validate Request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "all fields are required"
        });
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    }).populate("user");

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "invalid account id"
        });
    }

    /**
     * 2. Validate Idempotency key
     */
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already Processed",
                transaction: isTransactionAlreadyExists
            });
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is pending"
            });
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction already failed",
                transaction: isTransactionAlreadyExists
            });
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed"
            });
        }
    }

    /**
     * 3. Check account status
     */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be active to process Transaction"
        });
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance . Current Balance is ${balance} and required amount is ${amount}`
        });
    }

    /**
     * 5. Create transaction with MongoDB Session (Steps 5-9)
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [transaction] = await transactionModel.create(
            [
                {
                    fromAccount,
                    toAccount,
                    amount,
                    idempotencyKey,
                    status: "PENDING"
                }
            ],
            { session }
        );

        await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "DEBIT"
                }
            ],
            { session }
        );

        await(() =>{
            return new Promise((resolve) => setTimeout(resolve , 100*1000));
        })()

        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "CREDIT"
                }
            ],
            { session }
        );

        await transactionModel.findOneAndUpdate(
            {_id : transaction._id},
            {status : "COMPLETED"},
            {session}
        )

        await session.commitTransaction();
        session.endSession();

        /**
         * 10. Send Email Notification (non-blocking)
         */
        if (fromUserAccount.user?.email) {
            emailService.sendTransactionEmail(
                fromUserAccount.user.email,
                fromUserAccount.user.name || "Customer",
                amount,
                toAccount
            ).catch(err => {
                console.error("Background Email Error:", err.message);
            });
        }

        return res.status(201).json({
            message: "Transaction Completed Successfully",
            transaction: transaction
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        });
    }
}

async function createInitialFundsTransaction(req,res){
    const {toAccount , amount , idempotencyKey} = req.body ;

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"all fields are required"
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id : toAccount
    })

    if(!toUserAccount){
        return res.status(400).json({
            message:"invalid account id"
        });
    }

    if(toUserAccount.status != "ACTIVE"){
        return res.status(400).json({
            message:"Account is not active"
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [transaction] = await transactionModel.create(
            [
                {
                    fromAccount: null,
                    toAccount,
                    amount,
                    idempotencyKey,
                    status: "PENDING"
                }
            ],
            { session }
        );

        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "CREDIT"
                }
            ],
            { session }
        );

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial Funds Added Successfully",
            transaction: transaction
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: error.message
        });
    }
}

async function getTransactionHistory(req, res) {
    try {
        const { accountId } = req.params;

        const transactions = await transactionModel.find({
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).sort({ createdAt: -1 });

        const ledgerEntries = await ledgerModel.find({
            account: accountId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            accountId,
            transactions,
            ledgerEntries
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch transaction history",
            error: error.message
        });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistory
};


