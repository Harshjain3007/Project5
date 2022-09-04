const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { uploadFile } = require("../aws/aws");

// function for string verification
const isValid = function (value) {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length == 0) return false;
  else if (typeof value == "string") return true;
};

// function for name verification
const isValidFname = function (name) {
  return /^[a-zA-Z .]{2,30}$/.test(name);
};

const isValidLname = function (name) {
  return /^[a-zA-Z ]{2,30}$/.test(name);
};

const isValidStreet = function (value) {
  return /^[a-zA-Z0-9 -.]{2,30}$/.test(value);
};

// function for validating input request
const isValidRequest = function (data) {
  if (Object.keys(data).length == 0) return false;
  return true;
};

// function for mail verification
const isValidMail = function (v) {
  return /^([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)@([a-z]([-_\\.]*[a-z]+)*)[\\.]([a-z]{2,9})+$/.test(
    v
  );
};

// function for mobile verification
const isValidMobile = function (num) {
  return /^[6789]\d{9}$/.test(num);
};

// function for pincode verification
const isValidPincode = function (num) {
  return /^[1-9][0-9]{5}$/.test(num);
};

// function for password verification
const isValidPassword = function (pass) {
  return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(pass);
};

//function for object validation
const isValidObject = function (object) {
  if (typeof object === "undefined" || object === null) return false;
  if (typeof object != "object") return false;
  return isValidRequest(object);
};

const userValidation = async (req, res, next) => {
  try {
    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input" });

    let { fname, lname, email, phone, password } = req.body;

    if (!isValid(fname))
      return res
        .status(400)
        .send({ status: false, message: "Please enter fname" });

    if (!isValidFname(fname))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid fname" });

    if (!isValid(lname))
      return res
        .status(400)
        .send({ status: false, message: "Please enter lname" });

    if (!isValidLname(lname))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid lname" });

    if (!isValid(email))
      return res
        .status(400)
        .send({ status: false, message: "Please enter email" });

    if (!isValidMail(email))
      return res
        .status(400)
        .send({ status: false, message: `'${email}' is not a valid email` });

    if (!isValid(phone))
      return res
        .status(400)
        .send({ status: false, message: "Please enter phone number" });

    if (!isValidMobile(phone))
      return res.status(400).send({
        status: false,
        message: `'${phone}' is not a valid Indian phone number`,
      });

    if (!isValid(password))
      return res
        .status(400)
        .send({ status: false, message: "Please enter a password" });

    if (!isValidPassword(password))
      return res.status(400).send({
        status: false,
        message: `'${password}' is not a valid password,Password should contain 8 to 15 characters, one special character, a number and should not contain space`,
      });

    let bcrpytPassword = await bcrypt.hash(password, 10);

    let file = req.files;

    if (file.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please upload an image" });

    let allowedExtension = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
    ];

    if (!allowedExtension.includes(file[0].mimetype))
      return res
        .status(400)
        .send({ status: false, message: "File should be an image" });

    if (!isValidObject(req.body.address)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter address" });
    }

    if (!isValidObject(req.body.address.shipping)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter shipping address" });
    }

  if (!isValid(req.body.address.shipping.pincode))
    return res
      .status(400)
      .send({ status: false, message: "Please enter shipping pincode" });

  if (!isValidPincode(req.body.address.shipping.pincode))
    return res.status(400).send({
      status: false,
      message: "Please enter a valid shipping pincode",
    });

  if (!isValid(req.body.address.shipping.city))
    return res
      .status(400)
      .send({ status: false, message: "Please enter shipping city" });

  if (!isValidLname(req.body.address.shipping.city))
    return res
      .status(400)
      .send({ status: false, message: "Please enter a valid shipping city" });

  if (!isValid(req.body.address.shipping.street))
    return res
      .status(400)
      .send({ status: false, message: "Please enter shipping street" });

  if (!isValidStreet(req.body.address.shipping.street))
    return res.status(400).send({
      status: false,
      message: "Please enter a valid shipping street",
    });

    if (!isValidObject(req.body.address.billing)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter billing address" });
    }

    if (!isValid(req.body.address.billing.pincode))
      return res
        .status(400)
        .send({ status: false, message: "Please enter billing pincode" });

    if (!isValidPincode(req.body.address.billing.pincode))
      return res.status(400).send({
        status: false,
        message: "Please enter a valid billing pincode",
      });

    if (!isValid(req.body.address.billing.city))
      return res
        .status(400)
        .send({ status: false, message: "Please enter billing city" });

    if (!isValidLname(req.body.address.billing.city))
      return res
        .status(400)
        .send({ status: false, message: "Please enter a valid billing city" });

    if (!isValid(req.body.address.billing.street))
      return res
        .status(400)
        .send({ status: false, message: "Please enter billing street" });

    if (!isValidStreet(req.body.address.billing.street))
      return res.status(400).send({
        status: false,
        message: "Please enter a valid billing street",
      });

     
    if (
      req.body.address.shipping.city != req.body.address.billing.city &&
      req.body.address.shipping.pincode == req.body.address.billing.pincode
    )
      return res.status(400).send({
        status: false,
        message: "Pincode is different for different cities",
      });

    let address = {
      shipping: {
        street: req.body.address.shipping.street,
        city: req.body.address.shipping.city,
        pincode: req.body.address.shipping.pincode,
      },
      billing: {
        street: req.body.address.billing.street,
        city: req.body.address.billing.city,
        pincode: req.body.address.billing.pincode,
      },
    };

    let unique = await userModel.findOne({
      $or: [{ email: email }, { phone: phone }],
    });

    if (unique)
      return res
        .status(409)
        .send({ status: false, message: "Phone or Email already exists" });

    let data = {
      fname: fname,
      lname: lname,
      email: email,
      phone: phone,
      password: bcrpytPassword,
      address: address,
    };

    req.register = data;

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};
/////////////////////////////////---------------------UPDATE USER VALIDATIONS------------------------///////////////////////////////
const putUserValidations = async (req, res, next) => {
  try {
    if (!isValidRequest(req.body) && !req.files)
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input" });

    let { fname, lname, email, phone, password } = req.body;

    let data = {};

    if (fname?.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter a fname" });

    if (fname) {
      if (!isValid(fname))
        return res
          .status(400)
          .send({ status: false, message: "Please enter fname" });

      if (!isValidFname(fname))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid fname" });
      data.fname = fname;
    }
    if (lname?.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter lname" });

    if (lname) {
      if (!isValid(lname))
        return res
          .status(400)
          .send({ status: false, message: "Please enter lname" });

      if (!isValidLname(lname))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid lname" });
      data.lname = lname;
    }

    if (email?.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter email" });

    if (email) {
      if (!isValid(email))
        return res
          .status(400)
          .send({ status: false, message: "Please enter email" });

      if (!isValidMail(email))
        return res
          .status(400)
          .send({ status: false, message: `'${email}' is not a valid email` });
      data.email = email;
    }

    if (phone?.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter phone number" });

    if (phone) {
      if (!isValid(phone))
        return res
          .status(400)
          .send({ status: false, message: "Please enter phone number" });

      if (!isValidMobile(phone))
        return res.status(400).send({
          status: false,
          message: `'${phone}' is not a valid Indian phone number`,
        });
      data.phone = phone;
    }

    if (password?.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter password" });

    if (password) {
      if (!isValid(password))
        return res
          .status(400)
          .send({ status: false, message: "Please enter a password" });

      if (!isValidPassword(password))
        return res.status(400).send({
          status: false,
          message: `'${password}' is not a valid password`,
        });

      let bcrpytPassword = await bcrypt.hash(password, 10);
      data.password = bcrpytPassword;
    }

    let file = req.files;

    let allowedExtension = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
    ];
    console.log(req.body)
    if(req.body.profileImage?.length==0)
    return res.status(400).send({
      status: false,
      message: "Please upload a profile image",
    });

    if (file && file.length > 0) {
      if (!allowedExtension.includes(file[0].mimetype))//defines extension type of the file being uploaded
        return res.status(400).send({
          status: false,
          message: "Image should be in required format",
        });

      let profileImage = await uploadFile(file[0]);
      if (profileImage.error)
        return res
          .status(400)
          .send({ status: false, message: profileImage.error });
      data.profileImage = profileImage;
    }
    if (req.body.address?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter address as a valid object",
      });

    if (req.body.address) {
      if (!isValidObject(req.body.address)) {
        return res.status(400).send({
          status: false,
          message: "Please enter address as a valid object",
        });
      }

      if (req.body.address.shipping?.length == 0)
        return res.status(400).send({
          status: false,
          message: "Please enter shipping address as a valid object",
        });

      if (req.body.address.billing?.length == 0)
        return res.status(400).send({
          status: false,
          message: "Please enter billing address as a valid object",
        });

      if (
        Object.hasOwn(req.body.address, "shipping") ||
        Object.hasOwn(req.body.address, "billing")
      ) {
        if (req.body.address.shipping) {
          if (
            Object.hasOwn(req.body.address.shipping, "street") ||
            Object.hasOwn(req.body.address.shipping, "city") ||
            Object.hasOwn(req.body.address.shipping, "pincode")
          ) {
            if (!isValidObject(req.body.address.shipping))
              return res.status(400).send({
                status: false,
                message: "Please enter shipping address as a valid object",
              });

            if (req.body.address.shipping.pincode?.length == 0)
              return res.status(400).send({
                status: false,
                message: "Please enter shipping pincode",
              });

            if (req.body.address.shipping.pincode) {
              let shippingPincode = req.body.address.shipping.pincode;
              if (!isValid(shippingPincode))
                return res.status(400).send({
                  status: false,
                  message: "Please enter shipping pincode",
                });

              if (!isValidPincode(shippingPincode))
                return res.status(400).send({
                  status: false,
                  message: "Please enter a valid shipping pincode",
                });
              data["address.shipping.pincode"] = shippingPincode;
            }

            if (req.body.address.shipping.city?.length == 0)
              return res
                .status(400)
                .send({ status: false, message: "Please enter shipping city" });

            if (req.body.address.shipping.city) {
              let shippingCity = req.body.address.shipping.city;
              if (!isValid(shippingCity))
                return res.status(400).send({
                  status: false,
                  message: "Please enter shipping city",
                });

              if (!isValidLname(shippingCity))
                return res.status(400).send({
                  status: false,
                  message: "Please enter valid shipping city",
                });
              data["address.shipping.city"] = shippingCity;
            }

            if (req.body.address.shipping.street?.length == 0)
              return res.status(400).send({
                status: false,
                message: "Please enter shipping street",
              });

            if (req.body.address.shipping.street) {
              let shippingStreet = req.body.address.shipping.street;
              if (!isValid(shippingStreet))
                return res.status(400).send({
                  status: false,
                  message: "Please enter shipping street",
                });
              if (!isValidStreet(req.body.address.shipping.street))
                return res.status(400).send({
                  status: false,
                  message: "Please enter a valid shipping street",
                });
              data["address.shipping.street"] = shippingStreet;
            }
          } else
            return res.status(400).send({
              status: false,
              message:
                "Please enter shipping street or shipping city or shipping pincode",
            });
        }

        if (req.body.address.billing) {
          if (
            Object.hasOwn(req.body.address.billing, "street") ||
            Object.hasOwn(req.body.address.billing, "city") ||
            Object.hasOwn(req.body.address.billing, "pincode")
          ) {
            if (!isValidObject(req.body.address.billing)) {
              return res.status(400).send({
                status: false,
                message: "Please enter billing address as a valid object",
              });
            }

            if (req.body.address.billing.pincode?.length == 0)
              return res.status(400).send({
                status: false,
                message: "Please enter billing pincode",
              });

            if (req.body.address.billing.pincode) {
              let billingPincode = req.body.address.billing.pincode;
              if (!isValid(billingPincode))
                return res.status(400).send({
                  status: false,
                  message: "Please enter billing pincode",
                });

              if (!isValidPincode(billingPincode))
                return res.status(400).send({
                  status: false,
                  message: "Please enter a valid billing pincode",
                });
              data["address.billing.pincode"] = billingPincode;
            }

            if (req.body.address.billing.city?.length == 0)
              return res
                .status(400)
                .send({ status: false, message: "Please enter billing city" });

            if (req.body.address.billing.city) {
              let billingCity = req.body.address.billing.city;
              if (!isValid(billingCity))
                return res.status(400).send({
                  status: false,
                  message: "Please enter billing city",
                });

              if (!isValidLname(billingCity))
                return res.status(400).send({
                  status: false,
                  message: "Please enter valid billing city",
                });

              data["address.billing.city"] = billingCity;
            }

            if (req.body.address.billing.street?.length == 0)
              return res.status(400).send({
                status: false,
                message: "Please enter billing street",
              });

            if (req.body.address.billing.street) {
              let billingStreet = req.body.address.billing.street;
              if (!isValid(billingStreet))
                return res.status(400).send({
                  status: false,
                  message: "Please enter billing street",
                });
              if (!isValidStreet(req.body.address.billing.street))
                return res.status(400).send({
                  status: false,
                  message: "Please enter a valid billing street",
                });
              data["address.billing.street"] = billingStreet;
            }
          } else
            return res.status(400).send({
              status: false,
              message:
                "Please enter billing street or billing city or billing pincode",
            });
        }
      } else
        return res.status(400).send({
          status: false,
          message: "Please enter shipping or billing address",
        });
    }

    if (data.phone || data.email) {
      let unique = await userModel.findOne({
        $or: [{ email: email }, { phone: phone }],
      });

      if (unique)
        return res
          .status(409)
          .send({ status: false, message: "Phone or Email should be unique" });
    }

    req.register = data;

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {
  userValidation,
  putUserValidations,
  isValid,
  isValidMail,
  isValidRequest,
  isValidFname,
};
