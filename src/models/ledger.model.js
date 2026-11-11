const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema({
    account : {
        type : mongoose.Schema.ObjectId,
        ref : "account",
        required : [true , " Account is required for creating a ledger entry"],
        index : true ,
        immutable : true 
    },
    amount : {
        type : Number ,
        required : [true , "Amount is required for creating a ledger entry"],
        index : true ,
        immutable : true 
    },
    transaction : {
        type : mongoose.Schema.ObjectId,
        ref : "transaction",
        required : [true , "Transaction is required for creating a ledger entry"],
        index : true ,
        immutable : true 
    },
    type : {
        type : String ,
        enum : {
            values : ["CREDIT", "DEBIT"],
            message : "Ledger Type can be either CREDIT or DEBIT"
        },
        required : [true , "Ledger type is required"],
        index : true ,
        immutable : true 
    }
    
})


function preventLedgerModification(){
    throw new Error("Ledger enteries are immutable and cannot be deleted or modified .") ;
}

ledgerSchema.pre('updateOne' , preventLedgerModification)
ledgerSchema.pre('findOneAndUpdate' , preventLedgerModification)
ledgerSchema.pre('deleteOne' , preventLedgerModification)
ledgerSchema.pre('findAndDelete' , preventLedgerModification)
ledgerSchema.pre('deleteMany' , preventLedgerModification)
ledgerSchema.pre('updateMany' , preventLedgerModification)
ledgerSchema.pre('findOneAndDelete' , preventLedgerModification)
ledgerSchema.pre('findOneAndReplace' , preventLedgerModification)


const ledgerModel = mongoose.model("ledger" , ledgerSchema) ;


module.exports = ledgerModel;