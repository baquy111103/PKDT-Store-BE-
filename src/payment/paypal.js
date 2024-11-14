const fetch = require("node-fetch");

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Tạo giao dịch PayPal
const createOrder = async (products) => {
    const orderData = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: products.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2),
                },
                items: products.map((product) => ({
                    name: product.name,
                    unit_amount: {
                        currency_code: "USD",
                        value: (product.price || 15.00).toFixed(2),
                    },
                    quantity: product.quantity,
                    sku: product._id,
                }))
            }
        ],
        application_context: {
            return_url: "http://localhost:3000/success",  // URL để trả về sau khi thanh toán thành công
            cancel_url: "http://localhost:3000/cancel",   // URL nếu người dùng hủy giao dịch
        },
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: JSON.stringify(orderData),
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`PayPal Error: ${data.error_description || data.message}`);
    }

    return data;  // Trả về dữ liệu từ PayPal (bao gồm order ID)
};

const captureOrder = async (orderId) => {
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        },
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`PayPal Error: ${data.error_description || data.message}`);
    }

    return data;  // Trả về dữ liệu xác nhận thanh toán từ PayPal
};

module.exports = { createOrder, captureOrder };
