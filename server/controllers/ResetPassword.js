const User = require("../models/User");
const mailSender = require("../utils/mailSender");

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
exports.resetPassword = (req, res) => {
  try {
  } catch (e) {}
};
