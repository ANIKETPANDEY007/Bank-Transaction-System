const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlacklistModel = require("../models/blacklist.model");

/** 
* - user register Controller 
* - POST /api/auth/register
*/

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body || {};

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Email, password, and name are required.",
                status: "failed"
            });
        }

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: "failed"
            });
        }

        const user = await userModel.create({
            email,
            password,
            name
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token);

        await emailService.sendRegistrationEmail(user.email, user.name);

        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: "failed"
        });
    }
}

/** 
 * - User Login Controller
 * - POST /api/auth/login
 */ 

async function userLoginController(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                status: "failed"
            });
        }

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const isUser = await user.comparePassword(password);

        if (!isUser) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token);

        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: "failed"
        });
    }
}


/**
 * User Logout Controller
 * POST /api/auth/logout
 */

async function userLogoutController(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "No token found"
            });
        }

        await tokenBlacklistModel.create({
            token
        });

        res.clearCookie("token");

        return res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: "failed"
        });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};
