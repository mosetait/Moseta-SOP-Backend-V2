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
exports.BalanceTransferAdmin = asyncHandler( async (req,res) => {


        const {stockistId , totalAmount , documentNo , date , transferMedium} = req.body;


        // Validation
        if(!totalAmount || !documentNo || !stockistId || !date){
            return res.status(401).json({
                success: false,
                meessage: "Please enter amount , document number and stockist id."
            })
        }

        if(!req.files){
            return res.status(401).json({
                success: false,
                meessage: "Please upload Balance Transfer proof."
            })
        }


        const proof = req?.files?.file;


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
                message: 'Error while saving proof.',
                success: false
            });
        }

        const balanceAtTheTime = Number(stockist?.balance) - Number(totalAmount)

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
            },
            transactionStatus: "approved",
            transferMedium,
            date,
            balanceAtTheTime
        }

        // creating a transaction
        const newTransaction = await Transaction.create(transactionObj);


        //update stockist balance
        stockist.balance = Number(stockist.balance) - Number(totalAmount); 


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
exports.stockTransferAdmin = asyncHandler(async (req, res) => {
 
    // Convert the flat request body structure to a nested one
    const nestedBody = convertToNestedObject(req.body);

    const { 
        totalAmount,  
        totalAmountBeforeDiscount,
        documentNo, 
        products,
        stockistId,
        date,
        installationCharges,
        transportationCharges
    } = nestedBody;


    // Validation
    if (!totalAmount || !documentNo || !stockistId || !date || !totalAmountBeforeDiscount) {
        return res.status(401).json({
            success: false,
            message: "Please fill required fields."
        });
    }

    if (!req.files) {
        return res.status(401).json({
            success: false,
            message: "Please upload Stock Transfer proof."
        });
    }

    const proof = req?.files?.file;

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
            message: "Admin not found please login again"
        });
    }

    // Save the file to the server
    const fileName = `balance_transfer_proof_${Date.now()}_${proof.name}`;
    const uploadPath = `uploads/${fileName}`;

    try{
        proof.mv(uploadPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error while saving file to server."
                });
            }
        });
    }
    catch(error){
        return res.status(500).json({
            message: "Error While Saving Proof",
            success: false
        })
    }

    // Creating transaction object
    const transactionObj = {
        type: "ST",
        debitFor: "admin",
        creditFor: "stockist",
        totalAmount,
        totalAmountBeforeDiscount,
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
        installationCharges: installationCharges ? installationCharges : 0 ,
        transportationCharges : transportationCharges ? transportationCharges : 0,
        balanceAtTheTime : stockist?.balance
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
                    // Update quantity if product exists
                    existingProduct.quantity = Number(existingProduct.quantity) + Number(newProduct.quantity);
                } else {
                    // Add new product if it doesn't exist
                    existingCategory.products.push(newProduct);
                }
            });
        } else {
            // Add new category with products if category doesn't exist
            stockist.stock.push({
                category: newCategory.category,
                products: newCategory.products
            });
        }
    });

    await stockist.save();
    await newTransaction.save();

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
                await addTransactionToAdmin(admin, stockist._id, transaction._id, session);

                if (transaction.type === "CT") {
                    client.transactions.push(transaction._id);
                    await client.save({ session });
                }

                if (transaction.type === "BL") {
                    stockist.balance = Number(stockist.balance) + Number(transaction.totalAmount);
                }

                await transaction.updateOne({ transactionStatus: "approved" }, { session });
                await stockist.save({ session });
                await transaction.save({ session });
            } 
            else if (transaction.type === "ST") {

                let totalProfit = 0;
                const products = transaction.productDistribution;
                let priceAfterDiscountToMinusFromTheStockistBalance = 0;

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

                        const gstFactor = Number(100) / (Number(100) + Number(product.gst.$numberDecimal));
                        const baseAmount1 = (priceAfterDiscount * gstFactor);
                        const baseAmount2 = (baseAmount1 / 1.11);
                        const profit = (baseAmount1 - baseAmount2);
                        totalProfit += profit * quantity;
                        priceAfterDiscountToMinusFromTheStockistBalance += Number(stockItem.priceAfterDiscount) * quantity;

                        // Update stock quantity
                        stockItem.quantity -= quantity;
                    }
                }

                await addTransactionToAdmin(admin, stockist._id, transaction._id, session);
                const existingProfit = stockist.profitThisMonth ? stockist.profitThisMonth.toString() : "0";
                const updatedProfit = Number(existingProfit) + Number(totalProfit);
                stockist.profitThisMonth = updatedProfit;

                stockist.balance = Number(stockist.balance) - priceAfterDiscountToMinusFromTheStockistBalance;

                await stockist.save({ session });
                client.transactions.push(transaction._id);
                await client.save({ session });
                await transaction.updateOne({ transactionStatus: "approved" }, { session });
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
    } catch (error) {
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

const addTransactionToAdmin = async (admin, stockistId, transactionId, session) => {
    admin.transactions.push({ stockist: stockistId, transaction: transactionId });
    await admin.save({ session });
};

const findAndUpdateStockForCategory = async (stockist, category, categoryProducts) => {
    const stockCategory = stockist.stock.find(item => item.category.equals(category));
    if (!stockCategory) {
        throw new Error(`Category ${category} not found in stockist's stock`);
    }

    for (const { product, quantity } of categoryProducts) {
        const stockItem = stockCategory.products.find(item => item.product.equals(product));
        if (stockItem) {
            stockItem.quantity -= quantity;
        } else {
            throw new Error(`Product ${product} not found in category ${category} of stockist's stock`);
        }
    }
};
