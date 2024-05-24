const mongoose = require("mongoose");
const Stockist = require("../models/Stockist"); // Import your Mongoose model
const Notification = require("../models/Notification");
const Admin = require("../models/Admin");
const mailSender = require("./mailSender");


// Function to handle profit calculation and checks
async function checkMonthlyProfit() {

    try {

        console.log("Running monthly profit check...");

        // Get the current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Adding 1 because getMonth() returns 0-indexed month
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentMonth, 0).getDate();

        // const lastDayOfMonth = new Date (Date.now()).getDate();

        // Check if it's the last day of the month
        if (currentDate.getDate() === lastDayOfMonth) {

            console.log("It's the last day of the month.");

            // Calculate profitThisMonth for all stockists
            const stockists = await Stockist.find({ special: true });
            const admin = await Admin.find({});

            for (const stockist of stockists) {
                
                const profitThisMonth = stockist.profitThisMonth;
                
                if (profitThisMonth < stockist.expectedProfit) {

                    // Do something if profitThisMonth is in deficit
                    console.log(`Stockist ${stockist.name} has a deficit in profit for the month.`);

                    // create a notification
                    const notification = await Notification.create({
                        alert: `Stockist ${stockist.name} has a deficit of ${stockist.expectedProfit - profitThisMonth} in profit for the month.`
                    });


                    // add notification to admin
                    admin[0].notifications.push(notification._id);
                    

                    await admin[0].save();

                    // add notification to stockist
                    stockist.notifications.push(notification._id);

                    await stockist.save();



                    // add current month's profit to stockist
                    stockist.monthlyProfit.push({
                        month: currentMonth,
                        profit: profitThisMonth
                    })

                    await stockist.save();


                    // Send mail to moseta about the deficit
                    await mailSender(
                        "temp07066@gmail.com",
                        `Stockist ${stockist.name} has a deficit this month.`,
                        `Stockist ${stockist.name} has a deficit of ${stockist.expectedProfit - profitThisMonth} this month.`                        
                    );
                }

            }
        }

        // Check if it's the first day of the month
        if (currentDate.getDate() === 1) {

            console.log("It's the first day of the month.");

            // Reset profitThisMonth to 0 for all stockists
            await Stockist.updateMany({}, { profitThisMonth: 0 });
        }
    } 
    
    catch (error) {
        console.error("Error:", error);
    }

}

module.exports = { checkMonthlyProfit };
