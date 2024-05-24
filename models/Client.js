const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({

    name : {
        type: String,
        required: true,
    },

    address : {
        type: String,
        required: true, 
    },

    contact: {
        type: Number,
        required: true,   
    },

    type: {
        type: String,
        enum: ["distributor" , "store" , "customer"],
        required: true
    },

    stockist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stockist"
    },

    transactions: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Transaction"
    },

}, {timestamps:true});

module.exports = mongoose.model("Client" , clientSchema);