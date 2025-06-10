// cart.js - Centralized cart management
class CartManager {
    static CART_KEY = 'gymCart';
    static PROMO_KEY = 'activePromo';

    static getCart() {
        return JSON.parse(localStorage.getItem(this.CART_KEY)) || [];
    }

    static saveCart(cart) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    }

    static addItem(item) {
        const cart = this.getCart();
        cart.push(item);
        this.saveCart(cart);
        return cart;
    }

    static removeItem(index) {
        const cart = this.getCart();
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            this.saveCart(cart);
        }
        return cart;
    }

    static clearCart() {
        localStorage.removeItem(this.CART_KEY);
    }

    static getPromo() {
        return JSON.parse(localStorage.getItem(this.PROMO_KEY)) || null;
    }

    static applyPromo(promoData) {
        localStorage.setItem(this.PROMO_KEY, JSON.stringify(promoData));
        return promoData;
    }

    static clearPromo() {
        localStorage.removeItem(this.PROMO_KEY);
    }

    static calculateTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            return total + price;
        }, 0);
    }
}
