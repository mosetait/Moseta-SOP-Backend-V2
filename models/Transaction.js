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
        type: Number
    },

    installationCharges: {
        type: Number
    },



    productDistribution:{
        type: Array
    },

    totalAmount: {
        type: Number,
        required: true
    }
    
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);










