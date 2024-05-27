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
exports.stockTransferAdmin = asyncHandler(async (req, res) => {

    // Convert the flat request body structure to a nested one
    const nestedBody = convertToNestedObject(req.body);

    const { 
        totalAmount, 
        documentNo, 
        products,
        stockistId
    } = nestedBody;

    // Validation
    if (!totalAmount || !documentNo || !stockistId) {
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
        productDistribution: products
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
