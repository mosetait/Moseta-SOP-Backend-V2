const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    image:{
        type: Object
    },
    
    gstNo: {
        type: String,
        required: true,
        unique: true  
    },

    address : {
        type: String,
        required: true
    },

    tradeName: {
        type: String,
        required: true
    },

    contactNo : {
        type: Number,
        required: true
    },

    stockist:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stockist"
    }

} , {timestamps: true})

module.exports = mongoose.model("Profile" , profileSchema);