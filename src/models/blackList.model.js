const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema({
    token : {
        type : String ,
        required : [true , "Token is required to blackList"] ,
        unique : [true , "Token is already blacklisted"] , 
    },
    blackListedAt:{
        type : Date ,
        default : Date.now() ,
        immutable : true 
    }
},{
    timeStamps : true 
})

tokenBlacklistSchema.index({createdAt : 1},{expireAfterSeconds : 60*60*24*3})

const tokenBlacklistModel = mongoose.model("TokenBlacklist", tokenBlacklistSchema);

module.exports = tokenBlacklistModel;