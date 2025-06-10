document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5000/api'; // ✅ Correct backend base

    const contactForm = document.querySelector('#contact-form form');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !subject || !message) {
                alert('Please fill in all fields');
                return;
            }

            const formData = {
                name,
                email,
                subject,
                message,
                timestamp: new Date().toISOString()
            };

            // 1. Save locally
            let contacts = JSON.parse(localStorage.getItem('gymContacts') || '[]');
            contacts.push(formData);
            localStorage.setItem('gymContacts', JSON.stringify(contacts));

            // 2. Try to send to backend
            try {
                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to submit to backend');
                }

                const result = await response.json();
                console.log('Contact submitted successfully:', result);

                // Mark as synced
                formData.synced = true;
                localStorage.setItem('gymContacts', JSON.stringify(contacts));

            } catch (error) {
                console.error('Error sending to backend:', error);
                // It's fine, data remains in localStorage for offline sync
            }

            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }
});
