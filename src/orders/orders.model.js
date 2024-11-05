const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
    {
        orderId: String,
        products: [
            {
                productId: { type: String, required: true },
                quantity: { type: Number, required: true },
            },
        ],
        amount: Number,
        email: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "processing", "shipped", "completed",],
            default: "pending",
        },
    },
    { timestamps: true }
);
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
