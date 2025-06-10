document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout');
    const registrationForm = document.getElementById('registrationForm');

    const API_BASE_URL = 'http://localhost:5000/api';

    flatpickr(".date-input", {
        dateFormat: "d/m/Y",
        allowInput: true,
        defaultDate: new Date(),
        onReady: function(selectedDates, dateStr, instance) {
            if (instance.input.id === 'join_date') {
                instance.setDate(new Date(), true);
            }
        }
    });

    updateCartDisplay();

    document.querySelectorAll('.select-plan').forEach(button => {
        button.addEventListener('click', function() {
            const planName = this.getAttribute('data-name');
            const planPrice = parseFloat(this.getAttribute('data-price'));

            CartManager.addItem({
                id: Date.now(),
                type: 'membership',
                name: planName,
                price: planPrice,
                originalPrice: planPrice
            });

            updateCartDisplay();
        });
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (CartManager.getCart().length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'payments.html';
        });
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const phone = document.getElementById('phone').value.trim();
            const dob = document.getElementById('dob').value;
            const join_date = document.getElementById('join_date').value || formatDate(new Date());

            if (!name || !email || !password || !phone || !dob) {
                alert('Please fill in all required fields');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }

            if (!isValidDate(dob) || !isValidDate(join_date)) {
                alert('Please enter dates in DD/MM/YYYY format');
                return;
            }

            const memberData = {
                member_name: name,
                member_email: email,
                member_tel: phone,
                dob: formatDateForStorage(dob),
                join_date: formatDateForStorage(join_date),
                member_password: password,
                membership_type: 'Standard Membership'
            };

            // Save locally
            let members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
            const localMember = { ...memberData, id: Date.now() };
            members.push(localMember);
            localStorage.setItem('gymMembers', JSON.stringify(members));

            // Send to backend
            try {
                const response = await fetch(`${API_BASE_URL}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Registration failed');
                }

                const data = await response.json();
                console.log('Registration successful:', data);

                localMember.backend_id = data.member_id;
                localStorage.setItem('gymMembers', JSON.stringify(members));

                // ✅ Auto-login + redirect
                localStorage.setItem('member_id', data.member_id);
                localStorage.setItem('member_name', memberData.member_name);
                localStorage.setItem('member_email', memberData.member_email);

                alert('Registration successful! You are now logged in.');
                window.location.href = 'home.html';

            } catch (error) {
                console.error('Error during registration:', error);
                alert('Registration failed: ' + error.message);
            }
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
                <button class="remove-item" data-index="${index}" title="Remove item">×</button>
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

    function isValidDate(dateString) {
        const pattern = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/(19|20)\d{2}$/;
        return pattern.test(dateString);
    }

    function formatDateForStorage(dateString) {
        const parts = dateString.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
    }

    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
});
