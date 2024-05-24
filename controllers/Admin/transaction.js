const Stockist = require("../../models/Stockist");
const Admin = require("../../models/Admin");
const Transaction = require("../../models/Transaction");
const mailSender = require("../../utils/mailSender");
const asyncHandler = require("../../middleware/asyncHandler");






// Commit a BL transaction
exports.BalanceTransferAdmin = asyncHandler( async (req,res) => {


        const {stockistId , totalAmount , documentNo} = req.body;


        // Validation
        if(!totalAmount || !documentNo || !stockistId){
            return res.status(401).json({
                success: false,
                meessage: "Please enter amount , document number and stockist id."
            })
        }

        if(!req.files || !req.files.proof){
            return res.status(401).json({
                success: false,
                meessage: "Please upload Balance Transfer proof."
            })
        }


        const {proof} = req.files;


        const stockist = await Stockist.findOne({_id: stockistId}).populate({path: "profile"});

        if(!stockist){
            return res.status(401).json({
                success: false,
                message: "Stockist not found with this stockist id."
            })
        }
        const admin = await Admin.findOne({_id: req.user.id});

        if(!admin){
            return res.status(404).json({
                message : "Admin not found please login again.",
                success: false
            })
        }


        // Save the file to the server
        const fileName = `balance_transfer_proof_${Date.now()}_${proof.name}`;
        const uploadPath = `uploads/${fileName}`;
        proof.mv(uploadPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error while saving file to server."
                });
            }
        });

        // creating transaction variable
        const transactionObj = {
            type: "BL",
            debitFor: "admin",
            creditFor: "stockist",
            totalAmount,
            stockist: stockist._id,
            admin: admin._id,
            sender: "admin",
            receiver: "stockist",
            documentNo,
            file: {
                name: fileName,
                path: uploadPath
            }
        }

        // creating a transaction
        const newTransaction = await Transaction.create(transactionObj);


        // add transaction to admin
        
        // Find if there's an existing entry for the current stockist
        const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockistId));

        if (existingEntry) {
            // If an entry already exists, push the new transaction to its transactions array
            existingEntry.transactions.push(newTransaction._id);
        } else {
            // If no entry exists, create a new entry
            admin.transactions.push({
                stockist: stockistId,
                transactions: [newTransaction._id]
            });
        }

        await admin.save(); // Save the changes to the admin object

        


        // add transaction to stockist
        stockist.transactions.push(newTransaction._id);
        await stockist.save();
        

        // Send email with the attached PDF (or any file)
        await mailSender(
            process.env.MAIL_USER, 
            `NEW Balance Transfer Transaction`,

            `
                Name: ${stockist.name}
                Sender: Admin
                Receiver: Stockist
            `, 
            proof
        );

        return res.status(200).json({
            success: true,
            message: "Transaction committed",
            newTransaction
        })
    }
    

)







// commit a ST transaction
exports.stockTransferAdmin = asyncHandler( async (req,res) => {

        const {totalAmount , documentNo , stockistId } = req.body;

        const newStkItems = [
            {   
                category: "66447f4b51b83411ed21cabd",
                products: [
                    {
                    product: "6644ad4db1d1ce7a7d17c945",
                    quantity: 1
                    },
                    {
                    product: "6644ad9db1d1ce7a7d17c94d",
                    quantity: 2
                    },
                    {
                    product: "6644adcab1d1ce7a7d17c953",
                    quantity: 3
                    },
                ], 

            },
            {   
                category: "66447f6d51b83411ed21cac1",
                products: [
                    {
                    product: "6644af29b1d1ce7a7d17c95a",
                    quantity: 1
                    },
                    {
                    product: "6644af7cb1d1ce7a7d17c960",
                    quantity: 2
                    },
                    {
                    product: "6644afaab1d1ce7a7d17c966",
                    quantity: 3
                    },
                ], 

            }
        ];
        
        // Validation
        if(!totalAmount || !documentNo || !stockistId ){
            return res.status(401).json({
                success: false,
                meessage: "Please fill required fields."
            })
        }

        if(!req.files){
            return res.status(401).json({
                success: false,
                meessage: "Please upload Stock Transfer proof."
            })
        }

        const {proof} = req.files;


        const stockist = await Stockist.findOne({_id: stockistId}).populate({path: "profile"});

        if(!stockist){
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again."
            })
        }

        const admin = await Admin.findOne({_id: req.user.id});

        if(!admin){
            return res.status(404).json({
                message : "Admin not found please login again",
                success: false
            })
        }



        // Save the file to the server
        const fileName = `balance_transfer_proof_${Date.now()}_${proof.name}`;
        const uploadPath = `uploads/${fileName}`;
        proof.mv(uploadPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error while saving file to server."
                });
            }
        });

        // creating transaction variable
        const transactionObj = {
            type: "ST",
            debitFor: "admin",
            creditFor: "stockist",
            totalAmount,
            stockist: stockist._id,
            admin: admin._id,
            sender: "admin",
            receiver: "stockist",
            documentNo,
            file: {
                name: fileName,
                path: uploadPath
            },
            productDistribution: newStkItems
        }


        // creating a transaction
        const newTransaction = await Transaction.create(transactionObj);


        // add transaction to admin

        // Find if there's an existing entry for the current stockist
        const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockistId));

        if (existingEntry) {
            // If an entry already exists, push the new transaction to its transactions array
            existingEntry.transactions.push(newTransaction._id);
        } 
        else {
            // If no entry exists, create a new entry
            admin.transactions.push({
                stockist: req.user.id,
                transactions: [newTransaction._id]
            });
        }

        await admin.save(); // Save the changes to the admin object
        


        // add transaction to stockist
        stockist.transactions.push(newTransaction._id);
        stockist.stock = stockist.stock.concat(newStkItems);
        await stockist.save();
        

        // Send email with the attached PDF (or any file)
        await mailSender(
            process.env.MAIL_USER, 
            `NEW Client Transfer Receipt Transaction`,

            `
                Name: ${stockist.name} \n
                Sender: Admin \n
                Receiver: Stockist \n
            `, 
            proof
        );

        return res.status(200).json({
            success: true,
            message: "Transaction committed",
            newTransaction
        })


})