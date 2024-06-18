const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name : {
        type: String,
        required: true
    },

    distributorPriceWithoutGst : {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    retailerPriceWithoutGst : {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    customerPriceWithoutGst : {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    mcpWithoutGst: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    distributorPriceWithGst : {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    retailerPriceWithGst : {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    customerPriceWithGst : {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    mcpWithGst: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }


}, {timestamps:true});

module.exports = mongoose.model("Product" , productSchema);