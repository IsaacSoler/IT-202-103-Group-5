const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000; 


app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

let cart = [];
let lastOrder = null;

const products = [
    {
        id: 1,
        name: "Cotton Hoodie",
        price: 50,
        image: "/Assets/hoddie.jpg",
        description: "A soft and comfortable cotton hoodie for cold weather."
    },
    {
        id: 2,
        name: "Jean Jacket",
        price: 70,
        image: "/Assets/jacket.jpg",
        description: "Warm denim jacket with wool lining."
    },
    {
        id: 3,
        name: "Elegent Dress",
        price: 85,
        image: "/Assets/Dress.jpg",
        description: "A stylish sleeveless dress with button details."
    },
    {
        id: 4,
        name: "Colorful Pant",
        price: 40,
        image: "/Assets/pant.jpg",
        description: "A colorful pair of men's pants suitable for all seasons."
    },
    {
        id: 5,
        name: "Teenagers Sweatshirt",
        price: 35,
        image: "/Assets/Sweatshirt.jpg",
        description: "A warm cotton sweatshirt designed for teenagers."
    }
];

app.get('/api/products', (req, res) => 
{
    res.json(products);
});

app.get('/api/cart', (req, res) => 
{
    let total = 0;
    cart.forEach(item =>
    {
        total += item.price * item.quantity;
    });
    res.json({cart: cart, total: total});
});

app.post("/api/cart/add", (req, res) => {
    const productId = parseInt(req.body.productId);
    const quantity = parseInt(req.body.quantity);

    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const existing = cart.find(item => item.productId === productId);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }

    res.json({ message: "Item added", cart: cart });
});

app.post("/api/cart/update", (req, res) => {
    const productId = parseInt(req.body.productId);
    const quantity = parseInt(req.body.quantity);

    const index = cart.findIndex(item => item.productId === productId);

    if (index === -1) {
        return res.status(404).json({ message: "Item not in cart" });
    }

    if (quantity <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = quantity;
    }

    res.json({ message: "Cart updated", cart: cart });
});

app.post("/api/checkout", (req, res) => {
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    const order = {
        items: cart,
        total: total,
        placedAt: new Date().toISOString()
    };

    lastOrder = order;


    cart = [];

    res.json({
        message: "Order placed successfully",
        order: order
    });
});
app.get("/api/order-last", (req, res) => {
    if (!lastOrder) {
        return res.status(404).json({ message: "No order found" });
    }

    res.json(lastOrder);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});




