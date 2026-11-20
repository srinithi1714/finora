
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const User = require("./models/User");
const Budget = require("./models/budget");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- IMAGE UPLOAD --------------------

const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

app.use("/uploads", express.static(uploadFolder));

function removeProductImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;

  const fileName = path.basename(imageUrl);
  const filePath = path.join(uploadFolder, fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// -------------------- DATABASE MODELS --------------------

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  amount: Number,
  category: String,
  date: String
});

const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  category: String,
  size: String,
  color: String,
  quantity: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" }
}, { timestamps: true });

const saleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  quantity: Number,
  unitPrice: Number,
  total: Number,
  date: String
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  phone: String,
  email: String,
  address: String
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  customerName: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  item: String,
  size: String,
  color: String,
  quantity: Number,
  price: Number,
  deliveryDate: { type: String, default: "" },
  deliveryAddress: { type: String, default: "", trim: true },
  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Delivered",
      "In Progress",
      "Completed",
      "Cancelled"
    ],
    default: "Pending"
  }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  customerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  customerName: { type: String, default: "Customer" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" }
});

reviewSchema.index(
  { customerUserId: 1, productId: 1 },
  { unique: true }
);

const Expense = mongoose.models.Expense ||
  mongoose.model("Expense", expenseSchema);

const Product = mongoose.models.Product ||
  mongoose.model("Product", productSchema);

const Sale = mongoose.models.Sale ||
  mongoose.model("Sale", saleSchema);

const Customer = mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);

const Order = mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

const Review = mongoose.models.Review ||
  mongoose.model("Review", reviewSchema);

// -------------------- COMMON HELPERS --------------------

async function validUser(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return User.findById(id);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sendError(res, error, message = "Something went wrong") {
  console.error(message, error);
  return res.status(500).json({ message });
}

// -------------------- BASIC ROUTE --------------------

app.get("/", (req, res) => {
  res.send("FINORA Boutique Management API is running");
});

// -------------------- ADMIN REGISTER --------------------

app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      return res.status(403).json({
        message: "Admin registration is closed"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin"
    });

    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    sendError(res, error, "Admin registration failed");
  }
});

// -------------------- ADMIN LOGIN --------------------

app.post("/api/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password"
      });
    }

    // Find account by email first, then check its role.
    const user = await User.findOne({ email });

    console.log("Admin account found:", !!user);
    console.log("Admin role:", user ? user.role : "Account not found");

    if (!user) {
      return res.status(401).json({
        message: "Admin account not found. Check the registered email."
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "This account is not registered as Admin."
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "Admin password is missing."
      });
    }

    const match = await bcrypt.compare(password, user.password);

    console.log("Password matched:", match);

    if (!match) {
      return res.status(401).json({
        message: "Incorrect admin password."
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Admin login failed"
    });
  }
});

// -------------------- CUSTOMER REGISTER --------------------

app.post("/api/customer/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || "",
      address: address || "",
      role: "customer"
    });

    res.status(201).json({
      message: "Customer registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    sendError(res, error, "Customer registration failed");
  }
});

// -------------------- CUSTOMER LOGIN --------------------

app.post("/api/customer/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: (email || "").toLowerCase().trim(),
      role: "customer"
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid customer email or password"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid customer email or password"
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    sendError(res, error, "Customer login failed");
  }
});

// -------------------- CUSTOMER PROFILE --------------------

app.get("/api/customer/profile/:customerUserId", async (req, res) => {
  try {
    const user = await validUser(req.params.customerUserId);

    if (!user || user.role !== "customer") {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      address: user.address || ""
    });
  } catch (error) {
    sendError(res, error, "Could not load customer profile");
  }
});

app.put("/api/customer/profile/:customerUserId", async (req, res) => {
  try {
    const user = await validUser(req.params.customerUserId);

    if (!user || user.role !== "customer") {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const { fullName, phone } = req.body;

    if (typeof fullName === "string" && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      profile: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "",
        address: user.address || ""
      }
    });
  } catch (error) {
    sendError(res, error, "Could not update customer profile");
  }
});

// -------------------- PRODUCTS --------------------

app.get("/api/products/:userId", async (req, res) => {
  try {
    if (!(await validUser(req.params.userId))) {
      return res.status(404).json({ message: "User not found" });
    }

    const products = await Product.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    sendError(res, error, "Could not load products");
  }
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const {
      userId,
      name,
      category,
      size,
      color,
      quantity,
      purchasePrice,
      sellingPrice,
      imageUrl
    } = req.body;

    if (!(await validUser(userId))) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const product = await Product.create({
      userId,
      name,
      category,
      size,
      color,
      quantity: Number(quantity) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      imageUrl: req.file
        ? `/uploads/${req.file.filename}`
        : imageUrl || ""
    });

    res.status(201).json(product);
  } catch (error) {
    sendError(res, error, "Could not add product");
  }
});

app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      userId
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const fields = [
      "name",
      "category",
      "size",
      "color",
      "quantity",
      "purchasePrice",
      "sellingPrice"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (["quantity", "purchasePrice", "sellingPrice"].includes(field)) {
          product[field] = Number(req.body[field]) || 0;
        } else {
          product[field] = req.body[field];
        }
      }
    });

    if (req.file) {
      removeProductImage(product.imageUrl);
      product.imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      product.imageUrl = req.body.imageUrl;
    }

    await product.save();

    res.json(product);
  } catch (error) {
    sendError(res, error, "Could not update product");
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const product = await Product.findOne({
      _id: req.params.id,
      userId
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    removeProductImage(product.imageUrl);
    await Product.deleteOne({ _id: product._id });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    sendError(res, error, "Could not delete product");
  }
});

// -------------------- CUSTOMER STORE --------------------

app.get("/api/store/products", async (req, res) => {
  try {
    const products = await Product.find({
      quantity: { $gt: 0 }
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    sendError(res, error, "Could not load store products");
  }
});

// -------------------- CUSTOMER ORDERS --------------------

app.post("/api/customer/orders", async (req, res) => {
  let reservedProduct = null;

  try {
    const {
      customerUserId,
      productId,
      quantity,
      deliveryAddress
    } = req.body;

    const qty = Number(quantity);
    const customerAddress =
      typeof deliveryAddress === "string"
        ? deliveryAddress.trim()
        : "";

    if (
      !isValidObjectId(customerUserId) ||
      !isValidObjectId(productId) ||
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      return res.status(400).json({
        message: "Invalid customer, product, or quantity"
      });
    }

    if (!customerAddress) {
      return res.status(400).json({
        message: "Please enter your delivery address"
      });
    }

    const customer = await User.findById(customerUserId);

    if (!customer || customer.role !== "customer") {
      return res.status(400).json({
        message: "Invalid customer account"
      });
    }

    reservedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        quantity: { $gte: qty }
      },
      {
        $inc: { quantity: -qty }
      },
      { new: true }
    );

    if (!reservedProduct) {
      return res.status(400).json({
        message: "Not enough stock available"
      });
    }

    const order = await Order.create({
      userId: reservedProduct.userId,
      customerUserId: customer._id,
      customerName: customer.fullName,
      productId: reservedProduct._id,
      item: reservedProduct.name,
      size: reservedProduct.size || "",
      color: reservedProduct.color || "",
      quantity: qty,
      price: Number(reservedProduct.sellingPrice) * qty,
      deliveryAddress: customerAddress,
      status: "Pending"
    });

    res.status(201).json({
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    if (reservedProduct) {
      await Product.updateOne(
        { _id: reservedProduct._id },
        { $inc: { quantity: Number(req.body.quantity) || 0 } }
      );
    }

    sendError(res, error, "Could not place order");
  }
});

app.get("/api/customer/orders/:customerUserId", async (req, res) => {
  try {
    const customer = await validUser(req.params.customerUserId);

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const orders = await Order.find({
      customerUserId: customer._id
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    sendError(res, error, "Could not load customer orders");
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  try {
    const admin = await validUser(req.params.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({
        message: "Admin not found"
      });
    }

    const orders = await Order.find({
      userId: admin._id,
      customerUserId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    sendError(res, error, "Could not load orders");
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const { userId, status, deliveryDate } = req.body;

    if (!isValidObjectId(req.params.id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid order or admin ID"
      });
    }

    const admin = await validUser(userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Delivered",
      "In Progress",
      "Completed",
      "Cancelled"
    ];

    const order = await Order.findOne({
      _id: req.params.id,
      userId: admin._id,
      customerUserId: { $exists: true, $ne: null }
    });

    if (!order) {
      return res.status(404).json({
        message: "Customer order not found"
      });
    }

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status"
        });
      }

      order.status = status;
    }

    if (deliveryDate !== undefined) {
      order.deliveryDate = deliveryDate;
    }

    await order.save();

    res.json({
      message: "Order updated successfully",
      order
    });
  } catch (error) {
    sendError(res, error, "Could not update order");
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      userId,
      customerUserId: { $exists: true, $ne: null }
    });

    if (!order) {
      return res.status(404).json({
        message: "Customer order not found"
      });
    }

    if (order.productId && order.quantity > 0) {
      await Product.updateOne(
        { _id: order.productId },
        { $inc: { quantity: order.quantity } }
      );
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    sendError(res, error, "Could not delete order");
  }
});

app.delete("/api/orders/clear/:userId", async (req, res) => {
  try {
    const admin = await validUser(req.params.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    const orders = await Order.find({
      userId: admin._id,
      customerUserId: { $exists: true, $ne: null }
    });

    for (const order of orders) {
      if (order.productId && order.quantity > 0) {
        await Product.updateOne(
          { _id: order.productId },
          { $inc: { quantity: order.quantity } }
        );
      }
    }

    await Order.deleteMany({
      userId: admin._id,
      customerUserId: { $exists: true, $ne: null }
    });

    res.json({
      message: "Customer orders cleared successfully"
    });
  } catch (error) {
    sendError(res, error, "Could not clear orders");
  }
});

// -------------------- PRODUCT REVIEWS --------------------

app.get("/api/store/reviews", async (req, res) => {
  try {
    const filter = {};

    if (req.query.productId) {
      if (!isValidObjectId(req.query.productId)) {
        return res.status(400).json({
          message: "Invalid product ID"
        });
      }

      filter.productId = req.query.productId;
    }

    const reviews = await Review.find(filter)
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    sendError(res, error, "Could not load reviews");
  }
});

app.get("/api/customer/reviews/:customerUserId", async (req, res) => {
  try {
    const customer = await validUser(req.params.customerUserId);

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const reviews = await Review.find({
      customerUserId: customer._id
    })
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    sendError(res, error, "Could not load your reviews");
  }
});

app.post("/api/customer/reviews", async (req, res) => {
  try {
    const {
      customerUserId,
      productId,
      rating,
      comment,
      orderId
    } = req.body;

    const score = Number(rating);

    if (
      !isValidObjectId(customerUserId) ||
      !isValidObjectId(productId) ||
      !isValidObjectId(orderId) ||
      !Number.isInteger(score) ||
      score < 1 ||
      score > 5
    ) {
      return res.status(400).json({
        message: "Please provide a valid product, order, and 1–5 star rating"
      });
    }

    const customer = await User.findById(customerUserId);

    if (!customer || customer.role !== "customer") {
      return res.status(400).json({
        message: "Invalid customer account"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customerUserId: customer._id,
      productId,
      status: { $nin: ["Cancelled"] }
    });

    if (!order) {
      return res.status(403).json({
        message: "You can review only a product you have ordered"
      });
    }

    const existingReview = await Review.findOne({
      customerUserId: customer._id,
      productId
    });

    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this product"
      });
    }

    const review = await Review.create({
      customerUserId: customer._id,
      productId,
      orderId: order._id,
      customerName: customer.fullName,
      rating: score,
      comment: (comment || "").trim()
    });

    res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product"
      });
    }

    sendError(res, error, "Could not submit review");
  }
});

// -------------------- SALES --------------------

app.get("/api/sales/:userId", async (req, res) => {
  try {
    const sales = await Sale.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    sendError(res, error, "Could not load sales");
  }
});

app.post("/api/sales", async (req, res) => {
  try {
    const {
      userId,
      productId,
      productName,
      quantity,
      unitPrice,
      total,
      date
    } = req.body;

    const sale = await Sale.create({
      userId,
      productId: productId || null,
      productName,
      quantity: Number(quantity) || 0,
      unitPrice: Number(unitPrice) || 0,
      total: Number(total) || 0,
      date
    });

    if (productId && isValidObjectId(productId)) {
      await Product.updateOne(
        { _id: productId, userId },
        { $inc: { quantity: -(Number(quantity) || 0) } }
      );
    }

    res.status(201).json(sale);
  } catch (error) {
    sendError(res, error, "Could not add sale");
  }
});

app.delete("/api/sales/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const sale = await Sale.findOneAndDelete({
      _id: req.params.id,
      userId
    });

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found"
      });
    }

    if (sale.productId && sale.quantity > 0) {
      await Product.updateOne(
        { _id: sale.productId, userId },
        { $inc: { quantity: sale.quantity } }
      );
    }

    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    sendError(res, error, "Could not delete sale");
  }
});

// -------------------- CUSTOMERS --------------------

app.get("/api/customers/:userId", async (req, res) => {
  try {
    const customers = await Customer.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (error) {
    sendError(res, error, "Could not load customers");
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    sendError(res, error, "Could not add customer");
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json(customer);
  } catch (error) {
    sendError(res, error, "Could not update customer");
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    sendError(res, error, "Could not delete customer");
  }
});

// -------------------- EXPENSES --------------------

app.get("/api/expenses/:userId", async (req, res) => {
  try {
    const expenses = await Expense.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    sendError(res, error, "Could not load expenses");
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (error) {
    sendError(res, error, "Could not add expense");
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.json(expense);
  } catch (error) {
    sendError(res, error, "Could not update expense");
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    sendError(res, error, "Could not delete expense");
  }
});

// -------------------- BUDGET --------------------

app.get("/api/budget/:userId", async (req, res) => {
  try {
    const budget = await Budget.findOne({
      userId: req.params.userId
    });

    res.json(budget || {});
  } catch (error) {
    sendError(res, error, "Could not load budget");
  }
});

app.post("/api/budget", async (req, res) => {
  try {
    const { userId } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(budget);
  } catch (error) {
    sendError(res, error, "Could not save budget");
  }
});

// -------------------- ERROR HANDLER --------------------

app.use((error, req, res, next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Image must be smaller than 5MB"
        : error.message
    });
  }

  res.status(500).json({
    message: error.message || "Server error"
  });
});

// -------------------- DATABASE CONNECTION --------------------

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });
