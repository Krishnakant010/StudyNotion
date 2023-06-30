const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
  mongoose
    .connect(process.env.MONGODB_URl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Db connection established"))
    .catch((e) => {
      console.log("Error connecting to Mongo");
      console.log(e.message);
      process.exit(1);
    });
};
