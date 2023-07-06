const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
// resetPasswordToken
exports.resetpasswordToken = async (req, res) => {
  try {
    // email from body
    const { email } = req.body;

    // check if email is valid
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({ success: false, message: "Invalid email" });
    }
    //   generate token
    const token = crypto.randomUUID();
    //   update user adding
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      { token: token, resetpasswordToken: Date.now() + 5 * 60 * 1000 },
      {
        new: true,
      }
    );
    // create url
    const url = `http:localhost:3000/update-password/${token}`;
    // send mail
    await mailSender(
      email,
      "Password reset Link",
      `Password reset Link : ${url} `
    );
    // return response
    return res.json({
      success: true,
      message: "Email Sent successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      success: false,
      message: "Error sending password reset link",
    });
  }
};
// Reset password
exports.resetPassword = async (req, res) => {
  // fetch data
  //token sent from frontend
  const { password, confirmPassword, token } = req.body;
  // validation
  if (password != confirmPassword) {
    return res.json({
      success: false,
      message: "Passwords do not match",
    });
  }
  //user details with the help of token
  const userDetails = await User.findOne({ token: token });
  // if no entry then token is invalid
  if (!userDetails) {
    return res.json({
      success: false,
      message: "Token is invalid",
    });
  }
  // chech tokens expiration
  if (userDetails.resetPasswordExpires < Date.now()) {
    return res.json({
      success: false,
      message: "Token has expired, please regenerate the token",
    });
  }
  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // update passwords
  await User.findOneAndUpdate(
    { token: token },
    { password: hashedPassword },
    { new: true }
  );
  return res.json(200).json({
    success: true,
    message: "Password reset successfull",
  });
  try {
  } catch (e) {
    return res.json(401).json({
      success: false,
      message: "Password reset could not be done",
    });
  }
};
