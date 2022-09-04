const { isValidObjectId } = require("mongoose");
const orderModel = require("../models/orderModel");
const { isValidRequest, isValid } = require("../validations/userValidations");
const cartModel = require("../models/cartModel");

////////////////////////////////------------------------CREATE ORDER API-----------------------------//////////////////////////////////////
const createOrder = async function (req, res) {
  try {
    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input" });

    let keys = Object.keys(req.body);
    let flag = true;
    keys.forEach((e) => {
      if (!["cartId", "cancellable", "status"].includes(e))
        return (flag = false);
    });
    if (flag == false)
      return res
        .status(400)
        .send({
          status: false,
          message: "Inputs can either be cartId, cancellable or status",
        });

    userId = req.params.userId;

    let { cartId, cancellable, status } = req.body;

    if (status && status != "pending")
      return res
        .status(400)
        .send({ status: false, message: "Status can only be pending" });

    if (cancellable?.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter cancellable value" });

    if (Object.hasOwn(req.body, "cancellable")) {
      if (
        cancellable != true &&
        cancellable != false &&
        cancellable != "true" &&
        cancellable != "false"
      )
        return res.status(400).send({
          status: false,
          message: "cancellable value should be either true or false",
        });
    }

    let cart = await cartModel.findOne({ userId: userId }).populate("items.productId");

    if (!cart)
      return res.status(404).send({ status: false, message: "cart not found" });

    if (cart.items.length == 0)
      return res.status(404).send({
        status: false,
        message: "No items found inside cart",
      });

    if (cartId?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter cartId",
      });

    if (Object.hasOwn(req.body, "cartId")) {
      if (!isValid(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Please enter cartId" });

      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid cartId" });

      if (cart._id != cartId)
        return res.status(403).send({
          status: false,
          message: "User is not authorized to access this cart",
        });
    }

    let order = {};

    let totalQuantity = 0;
    let titles = "";
    cart.items.forEach((e) => {
      if (e.productId.isDeleted == true) {

        titles += `'${e.productId.title}'` + " ";

      } else if (e.productId.isDeleted == false) totalQuantity += e.quantity;
    });
    if (titles.length > 0)
      return res
        .status(400)
        .send({ status: false, message: `${titles} not available (deleted) ` });

    order.userId = userId;
    order.items = cart.items;
    order.totalPrice = cart.totalPrice;
    order.totalItems = cart.totalItems;
    order.totalQuantity = totalQuantity;
    order.cancellable = cancellable;
    order.status = status;

    let createdOrder = await orderModel.create(order);

    res.status(201).send({ status: true, message: "Success", data: createdOrder }); // here return is not used since we want JS to execute the bellow codes

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;

    await cart.save();
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

////////////////////////////////---------------------UPDATE ORDER API-----------------------------//////////////////////////////////////
const updateOrder = async (req, res) => {
  try {
    userId = req.params.userId;

    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input" });

    let { orderId, status } = req.body;

    if (!isValid(orderId))
      return res
        .status(400)
        .send({ status: false, message: "Please enter orderId" });

    if (!isValidObjectId(orderId))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid orderId" });

    if (!["completed", "cancelled"].includes(status))
      return res.status(400).send({
        status: false,
        message: "Status can only be updated to cancelled or completed",
      });

    let thisOrder = await orderModel.findOne({
      _id: orderId,
      isDeleted: false,
      status: "pending",
    });

    if (!thisOrder)
      return res.status(404).send({
        status: false,
        message: "Order not found or is deleted or is not pending",
      });

    if (thisOrder.userId != userId)
      return res.status(403).send({
        status: false,
        message: "User is not authorized to update this order",
      });

    if (thisOrder.cancellable == false && status == "cancelled")
      return res
        .status(400)
        .send({ status: false, message: "This order can not be cancelled" });

    let updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { status: status },
      { new: true }
    );

    res
      .status(200)
      .send({ status: true, message: "Success", data: updatedOrder });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createOrder, updateOrder };
