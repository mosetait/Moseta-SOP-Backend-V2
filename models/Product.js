const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name : {
        type: String,
        required: true
    },

    distributorPriceWithoutGst : {
        type: Number,
        required: true
    },

    retailerPriceWithoutGst : {
        type: Number,
        required: true
    },

    customerPriceWithoutGst : {
        type: Number,
        required: true
    },

    mcpWithoutGst: {
        type: Number,
        required: true
    },

    distributorPriceWithGst : {
        type: Number,
        required: true
    },

    retailerPriceWithGst : {
        type: Number,
        required: true
    },

    customerPriceWithGst : {
        type: Number,
        required: true
    },

    mcpWithGst: {
        type: Number,
        required: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }


}, {timestamps:true});

module.exports = mongoose.model("Product" , productSchema);