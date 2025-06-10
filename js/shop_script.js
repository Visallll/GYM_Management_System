document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout');

    const API_BASE_URL = 'http://localhost:5000/api'; // (not used yet but good for consistency)

    if (typeof CartManager === 'undefined') {
        console.error('CartManager not found!');
        return;
    }

    // Initialize cart display
    updateCartDisplay();

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseFloat(this.getAttribute('data-price'));
            const parentCard = this.closest('.card');
            let options = '';

            if (parentCard) {
                const sugarSelect = parentCard.querySelector('.sugar-option');
                const iceSelect = parentCard.querySelector('.ice-option');

                if (sugarSelect && iceSelect) {
                    options = ` (${sugarSelect.value}, ${iceSelect.value})`;
                }
            }

            CartManager.addItem({
                id: Date.now(),
                type: 'shop',
                name: itemName + options,
                price: itemPrice,
                originalPrice: itemPrice
            });

            updateCartDisplay();
        });
    });

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (CartManager.getCart().length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'payments.html';
        });
    }

    function updateCartDisplay() {
        if (!cartItems || !totalPriceElement) return;

        const cart = CartManager.getCart();
        cartItems.innerHTML = '';

        if (cart.length === 0) {
            cartItems.innerHTML = '<li class="empty-cart">Your cart is empty</li>';
            totalPriceElement.textContent = '0.00';
            return;
        }

        cart.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                <button class="remove-item" data-index="${index}" title="Remove item">
                    ×
                </button>
            `;
            cartItems.appendChild(li);
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                CartManager.removeItem(index);
                updateCartDisplay();
            });
        });

        totalPriceElement.textContent = CartManager.calculateTotal().toFixed(2);
    }
});
