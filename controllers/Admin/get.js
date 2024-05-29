const Stockist = require("../../models/Stockist");
const Notifications = require("../../models/Notification")
const asyncHandler = require("../../middleware/asyncHandler");
const Category = require("../../models/Category");


// get all stockist info
exports.getAllStockistInfo = asyncHandler( async (req,res) => {

        const stockists = await Stockist.find().populate({path: "transactions"}).populate({path: "profile"});

        return res.status(200).json({
            message: "Stockist fetched successfully",
            success: true,
            stockists
        })  

})





// get a single stockist
exports.getStockistInfo = asyncHandler( async (req,res) => {

        const {id} = req.params;

        if(!id){
            return res.status(401).json({
                message: "Please provide stockist id",
                success: false,
            })
        }

        const stockist = await Stockist.findOne({_id: id})
        .populate({path: "transactions"})
        .populate({path: "profile"})
        .populate({
            path: 'rejectedTransactions',
            populate: {
              path: 'client'  // This will populate the client field within each transaction
            }
        });

        if(!stockist){
            return res.status(404).json({
                message: "Stockist not found",
                success: false,
            })
        }

        return res.status(200).json({
            message: "Stockist fetched successfully",
            success: true,
            stockist
        })

    }    


)





// get all notifications
exports.getAllNotifications = asyncHandler( async (req,res) => {

        const notifications = await Notifications.find();

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            notifications
        })

})





// get stock
exports.getStockAdmin = asyncHandler( async (req,res) => {


    const stock = await Category.find().populate({path: "products"});

    return res.status(200).json({
        message: "Stock fetched successfully",
        stock
    })

})





// get transactions of a single stockist
exports.getTransactions = asyncHandler( async (req,res) => {

    const {stockistId} = req.body;
    
    const stockist = await Stockist.findById({_id: stockistId})
    .populate({
        path: 'transactions',
        populate: {
          path: 'client'  // This will populate the client field within each transaction
        }
    });

    return res.status(200).json({
        message: "Transactions Fetched Successfully.",
        success: true,
        transactions: stockist.transactions
    })
})