const Client = require("../../models/Client");
const asyncHandler = require("../../middleware/asyncHandler");
const Stockist = require("../../models/Stockist")


// Create client
exports.createClient = asyncHandler( async (req,res) => {

    const {
        name, 
        address,
        contact,
        type
    } = req.body;

    if(
        !name || !address || !contact || !type
    ){
        return res.status(400).json({
            message: "Please fill all mandatory fields.",
            success: false
        })
    }

    const stockist = await Stockist.findOne({_id: req.user.id});

    if(!stockist){
        return res.status(401).json({
            message: "Stockist not found. Please login again.",
            success: false
        }) 
    }

    const existingClient = await Client.findOne({
        $or: [
            { address: address }, 
            { contact: contact }
        ]
    });

    if(existingClient){
        return res.status(401).json({
            message: "Client already exist.",
            success: false
        })
    }

    const newClient = await Client.create({
        name, 
        address,
        contact,
        type,
        stockist: req.user.id
    })
    
    // add client to stockist
    stockist.clients.push(newClient._id);
    await stockist.save();

    return res.status(200).json({
        message: "Client created successfully",
        success: true,
        newClient
    })

})



//  update client
exports.updateClient = asyncHandler( async (req,res) => {

    const {
        clientId,
        name, 
        address,
        contact,
        type
    } = req.body;

    if(
        !name || !address || !contact || !type || !clientId
    ){
        return res.status(400).json({
            message: "Please fill all mandatory fields.",
            success: false
        })
    }

    const stockist = await Stockist.findOne({_id: req.user.id});

    if(!stockist){
        return res.status(401).json({
            message: "Stockist not found. Please login again.",
            success: false
        }) 
    }

    const existingClient = await Client.findOne({_id: clientId});

    if(!existingClient){
        return res.status(401).json({
            message: "Client not found.",
            success: false
        })
    }

    await existingClient.updateOne({
        name, 
        address,
        contact,
        type
    })
    
    await existingClient.save();

    return res.status(200).json({
        message: "Client updated successfully",
        success: true,
    })

})



// delete client
exports.deleteClient = asyncHandler( async (req,res) => {

    const {clientId} = req.body;

    if(!clientId){
        return res.status(400).json({
            message: "Please provide client id.",
            success: false
        })
    }

    const client = await Client.findOne({_id: clientId});

    if(!client){
        return res.status(404).json({
            message: "Client not found",
            success: false
        })    
    }

    await client.deleteOne();

    return res.status(200).json({
        message: "Client deleted successfully",
        success: true
    })

})
