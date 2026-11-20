import { useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000";

function getAutoProductImage(name) {
  const value = (name || "").toLowerCase().trim();

  const images = {
    kurti: "https://www.blocksofindia.com/cdn/shop/files/3_7e50fe14-cb4b-444f-afb5-6ad9fb4a8a5a_1200x1200.jpg?v=1683107842",
    saree: "https://www.santarms.com/cdn/shop/files/Banarasi_Silk_Saree_with_Blouse.jpg?v=1763615806&width=1500",
    jeans: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
    shawl: "https://officeandyouasia.com/cdn/shop/files/CR-11.jpg?v=1767432138&width=2000",
    dress: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",
    top: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
    blouse: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80",
    earrings: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
    necklace: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80",
    bangles: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80",
    bracelet: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=600&q=80",
    handbag: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
    watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    hairclip: "https://images.unsplash.com/photo-1635767798638-3665a7e3e5d4?auto=format&fit=crop&w=600&q=80",
    clothing: "https://images.unsplash.com/photo-1542060748-10c28b62716f?auto=format&fit=crop&w=600&q=80"
  };

  if (value.includes("saree") || value.includes("sari")) return images.saree;
  if (value.includes("kurti")) return images.kurti;
  if (value.includes("shawl") || value.includes("stole")) return images.shawl;
  if (["jean", "pant", "trouser", "palazzo"].some(x => value.includes(x))) return images.jeans;
  if (value.includes("earring")) return images.earrings;
  if (value.includes("necklace") || value.includes("chain")) return images.necklace;
  if (value.includes("bangle")) return images.bangles;
  if (value.includes("bracelet")) return images.bracelet;
  if (["handbag", "purse", "bag"].some(x => value.includes(x))) return images.handbag;
  if (value.includes("watch")) return images.watch;
  if (value.includes("hair clip") || value.includes("hairclip") || value.includes("hair pin")) return images.hairclip;
  if (["dress", "gown", "maxi"].some(x => value.includes(x))) return images.dress;
  if (value.includes("blouse")) return images.blouse;
  if (["top", "shirt", "t-shirt"].some(x => value.includes(x))) return images.top;
  return images.clothing;
}

function getDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
}

const TRACKING_STEPS = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];

function getTrackingStatus(status) {
  if (status === "In Progress") return "Packed";
  if (status === "Completed") return "Delivered";
  return status || "Pending";
}

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [accountType, setAccountType] = useState("admin");
  const [portalSelected, setPortalSelected] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [page, setPage] = useState("Dashboard");

  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(10000);

  const [storeProducts, setStoreProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: ""
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: ""
  });

  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    productId: "",
    orderId: "",
    rating: 5,
    comment: ""
  });

  const [productForm, setProductForm] = useState({
    name: "",
    category: "Clothing",
    size: "",
    color: "",
    quantity: "",
    purchasePrice: "",
    sellingPrice: "",
    imageUrl: ""
  });

  const [saleForm, setSaleForm] = useState({
    productId: "",
    quantity: 1,
    unitPrice: ""
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Shop expenses"
  });

  const [message, setMessage] = useState("");
  const uid = user?.id;

  const getImageSrc = value => {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    return `${API}${value.startsWith("/") ? "" : "/"}${value}`;
  };

  const money = value => "₹" + Number(value || 0).toLocaleString("en-IN");

  // ---------------- ADMIN DATA ----------------

  const loadData = async id => {
    const endpoints = [
      ["products", `/api/products/${id}`],
      ["sales", `/api/sales/${id}`],
      ["customers", `/api/customers/${id}`],
      ["orders", `/api/orders/${id}`],
      ["expenses", `/api/expenses/${id}`],
      ["budget", `/api/budget/${id}`]
    ];

    for (const [key, url] of endpoints) {
      try {
        const response = await axios.get(API + url);
        if (key === "products") setProducts(response.data);
        if (key === "sales") setSales(response.data);
        if (key === "customers") setCustomers(response.data);
        if (key === "orders") setOrders(response.data);
        if (key === "expenses") setExpenses(response.data);
        if (key === "budget") setBudget(response.data.monthlyBudget || 10000);
      } catch (error) {
        console.log(key, error);
      }
    }
  };

  const refreshOrders = async () => {
    if (!uid) return setMessage("Please log in again.");

    try {
      const response = await axios.get(`${API}/api/orders/${uid}`);
      setOrders(response.data);
      setMessage("Orders refreshed successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not refresh orders.");
    }
  };

  const clearOrders = async () => {
    if (!uid) return setMessage("Please log in again.");
    if (!window.confirm("Permanently delete all customer orders?")) return;

    try {
      await axios.delete(`${API}/api/orders/clear/${uid}`);
      setOrders([]);
      setMessage("Customer orders cleared successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not clear orders.");
    }
  };

  // ---------------- CUSTOMER DATA ----------------

  const loadStoreProducts = async () => {
    setStoreLoading(true);

    try {
      const response = await axios.get(API + "/api/store/products");
      setStoreProducts(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load products.");
    } finally {
      setStoreLoading(false);
    }
  };

  const loadCustomerOrders = async customerId => {
    try {
      const response = await axios.get(`${API}/api/customer/orders/${customerId}`);
      setCustomerOrders(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load your orders.");
    }
  };

  const loadProfile = async customerId => {
    try {
      const response = await axios.get(`${API}/api/customer/profile/${customerId}`);
      setProfile(response.data);
      setProfileForm({
        fullName: response.data.fullName || "",
        phone: response.data.phone || ""
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load profile.");
    }
  };

  const saveProfile = async e => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `${API}/api/customer/profile/${uid}`,
        profileForm
      );

      setProfile(response.data.profile);
      setUser({ ...user, fullName: response.data.profile.fullName });
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update profile.");
    }
  };

  const loadReviews = async () => {
    try {
      const [allResponse, mineResponse] = await Promise.all([
        axios.get(API + "/api/store/reviews"),
        axios.get(`${API}/api/customer/reviews/${uid}`)
      ]);

      setReviews(allResponse.data);
      setMyReviews(mineResponse.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load reviews.");
    }
  };

  const submitReview = async e => {
    e.preventDefault();

    try {
      const response = await axios.post(API + "/api/customer/reviews", {
        customerUserId: uid,
        ...reviewForm
      });

      setMessage(response.data.message || "Review submitted!");
      setReviewForm({
        productId: "",
        orderId: "",
        rating: 5,
        comment: ""
      });

      await loadReviews();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit review.");
    }
  };

  // ---------------- AUTHENTICATION ----------------

  const handleAuth = async e => {
    e.preventDefault();

    try {
      let url;
      let body;

      if (accountType === "customer") {
        url = authMode === "register"
          ? "/api/customer/register"
          : "/api/customer/login";

        body = authMode === "register"
          ? { fullName, email, password }
          : { email, password };
      } else {
        url = authMode === "register" ? "/api/register" : "/api/login";

        body = authMode === "register"
          ? { fullName, email, password }
          : { email, password };
      }

      const response = await axios.post(API + url, body);
      const loggedUser = { ...response.data.user, role: accountType };

      setUser(loggedUser);
      setMessage("");

      if (accountType === "admin") {
        await loadData(loggedUser.id);
        setPage("Dashboard");
      } else {
        setPage("Store");

        await Promise.all([
          loadStoreProducts(),
          loadCustomerOrders(loggedUser.id),
          loadProfile(loggedUser.id),
          loadReviews()
        ]);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  // ---------------- CART ----------------

  const addToCart = product => {
    const productId = product._id || product.id;
    const existing = cart.find(item => item.product._id === productId);
    const currentQuantity = existing ? existing.quantity : 0;

    if (currentQuantity >= Number(product.quantity)) {
      return setMessage("You have reached the available stock quantity.");
    }

    if (existing) {
      setCart(cart.map(item =>
        item.product._id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product: { ...product, _id: productId }, quantity: 1 }]);
    }

    setMessage("Product added to cart!");
  };

  const changeCartQuantity = (productId, quantity) => {
    const newQuantity = Number(quantity);
    const item = cart.find(x => x.product._id === productId);

    if (!item) return;

    if (newQuantity < 1) {
      setCart(cart.filter(x => x.product._id !== productId));
      return;
    }

    if (newQuantity > Number(item.product.quantity)) {
      return setMessage("Not enough stock available.");
    }

    setCart(cart.map(x =>
      x.product._id === productId ? { ...x, quantity: newQuantity } : x
    ));
  };

  const removeFromCart = productId =>
    setCart(cart.filter(item => item.product._id !== productId));

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.sellingPrice || 0) * item.quantity,
    0
  );

  // ---------------- PLACE CUSTOMER ORDER ----------------

  const placeCustomerOrder = async () => {
    if (!cart.length) {
      return setMessage("Your cart is empty.");
    }

    const trimmedAddress = deliveryAddress.trim();

    if (!trimmedAddress) {
      return setMessage("Please enter your delivery address before placing the order.");
    }

    let placedCount = 0;

    try {
      for (const item of cart) {
        await axios.post(API + "/api/customer/orders", {
          customerUserId: uid,
          productId: item.product._id,
          quantity: item.quantity,
          deliveryAddress: trimmedAddress
        });

        placedCount++;
      }

      setCart([]);
      setMessage("Your order has been placed successfully!");

      await Promise.all([
        loadStoreProducts(),
        loadCustomerOrders(uid)
      ]);
    } catch (error) {
      setMessage(
        placedCount
          ? `${placedCount} cart item(s) were ordered. One or more remaining items could not be ordered: ${error.response?.data?.message || "Please check stock."}`
          : error.response?.data?.message || "Could not place your order."
      );

      await Promise.all([
        loadStoreProducts(),
        loadCustomerOrders(uid)
      ]);
    }
  };

  // ---------------- LOGOUT ----------------

  const logout = () => {
    setUser(null);
    setAccountType("admin");
    setPortalSelected(false);
    setAuthMode("login");
    setPage("Dashboard");
    setCart([]);
    setStoreProducts([]);
    setCustomerOrders([]);
    setOrders([]);
    setReviews([]);
    setMyReviews([]);
    setDeliveryAddress("");
    setMessage("");
    setFullName("");
    setEmail("");
    setPassword("");
  };

  // ---------------- ADMIN PRODUCT MANAGEMENT ----------------

  const addProduct = async e => {
    e.preventDefault();

    if (!uid) return setMessage("Please log in again.");

    const formData = new FormData();

    formData.append("userId", String(uid));
    formData.append("name", productForm.name);
    formData.append("category", productForm.category);
    formData.append("size", productForm.size);
    formData.append("color", productForm.color);
    formData.append("quantity", String(Number(productForm.quantity)));
    formData.append("purchasePrice", String(Number(productForm.purchasePrice)));
    formData.append("sellingPrice", String(Number(productForm.sellingPrice)));
    formData.append("imageUrl", getAutoProductImage(productForm.name));

    try {
      const url = editingProductId
        ? `${API}/api/products/${editingProductId}`
        : `${API}/api/products`;

      const response = await fetch(url, {
        method: editingProductId ? "PUT" : "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save product.");
      }

      setMessage(result.message || "Product saved successfully!");

      setProductForm({
        name: "",
        category: "Clothing",
        size: "",
        color: "",
        quantity: "",
        purchasePrice: "",
        sellingPrice: "",
        imageUrl: ""
      });

      setEditingProductId(null);
      await loadData(uid);
    } catch (error) {
      setMessage(error.message || "Could not save product.");
    }
  };

  const editProduct = product => {
    setEditingProductId(product._id || product.id);

    setProductForm({
      name: product.name || "",
      category: product.category || "Clothing",
      size: product.size || "",
      color: product.color || "",
      quantity: product.quantity ?? "",
      purchasePrice: product.purchasePrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      imageUrl: product.imageUrl || ""
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);

    setProductForm({
      name: "",
      category: "Clothing",
      size: "",
      color: "",
      quantity: "",
      purchasePrice: "",
      sellingPrice: "",
      imageUrl: ""
    });
  };

  const deleteProduct = async id => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await axios.delete(`${API}/api/products/${id}`, {
        data: { userId: uid }
      });

      await loadData(uid);
      setMessage("Product deleted.");
    } catch {
      setMessage("Could not delete product.");
    }
  };

  // ---------------- SALES ----------------

  const addSale = async e => {
    e.preventDefault();

    const selected = products.find(p =>
      (p._id || p.id) === saleForm.productId
    );

    if (!selected) return setMessage("Please select a product.");

    if (Number(saleForm.quantity) > selected.quantity) {
      return setMessage("Not enough stock available.");
    }

    try {
      const quantity = Number(saleForm.quantity);
      const unitPrice = Number(saleForm.unitPrice || selected.sellingPrice);

      await axios.post(API + "/api/sales", {
        userId: uid,
        productId: selected._id || selected.id,
        productName: selected.name,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
        date: new Date().toISOString()
      });

      setSaleForm({
        productId: "",
        quantity: 1,
        unitPrice: ""
      });

      await loadData(uid);
      setMessage("Sale recorded successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not record sale.");
    }
  };

  // ---------------- CUSTOMERS ----------------

  const addCustomer = async e => {
    e.preventDefault();

    try {
      await axios.post(API + "/api/customers", {
        userId: uid,
        ...customerForm
      });

      setCustomerForm({
        name: "",
        phone: "",
        email: "",
        address: ""
      });

      await loadData(uid);
      setMessage("Customer added successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not add customer.");
    }
  };

  const deleteCustomer = async id => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await axios.delete(`${API}/api/customers/${id}`, {
        data: { userId: uid }
      });

      await loadData(uid);
    } catch {
      setMessage("Could not delete customer.");
    }
  };

  // ---------------- ADMIN ORDER MANAGEMENT ----------------

  const updateOrder = async (id, changes) => {
    try {
      await axios.put(`${API}/api/orders/${id}`, {
        userId: uid,
        ...changes
      });

      const response = await axios.get(`${API}/api/orders/${uid}`);
      setOrders(response.data);
      setMessage("Order updated successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update order.");
    }
  };

  const deleteOrder = async id => {
    if (!window.confirm("Delete this customer order?")) return;

    try {
      await axios.delete(`${API}/api/orders/${id}`, {
        data: { userId: uid }
      });

      await refreshOrders();
      setMessage("Order deleted successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete order.");
    }
  };

  // ---------------- EXPENSES AND BUDGET ----------------

  const addExpense = async e => {
    e.preventDefault();

    try {
      await axios.post(API + "/api/expenses", {
        userId: uid,
        title: expenseForm.title,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        date: new Date().toISOString()
      });

      setExpenseForm({
        title: "",
        amount: "",
        category: "Shop expenses"
      });

      await loadData(uid);
      setMessage("Expense saved!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save expense.");
    }
  };

  const deleteExpense = async id => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await axios.delete(`${API}/api/expenses/${id}`, {
        data: { userId: uid }
      });

      await loadData(uid);
    } catch {
      setMessage("Could not delete expense.");
    }
  };

  const saveBudget = async e => {
    e.preventDefault();

    try {
      await axios.post(API + "/api/budget", {
        userId: uid,
        monthlyBudget: Number(budget)
      });

      setMessage("Monthly budget updated!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update budget.");
    }
  };

  // ---------------- CALCULATIONS ----------------

  const salesTotal = sales.reduce(
    (sum, s) => sum + Number(s.total || 0),
    0
  );

  const expenseTotal = expenses.reduce(
    (sum, x) => sum + Number(x.amount || 0),
    0
  );

  const stockCount = products.reduce(
    (sum, p) => sum + Number(p.quantity || 0),
    0
  );

  const pendingOrders = orders.filter(o =>
    !["Completed", "Delivered", "Cancelled"].includes(o.status)
  ).length;

  const lowStock = products.filter(
    p => Number(p.quantity) <= 5
  ).length;

  const navItems = [
    "Dashboard",
    "Inventory",
    "Sales",
    "Customers",
    "Orders",
    "Expenses",
    "Reports",
    "Settings"
  ];

  // ---------------- PORTAL SELECTION PAGE ----------------

  if (!user && !portalSelected) {
    return (
      <div className="portal-page">
        <div className="portal-heading">
          <div className="brand-logo">F</div>

          <h1>FINORA</h1>

          <p className="portal-subtitle">
            BOUTIQUE MANAGEMENT SYSTEM
          </p>

          <h2>Welcome to FINORA</h2>

          <p>Choose your portal to continue</p>
        </div>

        <div className="portal-container">
          <div className="portal-card admin-card">
            <div className="portal-icon">🛡️</div>

            <h2>Admin Portal</h2>

            <p>
              Manage products, inventory, customers,
              sales and boutique orders.
            </p>

            <button
              onClick={() => {
                setAccountType("admin");
                setAuthMode("login");
                setPortalSelected(true);
                setMessage("");
                setFullName("");
                setEmail("");
                setPassword("");
              }}
            >
              Admin Login
            </button>
          </div>

          <div className="portal-card customer-card">
            <div className="portal-icon">🛍️</div>

            <h2>Customer Portal</h2>

            <p>
              Explore boutique products, shop online
              and track your orders.
            </p>

            <button
              onClick={() => {
                setAccountType("customer");
                setAuthMode("login");
                setPortalSelected(true);
                setMessage("");
                setFullName("");
                setEmail("");
                setPassword("");
              }}
            >
              Customer Login
            </button>
          </div>
        </div>

        <p className="portal-footer">
          FINORA · Your Boutique, Your Style
        </p>
      </div>
    );
  }

  // ---------------- SEPARATE LOGIN AND REGISTER PAGE ----------------

  if (!user && portalSelected) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <button
            type="button"
            className="small-btn"
            onClick={() => {
              setPortalSelected(false);
              setMessage("");
              setFullName("");
              setEmail("");
              setPassword("");
              setAuthMode("login");
            }}
          >
            ← Back to Portals
          </button>

          <div className="auth-brand">
            <div className="brand-logo">F</div>
            <p className="brand-name">FINORA</p>
            <span>BOUTIQUE MANAGEMENT</span>
          </div>

          <h1>
            {accountType === "admin"
              ? "Admin Portal"
              : "Customer Portal"}
          </h1>

          <p className="muted">
            {accountType === "admin"
              ? "Login to manage your boutique."
              : "Login to explore and shop our collection."}
          </p>

          <form onSubmit={handleAuth} className="form-stack">

            {authMode === "register" && (
              <input
                placeholder="Full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength="6"
            />

            <button className="primary-btn" type="submit">
              {authMode === "register"
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          {message && (
            <p className="notice">{message}</p>
          )}

          {/* Registration is available only for customers */}

          {accountType === "customer" && (
            <p className="auth-switch">
              {authMode === "register"
                ? "Already have an account?"
                : "New to FINORA?"}

              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setAuthMode(
                    authMode === "register" ? "login" : "register"
                  );
                  setMessage("");
                  setFullName("");
                  setEmail("");
                  setPassword("");
                }}
              >
                {authMode === "register"
                  ? "Login"
                  : "Create account"}
              </button>
            </p>
          )}

          {accountType === "admin" && (
            <p className="muted" style={{ marginTop: "18px" }}>
              Administrator access only.
            </p>
          )}

        </div>
      </div>
    );
  }

  // ---------------- CUSTOMER STORE ----------------

  if (user.role === "customer") {
    const cartCount = cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const reviewedProductIds = myReviews.map(r =>
      typeof r.productId === "object"
        ? r.productId?._id
        : r.productId
    );

    const eligibleOrders = customerOrders.filter(o =>
      o.productId &&
      !["Cancelled"].includes(o.status) &&
      !reviewedProductIds.includes(
        typeof o.productId === "object"
          ? o.productId?._id
          : o.productId
      )
    );

    const productRatings = productId => {
      const matching = reviews.filter(r =>
        (typeof r.productId === "object"
          ? r.productId?._id
          : r.productId) === productId
      );

      if (!matching.length) {
        return { average: 0, count: 0 };
      }

      return {
        average: matching.reduce(
          (sum, r) => sum + Number(r.rating),
          0
        ) / matching.length,
        count: matching.length
      };
    };

    return (
      <div style={{
        minHeight: "100vh",
        background: "#faf8f6",
        color: "#302923",
        padding: "25px"
      }}>
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          borderBottom: "1px solid #e8dfd8",
          paddingBottom: "20px",
          marginBottom: "25px"
        }}>
          <div>
            <h1 style={{
              margin: 0,
              letterSpacing: "5px",
              fontSize: "28px"
            }}>
              FINORA
            </h1>
            <small style={{ letterSpacing: "2px" }}>
              YOUR BOUTIQUE STORE
            </small>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <span>Welcome, {user.fullName || user.name}</span>

            {["Store", "Cart", "My Orders", "My Profile", "Reviews"].map(item => (
              <button
                key={item}
                className="small-btn"
                onClick={() => {
                  setPage(item);
                  setMessage("");

                  if (item === "Store") loadStoreProducts();
                  if (item === "My Orders") loadCustomerOrders(uid);
                  if (item === "My Profile") loadProfile(uid);

                  if (item === "Reviews") {
                    loadReviews();
                    loadCustomerOrders(uid);
                  }
                }}
              >
                {item === "Cart" ? `Cart (${cartCount})` : item}
              </button>
            ))}

            <button className="delete-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        {message && (
          <div className="notice" style={{ marginBottom: "20px" }}>
            {message}
            <button
              onClick={() => setMessage("")}
              style={{ marginLeft: "12px" }}
            >
              ×
            </button>
          </div>
        )}

        {/* SHOP */}

        {page === "Store" && (
          <>
            <section style={{
              padding: "35px 20px",
              background: "#eee5dc",
              borderRadius: "14px",
              marginBottom: "30px"
            }}>
              <p style={{ letterSpacing: "3px", fontSize: "12px" }}>
                THE FINORA COLLECTION
              </p>
              <h2 style={{ fontSize: "30px", margin: "10px 0" }}>
                Discover your style.
              </h2>
              <p>Explore the latest products from our boutique.</p>
            </section>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              <h2>Our Products</h2>
              <button className="small-btn" onClick={loadStoreProducts}>
                Refresh Products
              </button>
            </div>

            {storeLoading ? (
              <p>Loading products...</p>
            ) : storeProducts.length === 0 ? (
              <div className="panel">
                <h3>No products available yet.</h3>
                <p className="muted">
                  Please check again after the boutique admin adds products.
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "22px"
              }}>
                {storeProducts.map(product => {
                  const id = product._id || product.id;
                  const rating = productRatings(id);

                  return (
                    <div
                      key={id}
                      style={{
                        background: "#fff",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid #eee5dc"
                      }}
                    >
                      <img
                        src={getImageSrc(product.imageUrl) || getAutoProductImage(product.name)}
                        alt={product.name}
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getAutoProductImage(product.name);
                        }}
                        style={{
                          width: "100%",
                          height: "240px",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />

                      <div style={{ padding: "15px" }}>
                        <small style={{
                          color: "#927d6c",
                          textTransform: "uppercase"
                        }}>
                          {product.category}
                        </small>

                        <h3 style={{ margin: "8px 0" }}>
                          {product.name}
                        </h3>

                        <p>Size: {product.size || "Free Size"}</p>
                        <p>Color: {product.color || "As shown"}</p>

                        <p style={{
                          fontWeight: "bold",
                          fontSize: "19px"
                        }}>
                          {money(product.sellingPrice)}
                        </p>

                        <p style={{
                          fontSize: "13px",
                          color: "#6c6259"
                        }}>
                          {product.quantity} available
                        </p>

                        <p style={{ fontSize: "13px" }}>
                          {rating.count
                            ? `★ ${rating.average.toFixed(1)} (${rating.count} reviews)`
                            : "No reviews yet"}
                        </p>

                        <button
                          className="primary-btn"
                          style={{ width: "100%" }}
                          disabled={Number(product.quantity) <= 0}
                          onClick={() => addToCart(product)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CART AND CHECKOUT */}

        {page === "Cart" && (
          <section>
            <h2>My Shopping Cart</h2>

            {!cart.length ? (
              <div className="panel">
                <h3>Your cart is empty.</h3>
                <button
                  className="primary-btn"
                  onClick={() => setPage("Store")}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="panel">
                  {cart.map(item => (
                    <div
                      key={item.product._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "18px",
                        padding: "15px 0",
                        borderBottom: "1px solid #eee"
                      }}
                    >
                      <img
                        src={getImageSrc(item.product.imageUrl) || getAutoProductImage(item.product.name)}
                        alt={item.product.name}
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getAutoProductImage(item.product.name);
                        }}
                        style={{
                          width: "85px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px"
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <h3>{item.product.name}</h3>
                        <p>Size: {item.product.size || "Free Size"}</p>
                        <p>Color: {item.product.color || "As shown"}</p>
                        <strong>{money(item.product.sellingPrice)}</strong>
                      </div>

                      <div>
                        <label>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max={item.product.quantity}
                          value={item.quantity}
                          onChange={e => changeCartQuantity(item.product._id, e.target.value)}
                          style={{
                            width: "75px",
                            display: "block"
                          }}
                        />
                      </div>

                      <strong>
                        {money(Number(item.product.sellingPrice) * item.quantity)}
                      </strong>

                      <button
                        className="delete-btn"
                        onClick={() => removeFromCart(item.product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  className="panel"
                  style={{
                    marginTop: "20px",
                    maxWidth: "450px",
                    marginLeft: "auto"
                  }}
                >
                  <h3>Order Summary</h3>

                  <div className="report-line">
                    <span>Products</span>
                    <strong>{cartCount}</strong>
                  </div>

                  <div className="report-line">
                    <span>Total Amount</span>
                    <strong>{money(cartTotal)}</strong>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <label
                      htmlFor="checkout-delivery-address"
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "8px"
                      }}
                    >
                      Delivery Address *
                    </label>

                    <textarea
                      id="checkout-delivery-address"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your complete delivery address, including house number, street, area, city, state and PIN code"
                      rows="5"
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        border: "1px solid #d8cec5",
                        borderRadius: "8px",
                        resize: "vertical",
                        fontFamily: "inherit"
                      }}
                    />

                    <small className="muted">
                      Your address will be saved with this order and shown to the boutique admin.
                    </small>
                  </div>

                  <button
                    className="primary-btn"
                    style={{
                      width: "100%",
                      marginTop: "15px"
                    }}
                    onClick={placeCustomerOrder}
                    disabled={!deliveryAddress.trim()}
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* MY ORDERS AND TRACKING */}

        {page === "My Orders" && (
          <section>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              <h2>My Orders & Tracking</h2>
              <button
                className="small-btn"
                onClick={() => loadCustomerOrders(uid)}
              >
                Refresh
              </button>
            </div>

            {!customerOrders.length ? (
              <div className="panel">
                <h3>No orders yet.</h3>
                <button
                  className="primary-btn"
                  onClick={() => setPage("Store")}
                >
                  Start Shopping
                </button>
              </div>
            ) : customerOrders.map(order => {
              const status = getTrackingStatus(order.status);
              const currentStep = TRACKING_STEPS.indexOf(status);
              const cancelled = status === "Cancelled";

              return (
                <div
                  className="panel"
                  key={order._id}
                  style={{ marginBottom: "18px" }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}>
                    <div>
                      <h3>{order.item}</h3>
                      <p>
                        Size: {order.size || "—"} · Color: {order.color || "—"} · Quantity: {order.quantity}
                      </p>
                      <p>Order date: {formatDate(order.createdAt)}</p>
                    </div>

                    <div>
                      <strong>{money(order.price)}</strong>
                      <p><strong>Status: {order.status}</strong></p>
                    </div>
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <h4>Order progress</h4>

                    {cancelled ? (
                      <p style={{ color: "#a33" }}>
                        This order has been cancelled.
                      </p>
                    ) : (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        gap: "6px"
                      }}>
                        {TRACKING_STEPS.map((step, index) => (
                          <div key={step} style={{ textAlign: "center" }}>
                            <div style={{
                              height: "7px",
                              borderRadius: "10px",
                              background: index <= currentStep ? "#8b7059" : "#e5ddd5",
                              marginBottom: "8px"
                            }} />

                            <small style={{
                              fontSize: "11px",
                              fontWeight: index === currentStep ? "bold" : "normal"
                            }}>
                              {step}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <p>
                      <strong>Expected delivery:</strong>{" "}
                      {order.deliveryDate
                        ? formatDate(order.deliveryDate)
                        : "Not scheduled yet"}
                    </p>

                    <p>
                      <strong>Delivery address:</strong>{" "}
                      {order.deliveryAddress || "Address not available for this order."}
                    </p>

                    <small className="muted">
                      This is the delivery address you entered when placing the order.
                    </small>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* MY PROFILE */}

        {page === "My Profile" && (
          <section
            className="panel"
            style={{ maxWidth: "650px" }}
          >
            <h2>My Profile</h2>
            <p className="muted">
              View and update your account details.
            </p>

            <form onSubmit={saveProfile} className="form-stack">
              <label>Full name</label>
              <input
                value={profileForm.fullName}
                onChange={e => setProfileForm({
                  ...profileForm,
                  fullName: e.target.value
                })}
                required
              />

              <label>Email address</label>
              <input
                value={profile.email || user.email || ""}
                readOnly
              />

              <label>Phone number</label>
              <input
                value={profileForm.phone}
                onChange={e => setProfileForm({
                  ...profileForm,
                  phone: e.target.value
                })}
                placeholder="Enter phone number"
              />

              <p className="muted">
                Your delivery address is entered separately during checkout and saved with each order.
              </p>

              <button className="primary-btn" type="submit">
                Save Profile
              </button>
            </form>
          </section>
        )}

        {/* REVIEWS */}

        {page === "Reviews" && (
          <section>
            <h2>Product Reviews</h2>

            <div
              className="panel"
              style={{ maxWidth: "700px" }}
            >
              <h3>Write a Review</h3>

              {eligibleOrders.length === 0 ? (
                <p className="muted">
                  You can review products you have ordered. You have no eligible products to review right now.
                </p>
              ) : (
                <form onSubmit={submitReview} className="form-stack">
                  <label>Select a purchased product</label>

                  <select
                    value={reviewForm.orderId}
                    onChange={e => {
                      const selected = eligibleOrders.find(
                        o => o._id === e.target.value
                      );

                      setReviewForm({
                        ...reviewForm,
                        orderId: e.target.value,
                        productId: selected?.productId || ""
                      });
                    }}
                    required
                  >
                    <option value="">Choose an order</option>

                    {eligibleOrders.map(order => (
                      <option key={order._id} value={order._id}>
                        {order.item} — ordered {formatDate(order.createdAt)}
                      </option>
                    ))}
                  </select>

                  <label>Rating</label>

                  <select
                    value={reviewForm.rating}
                    onChange={e => setReviewForm({
                      ...reviewForm,
                      rating: Number(e.target.value)
                    })}
                  >
                    <option value={5}>★★★★★ — Excellent</option>
                    <option value={4}>★★★★ — Very good</option>
                    <option value={3}>★★★ — Good</option>
                    <option value={2}>★★ — Fair</option>
                    <option value={1}>★ — Poor</option>
                  </select>

                  <label>Your review</label>

                  <textarea
                    rows="4"
                    placeholder="Share your experience with this product..."
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({
                      ...reviewForm,
                      comment: e.target.value
                    })}
                  />

                  <button className="primary-btn" type="submit">
                    Submit Review
                  </button>
                </form>
              )}
            </div>

            <div
              className="panel"
              style={{ marginTop: "20px" }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <h3>Customer Reviews</h3>
                <button className="small-btn" onClick={loadReviews}>
                  Refresh Reviews
                </button>
              </div>

              {reviews.length === 0 ? (
                <p className="muted">No product reviews yet.</p>
              ) : reviews.map(review => (
                <div
                  key={review._id}
                  style={{
                    padding: "15px 0",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <strong>
                    {review.productId?.name || "Boutique product"}
                  </strong>

                  <p style={{
                    color: "#9b7440",
                    margin: "5px 0"
                  }}>
                    {"★".repeat(Number(review.rating))}
                    {"☆".repeat(5 - Number(review.rating))}
                  </p>

                  <p>{review.comment || "No written comment."}</p>

                  <small className="muted">
                    {review.customerName || "Customer"} · {formatDate(review.createdAt)}
                  </small>
                </div>
              ))}
            </div>

            <div
              className="panel"
              style={{ marginTop: "20px" }}
            >
              <h3>My Submitted Reviews</h3>

              {myReviews.length === 0 ? (
                <p className="muted">
                  You have not submitted any reviews yet.
                </p>
              ) : myReviews.map(review => (
                <div
                  key={review._id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <strong>
                    {review.productId?.name || "Product"}
                  </strong>

                  <p style={{ color: "#9b7440" }}>
                    {"★".repeat(Number(review.rating))}
                  </p>

                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{
          textAlign: "center",
          marginTop: "50px",
          padding: "20px",
          color: "#88796c"
        }}>
          FINORA · Your Boutique Store
        </footer>
      </div>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-brand">
          <div className="brand-logo">F</div>
          <div>
            <strong>FINORA</strong>
            <small>BOUTIQUE STUDIO</small>
          </div>
        </div>

        <p className="nav-caption">WORKSPACE</p>

        <nav>
          {navItems.map(item => (
            <button
              key={item}
              className={page === item ? "nav-link active" : "nav-link"}
              onClick={() => {
                setPage(item);
                setMessage("");

                if (item === "Orders") refreshOrders();
              }}
            >
              <span className="nav-dot"></span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">
              {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user.fullName || user.name}</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINORA / WORKSPACE</p>
            <h1>{page}</h1>
          </div>

          <div className="topbar-date">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </div>
        </header>

        {message && (
          <div className="notice app-notice">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {/* DASHBOARD */}

        {page === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div>
                <p className="eyebrow">YOUR BOUTIQUE OVERVIEW</p>
                <h2>Welcome back, {user.fullName || user.name}.</h2>
                <p>Here's what's happening in your boutique today.</p>
              </div>

              <div className="banner-mark">F</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Total Sales</span>
                <strong>{money(salesTotal)}</strong>
                <small>Recorded revenue</small>
              </div>

              <div className="stat-card">
                <span>Inventory Units</span>
                <strong>{stockCount}</strong>
                <small>{products.length} products listed</small>
              </div>

              <div className="stat-card">
                <span>Active Orders</span>
                <strong>{pendingOrders}</strong>
                <small>Need attention</small>
              </div>

              <div className="stat-card">
                <span>Customers</span>
                <strong>{customers.length}</strong>
                <small>Registered customers</small>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">STORE ACTIVITY</p>
                    <h3>Recent Sales</h3>
                  </div>

                  <button
                    className="small-btn"
                    onClick={() => setPage("Sales")}
                  >
                    View all
                  </button>
                </div>

                {sales.length === 0 ? (
                  <p className="empty-state">No sales recorded yet.</p>
                ) : (
                  sales.slice().reverse().slice(0, 5).map(s => (
                    <div className="data-row" key={s._id || s.id}>
                      <div>
                        <strong>{s.productName}</strong>
                        <small>{formatDate(s.date)}</small>
                      </div>
                      <b>{money(s.total)}</b>
                    </div>
                  ))
                )}
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">STOCK CHECK</p>
                    <h3>Inventory Alerts</h3>
                  </div>
                </div>

                <div className="big-number">{lowStock}</div>
                <p className="muted">
                  Products with 5 or fewer units remaining.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => setPage("Inventory")}
                >
                  Manage Inventory
                </button>
              </div>
            </section>
          </>
        )}

        {/* INVENTORY */}

        {page === "Inventory" && (
          <>
            <div className="section-intro">
              <p>
                Add products and keep track of boutique stock, sizes and prices.
              </p>
            </div>

            <section className="panel">
              <div className="panel-heading">
                <h3>{editingProductId ? "Edit Product" : "Add New Product"}</h3>
              </div>

              <form onSubmit={addProduct} className="form-grid">
                <input
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={e => setProductForm({
                    ...productForm,
                    name: e.target.value
                  })}
                  required
                />

                <select
                  value={productForm.category}
                  onChange={e => setProductForm({
                    ...productForm,
                    category: e.target.value
                  })}
                >
                  {[
                    "Clothing", "Kurti", "Saree", "Jeans", "Pant",
                    "Shawl", "Dress", "Top", "Blouse", "Accessories",
                    "Earrings", "Necklace", "Bangles", "Bracelet",
                    "Handbag", "Watch", "Hair Clips", "Footwear", "Other"
                  ].map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>

                <input
                  placeholder="Size (S, M, L, Free Size)"
                  value={productForm.size}
                  onChange={e => setProductForm({
                    ...productForm,
                    size: e.target.value
                  })}
                />

                <input
                  placeholder="Color"
                  value={productForm.color}
                  onChange={e => setProductForm({
                    ...productForm,
                    color: e.target.value
                  })}
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  value={productForm.quantity}
                  onChange={e => setProductForm({
                    ...productForm,
                    quantity: e.target.value
                  })}
                  required
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Purchase price"
                  value={productForm.purchasePrice}
                  onChange={e => setProductForm({
                    ...productForm,
                    purchasePrice: e.target.value
                  })}
                  required
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Selling price"
                  value={productForm.sellingPrice}
                  onChange={e => setProductForm({
                    ...productForm,
                    sellingPrice: e.target.value
                  })}
                  required
                />

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600"
                  }}>
                    Automatic Product Image
                  </label>

                  <img
                    key={productForm.name}
                    src={getAutoProductImage(productForm.name)}
                    alt="Automatic product preview"
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getAutoProductImage("clothing");
                    }}
                    style={{
                      width: "120px",
                      height: "140px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid #ddd"
                    }}
                  />

                  <p style={{
                    fontSize: "12px",
                    marginTop: "5px"
                  }}>
                    Sample image selected automatically from the product name.
                  </p>
                </div>

                <button className="primary-btn" type="submit">
                  {editingProductId ? "Save Changes" : "Add Product"}
                </button>

                {editingProductId && (
                  <button
                    className="small-btn"
                    type="button"
                    onClick={cancelProductEdit}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Product Inventory</h3>
                <span>{products.length} products</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Size / Color</th>
                      <th>Stock</th>
                      <th>Sell Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map(p => (
                      <tr key={p._id || p.id}>
                        <td>
                          <img
                            src={getImageSrc(p.imageUrl) || getAutoProductImage(p.name)}
                            alt={p.name}
                            onError={e => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getAutoProductImage(p.name);
                            }}
                            style={{
                              width: "58px",
                              height: "68px",
                              objectFit: "cover",
                              borderRadius: "8px"
                            }}
                          />
                        </td>

                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td>{p.size || "—"} / {p.color || "—"}</td>

                        <td>
                          <span className={
                            Number(p.quantity) <= 5
                              ? "stock-low"
                              : "stock-good"
                          }>
                            {p.quantity}
                          </span>
                        </td>

                        <td>{money(p.sellingPrice)}</td>

                        <td>
                          <button
                            className="small-btn"
                            onClick={() => editProduct(p)}
                          >
                            Edit
                          </button>{" "}

                          <button
                            className="delete-btn"
                            onClick={() => deleteProduct(p._id || p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <p className="empty-state">
                  No products yet. Add your first product above.
                </p>
              )}
            </section>
          </>
        )}

        {/* SALES */}

        {page === "Sales" && (
          <>
            <section className="stats-grid one-row">
              <div className="stat-card">
                <span>Total Revenue</span>
                <strong>{money(salesTotal)}</strong>
              </div>

              <div className="stat-card">
                <span>Sales Count</span>
                <strong>{sales.length}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Record a Sale</h3>
              </div>

              <form onSubmit={addSale} className="form-grid">
                <select
                  value={saleForm.productId}
                  onChange={e => {
                    const p = products.find(
                      x => (x._id || x.id) === e.target.value
                    );

                    setSaleForm({
                      ...saleForm,
                      productId: e.target.value,
                      unitPrice: p?.sellingPrice || ""
                    });
                  }}
                  required
                >
                  <option value="">Select product</option>

                  {products.map(p => (
                    <option
                      key={p._id || p.id}
                      value={p._id || p.id}
                    >
                      {p.name} — Stock: {p.quantity}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={saleForm.quantity}
                  onChange={e => setSaleForm({
                    ...saleForm,
                    quantity: e.target.value
                  })}
                  required
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Unit selling price"
                  value={saleForm.unitPrice}
                  onChange={e => setSaleForm({
                    ...saleForm,
                    unitPrice: e.target.value
                  })}
                  required
                />

                <button className="primary-btn" type="submit">
                  Save Sale
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Sales History</h3>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.slice().reverse().map(s => (
                      <tr key={s._id || s.id}>
                        <td>{s.productName}</td>
                        <td>{s.quantity}</td>
                        <td>{money(s.unitPrice)}</td>
                        <td><strong>{money(s.total)}</strong></td>
                        <td>{formatDate(s.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sales.length === 0 && (
                <p className="empty-state">No sales recorded yet.</p>
              )}
            </section>
          </>
        )}

        {/* CUSTOMERS */}

        {page === "Customers" && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <h3>Add Customer</h3>
              </div>

              <form onSubmit={addCustomer} className="form-grid">
                <input
                  placeholder="Customer name"
                  value={customerForm.name}
                  onChange={e => setCustomerForm({
                    ...customerForm,
                    name: e.target.value
                  })}
                  required
                />

                <input
                  placeholder="Phone number"
                  value={customerForm.phone}
                  onChange={e => setCustomerForm({
                    ...customerForm,
                    phone: e.target.value
                  })}
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={customerForm.email}
                  onChange={e => setCustomerForm({
                    ...customerForm,
                    email: e.target.value
                  })}
                />

                <input
                  placeholder="Address"
                  value={customerForm.address}
                  onChange={e => setCustomerForm({
                    ...customerForm,
                    address: e.target.value
                  })}
                />

                <button className="primary-btn" type="submit">
                  Add Customer
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Customer Directory</h3>
                <span>{customers.length} customers</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map(c => (
                      <tr key={c._id || c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.phone || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td>{c.address || "—"}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteCustomer(c._id || c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {customers.length === 0 && (
                <p className="empty-state">No customers added yet.</p>
              )}
            </section>
          </>
        )}

        {/* ORDERS */}

        {page === "Orders" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Customer Orders</h3>
                <p className="muted">
                  Orders placed by customers through the FINORA store.
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <span>{orders.length} orders</span>

                <button className="small-btn" onClick={refreshOrders}>
                  Refresh Orders
                </button>

                <button className="delete-btn" onClick={clearOrders}>
                  Clear Orders
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <p className="empty-state">
                No customer orders yet. Orders placed through the customer store will appear here automatically.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Quantity</th>
                      <th>Total Price</th>
                      <th>Order Date</th>
                      <th>Delivery Date</th>
                      <th>Customer Delivery Address</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id || o.id}>
                        <td>
                          <strong>{o.customerName || "Customer"}</strong>
                        </td>

                        <td>{o.item}</td>
                        <td>{o.size || "—"}</td>
                        <td>{o.color || "—"}</td>
                        <td>{o.quantity}</td>
                        <td><strong>{money(o.price)}</strong></td>
                        <td>{formatDate(o.createdAt)}</td>

                        <td>
                          <input
                            type="date"
                            value={getDateInputValue(o.deliveryDate)}
                            onChange={e => updateOrder(
                              o._id || o.id,
                              { deliveryDate: e.target.value }
                            )}
                            style={{ minWidth: "135px" }}
                          />
                        </td>

                        <td style={{
                          minWidth: "190px",
                          maxWidth: "260px",
                          whiteSpace: "normal",
                          overflowWrap: "anywhere"
                        }}>
                          {o.deliveryAddress || "Address not provided"}
                        </td>

                        <td>
                          <select
                            className="status-select"
                            value={o.status || "Pending"}
                            onChange={e => updateOrder(
                              o._id || o.id,
                              { status: e.target.value }
                            )}
                          >
                            <option>Pending</option>
                            <option>Confirmed</option>
                            <option>Packed</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteOrder(o._id || o.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* EXPENSES */}

        {page === "Expenses" && (
          <>
            <section className="stats-grid one-row">
              <div className="stat-card">
                <span>Total Expenses</span>
                <strong>{money(expenseTotal)}</strong>
              </div>

              <div className="stat-card">
                <span>Expense Entries</span>
                <strong>{expenses.length}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Add Boutique Expense</h3>
              </div>

              <form onSubmit={addExpense} className="form-grid">
                <input
                  placeholder="Expense description"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({
                    ...expenseForm,
                    title: e.target.value
                  })}
                  required
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({
                    ...expenseForm,
                    amount: e.target.value
                  })}
                  required
                />

                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({
                    ...expenseForm,
                    category: e.target.value
                  })}
                >
                  {[
                    "Shop expenses",
                    "Rent",
                    "Staff salary",
                    "Transport",
                    "Utilities",
                    "Other"
                  ].map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>

                <button className="primary-btn" type="submit">
                  Save Expense
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Expense Records</h3>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.slice().reverse().map(x => (
                      <tr key={x._id || x.id}>
                        <td>{x.title}</td>
                        <td>{x.category}</td>
                        <td>{money(x.amount)}</td>
                        <td>{formatDate(x.date)}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteExpense(x._id || x.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {expenses.length === 0 && (
                <p className="empty-state">No expenses added yet.</p>
              )}
            </section>
          </>
        )}

        {/* REPORTS */}

        {page === "Reports" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <span>Revenue</span>
                <strong>{money(salesTotal)}</strong>
              </div>

              <div className="stat-card">
                <span>Expenses</span>
                <strong>{money(expenseTotal)}</strong>
              </div>

              <div className="stat-card">
                <span>Net Difference</span>
                <strong>{money(salesTotal - expenseTotal)}</strong>
              </div>

              <div className="stat-card">
                <span>Orders</span>
                <strong>{orders.length}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Business Summary</h3>
              </div>

              <div className="report-line">
                <span>Total sales revenue</span>
                <strong>{money(salesTotal)}</strong>
              </div>

              <div className="report-line">
                <span>Total recorded expenses</span>
                <strong>{money(expenseTotal)}</strong>
              </div>

              <div className="report-line">
                <span>Products in inventory</span>
                <strong>{products.length}</strong>
              </div>

              <div className="report-line">
                <span>Total stock units</span>
                <strong>{stockCount}</strong>
              </div>

              <div className="report-line">
                <span>Registered customers</span>
                <strong>{customers.length}</strong>
              </div>

              <div className="report-line">
                <span>Orders awaiting completion</span>
                <strong>{pendingOrders}</strong>
              </div>

              <p className="muted report-note">
                Net difference is sales revenue minus recorded expenses. It is not a full accounting profit calculation.
              </p>
            </section>
          </>
        )}

        {/* SETTINGS */}

        {page === "Settings" && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <h3>Business Profile</h3>
              </div>

              <div className="profile-details">
                <div>
                  <span>Account name</span>
                  <strong>{user.fullName || user.name}</strong>
                </div>

                <div>
                  <span>Email address</span>
                  <strong>{user.email}</strong>
                </div>

                <div>
                  <span>Platform</span>
                  <strong>FINORA Boutique Management</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h3>Monthly Expense Budget</h3>
              </div>

              <p className="muted">
                Set a monthly target to monitor your boutique expenses.
              </p>

              <form onSubmit={saveBudget} className="budget-form">
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  required
                />

                <button className="primary-btn" type="submit">
                  Save Budget
                </button>
              </form>
            </section>
          </>
        )}

        <footer className="app-footer">
          FINORA <span>·</span> Boutique Management System
        </footer>
      </main>
    </div>
  );
}

export default App;