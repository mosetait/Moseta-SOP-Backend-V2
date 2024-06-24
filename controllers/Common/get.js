const asyncHandler = require("../../middleware/asyncHandler");
const Category = require("../../models/Category");
const Product = require("../../models/Product");
const Transaction = require("../../models/Transaction");
const RejectedTransaction = require("../../models/RejectedTransactions");
const Stockist = require("../../models/Stockist");
const fs = require('fs');
const path = require('path');
const moment = require('moment'); // Using moment.js for date manipulation
const mongoose = require("mongoose")




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









// monthly transactions
exports.getTransactionsByMonth = async (req, res) => {
    try {
        // Extract the month and stockistId parameters from the request
        const { month, stockistId } = req.body;

        // Validate the month parameter
        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ message: 'Invalid month parameter' });
        }

        // Validate the stockistId parameter
        if (!stockistId) {
            return res.status(400).json({ message: 'Stockist ID is required' });
        }

        // Get the current year and previous month
        const currentYear = moment().year();
        const currentMonth = moment().month(); // moment months are zero-indexed
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1; // Adjust for January case

        // Calculate the start and end dates for the specified month
        const startDate = moment({ year: currentYear, month: month - 1, day: 1 }).startOf('day').toDate(); // month is zero-indexed in moment
        const endDate = moment(startDate).endOf('month').toDate();

        // Calculate the start and end dates for the previous month
        const prevMonthStartDate = moment({ year: currentYear, month: previousMonth, day: 1 }).startOf('day').toDate();
        const prevMonthEndDate = moment(prevMonthStartDate).endOf('month').toDate();

        // Find the last transaction of the previous month
        const lastTransactionPrevMonth = await Transaction.findOne({
            stockist: stockistId,
            date: {
                $lt: startDate // Find transactions before the start of the current month
            }
        }).sort({ date: -1 }).limit(1);

        // Fetch transactions within the date range for the specified month, excluding type "CT"
        // Also fetch "ST" transactions where sender is "stockist"
        const transactions = await Transaction.find({
            stockist: stockistId,
            $or: [
                { type: { $ne: "CT" } }, // Exclude transactions where type is "CT"
                { type: "ST", sender: "stockist" } // Include "ST" transactions where sender is "stockist"
            ],
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        
        // Return the last transaction of the previous month and the filtered transactions
        return res.status(200).json({
            lastTransactionPrevMonth,
            transactions
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};






