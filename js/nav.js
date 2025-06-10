// nav.js - Shared navigation logic
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5000/api'; // (for future consistency)

    function isLoggedIn() {
        return localStorage.getItem('member_id') !== null;
    }

    function updateNavigation() {
        const navItems = document.querySelectorAll('.navbar ul li a');
        if (!navItems.length) return; // Defensive: navbar not found

        const protectedRoutes = ['trainer.html', 'workouts.html', 'shops.html', 'contact.html', , 'account.html']; // ✅ removed extra comma

        navItems.forEach(item => {
            const href = item.getAttribute('href');

            // Show/hide protected pages
            if (protectedRoutes.includes(href)) {
                item.parentElement.style.display = isLoggedIn() ? 'block' : 'none';
            }

            // Change login/logout text
            if (href === 'login.html' && isLoggedIn()) {
                item.textContent = 'Logout';
                item.href = 'logout.html';
            } else if (href === 'logout.html' && !isLoggedIn()) {
                item.textContent = 'Login';
                item.href = 'login.html';
            }
        });
    }

    updateNavigation();
});
