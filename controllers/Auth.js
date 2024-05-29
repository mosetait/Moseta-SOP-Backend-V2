const Admin = require("../models/Admin");
const Stockist = require("../models/Stockist");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Transaction = require("../models/Transaction");
const Profile = require("../models/Profile");

require("dotenv").config();





// Login - STOCKIST
exports.loginStk = async (req, res) => {

    try {

      const { username, password } = req.body;
      
      if(!username || !password){
        return res.status(401).json({
          message: "Please enter username and password",
          success: false
        })
      }

  
      const user = await Stockist.findOne({ username })
      .select('+password')
      .populate({
        path: 'transactions',
        populate: {
          path: 'client'  // This will populate the client field within each transaction
        }
      })
      .populate({ path: 'profile' })
      .populate({ path: 'clients' })
      .populate({
        path: 'rejectedTransactions',
        populate: {
          path: 'client'  // This will populate the client field within each transaction
        }
      });
    
    
  
      if (!user) {
        return res.status(404).json({
          message: 'Invalid Username or Password',
          success: false,
        });
      }
  
      if (await bcrypt.compare(password, user.password)) {

        const token = jwt.sign(
          {
            username: user.username,
            id: user._id,
            accountType: user.accountType,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: '72h',
          }
        );
  
        user.token = token;
        user.password = undefined;
  
        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true,
          sameSite: 'None', // Adjust based on your application's needs
          secure: true, // Set to true in production if served over HTTPS
        };
  
        res.cookie('token', token, options).status(200).json({
          message: 'Logged in successfully',
          success: true,
          user,
          token
        });

      } 
      else {
        return res.status(401).json({
          success: false,
          message: 'Invalid Username or Password',
        });
      }
    } 
    catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Login failure, please try again',
      });
    }
};






// SignUp - ADMIN
exports.signUpAdmin = async (req , res) => {
    
    try {
      
        // Destructure fields from the request body
        const {
            name,
            username,
            password,
        } = req.body;

        // Check if All Details are there or not
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
        const existingUser = await Admin.findOne({username})

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists. Please sign in to continue.",
            })
        }



        // Hash password
        const hashedPassword = await bcrypt.hash(password , 10);


        const user = await Admin.create({
            name,
            username,
            password: hashedPassword,
        });
        

        return res.status(200).json({
            success: true,
            user,
            message: "Admin registered successfully",
        })
        

    }

    catch (error) {

        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Stockist cannot be registered. Please try again.",
        })
    }

}







// Login - ADMIN
exports.loginAdmin = async (req, res) => {

    try {

      const { username, password } = req.body;

  
      const user = await Admin.findOne({ username })
      .select('+password').populate({path: "stockists"})
      .populate({
        path: 'transactions',
        populate: {
          path: 'client'  // This will populate the client field within each transaction
        }
      });

  
      if (!user) {
        return res.status(404).json({
          message: 'Invalid Username or Password',
          success: false,
        });
      }
  
      if (await bcrypt.compare(password, user.password)) {

        const token = jwt.sign(
          {
            username: user.username,
            id: user._id,
            accountType: user.accountType,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: '72h',
          }
        );
  
        user.token = token;
        user.password = undefined;
  
        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true,
          sameSite: 'None', // Adjust based on your application's needs
          secure: true, // Set to true in production if served over HTTPS
        };
  
        res.cookie('token', token, options).status(200).json({
          message: 'Logged in successfully',
          success: true,
          user,
        });

      } 
      else {
        return res.status(401).json({
          success: false,
          message: 'Invalid Username or Password',
        });
      }
    } 
    catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Login failure, please try again',
      });
    }
};







// Logout
exports.logout = async (req, res) => {
  try {
    let { token } = req.cookies;

    if (token) {
      // Clear the 'token' cookie
      res.clearCookie('token');

      // Remove user from request
      req.user = null;

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'You are already logged out.',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: 'Error while logging out',
      success: false,
    });
  }
};











// Get user info to make him logged in on every page
exports.getUserInfo = async (req, res) => {

  try {

    const { id } = req.user; // Assuming the user ID is stored in the token payload


    if(req.user.accountType === "admin"){

       user = await Admin.findById(id)
      .select('+password').populate({path: "stockists"})
      .populate({
        path: 'transactions',
        populate: {
          path: 'client'  // This will populate the client field within each transaction
        },
      });

    }

    else if (req.user.accountType === "stockist"){

      user = await Stockist.findOne({ _id: id })
      .select('+password')
      .populate({
        path: 'transactions',
        populate: {
          path: 'client'  
        }
      })
      .populate({ path: 'profile' })
      .populate({ path: 'clients' });    
    }

    else{
      return res.status(404).json({
        success:false,
        message: "User not found"
      })
    }

    

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error getting user information',
    });
  }
};

