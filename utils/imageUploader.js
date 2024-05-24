const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file , folder , quality) => {

    const options = {folder};

    if(quality){
        options.quality = quality;
    }

    options.resource_type = "auto";
    
    return await cloudinary.uploader.upload(file.tempFilePath , options);
    
}