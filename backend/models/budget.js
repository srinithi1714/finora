const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  monthlyBudget: {
    type: Number,
    required: true,
    default: 10000
  }
});

module.exports = mongoose.model("Budget", budgetSchema);