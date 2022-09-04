const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { uploadFile } = require("../aws/aws");
const { isValid, isValidMail } = require("../validations/userValidations");

////////////////////////////////----------------------CREATE USER DETAILS----------------------/////////////////////////////////
const userRegister = async (req, res) => {
  try {
    let data = req.register;
    let file = req.files;

    if (file && file.length > 0) {
      let profileImage = await uploadFile(file[0]);
      if (profileImage.error)
        return res
          .status(400)
          .send({ status: false, message: profileImage.error });
      data.profileImage = profileImage;
    } else
      return res
        .status(400)
        .send({ status: false, message: "Please upload profile image" });

    let savedData = await userModel.create(data);

    res.status(201).send({
      status: true,
      message: "User created successfully",
      data: savedData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
////////////////////////////////----------------------USER LOGIN----------------------/////////////////////////////////
const loginUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password)
      return res
        .status(400)
        .send({ status: false, message: "Please Enter email and password" });
    if (!isValidMail(email))
      return res
        .status(400)
        .send({ status: false, message: `'${email}' is not a valid email` });

    if (!isValid(password))
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid password " });

    let checkEmail = await userModel.findOne({ email: email });

    if (!checkEmail)
      return res
        .status(404)
        .send({ status: false, message: `'${email}' email not found ` });

    let checkPassword = bcrypt.compareSync(password, checkEmail.password);
    if (!checkPassword)
      return res.status(401).send({ status: false, message: "Wrong password" });

    const token = jwt.sign(
      {
        userId: checkEmail._id,
      },
      "this is my secret key",
      { expiresIn: "24h" }
    );

    res.status(200).send({
      status: true,
      message: "User login successfull",
      data: { userId: checkEmail._id, token: token },
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
////////////////////////////////----------------------GET USER DETAILS----------------------/////////////////////////////////
const getUserDetails = async function (req, res) {
  try {
    const userId = req.params.userId;
    const findUserDetails = await userModel.findById(userId);

    if (!findUserDetails) {
      return res
        .status(404)
        .send({ status: false, message: "User Not Found!!!" });
    }

    res.status(200).send({
      status: true,
      message: "User profile details",
      data: findUserDetails,
    });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};
////////////////////////////////----------------------UPDATE USER DETAILS----------------------/////////////////////////////////
const putUser = async (req, res) => {
  try {
    let userId = req.params.userId;
    let data = req.register;

    if (Object.keys(data).length == 0)
      return res.status(400).send({
        status: false,
        message: "Nothing to update,Kindly check your input",
      });

    let updatedUser = await userModel.findOneAndUpdate({ _id: userId }, data, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).send({ status: false, message: "User not found" });

    res.status(200).send({
      status: true,
      message: "User profile updated",
      data: updatedUser,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { userRegister, loginUser, getUserDetails, putUser };
