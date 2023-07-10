const Course = require("../models/Course");
const Categoy = require("../models/Categoy");
const User = require("../models/User");
const {
  uploadImage,
  uploadImageToCloudinary,
} = require("../utils/imageUploader");
// crweate course

exports.createCourse = async (req, res) => {
  try {
    //
    const { courseName, courseDescription, whatYouWillLearn, price, category } =
      req.body;
    //here category is id of category
    const thumbnail = req.files.thumbnailImage;
    // validate
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // check for instructor
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found",
      });
    }
    console.log("Instructor details :", instructorDetails);
    // check Category if it is valid or not
    const CategoryDetails = await Categoy.findById(category);
    if (!CategoryDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Category details not found" });
    }
    // upload images to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    // create an entry for new Course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price: price,
      category: CategoryDetails._id,
      thumbnail: thumbnailImage,
    });
    //add mew couse to user schema of Instructor/user
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        new: true,
      }
    );
    // update the Category schema
    await CategoryDetails.findByIdAndUpdate(
      { _id: category },
      {
        $push: {
          course: newCourse._id,
        },
      },
      {
        new: true,
      }
    );
    // return
    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

//----------------------------------------------------------------
// show all courses
exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();
    return res.status(200).json({
      success: true,
      message: "All courses fetched successfully",
      allCourses,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

//get coursedETAILS
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    // find courseDetails
    const courseDetails = await Course.find({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with ${courseId}`,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: courseDetails,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
