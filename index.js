const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const app = express()
require('dotenv').config()
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const port = process.env.PORT || 5000;

const uploadImage = require("./src/utils/uploadImage");
//console.log(process.env.DB_URL)


//admin (2Wbktu7gUAkuigc1)

//middleware setup
app.use(express.json({ limit: "25mb" }));
app.use((express.urlencoded({ limit: "25mb" })));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

// all routes
const authRoutes = require('./src/users/user.route');
const productRoutes = require('./src/products/products.route');
const reviewRoutes = require('./src/reviews/reviews.router');
const orderRoutes = require('./src/orders/orders.route');
const statsRoutes = require('./src/stats/stats.route');

// Route setup
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

main().then(() => console.log("MongoDB connected")).catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.DB_URL);

    app.get('/', (req, res) => {
        res.send('Ba Wuy Server is running ... ')
    })
}

// upload image routes
app.post("/uploadImage", (req, res) => {
    uploadImage(req.body.image)
        .then((url) => res.send(url))
        .catch((err) => res.status(500).send(err));
});

// paypal.configure({
//     'mode':'sandbox',
//     'client_id':'Ab4LA33LaOGv1TwKyNRMxB7Fj4amsRr8-qqG2kFleCG_S0ivN3r77VWpOAm3v5Hs0cgVuta-bme0O2cH',
//     'client_secret':'EHzrwXL_qj9R7n6UC-JZOSVgOBqOhcbcAKyCSZdTJ9dSO_5DJqH0JRVRqzOt2qulrcaM9jAkYC37oC6N'
// });



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})