const mongoose = require('mongoose') ;

const transactionSchema = new mongoose.Schema({

    fromAccount  :{
        type     : mongoose.Schema.Types.ObjectId,
        ref      : "account" ,
        required : false ,
        index    : true 
    },

    toAccount    : {
        type     : mongoose.Schema.Types.ObjectId,
        ref      : "account" ,
        required : [true, "Transaction must be associated with a to account "],
        index    : true 
    },
    status :{
        type : String ,
        enum :{
            values : ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message : "Status can either be PENDING , COMPLETED , FAILED OR REVERSED "
        },
        default : "PENDING" ,
    },
    amount : {
        type : Number ,
        required : [true , " Amount is required for creating a transaction"] ,
        min : [0,"Transaction ammount cannot be negative "] 
    },
    idempotencyKey:{
        type : String , 
        required : [true , " Idempotency key is required for creating a transaction"],
        index : true ,
        unique : true 
    }
},{
    timestamps : true 
})

const transactionModel = mongoose.model("transaction",transactionSchema) ;


module.exports = transactionModel