const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    type: {
        type: String,
        enum: ["BL" , "ST" , "CT" , "PI"],
        required: true 
    },

    debitFor:{
        type: String,
        enum: ["admin" , "stockist"],
        required: true,
    },

    creditFor: {
        type: String,
        enum: ["admin" , "stockist"],
        required: true,
    },

    sender: {
        type: String,
        enum: ["admin" , "stockist"],
        required: true
    },


    receiver: {
        type: String,
        enum: ["admin" , "stockist" , "client"],
        required: true
    },

    documentNo: {
        type: String,
        required: true
    },

    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin", 
    },

    stockist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stockist", // Reference to the Stockist model
        required: true // Reference to the stockist involved in the transaction
    },

    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client", 
    },


    file: {
        name: {
            type: String,
            required: true 
        },
        path: {
            type: String,
            required: true 
        }
    },

    transportationCharges: {
        type: mongoose.Schema.Types.Decimal128
    },

    installationCharges: {
        type: mongoose.Schema.Types.Decimal128
    },



    productDistribution:[
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category"
            },

            products:{
                type: Array
            }
        }
    ],

    totalAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    balanceAtTheTime: {
        type: mongoose.Schema.Types.Decimal128,
    },

    transactionStatus: {
        type: String,
        enum: ["pending" , "approved" , "rejected"],
        default: "pending",
        required: true
    },

    transferMedium: {
        type: String,
        enum: ["bank" , "cash" , "NEFT" , "RTGS" , "upi"],
        // required: true
    },

    instruction:{
        type: String,
    },

    date: {
        type: Date,
        required: true
    }
    
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);











