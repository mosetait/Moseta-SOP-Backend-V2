const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const helmet = require("helmet");
const connectCloudinary = require('./config/cloudinary');
const connectDatabase = require('./config/database');
const fileUpload = require("express-fileupload");
// const multer = require("multer");
const cors = require("cors");


const CronJob = require("cron").CronJob;
const { checkMonthlyProfit } = require("./utils/cronJobs"); 


dotenv.config();

// connect cloudinary
connectCloudinary();

// Connect to the database
connectDatabase();

// middlewares
app.use(express.json({ limit: '2mb' }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(helmet());
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
);
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));



// importing routes
const admin = require("./routes/Admin");
const stockist = require("./routes/Stockist");
const common = require("./routes/Common");

app.use("/api/v1", admin);
app.use("/api/v1", stockist);
app.use("/api/v1", common);



// Define cron schedules for the 1st and last day of the month at 12 PM noon
const firstDayOfMonthSchedule = "0 12 1 * *"; // At 12:00 PM on the 1st day of every month

// Calculate cron schedule for the last day of the month at 12 PM noon
const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
const lastDayOfMonthSchedule = `0 12 ${lastDayOfMonth.getDate()} * *`; 

// Create CronJob instances for the 1st and last day of the month
const firstDayOfMonthJob = new CronJob(firstDayOfMonthSchedule, checkMonthlyProfit);
const lastDayOfMonthJob = new CronJob(lastDayOfMonthSchedule, checkMonthlyProfit);

// Start the cron jobs
firstDayOfMonthJob.start();
lastDayOfMonthJob.start();



// app.use("/" , (req,res) => {
//     res.send("Server is running")
// })




const PORT = process.env.PORT || 8441

app.listen(PORT , () => {
    console.log(`Server is running on PORT : ${PORT}`)
})
