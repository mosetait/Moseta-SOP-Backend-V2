const Stockist = require("../../models/Stockist");
const Admin = require("../../models/Admin");
const Profile = require("../../models/Profile");
const Transaction = require("../../models/Transaction");
const {uploadImageToCloudinary} = require("../../utils/imageUploader");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose")
const multer = require("multer");




// Setup profile
exports.setupProfile = async (req , res) => {

    try{

        const {
            name,
            gstNo,
            address,
            tradeName,
            contactNo
        } = req.body;


        const image = req.files?.profilePic;

        // Validations
        if (
            !name ||
            !gstNo ||
            !address ||
            !tradeName ||
            !contactNo
        ) {
            return res.status(401).json({
                success: false,
                message: "Please fill all the required fields"
            })
        }

        
        // Check if the stockist exist
        const existingStk = await Stockist.findOne({username: req.user.username});

        if(!existingStk){
            return res.status(404).json({
                success: false,
                message: "User not found. Please login again."
            })
        }


        // Checking if there any other profile like this
        const existingProfile = await Profile.findOne({
            $or:[
                {gstNo},
                {contactNo}
            ]
        })

        if(existingProfile){
            return res.status(401).json({
                success: false,
                message: "Profile with this informatio exist."
            })
        }

        // upload profile picture to cloudinary
        const profilePic = async (image) => {

            const result = await uploadImageToCloudinary(image, process.env.FOLDER_NAME , 50);

            return {
              publicId: result.public_id,
              secureUrl: result.secure_url,
            };
    
        }
        
        let uploadProfilePic = {};

        if(image){
            uploadProfilePic = await profilePic(image);
        }


        // Create Profile
        const newProfile = await Profile.create({
            name,
            gstNo,
            address,
            tradeName,
            contactNo,
            image: uploadProfilePic,
            profile: existingStk._id,
            profileSetup: true,
            stockist: req.user.id
        });

        // add profile to the stockist
        existingStk.profile = newProfile._id;
        existingStk.profileSetup = true;

        await existingStk.save();

        return res.status(200).json({
            success: true,
            message: "Profile Created Successfully",
            newProfile
        })

    }
    catch(error){
        
        return res.status(500).json({
            success: false,
            message: `Error while creating profile : ${error}`
        })
    }   

}




// update profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, gstNo, address, tradeName, contactNo } = req.body;
        const image = req.files?.profilePic;

        // Validations
        if (!name || !address || !gstNo || !tradeName || !contactNo) {
            return res.status(401).json({
                success: false,
                message: "Please fill all the required fields"
            });
        }

        // Check if the stockist exists
        const existingStk = await Stockist.findOne({ _id: req.user.id });

        if (!existingStk) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please login again."
            });
        }

        // Extract stockist's profile
        const profile = await Profile.findOne({ _id: existingStk.profile });

        if (!profile) {
            return res.status(401).json({
                success: false,
                message: "Please setup profile first"
            });
        }

        // Delete existing image from Cloudinary
        if (image) {
            const deleteProfilePic = async () => {
                await cloudinary.uploader.destroy(profile.image.publicId);
            };

            if (typeof profile.image === 'object' && profile.image !== null) {
                const isEmpty = Object.keys(profile.image).length === 0 && profile.image.constructor === Object;
                if (!isEmpty) {
                    await deleteProfilePic();
                }
            }
        }

        // Upload profile picture to Cloudinary
        const profilePic = async (image) => {
            const result = await uploadImageToCloudinary(image, process.env.FOLDER_NAME, 50);
            return {
                publicId: result.public_id,
                secureUrl: result.secure_url,
            };
        };

        let uploadProfilePic = profile.image ? profile.image : {};

        if (image) {
            uploadProfilePic = await profilePic(image);
        }

        // Update the stockist
        await profile.updateOne({
            name,
            address,
            tradeName,
            contactNo,
            gstNo,
            image: uploadProfilePic,
            stockist: req.user.id
        });

        existingStk.name = name;
        await existingStk.save();

        return res.status(200).json({
            success: true,
            message: "Stockist profile updated successfully."
        });

    } catch (error) {
        
        return res.status(500).json({
            success: false,
            message: `Error while updating profile: ${error}`
        });
    }
};
