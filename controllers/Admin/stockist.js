const Admin = require("../../models/Admin");
const Stockist = require("../../models/Stockist");
const bcrypt = require("bcrypt");
const Transaction = require("../../models/Transaction");
const Profile = require("../../models/Profile");
const asyncHandler = require("../../middleware/asyncHandler");





// SignUp / create - STOCKIST
exports.signUpStk = asyncHandler( async (req,res) => {

      
    // Destructure fields from the request body
    const {
        name,
        username,
        password,
        special,
        expectedProfit,

    } = req.body;

console.log(req.body)

    // Check if All Details are there or not
    if(special){

      if(!expectedProfit){
        return res.status(403).send({
          success: false,
          message: "If the stockist is special then please provide expected profit.",
        })
      }

    }

    if (
        !name ||
        !username ||
        !password 
    ) {
        return res.status(403).send({
        success: false,
        message: "All Fields are required",
        })
    }


    // Check if user already exists
    const existingStk = await Stockist.findOne({username})

    if (existingStk) {
        return res.status(400).json({
            success: false,
            message: "Stockist already exists. Please sign in to continue.",
        })
    }


    // fetch admin details
    const admin = await Admin.findOne({_id: req.user.id});

    if(!admin){
      return res.status(401).json({
        success: false,
        message: "Please login as an admin first"
      })
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password , 10);

    
    const newStk = await Stockist.create({
      name,
      username,
      password: hashedPassword,
      admin: req.user.id,
      special,
      expectedProfit : special ? expectedProfit : null
    });


    // add this stockist in the admin's model
    admin.stockists.push(newStk._id);
    await admin.save();
    
    

    return res.status(200).json({
        success: true,
        newStk,
        message: "Stockist registered successfully",
    })
    

}

)






// deleteStokcist
exports.deleteStockist = asyncHandler( async (req,res) => {

      
    const {id} = req.params;

    if(!id){
      return res.status(401).json({
        success: false,
        message: "Please provide an id."
      })
    }

    const admin = await Admin.findOne({_id: req.user.id});

    if(!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found."
      })
    }


    const stockist = await Stockist.findOne({_id: id});

    if(!stockist) {
      return res.status(404).json({
        success: false,
        message: "Stockist not found."
      })
    }


    // Find the profile associated with the stockist
    const profile = await Profile.findOne({ _id: stockist.profile });

    // If profile found, delete it
    if (profile) {
      await profile.deleteOne();
    }

    // Delete transactions associated with the stockist
    await Transaction.deleteMany({ stockist: id });

    // delete stockist from admin
    admin.stockists = admin.stockists.filter(stockistId => stockistId.toString() !== id);

    admin.transactions = admin.transactions.filter(transaction => transaction.stockist.toString() !== id);

    await admin.save();



    // Delete the stockist
    await stockist.deleteOne();


    return res.status(200).json({
      success: true,
      message: "Stockist deleted successfully"
    })

})


// update stockist 