const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    
    transactions: [

        {
            stockist: {
                type: mongoose.Schema.Types.ObjectId,
                ref:"Stockist"
            },

            transactions: {
                    type:[mongoose.Schema.Types.ObjectId],
                    ref:"Transaction"    
            }
        }

    ],

    stockists:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Stockist"
    },

    notifications:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Notification" 
    },

    accountType: {
        type: String,
        required: true,
        default: "admin"
    }
    
}, 
{
    timestamps: true // Automatically add createdAt and updatedAt fields
});


module.exports = mongoose.model("Admin" , adminSchema);
