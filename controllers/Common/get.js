const asyncHandler = require("../../middleware/asyncHandler");
const Category = require("../../models/Category");
const Product = require("../../models/Product");
const Transaction = require("../../models/Transaction");
const RejectedTransaction = require("../../models/RejectedTransactions");
const Stockist = require("../../models/Stockist");
const fs = require('fs');
const path = require('path');





// get all categories
exports.getAllCategories = asyncHandler( async (req,res) => {

    const categories = await Category.find();

    return res.status(200).json({
        success: false,
        message: "Categories Fetched Successfully",
        categories
    })

})



// Get products of a category
exports.getAllProducts = asyncHandler( async (req,res) => {

    const {categoryId} = req.body;

    if(!categoryId){
        return res.status(400).json({
            message : "Please provide category id",
            success: false
        })
    }

    const products = await Product.find({category: categoryId});

    return res.status(200).json({
        message: "Products fetched successfully",
        products,
        success: true
    })

})




// fetch proof
exports.fetchProof = asyncHandler( async (req,res) => {
        
        const { fileName } = req.body;

        if(!fileName){
            return res.status(200).json({
                message: "No proof found",
                success:false
            })
        }

        // Construct the absolute path to the file
        const absolutePath = path.join(__dirname, '../..', 'uploads', fileName);


        // Check if the file exists
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                message: 'File not found',
                success: false
            });
        }

        // Determine the content type based on the file extension
        const contentType = getFileContentType(fileName);

        // Set the appropriate content type for the response
        res.setHeader('Content-Type', contentType);

        // Stream the file directly to the response
        fs.createReadStream(absolutePath).pipe(res);

    }

)





// Function to determine content type based on file extension
function getFileContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
        case '.pdf':
            return 'application/pdf';
        case '.doc':
        case '.docx':
            return 'application/msword';
        case '.xls':
        case '.xlsx':
            return 'application/vnd.ms-excel';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        // Add more cases for other file types if needed
        default:
            return 'application/octet-stream'; // Default to binary data
    }
}





// fetch a transaction
exports.fetchTransaction = asyncHandler( async (req,res) => {

    const {transactionId} = req.body;

    const transaction = await Transaction.findOne({_id: transactionId}).populate({path: "productDistribution.category"});

    if(!transaction){
        return res.status(404).json({
            message:  "Transaction not found",
            success:    false
        })
    }

    // check if the transaction belongs to the stockist
    if(req.user.accountType === "stockist"){
        const stockist = await Stockist.findOne({_id: req.user.id});

        if(!stockist){
            return res.status(404).json({
                message:  "User not found. Please login again",
                success:    false
            })
        }

        if(!stockist.transactions.includes(transactionId)){
            return res.status(404).json({
                message:  "This Transaction does not belongs to you.",
                success:    false
            })
        }
    }

    return res.status(200).json({
        message: "Transaction Fetched Successfully",
        success: true,
        transaction
    })

})






// fetch a rejected transaction
exports.fetchRejectedTransaction = asyncHandler( async (req,res) => {

    const {transactionId} = req.body;

    const transaction = await RejectedTransaction.findOne({_id: transactionId}).populate({path: "productDistribution.category"});

    if(!transaction){
        return res.status(404).json({
            message:  "Transaction not found",
            success:    false
        })
    }

    // check if the transaction belongs to the stockist
    if(req.user.accountType === "stockist"){
        const stockist = await Stockist.findOne({_id: req.user.id});

        if(!stockist){
            return res.status(404).json({
                message:  "User not found. Please login again",
                success:    false
            })
        }

        if(!stockist.rejectedTransactions.includes(transactionId)){
            return res.status(404).json({
                message:  "This Transaction does not belongs to you.",
                success:    false
            })
        }
    }

    return res.status(200).json({
        message: "Transaction Fetched Successfully",
        success: true,
        transaction
    })

})