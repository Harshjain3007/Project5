const { isValidObjectId } = require("mongoose");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const { isValidRequest } = require("../validations/userValidations");

/////////////////////////////////----------------CREATE CART API-----------------------/////////////////////////////////////
const createCart = async (req, res) => {
  try {
    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input in body" });

    userId = req.params.userId;

    let { productId, cartId, quantity } = req.body;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid productId" });

    let thisProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!thisProduct)
      return res.status(400).send({
        status: false,
        message: "Product has been deleted or doesnt exists",
      });

    if (quantity?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter number of quantity",
      });

    if (quantity) {
      if (!/^[1-9][0-9]?$/.test(quantity))
        return res.status(400).send({
          status: false,
          message: "Please enter valid number of quantity (minimum 1)",
        });
    } else quantity = 1;

    let checkCartId = await cartModel.findOne({ userId: userId });

    if (cartId?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter cartId",
      });

    if (cartId) {
      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid cartId" });

      let checkCart = await cartModel.findById(cartId);

      if (!checkCart)
        return res
          .status(400)
          .send({ status: false, message: "CartId doesnt exist" });

      if (checkCartId._id != cartId)
        return res.status(403).send({
          status: false,
          message: "User is not authorized to access this cart",
        });
    }

    if (checkCartId) {
      let update = {};
      let products = checkCartId.items;
      let flag = false;
      let i = 0;

      for (i = 0; i < products.length; i++) {
        if (products[i].productId == productId) {
          flag = true;
          break;
        }
      }

      if (flag == true) {
        update[`items.${i}.quantity`] =
          checkCartId.items[i].quantity + parseInt(quantity);
        update.totalPrice =
          checkCartId.totalPrice + thisProduct.price * quantity;
      } else {
        update["$push"] = {
          items: { productId: productId, quantity: quantity },
        };
        update.totalPrice =
          checkCartId.totalPrice + thisProduct.price * quantity;
        update.totalItems = checkCartId.totalItems + 1;
      }

      let updatedCart = await cartModel
        .findOneAndUpdate({ userId: userId }, update, { new: true })
        .populate("items.productId", {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          isDeleted: 0,
          deletedAt: 0,
        })
        .select({ "items._id": 0, __v: 0, createdAt: 0, updatedAt: 0 });
      return res
        .status(200)
        .send({ status: true, message: "Success", data: updatedCart });
    } else {
      let created = {};
      created.userId = userId;
      created.items = { productId: productId, quantity: quantity };
      created.totalPrice = thisProduct.price * quantity;
      created.totalItems = 1;

      //let savedData = await cartModel.create(created);

      let data = await cartModel
        .findOneAndUpdate({ userId: userId }, created, {
          new: true,
          upsert: true,
        }) //upsert is used for creating new document if no document is found with this userId
        .populate("items.productId", {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          isDeleted: 0,
          deletedAt: 0,
        })
        .select({ "items._id": 0, __v: 0, createdAt: 0, updatedAt: 0 });

      return res
        .status(201)
        .send({ status: true, message: "Success", data: data });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////----------------UPDATE CART API-----------------------/////////////////////////////////////
const updateCart = async (req, res) => {
  try {
    let userId = req.params.userId;

    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input in body" });

    let { cartId, productId, removeProduct } = req.body;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid productId" });

    if (removeProduct != 1 && removeProduct != 0)
      return res.status(400).send({
        status: false,
        message: "Please enter valid removeProduct value as 1 or 0",
      });

    let checkCartId = await cartModel.findOne({ userId: userId }); //.populate("items.productId");

    if (!checkCartId)
      return res
        .status(404)
        .send({ status: false, message: "Cart doesnt exists" });

    if (checkCartId.items.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No items found inside cart" });

    if (cartId) {
      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid cartId" });

      if (checkCartId._id != cartId)
        return res.status(403).send({
          status: false,
          message: "User is not authorized to access this cart",
        });
    }

    //let thisProduct=checkCartId.items.find(e=>e.productId._id==productId)//this find is for array to reduce Db call

    let thisProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!thisProduct)
      return res.status(400).send({
        status: false,
        message: "Product has been deleted or does'nt exists",
      });

    let update = {};
    let product = checkCartId.items;
    let quantity = 0;
    let flag = false;
    let i = 0;

    for (i = 0; i < product.length; i++) {
      if (product[i].productId == productId) {
        quantity = product[i].quantity;
        flag = true;
        break;
      }
    }
    if (flag == false)
      return res.status(404).send({
        status: false,
        message: "Product has already been deleted or is not present in cart",
      });

    if (removeProduct == 0 || quantity == 1) {
      update["$pull"] = { items: { productId: productId } }; //Used pull to remove an element from an array
      update.totalPrice =
        checkCartId.totalPrice - thisProduct.price * product[i].quantity;
      update.totalItems = checkCartId.totalItems - 1;
    } else if (removeProduct == 1) {
      update[`items.${i}.quantity`] = checkCartId.items[i].quantity - 1;
      update.totalPrice = checkCartId.totalPrice - thisProduct.price;
    }

    if (Object.keys(update).length == 0)
      return res.status(404).send({
        status: false,
        message: "Nothing to update,please check your inputs",
      });

    let updatedCart = await cartModel
      .findOneAndUpdate({ userId: userId }, update, { new: true })
      .populate("items.productId", {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        isDeleted: 0,
        deletedAt: 0,
      })
      .select({ "items._id": 0, __v: 0 });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: updatedCart });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////----------------GET CART API-----------------------/////////////////////////////////////
const getCart = async (req, res) => {
  try {
    let userId = req.params.userId;

    let validCart = await cartModel
      .findOne({ userId: userId })
      .populate("items.productId", {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        isDeleted: 0,
        deletedAt: 0,
      })
      .select({ "items._id": 0, __v: 0 });
    if (!validCart)
      return res.status(404).send({ status: false, message: "No cart found" });
    return res
      .status(200)
      .send({ status: true, message: "Success", data: validCart });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////----------------DELETE CART API-----------------------/////////////////////////////////////
const deleteCart = async (req, res) => {
  try {
    let userId = req.params.userId;

    let validCart = await cartModel.findOne({ userId: userId });

    if (!validCart)
      return res.status(404).send({ status: false, message: "No cart found" });

    if (validCart.items.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No items found inside cart" });

    validCart.items = [];
    validCart.totalPrice = 0;
    validCart.totalItems = 0;

    await validCart.save();

    return res.status(204).send({ status: true, message: "Success" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
module.exports = { createCart, updateCart, getCart, deleteCart };
