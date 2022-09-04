const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");

const authentication = async function (req, res, next) {
  try {
    let bearerToken = req.headers["authorization"];
    var token=null;   //If token is not found inside bearerToken,then command will go to line 16 since null is falsy value Token missing message will be shown

    if(typeof bearerToken!== "undefined"){

        let bearer=bearerToken.split(" ")
        token=bearer[1]
    }

    if (!token)
      return res
        .status(401)
        .send({ status: false, message: "You are not logged in (token Missing)" });

    jwt.verify(token, "this is my secret key",function (err, decoded) {
        if (err) {
          let msg =
            err.message === "jwt expired" ? "token is expired": "token is invalid";

          return res.status(401).send({ status: false, message: msg });
        
        }else{

            req.decodeToken=decoded  //taking  userId from the token and store it into user_id key to use further in the code
            next()
        }
    });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const authorization = async function (req, res, next) {
  try {
    let userId = req.params.userId;

    if (!mongoose.isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Not a valid userId" });

    let userDetail = await userModel.findById(userId);
    if (!userDetail)
      return res.status(404).send({ status: false, message: "No such userId" });

    if (userId != req.decodeToken.userId)
      return res
        .status(403)
        .send({ status: false, message: "You are not authorized" });
    next();
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { authentication, authorization };