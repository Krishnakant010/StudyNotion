const User = require("../models/User");
const Profile = require("../models/Profile");
const {
  uploadImage,
  uploadImageToCloudinary,
} = require("../utils/imageUploader");
const { default: mongoose } = require("mongoose");
exports.updateProfile = async (req, res) => {
  try {
    // data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    // userId
    const id = req.user.id;
    //validate
    if (!contactNumber || !gender) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid fields",
      });
    }
    // findPRofile
    const userDetails = await User.findById(id);
    let profileId = userDetails.additionalDetails;
    // updateProfile

    profileId = new mongoose.Types.ObjectId(profileId);
    const profileDetails = await Profile.findById(profileId);
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
    console.log(err.message);
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
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    console.log(userDetails);
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDetails = await User.findOne({
      _id: userId,
    })
      .populate("courses")
      .exec();
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
