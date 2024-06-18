const mongoose = require("mongoose");

const rejectedTransactionSchema = new mongoose.Schema({

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

    transactionStatus: {
        type: String,
        default: "rejected",
        required: true
    },

    rejectionReason : {
        type: String,
        required: true
    },
    
    
}, { timestamps: true });

// TTL index to automatically delete documents after 7 days
rejectedTransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model("RejectedTransaction", rejectedTransactionSchema);











