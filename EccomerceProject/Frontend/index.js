var productImages = {
    1: "Assets/hoddie.jpg",
    2: "Assets/jacket.jpg",
    3: "Assets/Dress.jpg",
    4: "Assets/pant.jpg",
    5: "Assets/Sweatshirt.jpg"
};

document.addEventListener("DOMContentLoaded", function () {
    var path = window.location.pathname;

    if (path.indexOf("shop.html") !== -1) {
        initShopPage();
    } else if (path.indexOf("cart.html") !== -1) {
        initCartPage();
    } else if (path.indexOf("checkout.html") !== -1) {
        initCheckoutPage();
    } else if (path.indexOf("confirmation.html") !== -1) {
        initConfirmationPage();
    }
});

function initShopPage() {
    var productCards = document.querySelectorAll("#Products .product1");
    if (!productCards.length) return;

    productCards.forEach(function (card, index) {
        var addBtn = card.querySelector("button");
        var qtyInput = card.querySelector("input[type='number']");
        if (!addBtn || !qtyInput) return;

        var productId = index + 1;

        addBtn.addEventListener("click", function () {
            var qty = parseInt(qtyInput.value, 10);
            if (isNaN(qty) || qty < 1) {
                qty = 1;
                qtyInput.value = 1;
            }
            addToCart(productId, qty);
        });
    });
}

function addToCart(productId, quantity) {
    fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId, quantity: quantity })
    })
        .then(function (res) {
            if (!res.ok) {
                if (res.status === 404) alert("Product not found in backend.");
                else alert("Unable to add to cart.");
                throw new Error("Add failed");
            }
            return res.json();
        })
        .then(function () {
            alert("Item added to cart.");
        })
        .catch(function (err) {
            console.log("Error adding item:", err);
        });
}

function initCartPage() {
    var tableBody = document.querySelector("#cart table tbody");
    var cartTable = document.querySelector("#cart table");
    if (!tableBody || !cartTable) return;

    var totalEl = document.getElementById("cart-total");
    if (!totalEl) {
        totalEl = document.createElement("p");
        totalEl.id = "cart-total";
        cartTable.parentNode.appendChild(totalEl);
    }

    loadCart();

    function loadCart() {
        fetch("/api/cart")
            .then(function (res) { return res.json(); })
            .then(function (data) {
                renderCart(data.cart, data.total);
            })
            .catch(function (err) {
                console.log("Error loading cart:", err);
            });
    }

    function renderCart(items, total) {
        tableBody.innerHTML = "";

        if (!items.length) {
            var row = document.createElement("tr");
            row.innerHTML = `<td colspan="6" class="text-center">Your cart is empty.</td>`;
            tableBody.appendChild(row);
            totalEl.textContent = "Total: $0";
            return;
        }

        items.forEach(function (item) {
            var imgSrc = productImages[item.productId] || "";
            var lineTotal = item.price * item.quantity;

            var tr = document.createElement("tr");
            tr.innerHTML =
                `<td><img src="${imgSrc}" alt=""></td>` +
                `<td>${item.name}</td>` +
                `<td>$${item.price}</td>` +
                `<td><input type="number" value="${item.quantity}" min="1" class="form-control form-control-sm cart-qty" data-id="${item.productId}"></td>` +
                `<td>$${lineTotal}</td>` +
                `<td><button class="btn btn-danger btn-sm cart-remove" data-id="${item.productId}">delete</button></td>`;

            tableBody.appendChild(tr);
        });

        totalEl.textContent = "Total: $" + total;
        setupEvents();
    }

    function setupEvents() {
        var qtyInputs = document.querySelectorAll(".cart-qty");
        var removeBtns = document.querySelectorAll(".cart-remove");

        qtyInputs.forEach(function (input) {
            input.addEventListener("change", function () {
                var id = parseInt(this.getAttribute("data-id"), 10);
                var qty = parseInt(this.value, 10);
                if (isNaN(qty) || qty < 1) qty = 1;
                updateCart(id, qty);
            });
        });

        removeBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var id = parseInt(this.getAttribute("data-id"), 10);
                updateCart(id, 0);
            });
        });
    }

    function updateCart(productId, quantity) {
        fetch("/api/cart/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: productId, quantity: quantity })
        })
            .then(function (res) {
                if (!res.ok) {
                    alert("Cart update failed.");
                    throw new Error("Update failed");
                }
                return res.json();
            })
            .then(function () {
                loadCart();
            })
            .catch(function (err) {
                console.log("Cart update error:", err);
            });
    }
}

function initCheckoutPage() {
    var summary = document.querySelector("#out table tbody");
    var subtotalTable = document.querySelector("#subtotal table");
    var orderBtn = document.getElementById("orderbutton");
    var orderLink = document.querySelector(".order a");

    if (!summary || !subtotalTable || !orderBtn) return;

    var rows = subtotalTable.querySelectorAll("tr");
    var subtotalCell = rows[0].children[1];
    var taxCell = rows[2].children[1];
    var totalCell = rows[3].children[1];

    loadSummary();

    if (orderLink) {
        orderLink.addEventListener("click", function (e) {
            e.preventDefault();
            placeOrder();
        });
    }

    orderBtn.addEventListener("click", function (e) {
        e.preventDefault();
        placeOrder();
    });

    function loadSummary() {
        fetch("/api/cart")
            .then(function (res) { return res.json(); })
            .then(function (data) {
                buildTable(data.cart);
            })
            .catch(function (err) {
                console.log("Checkout load error:", err);
            });
    }

    function buildTable(items) {
        summary.innerHTML = "";
        if (!items.length) {
            var row = document.createElement("tr");
            row.innerHTML = `<td colspan="3" class="text-center">Your cart is empty.</td>`;
            summary.appendChild(row);

            subtotalCell.textContent = "$0";
            taxCell.textContent = "$0";
            totalCell.textContent = "$0";
            return;
        }

        var subtotal = 0;

        items.forEach(function (item) {
            var line = item.price * item.quantity;
            subtotal += line;

            var tr = document.createElement("tr");
            tr.innerHTML =
                `<td>${item.name}</td>` +
                `<td>$${item.price}</td>` +
                `<td>${item.quantity}</td>`;
            summary.appendChild(tr);
        });

        var tax = 5;
        var total = subtotal + tax;

        subtotalCell.textContent = "$" + subtotal;
        taxCell.textContent = "$" + tax;
        totalCell.textContent = "$" + total;
    }

    function placeOrder() {
        fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        })
            .then(function (res) {
                if (!res.ok) {
                    alert("Checkout failed.");
                    throw new Error("Checkout error");
                }
                return res.json();
            })
            .then(function () {
                window.location.href = "confirmation.html";
            })
            .catch(function (err) {
                console.log("Order error:", err);
            });
    }
}

function initConfirmationPage() {
    fetch("/api/order-last")
        .then(function (res) {
            if (!res.ok) throw new Error("No order");
            return res.json();
        })
        .then(function (order) {
            console.log("Last order:", order);
        })
        .catch(function () {
            console.log("No previous order found");
        });
}
