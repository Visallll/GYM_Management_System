document.addEventListener('DOMContentLoaded', function () {
    const feedbackPopup = document.getElementById('feedback-popup');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackItems = document.getElementById('feedbackItems');
    const trainerNameDisplay = document.getElementById('trainerNameDisplay');
    const closeBtn = document.querySelector('.close-btn');

    const API_BASE_URL = 'http://localhost:5000/api';

    let currentTrainer = '';

    // Open feedback popup
    document.querySelectorAll('.feedback-btn').forEach(button => {
        button.addEventListener('click', function () {
            currentTrainer = this.getAttribute('data-trainer');
            if (trainerNameDisplay) trainerNameDisplay.textContent = currentTrainer;
            loadFeedback(currentTrainer);
            if (feedbackPopup) feedbackPopup.classList.add('active');
        });
    });

    // Close feedback popup
    if (closeBtn && feedbackPopup) {
        closeBtn.addEventListener('click', function () {
            feedbackPopup.classList.remove('active');
        });
    }

    // Submit feedback
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const rating = document.getElementById('rating').value;
            const comment = document.getElementById('comment').value;
            const memberId = localStorage.getItem('member_id');
            const memberName = localStorage.getItem('member_name') || 'Anonymous';

            if (!memberId) {
                alert('Please login to leave feedback');
                window.location.href = 'login.html';
                return;
            }

            if (!rating || !comment) {
                alert('Please provide both rating and comment');
                return;
            }

            const feedbackData = {
                trainer_name: currentTrainer,
                member_id: memberId,
                member_name: memberName,
                rating: parseInt(rating),
                comment: comment
            };

            // Save to local storage
            let feedbacks = JSON.parse(localStorage.getItem('gymFeedback') || '[]');
            feedbacks.push({
                ...feedbackData,
                id: Date.now(),
                date: new Date().toISOString()
            });
            localStorage.setItem('gymFeedback', JSON.stringify(feedbacks));

            // Try to send to backend
            try {
                const response = await fetch(`${API_BASE_URL}/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(feedbackData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to submit feedback');
                }

                const responseData = await response.json();
                console.log('Feedback submitted:', responseData);
                loadFeedback(currentTrainer);

            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Feedback saved locally. Will sync when online.');
            }

            alert('Thank you for your feedback!');
            feedbackForm.reset();
        });
    }

    // Load feedbacks for a trainer
    async function loadFeedback(trainerName) {
        if (!feedbackItems) return;

        feedbackItems.innerHTML = '<li>Loading feedback...</li>';

        let feedbacks = JSON.parse(localStorage.getItem('gymFeedback') || '[]');
        let trainerFeedbacks = feedbacks.filter(fb => fb.trainer_name === trainerName);

        try {
            const response = await fetch(`${API_BASE_URL}/feedback?trainer_name=${encodeURIComponent(trainerName)}`);
            if (response.ok) {
                const backendFeedbacks = await response.json();
                trainerFeedbacks = [
                    ...trainerFeedbacks,
                    ...backendFeedbacks.filter(bf =>
                        !trainerFeedbacks.some(tf => tf.id === bf.id)
                    )
                ];
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
        }

        if (trainerFeedbacks.length === 0) {
            feedbackItems.innerHTML = '<li>No feedback yet</li>';
            return;
        }

        feedbackItems.innerHTML = '';
        trainerFeedbacks.forEach(fb => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${fb.member_name}</strong> (${fb.rating}⭐):
                <p>${fb.comment}</p>
                <small>${new Date(fb.date || fb.created_at).toLocaleDateString()}</small>
            `;
            feedbackItems.appendChild(li);
        });
    }
});
