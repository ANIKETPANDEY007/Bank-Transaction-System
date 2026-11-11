require("dotenv").config();
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

function extractToken(req) {
    if (req.cookies?.systemToken) return req.cookies.systemToken;
    if (req.cookies?.token) return req.cookies.token;

    const authHeader = req.headers?.authorization;
    if (!authHeader) return null;

    if (authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    return authHeader;
}

async function authMiddleware(req, res, next) {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access , token is missing"
        });
    }
    const isBlackListed = await tokenBlacklistModel.findOne({ token });

    if (isBlackListed) {
        return res.status(401).json({
            message: "Unauthorized access , token is invalid"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access , user not found"
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        return res.status(401).json({
            message: "Unauthorized access , token is invalid"
        });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access , token is missing"
        });
    }

    const isBlackListed = await tokenBlacklistModel.findOne({ token });

    if (isBlackListed) {
        return res.status(401).json({
            message: "Unauthorized access , token is invalid"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId).select("+systemUserId +systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access , user not found"
            });
        }

        const isSystemUser = Boolean(user.systemUser || user.systemUserId);

        if (!isSystemUser) {
            return res.status(403).json({
                message: "Forbidden access , not a system user"
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        console.error("Auth System User Error:", err.message);
        return res.status(401).json({
            message: "Unauthorized access , token is invalid"
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};

