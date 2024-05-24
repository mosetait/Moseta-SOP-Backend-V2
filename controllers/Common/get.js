const asyncHandler = require("../../middleware/asyncHandler");
const Category = require("../../models/Category");
const Product = require("../../models/Product");






// get all categories
exports.getAllCategories = asyncHandler( async (req,res) => {

    const categories = await Category.find();

    return res.status(200).json({
        success: false,
        message: "Categories Fetched Successfully",
        categories
    })

})



// Get products of a category
exports.getAllProducts = asyncHandler( async (req,res) => {

    const {categoryId} = req.body;

    if(!categoryId){
        return res.status(400).json({
            message : "Please provide category id",
            success: false
        })
    }

    const products = await Product.find({category: categoryId});

    return res.status(200).json({
        message: "Products fetched successfully",
        products,
        success: true
    })

})




// fetch proof
exports.fetchProof = asyncHandler( async (req,res) => {

        const { fileName } = req.body;

        if(!fileName){
            return res.status(200).json({
                message: "No proof found",
                success:false
            })
        }

        // Construct the absolute path to the file
        const absolutePath = path.join(__dirname, '..', 'uploads', fileName);


        // Check if the file exists
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                message: 'File not found',
                success: false
            });
        }

        // Determine the content type based on the file extension
        const contentType = getFileContentType(fileName);

        // Set the appropriate content type for the response
        res.setHeader('Content-Type', contentType);

        // Stream the file directly to the response
        fs.createReadStream(absolutePath).pipe(res);

    }

)

// Function to determine content type based on file extension
function getFileContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
        case '.pdf':
            return 'application/pdf';
        case '.doc':
        case '.docx':
            return 'application/msword';
        case '.xls':
        case '.xlsx':
            return 'application/vnd.ms-excel';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        // Add more cases for other file types if needed
        default:
            return 'application/octet-stream'; // Default to binary data
    }
}