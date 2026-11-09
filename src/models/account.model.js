const mongoose = require('mongoose') ;

const accountSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Account must be associated with a user "],
        index : true 
    },
    status:{
        type : String ,
        enum:{
            values : ["ACTIVE","FROZEN","CLOSED"],
            message : "Status can either be ACTIVE , FROZEN or CLOSED"
        },
        default : "ACTIVE"
    },
    currency : {
        type : String ,
        required : [true , "Currency is required to create a account " ],
        default :"INR"
    }
},{
    timestamps: true 
})

accountSchema.index({user : 1 , statusbar : 1})

const accountModel = mongoose.model("account",accountSchema) ;

module.exports = accountModel ;