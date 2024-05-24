const Stockist = require("../../models/Stockist");
const Admin = require("../../models/Admin");
const Profile = require("../../models/Profile");
const Transaction = require("../../models/Transaction");
const {uploadImageToCloudinary} = require("../../utils/imageUploader");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose")
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const mailSender = require("../../utils/mailSender");
const fs = require('fs');
const path = require('path');
const Client = require("../../models/Client");
const asyncHandler = require("../../middleware/asyncHandler")









// Commit a BL transaction with admin
exports.BalanceTransferStk = asyncHandler( async (req,res) => {

        const { amount, documentNo } = req.body;

        // Validation
        if (!amount || !documentNo) {
            return res.status(401).json({
                success: false,
                message: "Please enter amount and document number."
            });
        }

        if (!req.files || !req.files.proof) {
            return res.status(401).json({
                success: false,
                message: "Please upload Balance Transfer proof."
            });
        }

        const { proof } = req.files;

        const stockist = await Stockist.findOne({ _id: req.user.id }).populate({ path: "profile" });

        if (!stockist) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again."
            });
        }

        const admin = await Admin.findOne({ _id: stockist.admin });

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found please contact us.",
                success: false
            });
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
            debitFor: "stockist",
            creditFor: "admin",
            amount,
            stockist: stockist._id,
            admin: admin._id,
            sender: "stockist",
            receiver: "admin",
            documentNo,
            file: {
                name: fileName,
                path: uploadPath
            }
        };

        // creating a transaction
        const newTransaction = await Transaction.create(transactionObj);

        // add transaction to admin
        const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(req.user.id));
        if (existingEntry) {
            existingEntry.transactions.push(newTransaction._id);
        } else {
            admin.transactions.push({
                stockist: req.user.id,
                transactions: [newTransaction._id]
            });
        }
        await admin.save();

        // add transaction to stockist
        stockist.transactions.push(newTransaction._id);
        await stockist.save();

        // Send email with the attached PDF (or any file)
        await mailSender(
            process.env.MAIL_USER,
            `NEW Balance Transfer Transaction`,
            `
                Name: ${stockist.profile.name}
                State: ${stockist.profile.address}
            `,
            proof
        );

        return res.status(200).json({
            success: true,
            message: "Transaction committed",
            newTransaction
        });

});









// commit a CT transaction
exports.clientTransferStk = asyncHandler( async (req,res) => {

        const {amount , documentNo} = req.body;


        // Validation
        if(!amount || !documentNo){
            return res.status(401).json({
                success: false,
                meessage: "Please enter amount and document number"
            })
        }

        if(!req.files){
            return res.status(401).json({
                success: false,
                meessage: "Please upload Balance Transfer proof."
            })
        }

        const {proof} = req.files;


        const stockist = await Stockist.findOne({_id: req.user.id}).populate({path: "profile"});

        if(!stockist){
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again."
            })
        }

        const admin = await Admin.findOne({_id: stockist.admin});

        if(!admin){
            return res.status(404).json({
                message : "Admin not found please contact Moseta",
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
            type: "CT",
            debitFor: "admin",
            creditFor: "stockist",
            amount,
            stockist: stockist._id,
            admin: admin._id,
            sender: "stockist",
            receiver: "admin",
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
        const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(req.user.id));

        if (existingEntry) {
            // If an entry already exists, push the new transaction to its transactions array
            existingEntry.transactions.push(newTransaction._id);
        } else {
            // If no entry exists, create a new entry
            admin.transactions.push({
                stockist: req.user.id,
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
            `NEW Client Transfer Receipt Transaction`,

            `
                Name: ${stockist.profile.name}
                State: ${stockist.profile.address}
            `, 
            proof
        );

        return res.status(200).json({
            success: true,
            message: "Transaction committed",
            newTransaction
        })
    

})









// !-- commit a ST transaction , inlcude client in st transaction
exports.stockTransferStk = asyncHandler(async (req, res) => {

    const { totalAmount, documentNo, clientId , installationCharges , transportationCharges} = req.body;

    const products = [
        {
            category: "66447f4b51b83411ed21cabd",
            products: [
                {
                    product: "6644ad9db1d1ce7a7d17c94d",
                    quantity: 1
                },
                {
                    product: "6644adcab1d1ce7a7d17c953",
                    quantity: 1
                },
            ],

        },
        {
            category: "66447f6d51b83411ed21cac1",
            products: [
                {
                    product: "6644af29b1d1ce7a7d17c95a",
                    quantity: 1
                }
            ],

        }
    ];


    // Validation
    if (!totalAmount || !documentNo || !clientId) {
        return res.status(401).json({
            success: false,
            message: "Please fill all mandatory details"
        })
    }

    if (!req.files) {
        return res.status(401).json({
            success: false,
            message: "Please upload Balance Transfer proof."
        })
    }

    const { proof } = req.files;


    const stockist = await Stockist.findOne({ _id: req.user.id }).populate({ path: "profile" });

    if (!stockist) {
        return res.status(401).json({
            success: false,
            message: "User not found. Please login again."
        })
    }

    const admin = await Admin.findOne({ _id: stockist.admin });

    if (!admin) {
        return res.status(404).json({
            message: "Admin not found please contact Moseta",
            success: false
        })
    }

    const client = await Client.findOne({_id: clientId});

    if (!client) {
        return res.status(404).json({
            message: "Client not found.",
            success: false
        })
    }


    // check if this client belongs to the stockist
    if(!stockist.clients.includes(client._id)){
        return res.status(401).json({
            message: "Client not belongs to you.",
            success: false
        })
    }

    // ----------------------------------- Calculating profit -------------------------------------
    const baseAmount1 = Math.floor(totalAmount * (100 / 112));  //amount without tax
    const baseAmount2 = Math.floor(baseAmount1 / 1.11);
    const finalProfit = Math.floor(baseAmount1 - baseAmount2);


    // Remove items from stockist's stock
    for (const productCategory of products) {

        const { category, products } = productCategory;
        const stockItem = stockist.stock.find(item => String(item.category) === category);

        if (!stockItem) {
            return res.status(400).json({
                success: false,
                message: `No stock found for category ${category}`
            });
        }

        for (const { product, quantity } of products) {
            const productIndex = stockItem.products.findIndex(p => String(p.product) === product);
            if (productIndex !== -1) {
                const currentQuantity = stockItem.products[productIndex].quantity;
                if (currentQuantity < quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient quantity for product ${product}`
                    });
                }
                stockItem.products[productIndex].quantity -= quantity;
                if (stockItem.products[productIndex].quantity < 0) {
                    // If quantity goes below 0, set it to 0
                    stockItem.products[productIndex].quantity = 0;
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Product ${product} not found in stock`
                });
            }
        }
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
        debitFor: "stockist",
        creditFor: "admin",
        totalAmount,
        stockist: stockist._id,
        admin: admin._id,
        client: client._id,
        sender: "stockist",
        receiver: "client",
        documentNo,
        file: {
            name: fileName,
            path: uploadPath
        },
        productDistribution: products,
        installationCharges,
        transportationCharges
    }


    // creating a transaction
    const newTransaction = await Transaction.create(transactionObj);


    // Add transaction to admin

    // Find if there's an existing entry for the current stockist
    const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(req.user.id));

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



    // Add transaction to stockist
    stockist.transactions.push(newTransaction._id);
    stockist.profitThisMonth += finalProfit;
    await stockist.save();



    // push transaction in client
    client.transactions.push(newTransaction._id);
    await client.save();


    // Send email with the attached PDF (or any file)
    await mailSender(
        process.env.MAIL_USER,
        `NEW Client Transfer Receipt Transaction`,

        `
            Name: ${stockist.profile.name}
            State: ${stockist.profile.address}
        `,
        proof
    );

    return res.status(200).json({
        success: true,
        message: "Transaction committed",
        newTransaction
    })


})














