const express = require("express")
const { authentication, authorization } = require("../auth/auth")
const { createCart, updateCart, getCart, deleteCart } = require("../controllers/cartController")
const { createOrder, updateOrder } = require("../controllers/orderController")
const { createProduct, getProducts, getProductDetails, updateProduct, deleteProduct } = require("../controllers/productController")
const { userRegister, putUser, loginUser, getUserDetails } = require("../controllers/userController")
const { createProductValidations, updateProductValidations } = require("../validations/productValidations")
const { userValidation, putUserValidations } = require("../validations/userValidations")
const router = express.Router()

//User APIs

router.post("/register", userValidation, userRegister)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, authorization, getUserDetails)
router.put("/user/:userId/profile", authentication, authorization, putUserValidations, putUser)

//Product APIs

router.post("/products", createProductValidations, createProduct)
router.get("/products", getProducts)
router.get("/products/:productId", getProductDetails)
router.put("/products/:productId", updateProductValidations, updateProduct)
router.delete("/products/:productId", deleteProduct)

//Cart APIs

router.post("/users/:userId/cart",authentication,authorization,createCart)
router.put("/users/:userId/cart",authentication,authorization,updateCart)
router.get("/users/:userId/cart",authentication,authorization,getCart)
router.delete("/users/:userId/cart",authentication,authorization,deleteCart)

//Order APIs

router.post("/users/:userId/orders",authentication,authorization,createOrder)
router.put("/users/:userId/orders",authentication,authorization,updateOrder)

router.all("/*", (req, res) => {
    res.status(400).send({status:false,message:"Invalid HTTP request"})
})

module.exports = router