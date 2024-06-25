const Stockist = require("../../models/Stockist");
const Admin = require("../../models/Admin");
const Transaction = require("../../models/Transaction");
const mailSender = require("../../utils/mailSender");
const asyncHandler = require("../../middleware/asyncHandler");
const RejectedTransactions = require("../../models/RejectedTransactions");
const Client = require("../../models/Client")
const mongoose = require("mongoose")
const Decimal128 = mongoose.Types.Decimal128;


// Commit a BL transaction
exports.BalanceTransferAdmin = asyncHandler(async (req, res) => {

    const { stockistId, totalAmount, documentNo, date, transferMedium } = req.body;

    // Validation
    if (!totalAmount || !documentNo || !stockistId || !date) {
        return res.status(401).json({
            success: false,
            message: "Please enter amount, document number, and stockist ID."
        });
    }

    if (!req.files || !req.files.file) {
        return res.status(401).json({
            success: false,
            message: "Please upload Balance Transfer proof."
        });
    }

    const proof = req.files.file;

    const stockist = await Stockist.findOne({ _id: stockistId }).populate({ path: "profile" });
    if (!stockist) {
        return res.status(401).json({
            success: false,
            message: "Stockist not found with this stockist ID."
        });
    }

    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
        return res.status(404).json({
            success: false,
            message: "Admin not found, please login again."
        });
    }

    // Save the file to the server
    const fileName = `balance_transfer_proof_${Date.now()}_${proof.name}`;
    const uploadPath = `uploads/${fileName}`;

    try {
        proof.mv(uploadPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error while saving file to server."
                });
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error while saving proof."
        });
    }

    // Creating transaction object
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
        },
        transactionStatus: "approved",
        transferMedium,
        date,
        balanceAtTheTime: Number(stockist.balance) - Number(totalAmount)
    };

    // Creating a transaction
    const newTransaction = await Transaction.create(transactionObj);

    // Update stockist balance
    stockist.balance = Number(stockist.balance) - Number(totalAmount);

    // Add transaction to admin
    const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockistId));
    if (existingEntry) {
        existingEntry.transactions.push(newTransaction._id);
    } else {
        admin.transactions.push({
            stockist: stockistId,
            transactions: [newTransaction._id]
        });
    }
    await admin.save();

    // Add transaction to stockist
    stockist.transactions.push(newTransaction._id);
    await stockist.save();

    // Send email with the attached proof
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
    });
});







// Commit a ST transaction
exports.stockTransferAdmin = asyncHandler(async (req, res) => {

    // Convert the flat request body structure to a nested one
    const nestedBody = convertToNestedObject(req.body);

    const {
        totalAmount,
        documentNo,
        products,
        stockistId,
        date,
        installationCharges,
        transportationCharges
    } = nestedBody;

    // Validation
    if (!totalAmount || !documentNo || !stockistId || !date) {
        return res.status(401).json({
            success: false,
            message: "Please fill required fields."
        });
    }

    if (!req.files || !req.files.file) {
        return res.status(401).json({
            success: false,
            message: "Please upload Stock Transfer proof."
        });
    }

    const proof = req.files.file;

    const stockist = await Stockist.findOne({ _id: stockistId }).populate({ path: "profile" });
    if (!stockist) {
        return res.status(401).json({
            success: false,
            message: "User not found. Please login again."
        });
    }

    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
        return res.status(404).json({
            success: false,
            message: "Admin not found, please login again."
        });
    }

    // Save the file to the server
    const fileName = `stock_transfer_proof_${Date.now()}_${proof.name}`;
    const uploadPath = `uploads/${fileName}`;

    try {
        proof.mv(uploadPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error while saving file to server."
                });
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error while saving proof."
        });
    }

    // Creating transaction object
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
        productDistribution: products,
        transactionStatus: "approved",
        date,
        installationCharges: installationCharges ? installationCharges : 0,
        transportationCharges: transportationCharges ? transportationCharges : 0,
        balanceAtTheTime: Number(stockist.balance)
    };


    // Creating a transaction
    const newTransaction = await Transaction.create(transactionObj);


    // Add transaction to admin
    const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockistId));
    if (existingEntry) {
        existingEntry.transactions.push(newTransaction._id);
    } else {
        admin.transactions.push({
            stockist: req.user.id,
            transactions: [newTransaction._id]
        });
    }
    await admin.save();


    // Add transaction to stockist
    stockist.transactions.push(newTransaction._id);


    // Update stockist stock
    products.forEach(newCategory => {
        const existingCategory = stockist.stock.find(category => String(category.category._id) === String(newCategory.category));
        if (existingCategory) {
            newCategory.products.forEach(newProduct => {
                const existingProduct = existingCategory.products.find(product => String(product.product._id) === String(newProduct.product._id));
                if (existingProduct) {
                    existingProduct.quantity = Number(existingProduct.quantity) + Number(newProduct.quantity);
                } else {
                    existingCategory.products.push(newProduct);
                }
            });
        } else {
            stockist.stock.push({
                category: newCategory.category,
                products: newCategory.products
            });
        }
    });


    await stockist.save();
    await newTransaction.save();

    // Send email with the attached proof
    await mailSender(
        process.env.MAIL_USER,
        `NEW Client Transfer Receipt Transaction`,
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
    });
});








function convertToNestedObject(data) {
    const result = {};
  
    Object.keys(data).forEach(key => {
      const value = data[key];
      const keys = key.split(/[\[\]]/).filter(k => k); // Split the keys and filter out empty strings
      keys.reduce((acc, k, index) => {
        if (index === keys.length - 1) {
          acc[k] = value; // Set the value at the deepest level
        } else {
          if (!acc[k]) {
            acc[k] = isNaN(keys[index + 1]) ? {} : []; // Create an array or object based on the next key
          }
          return acc[k]; // Return the next level to be processed
        }
      }, result);
    });
  
    return result;
}








// approve a transaction
exports.confirmTransaction = asyncHandler(async (req, res) => {

    const { transactionId, transactionStatus, rejectionReason } = req.body;

    if (!transactionId) {
        return res.status(401).json({
            success: false,
            message: "Please provide transaction id."
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transaction = await Transaction.findById(transactionId)
            .populate('admin')
            .populate('stockist')
            .populate('client')
            .session(session);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        const stockist = await Stockist.findById(transaction.stockist).session(session);
        if (!stockist) {
            return res.status(404).json({
                success: false,
                message: "Stockist not found"
            });
        }

        const admin = await Admin.findById(stockist.admin).session(session);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        let client;
        if (transaction.type === "CT" || transaction.type === "ST") {
            client = await Client.findById(transaction.client._id).session(session);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: "Client not found."
                });
            }
        }

        if (transactionStatus === "approved") {

            if (transaction.type === "BL" || transaction.type === "CT") {

                // Add transaction to admin
                const existingEntry = admin.transactions.find(entry => entry.stockist.toString() == stockist._id.toString());


                if (existingEntry) {
                    existingEntry.transactions.push(transaction._id);
                } else {
                    admin.transactions.push({
                        stockist: transaction.stockist,
                        transactions: [transaction._id]
                    });
                }
                await admin.save({ session });


                if (transaction.type === "CT") {
                    client.transactions.push(transaction._id);
                    await client.save({ session });
                }

                if (transaction.type === "BL") {
                    stockist.balance = (Number(stockist.balance) + Number(transaction.totalAmount)).toFixed(2);
                }

                await transaction.updateOne({ transactionStatus: "approved" , balanceAtTheTime: Number(stockist.balance) }, { session });
                await stockist.save({ session });
                await transaction.save({ session });

            } 

            else if (transaction.type === "ST") {

                let totalProfit = 0;
                let totalBillingAmount = 0;
                const products = transaction.productDistribution;
            
                for (const productCategory of products) {
            
                    const { category, products: categoryProducts } = productCategory;
            
                    for (const { product, quantity, priceAfterDiscount } of categoryProducts) {
            
                        const stockCategory = stockist.stock.find(item => item.category.equals(category));
            
                        if (!stockCategory) {
                            throw new Error(`Category ${category} not found in stockist's stock`);
                        }
            
                        const stockItem = stockCategory.products.find(item => item.product.equals(product._id));
            
                        if (!stockItem) {
                            throw new Error(`Product ${product} not found in category ${category} of stockist's stock`);
                        }
            
                        // Calculating profit and billing amount per product
                        const gstRate = product.gst.$numberDecimal;
                        const amountWithoutTax = priceAfterDiscount * (100 / (100 + Number(gstRate)));
                        const amountWithoutProfit = amountWithoutTax / 1.11;
                        const profit = amountWithoutTax - amountWithoutProfit;
                        const billingAmount = amountWithoutProfit * (1 + (gstRate / 100));
            
                        // Round to 2 decimal places
                        const roundedProfit = (profit * quantity).toFixed(2);
                        const roundedBillingAmount = (billingAmount * quantity).toFixed(2);

                        // Accumulate rounded values
                        totalProfit += Number(roundedProfit);
                        totalBillingAmount += Number(roundedBillingAmount);

            
                        // Update stock quantity
                        stockItem.quantity -= quantity;
                    }
                }
            
                // Add transaction to admin
                const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockist._id));
                if (existingEntry) {
                    existingEntry.transactions.push(transaction._id);
                } else {
                    admin.transactions.push({
                        stockist: transaction.stockist,
                        transactions: [transaction._id]
                    });
                }
                await admin.save({ session });
            
                const existingProfit = stockist.profitThisMonth ? stockist.profitThisMonth.toString() : "0";
                const updatedProfit = Number(existingProfit) + Number(totalProfit);
                stockist.profitThisMonth = updatedProfit.toFixed(2);
            
                // Update stockist balance
                stockist.balance = (Number(stockist.balance) - totalBillingAmount).toFixed(2);
            
                await stockist.save({ session });
                client.transactions.push(transaction._id);
                await client.save({ session });
                console.log(stockist.balance)
                await transaction.updateOne({ transactionStatus: "approved" , totalBillingAmount: totalBillingAmount , balanceAtTheTime: stockist.balance }, { session });
            }
            

        }

        if (transactionStatus === "rejected") {

            const rejectTransaction = {
                type: transaction.type,
                debitFor: transaction.debitFor,
                creditFor: transaction.creditFor,
                totalAmount: transaction.totalAmount,
                stockist: transaction.stockist._id,
                admin: transaction.admin._id,
                client: transaction.client._id,
                sender: transaction.sender,
                receiver: transaction.receiver,
                documentNo: transaction.documentNo,
                file: {
                    name: transaction.file.name,
                    path: transaction.file.path
                },
                productDistribution: transaction.productDistribution,
                installationCharges: transaction.installationCharges || "",
                transportationCharges: transaction.transportationCharges || "",
                rejectionReason: rejectionReason,
                instruction: transaction.instruction ? transaction.instruction : null
            };

            const newRejectedTransaction = await RejectedTransactions.create(rejectTransaction, { session });
            stockist.rejectedTransactions.push(newRejectedTransaction._id);

            await Stockist.updateOne(
                { _id: stockist._id },
                { $pull: { transactions: transaction._id } },
                { session }
            );

            await stockist.save({ session });
            await Transaction.findByIdAndDelete(transaction._id, { session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: `Transaction ${transactionStatus}`
        });
    } 
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed: ", error);
        return res.status(500).json({
            success: false,
            message: "Transaction failed.",
            error: error.message
        });
    }
});



