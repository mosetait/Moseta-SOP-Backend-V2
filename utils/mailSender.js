const nodemailer = require("nodemailer");

const mailSender = async (email, title, body, attachment) => {

    try {

        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        });

        let mailOptions = {
            from: 'Moseta - Renewable luxury',
            to: email,
            subject: title,
            html: body,
        };

        // Add attachment if provided
        if (attachment) {
            mailOptions.attachments = [
                {
                    filename: attachment.originalname, // Use original file name
                    content: attachment.buffer, // Use buffer of the attachment
                }
            ];
        }

        let info = await transporter.sendMail(mailOptions);

        // console.log(info);
        return info;
    } 
    catch (error) {
        console.error(error.message);
        throw new Error("Failed to send email with attachment.");
    }
};

module.exports = mailSender;
