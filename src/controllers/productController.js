const { isValidObjectId } = require("mongoose");
const { uploadFile } = require("../aws/aws");
const productModel = require("../models/productModel");
const { isValidTitle, isValidName } = require("../validations/productValidations");
const { isValid, isValidRequest, isValidFname } = require("../validations/userValidations");

/////////////////////////////////////-----------------CREATE PRODUCT API--------------------//////////////////////////////////////
const createProduct = async (req, res) => {
  try {
    let data = req.update;

    let file = req.files;

    if (file && file.length > 0) {
      let productImage = await uploadFile(file[0]);
      if (productImage.error)
        return res
          .status(400)
          .send({ status: false, message: productImage.error });
      data.productImage = productImage;
    } else
      return res
        .status(400)
        .send({ status: false, message: "Please upload product image" });

    let savedData = await productModel.create(data);

    res.status(201).send({
      status: true,
      message: "Product created successfully",
      data: savedData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////////-----------------GET PRODUCT API--------------------//////////////////////////////////////
const getProducts = async (req, res) => {
  try {
    let query = req.query;

    if (isValidRequest(req.body))
      return res.status(400).send({
        status: false,
        message: "Please enter input in query params",
      });

    if (query) {
      let keys = Object.keys(query);

      let validKeys = [
        "priceGreaterThan",
        "size",
        "priceLessThan",
        "priceSort",
        "name",
      ];

      let check = true;
      keys.map((e) => {
        if (!validKeys.includes(e)) return (check = false);
      });

      if (!check)
        return res.status(400).send({
          status: false,
          message: "Please enter valid query params",
        });
    }

    if (query.name?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter a valid title name",
      });

    if (query.priceGreaterThan?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter priceGreaterThan value",
      });

    if (query.priceLessThan?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter priceLessThan value",
      });

    if (query.size?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter size value",
      });

    if (query.priceSort?.length == 0)
      return res.status(400).send({
        status: false,
        message: "Please enter priceSort value",
      });

    const product = { isDeleted: false };

    if (query.size) {
      let allowedSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];

      if (!isValid(query.size))
        return res
          .status(400)
          .send({ status: false, message: "Please enter a available size" });

      query.size = query.size.toUpperCase();

      let check = true;
      let sizes = query.size
        .trim()
        .split(",")
        .map((e) => e.trim());

      sizes.map((e) => {
        if (!allowedSizes.includes(e)) return (check = false);
      });
      if (check == false)
        return res.status(400).send({
          status: false,
          message: "Sizes can only be S, XS, M, X, L, XL, XXL",
        });

      product.availableSizes = { $in: sizes };
    }

    if (query.name) {
      if (!isValid(query.name))
        return res.status(400).send({
          status: false,
          message: "Please enter a valid title name",
        });

      if (!isValidName(query.name))
        return res.status(400).send({
          status: false,
          message: "Please enter a valid title name",
        });
      product.title = { $regex: query.name, $options: "i" };
    }

    if (query.priceGreaterThan) {
      if (!/^[0-9]+$/.test(query.priceGreaterThan))
        return res.status(400).send({
          status: false,
          message: "Please enter a valid product price",
        });
      product.price = { $gt: query.priceGreaterThan };
    }
    if (query.priceLessThan) {
      if (!/^[0-9]+$/.test(query.priceLessThan))
        return res.status(400).send({
          status: false,
          message: "Please enter a valid product price",
        });
      product.price = { $lt: query.priceLessThan };
    }
    if (query.priceGreaterThan && query.priceLessThan)
      product.price = { $lt: query.priceLessThan, $gt: query.priceGreaterThan };

    if (query.priceSort) {
      if (query.priceSort != "1" && query.priceSort != "-1")
        return res.status(400).send({
          status: false,
          message: "Please enter priceSort value as 1 or -1 only",
        });
    }

    const getProductDetails = await productModel
      .find(product)
      .sort({ price: query.priceSort });

    if (getProductDetails.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No products found" });

    res.status(200).send({ status: true, message:"Success",data: getProductDetails });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////////-----------------GET PRODUCT BY ID API--------------------//////////////////////////////////////
const getProductDetails = async (req, res) => {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res.status(400).send({
        status: false,
        message: "ProductId is not a valid ObjectId",
      });

    let product = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product)
      return res.status(404).send({
        status: false,
        message: "No products found or product has been deleted",
      });
    res.status(200).send({ status: true, message: "Success", data: product });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////////-----------------UPDATE PRODUCT API--------------------//////////////////////////////////////
const updateProduct = async (req, res) => {
  try {
    let data = req.productUpdate;
    let productId = req.params.productId;
    if (Object.keys(data).length == 0)
      return res.status(400).send({
        status: false,
        message: "Nothing to update ,please check your inputs",
      });

    let productUpdate = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      data,
      { new: true }
    );
    if (!productUpdate)
      return res.status(404).send({
        status: false,
        message: "No products found or product has been deleted",
      });
    res
      .status(200)
      .send({ status: true, message: "Success", data: productUpdate });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

/////////////////////////////////////-----------------DELETE PRODUCT API--------------------//////////////////////////////////////
const deleteProduct = async (req, res) => {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res.status(400).send({
        status: false,
        message: "ProductId is not a valid ObjectId",
      });

    let deleteProduct = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
    if (!deleteProduct)
      return res.status(404).send({
        status: false,
        message: "No products found or product has been deleted",
      });

    res
      .status(200)
      .send({
        status: true,
        message: "Product has been deleted",
        data: deleteProduct,
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
};
