const asyncHandler = require("../../middleware/asyncHandler");
const ProductModel = require("../../models/Category")
const Product = require("../../models/Product")
const Category = require("../../models/Category");



// create category
exports.createCategory = asyncHandler( async (req,res) => {

    const {name} = req.body;
  
   
    // validations
    if(!name) {
        return res.status(400).json({
            message: "Please fill all fields",
            success: false
        })
    }

    // check if category with same name is already created
    const existingCategory = await Category.findOne({name});

    if(existingCategory) {
        return res.status(401).json({
            message: "Category already exist.",
            success: false
        })
    }


    const newCategory = await Category.create({name});

    return res.status(200).json({
        message: "Category created successfully",
        success: true,
        newCategory
    })
})





// update category
exports.updateCategory = asyncHandler( async (req,res) => {

    const {id , name } = req.body;

    // validations
    if(!name || !id) {
        return res.status(400).json({
            message: "Please fill all fields",
            success: false
        })
    }

    // check if category with same name is already created
    const existingCategory = await Category.findOne({_id: id});

    if(!existingCategory) {
        return res.status(404).json({
            message: "Category Not Found.",
            success: false
        })
    }


    const updateCategory = await Category.findByIdAndUpdate({_id: id},{name} , {new: true});

    return res.status(200).json({
        message: "Category created successfully",
        success: true,
        updateCategory
    })
})






// delete category
exports.deleteCategory = asyncHandler( async (req,res) => {

    const {id} = req.body;

    // validations
    if(!id) {
        return res.status(400).json({
            message: "Please provide category id.",
            success: false
        })
    }

    // check if category with same name is already created
    const existingCategory = await Category.findOne({_id: id});

    if(!existingCategory) {
        return res.status(404).json({
            message: "Category Not Found.",
            success: false
        })
    }


    const deleteCategory = await Category.findByIdAndDelete({_id: id});


    return res.status(200).json({
        message: "Category created successfully",
        success: true,
        deleteCategory
    })
})






// -----------------------------------------------------------------------




// create product
exports.createProduct = asyncHandler( async (req,res) => {


    const {
        name,
        gst,
        distributorPriceWithoutGst,
        retailerPriceWithoutGst,
        customerPriceWithoutGst,
        mcpWithoutGst,
        categoryId,
        newPriceWithoutGst,
    } = req.body;


    // validations
    if(
        !name ||
        !distributorPriceWithoutGst ||
        !retailerPriceWithoutGst ||
        !customerPriceWithoutGst ||
        !mcpWithoutGst ||
        !categoryId || 
        !gst
    ){
        return res.status(206).json({
            message : "Please provide all the fields",
            success: false
        })
    }

    // check if product aready exist
    const existingProduct = await Product.findOne({
        $and : [ {name} , {distributorPriceWithoutGst} , {retailerPriceWithoutGst} , {customerPriceWithoutGst} , {mcpWithoutGst}]
    });

    if(existingProduct){
        return res.status(401).json({
            message: "Product with this name already exist.",
            success: false
        })
    }

    // check if category exist or not
    const category = await Category.findOne({_id: categoryId});

    if(!category){
        return res.status(404).json({
            message: "Category Not Found",
            success: false
        })
    }



    // calculating price after gst
    const distributorPriceWithGst = (distributorPriceWithoutGst * ((Number(gst)+100) / 100)).toFixed(2);
    const retailerPriceWithGst = (retailerPriceWithoutGst * ((Number(gst)+100) / 100)).toFixed(2);
    const customerPriceWithGst = (customerPriceWithoutGst * ((Number(gst)+100) / 100)).toFixed(2);
    const mcpWithGst = (mcpWithoutGst * ((Number(gst)+100) / 100)).toFixed(2);
    const newPriceWithGst = (newPriceWithoutGst * ((Number(gst)+100) / 100)).toFixed(2);


    // create new product
    const newProduct = await Product.create({
        name,
        distributorPriceWithoutGst,
        retailerPriceWithoutGst,
        customerPriceWithoutGst,
        mcpWithoutGst,
        distributorPriceWithGst,
        retailerPriceWithGst,
        customerPriceWithGst,
        mcpWithGst,
        gst,
        category: categoryId,
        newPriceWithGst: newPriceWithoutGst ?  newPriceWithGst : null,
        newPriceWithoutGst: newPriceWithoutGst ?  newPriceWithoutGst : null
    })


    

    // add product to category
    category.products.push(newProduct._id);

    await category.save();
    

    return res.status(200).json({
        message: "Product Created Successfully.",
        success: true,
        newProduct
    })


})








// update product
exports.updateProduct = asyncHandler( async (req,res) => {

    const {
        name,
        gst,
        distributorPriceWithoutGst,
        retailerPriceWithoutGst,
        customerPriceWithoutGst,
        mcpWithoutGst,
        productId
    } = req.body

    // validations
    if(
        !name ||
        !distributorPriceWithoutGst ||
        !retailerPriceWithoutGst ||
        !customerPriceWithoutGst ||
        !mcpWithoutGst ||
        !productId
    ){
        return res.status(206).json({
            message : "Please provide all the fields",
            success: false
        })
    }


    // check if product aready exist
    const existingProduct = await Product.findOne({_id: productId});

    if(!existingProduct){
        return res.status(404).json({
            message: "Product Not Found.",
            success: false
        })
    }

    // check if category exist
    const category = await Category.findOne({_id: existingProduct.category});

    if(!category){
        return res.status(404).json({
            message: "Category Not Found",
            success: false
        })
    }
    

    // check if the new info exist in another product or not
    const productSearch = await Product.findOne({name})

    // if product found with new info then return error
    if(productSearch._id.toString() !== productId){    
        return res.status(401).json({
            message: "Product with this info already exist.",
            success: false
        })
    }



    // calculating price after gst
    const distributorPriceWithGst = Math.floor(distributorPriceWithoutGst * ((gst+100) / 100));
    const retailerPriceWithGst = Math.floor(retailerPriceWithoutGst * ((gst+100) / 100));
    const customerPriceWithGst = Math.floor(customerPriceWithoutGst * ((gst+100) / 100));
    const mcpWithGst = Math.floor(mcpWithoutGst * ((gst+100) / 100));


    // update product
    await existingProduct.updateOne({
        name,
        distributorPriceWithoutGst,
        retailerPriceWithoutGst,
        customerPriceWithoutGst,
        mcpWithoutGst,
        distributorPriceWithGst,
        retailerPriceWithGst,
        customerPriceWithGst,
        gst,
        mcpWithGst,
    })

    await existingProduct.save();

    return res.status(200).json({
        message: "Product Updated Successfully.",
        success: true,
    })

})








// delete product
exports.deleteProduct = asyncHandler( async (req,res) => {

    const {productId} = req.body;

    // validation
    if(!productId) {
        return res.status(400).json({
            message: "Please provide product id.",
            success: false
        })
    }

    // find product
    const existingProduct = await Product.findOne({_id: productId});

    if(!existingProduct) {
        return res.status(404).json({
            message: "Product Not Found",
            success: false
        })
    }

    // find product category
    const category = await Category.findOne({_id: existingProduct.category});

    if(!category) {
        return res.status(404).json({
            message: "Product Category Not Found",
            success: false
        })
    }


    // remove product from categories
    category.products = category.products.filter(prodId => prodId.toString() !== existingProduct._id.toString());

    await category.save();

    await existingProduct.deleteOne();

    return res.status(200).json({
        message: "Product Deleted Successfully",
        success: true,
        existingProduct
    })
})