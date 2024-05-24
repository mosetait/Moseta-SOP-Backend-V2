const asyncHandler = require("../../middleware/asyncHandler");
const Stockist = require("../../models/Stockist");
const Client = require("../../models/Client");


// get stock
exports.getStock = asyncHandler( async (req,res) => {

    const stockistId = req?.user?.id;

    if(!stockistId){
        return res.status(401).json({
            message: "Something went wrong. Please login again.",
            success: false
        })
    }

    const stockist = await Stockist.findById(stockistId)
    .populate({
        path: 'stock',
        populate: {
            path: 'category',
            model: 'Category'
        }
    })
    .populate({
        path: 'stock.products.product',
        model: 'Product'
    })
    .exec();


    if(!stockist){
        return res.status(404).json({
            message: "Stockist not found. Please login again.",
            success: false
        })
    }

    const stock = stockist.stock;

    return res.status(200).json({
        message: "Stock fetched successfully",
        stock
    })

})


// get clients
exports.getClients = asyncHandler( async (req,res) => {

    const clients = await Client.find();

    return res.status(200).json({
        message: "Clients fetched successfully",
        success: true,
        clients
    })

})