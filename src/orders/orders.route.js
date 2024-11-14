const express = require("express");
const Order = require("./orders.model");
const router = express.Router();
const { createOrder, captureOrder } = require("../payment/paypal");

// Tạo giao dịch PayPal
router.post("/create-paypal-order", async (req, res) => {
    const { products } = req.body;
    console.log(req.body);
    try {
        // Gọi hàm tạo giao dịch trong paypal.js
        const order = await createOrder(products);  // Order object chứa thông tin từ PayPal

        // Trả về orderID từ phản hồi của PayPal
        res.json({ orderID: order.id });
    } catch (error) {
        console.error("Error creating PayPal order:", error);
        res.status(500).json({ error: `Failed to create PayPal order: ${error.message}` });
    }
});


// Xác nhận thanh toán PayPal
router.post("/confirm-paypal-payment", async (req, res) => {
    const { orderId } = req.body;
    console.log("Received orderId:", orderId);
    try {
        // Xác nhận giao dịch với PayPal
        const capture = await captureOrder(orderId);
        const paymentIntentId = capture.id;

        // Kiểm tra xem đơn hàng đã tồn tại trong DB chưa
        let order = await Order.findOne({ orderId: paymentIntentId });

        if (!order) {
            // Nếu đơn hàng chưa tồn tại, tạo mới đơn hàng
            const amount = parseFloat(capture.purchase_units[0].amount.value);
            const items = capture.purchase_units[0].items.map(item => ({
                productId: item.sku,
                quantity: parseInt(item.quantity),
            }));

            order = new Order({
                orderId: paymentIntentId,
                products: items,
                amount: amount,
                email: capture.payer.email_address,
                status: capture.status === "COMPLETED" ? "pending" : "failed",
            });
        } else {
            // Cập nhật trạng thái đơn hàng
            order.status = capture.status === "COMPLETED" ? "pending" : "failed";
        }

        // Lưu đơn hàng vào MongoDB
        await order.save();
        res.json({ order });
    } catch (error) {
        console.error("Error confirming PayPal payment:", error);
        res.status(500).json({ error: "Failed to confirm PayPal payment" });
    }
});

// Lấy danh sách đơn hàng theo email
router.get("/:email", async (req, res) => {
    const email = req.params.email;

    if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
    }

    try {
        const orders = await Order.find({ email: email }).sort({ createdAt: -1 });
        if (orders.length === 0 || !orders) {
            return res
                .status(404)
                .json({ order: 0, message: "No orders found for this email" });
        }
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Lấy thông tin chi tiết đơn hàng theo ID
router.get("/order/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Lấy tất cả đơn hàng
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        if (orders.length === 0) {
            console.log('No orders found');
            return res.status(200).json({ message: "No orders found", orders: [] });
        }
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Cập nhật trạng thái đơn hàng
router.patch('/update-order-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Order status is required" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Xóa đơn hàng
router.delete('/delete-order/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({
            message: "Order deleted successfully",
            order: deletedOrder
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
