document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5000/api'; // for consistency even if not used

    // Animated counters
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    if (counters.length) {
        counters.forEach(counter => {
            const updateCounter = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCounter, 1);
                } else {
                    counter.innerText = target;
                }
            };

            updateCounter();
        });
    }

    // Promotion buttons
    if (typeof CartManager !== 'undefined') {
        document.querySelectorAll('.apply-promo').forEach(button => {
            button.addEventListener('click', function() {
                const promoType = this.getAttribute('data-promo');
                const discount = parseInt(this.getAttribute('data-discount'));
                const discountType = this.getAttribute('data-type');

                const cart = CartManager.getCart();
                const updatedCart = cart.map(item => {
                    if ((discountType === 'membership' && item.type === 'membership') ||
                        (discountType === 'shop' && item.type === 'shop')) {
                        return {
                            ...item,
                            price: item.originalPrice * (1 - discount / 100),
                            discountApplied: true
                        };
                    }
                    return item;
                });

                CartManager.saveCart(updatedCart);
                CartManager.applyPromo({
                    type: promoType,
                    discount,
                    discountType,
                    applied: true
                });

                alert(`Promotion applied! You'll see the discount at checkout.`);
                window.location.href = 'payments.html';
            });
        });
    } else {
        console.error('CartManager is not available.');
    }
});
