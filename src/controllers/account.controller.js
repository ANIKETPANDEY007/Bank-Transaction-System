const accountModel = require("../models/account.model");

async function createAccountController(req, res) {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized: User not found in request."
            });
        }

        const account = await accountModel.create({
            user: user._id
        });

        return res.status(201).json({
            account
        });
    } catch (error) {
        console.error("Create Account Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to create account"
        });
    }
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({}).populate("user", "name email");
        return res.status(200).json({
            accounts
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to fetch accounts"
        });
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;
        const account = await accountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        const balance = await account.getBalance();
        return res.status(200).json({
            accountId: account._id,
            balance,
            currency: account.currency,
            status: account.status
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to fetch balance"
        });
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};


