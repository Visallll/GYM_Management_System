document.addEventListener('DOMContentLoaded', function () {
    const categoryItems = document.querySelectorAll('.workout-categories li');
    const workoutCards = document.querySelectorAll('.workout-card');
    const clearFilterBtn = document.getElementById('clear-filter');

    // Base URL for API endpoints
    const API_BASE_URL = 'http://localhost:5000/api';

    function filterWorkouts(category) {
        categoryItems.forEach(i => i.classList.remove('active'));
        const activeItem = Array.from(categoryItems).find(item =>
            item.getAttribute('data-category') === category
        );
        if (activeItem) activeItem.classList.add('active');

        workoutCards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                const categories = card.getAttribute('data-categories');
                if (categories && categories.includes(category)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }

    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const category = this.getAttribute('data-category');
            filterWorkouts(category);
        });

        item.addEventListener('dblclick', function () {
            filterWorkouts('all');
            categoryItems.forEach(i => i.classList.remove('active'));
            document.querySelector('.workout-categories li[data-category="all"]').classList.add('active');
        });
    });

    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function () {
            filterWorkouts('all');
            categoryItems.forEach(i => i.classList.remove('active'));
            document.querySelector('.workout-categories li[data-category="all"]').classList.add('active');
        });
    }

    // ✅ Booking logic fixed here
    document.querySelectorAll('.workout-card .btn').forEach(button => {
        button.addEventListener('click', async function () {
            const memberId = localStorage.getItem('member_id'); // FIXED LINE ✅

            if (!memberId) {
                alert('Please login to book a session');
                window.location.href = 'login.html';
                return;
            }

            const workoutCard = this.closest('.workout-card');
            if (!workoutCard) return;

            const workoutName = workoutCard.querySelector('h4')?.textContent || 'Unknown Workout';

            const bookingData = {
                member_id: memberId,
                workout_name: workoutName
            };

            let bookings = JSON.parse(localStorage.getItem('gymBookings') || '[]');
            const localBooking = {
                ...bookingData,
                id: Date.now(),
                booking_date: new Date().toISOString()
            };
            bookings.push(localBooking);
            localStorage.setItem('gymBookings', JSON.stringify(bookings));

            try {
                const response = await fetch(`${API_BASE_URL}/bookings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bookingData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to book session');
                }

                const data = await response.json();
                console.log('Booking successful:', data);

                localBooking.backend_id = data.booking_id;
                localStorage.setItem('gymBookings', JSON.stringify(bookings));

                alert(`You've successfully booked ${workoutName}!`);
            } catch (error) {
                console.error('Error booking session:', error);
                alert('Booking saved locally. Will sync when online.');
            }
        });
    });
});
