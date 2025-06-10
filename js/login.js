document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');

    const API_BASE_URL = 'http://localhost:5000/api'; // ✅ Correct base

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Login failed');
                }

                const data = await response.json();
                console.log('Login successful:', data);

                // Save member info to localStorage
                localStorage.setItem('member_id', data.member_id);
                localStorage.setItem('member_name', data.member_name);
                localStorage.setItem('member_email', data.member_email);

                alert('Login successful!');
                window.location.href = 'home.html'; // better to redirect to home after login

            } catch (error) {
                console.error('Login error:', error);
                alert('Invalid email or password. Please try again.');
            }
        });
    }
});
