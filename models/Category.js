const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
    },

    products: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },

    gst: {
        type: Number,
        required: true,
    }


}, {timestamps:true});

module.exports = mongoose.model("Category" , categorySchema);