const { instance } = require("../config/razorpay");

const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");

// capture the payment and initiate order
exports.capturePayment = async (req, res) => {
  try {
    //course and user id from body
    const { course_id } = req.body;
    const userId = req.user.id;

    // check if valid details
    if (!course_id || !userId) {
      return res.json({
        success: false,
        message: "Please enter valid course details",
      });
    }

    let course = await Course.findById(course_id);
    if (!course) {
      return res.json({
        success: false,
        message: "Could not find course",
      });
    }
    // user already paid for the course
    // it was in string hence chaging into mongoose OBJECTId
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      return res.json({
        success: false,
        message: "Student already paid for course",
      });
    }

    // order create and return
    const amount = course.price;
    const currency = "INR";
    const options = {
      amount: amount * 100,
      currency,
      receipt: Math.random(Date.now()).toString(),
      notes: {
        courseID: course_id,
        userId,
      },
    };
    try {
      //inititation of payment usign razorpay
      const paymentResponse = await instance.orders.create(options);
      console.log(paymentResponse);
      return res.status(200).json({
        success: true,
        coursName: course.coursName,
        courseDescription: course.courseDescription,
        thumbnail: course.thumbnail,
        orderID: paymentResponse.id,
        currency: PaymentRequest.currency,
        amount: paymentResponse.amount,
      });
    } catch (err) {
      console.log(err.message);
      res.json({
        success: false,
        message: "Could not initiate order",
      });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// verificaiton of payment which will be req by razorpay
exports.verifySignature = async (req, res) => {
  const webhookSecret = "1234";
  const signature = req.headers("x-razorpay-signature");
  const shasum = crypto.createHmac("sha256", webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");
  if (signature === digest) {
    console.log("Payment is authorized");
    const { courseID, userId } = req.body.payload.payment.entity.notes;
    try {
      // action i.e student enrollment
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseID },
        {
          $push: { studentsEnrolled: userId },
        },
        { new: true }
      );
      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }
      console.log(enrolledCourse);

      //   update user
      const enrolledStudent = await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: { courses: courseID },
        },
        {
          new: true,
        }
      );
      //   send the mail confirmed
      const emailResponse = await mailSender(
        enrolledStudent.email,
        "Congrats",
        "Congrats ,You have successfully purchased The course"
      );
      console.log(emailResponse);
      return res
        .status(200)
        .json({ success: true, message: "Course transaction completed" });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid parameters",
    });
  }
};
