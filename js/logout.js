document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5000/api'; // (for consistency with all files)

    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Clear all user-related localStorage data
            localStorage.removeItem('member_id');
            localStorage.removeItem('member_name');
            localStorage.removeItem('member_email');

            // Optional: clear cart and promo too when logout (good UX)
            CartManager?.clearCart?.();
            CartManager?.clearPromo?.();

            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
});
