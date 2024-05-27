const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Stockist = require("../models/Stockist");
const Admin = require("../models/Admin");

dotenv.config();


exports.auth = async (req , res , next) => {

    try {

        const {token} = req.cookies;

        
        if(!token) {
            return res.status(401).json({
                message: "Please Login First",
                success: false
            })
        }

        
        

        // Verifying Token
        try {
            
            const decode = jwt.verify(token , process.env.JWT_SECRET);

            req.user = decode;

        } 
        catch (error) {
            console.log(error)
            return res.status(401).json({ 
                success: false, 
                message: "token is invalid" 
            });

        }

        // If JWT is valid, move on to the next middleware or request handler
		next();

    } 
    catch (error) {
        console.log(error);
        return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
    }

}


// isAdmin
exports.isAdmin = async (req, res, next) => {

	try {

		const userDetails = await Admin.findOne({ username: req.user.username });
        
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message: "Something Went wrong. Please login again."
            })
        }

		if (userDetails.accountType !== "admin") {
			return res.status(401).json({
				success: false,
				message: "This is a Protected Route for Admin",
			});
		}

		next();

	} 
    catch (error) {
        console.log(error)
		return res.status(500).json({ 
            success: false, 
            message: `User Role Can't be Verified` 
        });
	}
};


// isStockist
exports.isStockist = async (req, res, next) => {

	try {

		const userDetails = await Stockist.findOne({ username: req.user.username });
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message: "Something Went wrong. Please login again."
            })
        }

		if (userDetails.accountType !== "stockist") {
			return res.status(401).json({
				success: false,
				message: "This is a Protected Route for Admin",
			});
		}

		next();

	} 
    catch (error) {
        console.log(error)
		return res.status(500).json({ 
            success: false, 
            message: `User Role Can't be Verified` 
        });
	}
};

