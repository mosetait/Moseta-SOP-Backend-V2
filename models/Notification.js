const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    alert:{
        type:String,
        required: true
    }

}, {timestamps:true});

module.exports = mongoose.model("Notifications" , notificationSchema);