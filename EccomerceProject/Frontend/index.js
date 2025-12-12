// Simple front-end script used by all pages

// map product IDs to image paths for the cart page
var productImages = {
    1: "Assets/hoddie.jpg",
    2: "Assets/jacket.jpg",
    3: "Assets/Dress.jpg",
    4: "Assets/pant.jpg",
    5: "Assets/Sweatshirt.jpg"
};

document.addEventListener("DOMContentLoaded", function () {
    // always set up the mobile menu if those elements exist
    setupMobileMenu();

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

// --------------------
// common: mobile nav
// --------------------
function setupMobileMenu() {
    var bar = document.getElementById("bar");
    var nav = document.getElementById("navbar");
    var closeIcon = document.getElementById("closeIcon");

    if (!bar || !nav) {
        return;
    }

    bar.addEventListener("click", function () {
        nav.classList.add("active");
    });

    if (closeIcon) {
        closeIcon.addEventListener("click", function () {
            nav.classList.remove("active");
        });
    }
}

// --------------------
// SHOP PAGE
// --------------------
function initShopPage() {
    var productCards = document.querySelectorAll("#Products .product1");

    if (!productCards || productCards.length === 0) {
        console.warn("No product cards found on shop page.");
        return;
    }

    // We assume order of cards matches backend IDs:
    // 1 = hoodie, 2 = jean jacket, 3 = dress, 4 = pant, 5 = sweatshirt
    productCards.forEach(function (card, index) {
        var addButton = card.querySelector("button");
        var qtyInput = card.querySelector("input[type='number']");

        if (!addButton || !qtyInput) {
            return;
        }

        var productId = index + 1; // 1..5 are valid, 6 (men's suit) will be ignored by backend

        addButton.addEventListener("click", function () {
            var qty = parseInt(qtyInput.value, 10);

            if (isNaN(qty) || qty < 1) {
                qty = 1;
                qtyInput.value = 1;
            }

            addToCart(productId, qty);
        });
    });
}

// send "add to cart" request
function addToCart(productId, quantity) {
    fetch("/api/cart/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
        .then(function (res) {
            if (!res.ok) {
                // backend returns 404 if product does not exist
                if (res.status === 404) {
                    alert("This product is not available in the backend yet.");
                } else {
                    alert("Failed to add item to cart.");
                }
                throw new Error("Add to cart failed");
            }
            return res.json();
        })
        .then(function () {
            alert("Item added to cart.");
        })
        .catch(function (err) {
            console.error("Error adding to cart:", err);
        });
}

// --------------------
// CART PAGE
// --------------------
function initCartPage() {
    var tableBody = document.querySelector("#cart table tbody");
    var table = document.querySelector("#cart table");

    if (!tableBody || !table) {
        console.warn("Cart table not found.");
        return;
    }

    // create a total element if it doesn't exist yet
    var totalEl = document.getElementById("cart-total");
    if (!totalEl) {
        totalEl = document.createElement("p");
        totalEl.id = "cart-total";
        totalEl.style.textAlign = "right";
        totalEl.style.marginTop = "15px";
        totalEl.style.fontWeight = "bold";
        table.parentNode.appendChild(totalEl);
    }

    loadCart();

    function loadCart() {
        fetch("/api/cart")
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                // backend returns { cart: [...], total: number }
                renderCart(data.cart, data.total);
            })
            .catch(function (err) {
                console.error("Error loading cart:", err);
            });
    }

    function renderCart(items, total) {
        tableBody.innerHTML = "";

        if (!items || items.length === 0) {
            var emptyRow = document.createElement("tr");
            emptyRow.innerHTML = '<td colspan="6" class="text-center">Your cart is empty.</td>';
            tableBody.appendChild(emptyRow);

            totalEl.textContent = "Total: $0";
            return;
        }

        items.forEach(function (item) {
            var tr = document.createElement("tr");

            var imgSrc = productImages[item.productId] || "";
            var imgHtml = imgSrc ? '<img src="' + imgSrc + '" alt="' + item.name + '">' : "";

            var lineTotal = item.price * item.quantity;

            tr.innerHTML = ''
                + '<td>' + imgHtml + '</td>'
                + '<td>' + item.name + '</td>'
                + '<td>$' + item.price + '</td>'
                + '<td>'
                + '  <input type="number" value="' + item.quantity + '" min="1"'
                + '         class="form-control form-control-sm cart-qty"'
                + '         data-id="' + item.productId + '">'
                + '</td>'
                + '<td>$' + lineTotal + '</td>'
                + '<td>'
                + '  <button class="btn btn-danger btn-sm cart-remove" data-id="' + item.productId + '">delete</button>'
                + '</td>';

            tableBody.appendChild(tr);
        });

        totalEl.textContent = "Total: $" + total;

        attachCartEvents();
    }

    function attachCartEvents() {
        var qtyInputs = document.querySelectorAll(".cart-qty");
        var removeButtons = document.querySelectorAll(".cart-remove");

        qtyInputs.forEach(function (input) {
            input.addEventListener("change", function () {
                var productId = parseInt(this.getAttribute("data-id"), 10);
                var newQty = parseInt(this.value, 10);

                if (isNaN(newQty) || newQty < 1) {
                    newQty = 1;
                    this.value = 1;
                }

                updateCart(productId, newQty);
            });
        });

        removeButtons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var productId = parseInt(this.getAttribute("data-id"), 10);
                updateCart(productId, 0); // 0 will remove item
            });
        });
    }

    function updateCart(productId, quantity) {
        fetch("/api/cart/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            })
        })
            .then(function (res) {
                if (!res.ok) {
                    alert("Could not update cart.");
                    throw new Error("Cart update failed");
                }
                return res.json();
            })
            .then(function () {
                loadCart();
            })
            .catch(function (err) {
                console.error("Error updating cart:", err);
            });
    }
}

// --------------------
// CHECKOUT PAGE
// --------------------
function initCheckoutPage() {
    var summaryBody = document.querySelector("#out table tbody");
    var subtotalTable = document.querySelector("#subtotal table");
    var orderButton = document.getElementById("orderbutton");
    var orderLink = document.querySelector(".order a");

    if (!summaryBody || !subtotalTable || !orderButton) {
        console.warn("Checkout elements not found.");
        return;
    }

    // grab the cells we will update: subtotal, tax, total
    var rows = subtotalTable.querySelectorAll("tr");
    if (rows.length < 4) {
        console.warn("Subtotal table has unexpected structure.");
        return;
    }

    var subtotalCell = rows[0].children[1]; // "Cart subtotal"
    var taxCell = rows[2].children[1];      // "Tax"
    var totalCell = rows[3].children[1];    // "Total"

    loadCheckoutSummary();

    // prevent the <a> from navigating immediately;
    // we want to call the backend first
    if (orderLink) {
        orderLink.addEventListener("click", function (e) {
            e.preventDefault();
            placeOrder();
        });
    }

    orderButton.addEventListener("click", function (e) {
        e.preventDefault();
        placeOrder();
    });

    function loadCheckoutSummary() {
        fetch("/api/cart")
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                renderCheckoutTable(data.cart, data.total);
            })
            .catch(function (err) {
                console.error("Error loading checkout cart:", err);
            });
    }

    function renderCheckoutTable(items, subtotalFromServer) {
        summaryBody.innerHTML = "";

        if (!items || items.length === 0) {
            var row = document.createElement("tr");
            row.innerHTML = '<td colspan="3" class="text-center">Your cart is empty.</td>';
            summaryBody.appendChild(row);

            subtotalCell.textContent = "$0";
            taxCell.textContent = "$0";
            totalCell.textContent = "$0";
            return;
        }

        var subtotal = 0;

        items.forEach(function (item) {
            var lineTotal = item.price * item.quantity;
            subtotal += lineTotal;

            var tr = document.createElement("tr");
            tr.innerHTML = ""
                + "<td>" + item.name + "</td>"
                + "<td>$" + item.price + "</td>"
                + "<td>" + item.quantity + "</td>";

            summaryBody.appendChild(tr);
        });

        // you can use subtotalFromServer instead of subtotal if you want
        var tax = 5; // fixed tax like in your original layout
        var total = subtotal + tax;

        subtotalCell.textContent = "$" + subtotal;
        taxCell.textContent = "$" + tax;
        totalCell.textContent = "$" + total;
    }

    function placeOrder() {
        fetch("/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        })
            .then(function (res) {
                if (!res.ok) {
                    alert("Checkout failed.");
                    throw new Error("Checkout failed");
                }
                return res.json();
            })
            .then(function () {
                // on success, go to confirmation page
                window.location.href = "confirmation.html";
            })
            .catch(function (err) {
                console.error("Error during checkout:", err);
            });
    }
}

// --------------------
// CONFIRMATION PAGE
// --------------------
function initConfirmationPage() {
    // optional: show last order total in console for debugging
    fetch("/api/order-last")
        .then(function (res) {
            if (!res.ok) {
                throw new Error("No last order");
            }
            return res.json();
        })
        .then(function (order) {
            console.log("Last order:", order);
        })
        .catch(function (err) {
            console.log("No previous order found:", err.message);
        });
}
