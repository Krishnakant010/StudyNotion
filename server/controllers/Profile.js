const User = require("../models/User");
const Profile = require("../models/Profile");

exports.updateProfile = async (req, res) => {
  try {
    // data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    // userId
    const id = req.user.id;
    //validate
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid fields",
      });
    }
    // findPRofile
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    // updateProfile
    const profileDetails = await Profile.findById({ profileId });
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.gender = gender;
    profileDetails.about = about;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();
    // return UpdateProfile
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profileDetails,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server Error",
      error: err.message,
    });
  }
};

// delete Account
exports.deleteAccount = async (req, res) => {
  try {
    // get id
    const id = req.user.id;

    const userDetails = await User.findById(id);

    // del profile first
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
    //del user
    await User.findOneAndDelete({ _id: id });
    //return res
  } catch (err) {}
};
