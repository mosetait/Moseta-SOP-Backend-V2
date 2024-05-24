const mongoose = require("mongoose");

const stockItemSchema = new mongoose.Schema({

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
        }
    }]
});

const stockistSchema = new mongoose.Schema({
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
    transactions: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Transaction"
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile"
    },

    admin: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Admin"
    },

    clients: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Client"
    },

    special: {
        type: Boolean,
        required: true,
        default: false
    },

    expectedProfit: {
        type: Number,
        default: 60000
    },

    profitThisMonth: {
        type: Number,
        default: 0
    },

    monthlyProfit: [{
        month: { type: String },
        profit: { type: Number }
    }],

    notifications: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Notification"
    },

    accountType: {
        type: String,
        required: true,
        default: "stockist"
    },
    
    profileSetup: {
        type: Boolean,
        required: true,
        default: false
    },
    
    stock: [stockItemSchema] // Array of objects containing product and quantity
}, 
{
    timestamps: true // Automatically add createdAt and updatedAt fields
});


// Index on the username field for faster querying
stockistSchema.index({ username: 1 });

module.exports = mongoose.model("Stockist", stockistSchema);
