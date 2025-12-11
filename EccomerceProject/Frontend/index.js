function getCart() {
    const data = localStorage.getItem('cart');
    return data ? JSON.parse(data) : [];
}
export default getCart;