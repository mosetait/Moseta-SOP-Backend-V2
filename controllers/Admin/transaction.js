const Stockist = require("../../models/Stockist");
const Admin = require("../../models/Admin");
const Transaction = require("../../models/Transaction");
const mailSender = require("../../utils/mailSender");
const asyncHandler = require("../../middleware/asyncHandler");
const RejectedTransactions = require("../../models/RejectedTransactions");
const Client = require("../../models/Client")




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
            },
            transactionStatus: "approved",
            transferMedium,
            date
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
    proof.mv(uploadPath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Error while saving file to server."
            });
        }
    });

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
        installationCharges,
        transportationCharges
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












// approve a transaction
exports.confirmTransaction = asyncHandler(async (req, res) => {

    const { transactionId, transactionStatus, rejectionReason } = req.body;

    if (!transactionId) {
        return res.status(401).json({
            success: false,
            message: "Please provide transaction id."
        });
    }

    // find transaction
    const transaction = await Transaction.findById(transactionId)
    .populate('admin')
    .populate('stockist')
    .populate('client');
    


    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: "Transaction not found."
        });
    }

    // find stockist
    const stockist = await Stockist.findById(transaction.stockist);

    if (!stockist) {
        return res.status(404).json({
            message: "Stockist not found",
            success: false
        });
    }

    const admin = await Admin.findById({_id: stockist.admin});

    if (!admin) {
        return res.status(404).json({
            message: "Admin not found",
            success: false
        });
    }

    let client;
    // find client
    if(transaction.type == "CT" || transaction.type == "ST"){

        client = await Client.findById({_id: transaction.client._id});

        if(!client) {
            return res.status(404).json({
                message: "Client not found.",
                success: false
            })
        }
    }
    

    // if transaction approved
    if(transactionStatus == "approved"){

        // check transaction type
        if(transaction.type == "BL" || transaction.type == "CT"){
  
            await transaction.updateOne({transactionStatus: "approved"});

            // add transaction to admin
            const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockist._id));
            if (existingEntry) {
                existingEntry.transactions.push(transaction._id);
            } else {
                admin.transactions.push({
                    stockist: req.user.id,
                    transactions: [transaction._id]
                });
            }

            if(transaction.type === "CT"){
                // Push transaction to client
                client.transactions.push(transaction._id);
                await client.save();
            }

            await admin.save();
            await transaction.save();
        }


        else if(transaction.type = "ST"){

   
            // Calculate profit
            const baseAmount1 = Math.floor(transaction.totalAmount * (100 / 112));  // Amount without tax
            const baseAmount2 = Math.floor(baseAmount1 / 1.11);
            const finalProfit = Math.floor(baseAmount1 - baseAmount2);


            const products = transaction.productDistribution;



            // Remove items from stockist's stock
            for (const productCategory of products) {

                
            const { category, products: categoryProducts } = productCategory;
                
            const stockItem = stockist.stock.find(item => String(item.category) === String(category));
                
            if (!stockItem) {
                return res.status(400).json({
                success: false,
                message: `No stock found for category ${category}`
                });
            }
        
            for (const { product, quantity } of categoryProducts) {
                
                const productIndex = stockItem.products.findIndex(p => String(p.product) === product._id);


                if (productIndex !== -1) {

                    const currentQuantity = stockItem.products[productIndex].quantity;

                    if (currentQuantity < quantity) {
                        return res.status(400).json({
                        success: false,
                        message: `Insufficient quantity for product ${product}`
                        });
                    }

                    stockItem.products[productIndex].quantity = stockItem.products[productIndex].quantity - quantity;
                    
                    if (stockItem.products[productIndex].quantity < 0) {
                        stockItem.products[productIndex].quantity = 0;
                    }

                } 
                else {
                    return res.status(400).json({
                        success: false,
                        message: `Product ${String(product?.product?.name)} not found in stock`
                    });
                }
            }
            }



            // add transaction to admin
            const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(stockist._id));
            if (existingEntry) {
                existingEntry.transactions.push(transaction._id);
            } else {
                admin.transactions.push({
                    stockist: req.user.id,
                    transactions: [transaction._id]
                });
            }

            // calculate profit of stockist
            const profit = stockist.profitThisMonth + finalProfit;
            await stockist.updateOne({profitThisMonth : profit});

            // Push transaction to client
            client.transactions.push(transaction._id);

            await client.save();
            await stockist.save();
            await admin.save();

            await transaction.updateOne({transactionStatus: "approved"});

        }

    }


    // if transaction rejected
    if(transactionStatus == "rejected") {

        const rejectTransaction = {
            type: transaction?.type,
            debitFor: transaction?.debitFor,
            creditFor: transaction?.creditFor,
            totalAmount: transaction?.totalAmount,
            stockist: transaction?.stockist?._id,
            admin: transaction?.admin?._id,
            client: transaction?.client?._id,
            sender: transaction?.sender,
            receiver: transaction?.receiver,
            documentNo: transaction?.documentNo,
            file: {
              name: transaction?.file?.name,
              path: transaction?.file?.path
            },
            productDistribution: transaction?.productDistribution,
            installationCharges: transaction?.installationCharges || "",
            transportationCharges : transaction?.transportationCharges || "",
            rejectionReason: rejectionReason
        }

        // create new rejected transaction
        const newRejectedTransaction = await RejectedTransactions.create(rejectTransaction);

        // push that transaction in stockist's rejected transactions array
        stockist.rejectedTransactions.push(newRejectedTransaction._id);

        // remove transaction from stockist's transaction array
        await Stockist.updateOne(
            { _id: stockist._id },
            { $pull: { transactions: transaction._id } }
          );
          
        await stockist.save();

        // delete transaction
        await Transaction.findByIdAndDelete(transaction._id);

    }

    return res.status(200).json({
        message: `Transaction ${transactionStatus}`,
        success: true
    });
});




