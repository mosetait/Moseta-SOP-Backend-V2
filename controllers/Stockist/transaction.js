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

        const { totalAmount, documentNo } = req.body;

        // Validation
        if (!totalAmount || !documentNo) {
            return res.status(401).json({
                success: false,
                message: "Please enter amount and document number."
            });
        }

        if (!req.files) {
            return res.status(401).json({
                success: false,
                message: "Please upload Balance Transfer proof."
            });
        }

        const proof  = req?.files?.file;

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
            totalAmount,
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

        const {totalAmount , documentNo , clientId} = req.body;


        // Validation
        if(!totalAmount || !documentNo || !clientId){
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

        const proof = req?.files?.file;


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

        const client = await Client.findOne({_id: clientId});

        if(!client) {
            return res.status(404).json({
                message : "Client not found",
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
            totalAmount,
            stockist: stockist._id,
            admin: admin._id,
            sender: "stockist",
            receiver: "admin",
            documentNo,
            file: {
                name: fileName,
                path: uploadPath
            },
            client: client._id
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

        // Push transaction to client
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









// !-- commit a ST transaction , inlcude client in st transaction
// Commit a ST transaction, include client in st transaction
exports.stockTransferStk = asyncHandler(async (req, res) => {
    // Convert the flat request body structure to a nested one
    const nestedBody = convertToNestedObject(req.body);
  
    const { 
      totalAmount, 
      documentNo, 
      clientId, 
      installationCharges, 
      transportationCharges, 
      products
    } = nestedBody;
  
    // Validation
    if (!totalAmount || !documentNo || !clientId) {
      return res.status(401).json({
        success: false,
        message: "Please fill all mandatory details"
      });
    }
  
    if (!req.files || !req.files.file) {
      return res.status(401).json({
        success: false,
        message: "Please upload Balance Transfer proof."
      });
    }
  
    const proof = req.files.file;
  
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
        message: "Admin not found please contact Moseta",
        success: false
      });
    }
  
    const client = await Client.findOne({ _id: clientId });
  
    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
        success: false
      });
    }
  
    // Check if this client belongs to the stockist
    if (!stockist.clients.includes(client._id)) {
      return res.status(401).json({
        message: "Client does not belong to you.",
        success: false
      });
    }
  
    // Calculate profit
    const baseAmount1 = Math.floor(totalAmount * (100 / 112));  // Amount without tax
    const baseAmount2 = Math.floor(baseAmount1 / 1.11);
    const finalProfit = Math.floor(baseAmount1 - baseAmount2);
  
    // Remove items from stockist's stock
    for (const productCategory of products) {
      const { category, products: categoryProducts } = productCategory;
      const stockItem = stockist.stock.find(item => String(item.category) === category);
        
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
          stockItem.products[productIndex].quantity -= quantity;
          if (stockItem.products[productIndex].quantity < 0) {
            stockItem.products[productIndex].quantity = 0;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: `Product ${String(product)} not found in stock`
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
  
    // Create the transaction object
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
    };

  
    // Create a new transaction
    const newTransaction = await Transaction.create(transactionObj);
  
    // Add transaction to admin
    const existingEntry = admin.transactions.find(entry => String(entry.stockist) === String(req.user.id));
  
    if (existingEntry) {
      existingEntry.transactions.push(newTransaction._id);
    } else {
      admin.transactions.push({
        stockist: req.user.id,
        transactions: [newTransaction._id]
      });
    }
  
    await admin.save(); // Save changes to the admin object
  
    // Add transaction to stockist
    stockist.transactions.push(newTransaction._id);
    stockist.profitThisMonth += finalProfit;
    await stockist.save();
  
    // Push transaction to client
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















