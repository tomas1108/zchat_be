
const nodemailer = require("nodemailer");

// khởi tạo tranporter và định nghĩa server gửi mail
let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: 'nhatnguyen9.6h@gmail.com',
        pass: 'lcgpnktjwzrcwjkj',
    },
});
// khởi tạo hàm sendMail
const sendEmail = async (mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
        return;
    } catch (error) {
        throw error;
    }
};
module.exports = sendEmail;