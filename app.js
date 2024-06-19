// thiết lập các biến trung gian cho server
const express = require("express"); // web for node.js
const morgan = require("morgan"); // ghi lại các thông tin yêu cầu HTTP vào server
const rateLimit = require("express-rate-limit"); // giới hạn số lượng yêu cầu từ người dùng, tránh bị tấn công ddos
const helmet = require("helmet");// tăng cường bảo mật cho web
const bodyParser = require("body-parser");// phân tích dữ liệu từ expresss 
const cors = require("cors");
const routes = require("./routes/index");
const authRoutes = require("./routes/auth");
const xss = require("xss");
const app = express();
const firebase = require('firebase-admin');
// Khởi tạo Firebase Config
app.use(express.json());
app.use(cors({
    origin: "*",
    methods:["GET", "PATCH","POST","DELETE","PUT"],
    credentials: true,
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(helmet());

if(process.env.NODE_ENV ==="development"){
    app.use(morgan("dev"));
}

// Register the middleware with Express


// Cấu hình Rate Limiter
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 5,              // Giới hạn 5 yêu cầu mỗi phút
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Áp dụng Rate Limiter cho các route của bạn
// app.use(authRoutes, limiter);

// // Middleware xử lý khi vượt quá giới hạn của Rate Limiter
// app.use((req, res, next) => {
//     if (req.rateLimit.remaining === 0) {
//         return res.status(429).send('Too many requests from this IP, please try again later.');
//     }
//     next();
// });


app.use(express.urlencoded({
    extended: true,
}));



app.use(routes);

module.exports = app;
