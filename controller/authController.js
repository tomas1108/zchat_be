const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailService = require("../services/mailer");
const crypto = require("crypto");
const otp = require("../template/mail/otp");
const resePass = require("../template/mail/resetPassword");
const filterObj = require("../utils/filterObj");
const sendEmail = require("../services/mailer");
const S3_BUCKET_NAME = 'codingmonk';
const AWS_S3_REGION = 'ap-south-1'; // eg. ap-south-1
const { format } = require('date-fns');



// Model
const User = require("../models/user");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const { getNotificationCountAndMessagesByUser } = require("./notificationController");

// this function will return you jwt token
const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);
const getCurrentDate = () => {
  const currentDate = new Date();

  // Định dạng ngày hiện tại thành "YYYY-MM-DD"
  const formattedDate = format(currentDate, 'yyyy-MM-dd');

  return formattedDate;
}

// Register New User
exports.register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, birthDate, gender } = req.body;
  // avatar mặc định
  const avatar = `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/`;
  // thêm avatar vào req.body
  req.body.avatar = avatar;
  const filteredBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "email",
    "password",
    "birthDate",
    "gender",
    "avatar"
  );

  // kiem tra xem email da ton tai chua

  const existing_user = await User.findOne({ email: email });
  if (existing_user && existing_user.verified) {
    // tai khoan da ton tai, yeu cau dang nhap
    return res.status(400).json({
      status: "error",
      message: "Email already in use, Please login.",
    });
  } else if (existing_user) {
    // neu tai khoan da ton tai nhung chua xac thuc thi update lai thong tin
    await User.findOneAndUpdate({ email: email }, filteredBody, {
      new: true,
      validateModifiedOnly: true,
    });
    // tao otp va gui mail
    req.userId = existing_user._id;
    next();
  } else {
    // neu tai khoan chua ton tai thi tao moi
    const new_user = await User.create(filteredBody);
    // tao otp va gui mail
    req.userId = new_user._id;
    next();
  }
});




exports.sendOTP = async (req, res, next) => {
  const { userId } = req;
  // tạo otp mới
  const new_otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  const otp_expiry_time = Date.now() + 10 * 60 * 1000; //10 phút 
  // lưu otp và thời gian hết hạn vào db
  const user = await User.findByIdAndUpdate(userId, {
    otp_expiry_time: otp_expiry_time,
  });
  user.otp = new_otp.toString();
  // lưu lại user
  await user.save({ new: true, validateModifiedOnly: true });
  console.log(new_otp);

  // gửi mail
  const mailOptions = {
    from: "ZChat <nhatnguyen9.6h@gmail.com>",
    to: user.email,
    subject: `OTP verification: ${new_otp}`,
    html: otp(user.firstName, new_otp),
    attachments: [],
  }

  sendEmail(mailOptions);
  res.status(200).json({
    status: "success",
    message: "OTP sent successfully!",
  });
}

exports.verifyOTP = catchAsync(async (req, res, next) => {
  // verify otp and update user accordingly
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP expired",
    });
  }

  if (user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }

  if (!(await user.correctOTP(otp, user.otp))) {
    res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });

    return;
  }

  // OTP is correct

  user.verified = true;
  user.otp = undefined;
  await user.save({ new: true, validateModifiedOnly: true });

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "OTP verified Successfully!",
    token,
    user_id: user._id,
  });
});

// User Login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // console.log(email, password);

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both email and password are required",
    });
    return;
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Account doesn't exist ",
    });

    return;
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    res.status(400).json({
      status: "error",
      message: "Password is incorrect",
    });

    return;
  }

  const token = signToken(user._id);
  let notification = await getNotificationCountAndMessagesByUser(user._id);
  console.log(" noti",notification);

  if (!notification) {
    notification = { count: null, messages: null }; // Không có thông báo, trả về mảng rỗng và count là 0
  }
  res.status(200).json({
    status: "success",
    message: "Logged in successfully!",
    token,
    user_id: user._id,
    user_name: user.firstName + " " + user.lastName,
    user_email: user.email,
    user_birthDate: user.birthDate,
    user_gender: user.gender,
    user_avatar: user.avatar,
    noti_count: notification.count,
    noti_messages: notification.messages,
  });
});

exports.loginWithGG = catchAsync(async (req, res, next) => {

  const { idToken } = req.body;

  try {
    // Xác thực ID token với Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Bạn có thể sử dụng uid để tìm hoặc tạo người dùng trong cơ sở dữ liệu của bạn
    // Ở đây chúng ta chỉ trả lại thông tin đã giải mã cho ví dụ
    res.status(200).send(decodedToken);
  } catch (error) {
    console.error('Lỗi xác thực ID token:', error);
    res.status(401).send('Không được phép');
  }




});
// Protect
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      message: "You are not logged in! Please log in to get access.",
    });
  }
  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  console.log(decoded);

  // 3) Check if user still exists

  const this_user = await User.findById(decoded.userId);
  if (!this_user) {
    return res.status(401).json({
      message: "The user belonging to this token does no longer exists.",
    });
  }
  // 4) Check if user changed password after the token was issued
  if (this_user.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      message: "User recently changed password! Please log in again.",
    });
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = this_user;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "There is no user with email address.",
    });
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `http://localhost:3000/auth/new-password?token=${resetToken}`;
    // TODO => Send Email with this Reset URL to user's email address

    console.log(resetURL);

    // gửi mail
    const mailOptions = {
      from: "ZChat <nhatnguyen9.6h@gmail.com>",
      to: user.email,
      subject: "Reset Password",
      html: resePass(user.firstName, resetURL),
      attachments: [],
    }
    sendEmail(mailOptions);
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      message: "There was an error sending the email. Try again later!",
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Token is Invalid or Expired",
    });
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password Reseted Successfully",
    token,
  });
});
