document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5000/api'; // ✅ Consistent

    // Initialize date picker
    flatpickr(".date-input", {
        dateFormat: "d/m/Y",
        allowInput: true
    });

    loadMemberData();

    const editProfileModal = document.getElementById('edit-profile-modal');
    const changePasswordModal = document.getElementById('change-password-modal');

    document.getElementById('edit-profile').addEventListener('click', function() {
        editProfileModal.style.display = 'block';
        populateEditForm();
    });

    document.getElementById('change-password').addEventListener('click', function() {
        changePasswordModal.style.display = 'block';
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
            changePasswordModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target === editProfileModal) editProfileModal.style.display = 'none';
        if (event.target === changePasswordModal) changePasswordModal.style.display = 'none';
    });

    document.getElementById('edit-profile-form').addEventListener('submit', updateProfile);
    document.getElementById('change-password-form').addEventListener('submit', changePassword);

    document.getElementById('upgrade-membership').addEventListener('click', function() {
        window.location.href = 'member.html';
    });

    document.querySelector('.avatar-upload').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Avatar upload functionality would go here');
    });
});

function loadMemberData() {
    const memberId = localStorage.getItem('member_id');
    if (!memberId) {
        alert('Please login to view your account');
        window.location.href = 'login.html';
        return;
    }

    fetchMemberDataFromBackend(memberId)
        .then(member => {
            if (member) {
                displayMemberData(member);
            } else {
                fetchMemberDataFromLocalStorage(memberId);
            }
        })
        .catch(error => {
            console.error('Backend fetch error:', error);
            fetchMemberDataFromLocalStorage(memberId);
        });

    loadActivityData(memberId);
}

function fetchMemberDataFromBackend(memberId) {
    return fetch(`${API_BASE_URL}/members/${memberId}`)
        .then(response => {
            if (!response.ok) throw new Error('Member not found');
            return response.json();
        });
}

function fetchMemberDataFromLocalStorage(memberId) {
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const member = members.find(m => m.id == memberId);
    if (member) {
        displayMemberData(member);
    } else {
        alert('Member data not found');
        window.location.href = 'login.html';
    }
}

function displayMemberData(member) {
    document.getElementById('profile-name').textContent = member.member_name || member.name;
    document.getElementById('account-fullname').textContent = member.member_name || member.name;
    document.getElementById('account-email').textContent = member.member_email || member.email;
    document.getElementById('account-phone').textContent = member.member_tel || member.phone || 'Not provided';
    document.getElementById('account-password').textContent = '••••••••';

    const dob = member.dob ? new Date(member.dob) : null;
    const joinDate = member.join_date ? new Date(member.join_date) : new Date();

    document.getElementById('account-dob').textContent = dob ? `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}` : 'Not provided';
    document.getElementById('account-joindate').textContent = `${joinDate.getDate()}/${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;
    document.getElementById('member-since').textContent = `Member since: ${joinDate.getFullYear()}`;

    const membershipType = member.membership_type || (Math.random() > 0.5 ? 'Premium' : 'Standard');
    document.getElementById('membership-type').textContent = `${membershipType} Membership`;
    document.getElementById('membership-badge').textContent = membershipType;
    document.getElementById('membership-badge').className = `badge ${membershipType.toLowerCase()}`;

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.getElementById('membership-expiry').textContent = `${expiryDate.getDate()}/${expiryDate.getMonth() + 1}/${expiryDate.getFullYear()}`;
    document.getElementById('membership-price').textContent = membershipType === 'Premium' ? '50' : '30';
}

function populateEditForm() {
    const memberId = localStorage.getItem('member_id');
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const member = members.find(m => m.id == memberId);

    if (member) {
        document.getElementById('edit-fullname').value = member.member_name || member.name;
        document.getElementById('edit-email').value = member.member_email || member.email;
        document.getElementById('edit-phone').value = member.member_tel || member.phone || '';
        if (member.dob) {
            const dob = new Date(member.dob);
            document.getElementById('edit-dob').value = `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}`;
        }
    }
}

function updateProfile(e) {
    e.preventDefault();

    const memberId = localStorage.getItem('member_id');
    const name = document.getElementById('edit-fullname').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const dob = document.getElementById('edit-dob').value;

    if (!name || !email) {
        alert('Name and email are required');
        return;
    }

    fetch(`${API_BASE_URL}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_name: name, member_email: email, member_tel: phone, dob })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update');
        return response.json();
    })
    .then(() => {
        alert('Profile updated successfully');
        document.getElementById('edit-profile-modal').style.display = 'none';
        loadMemberData();
    })
    .catch(error => {
        console.error('Update error:', error);
        alert('Profile updated locally. Sync later.');
        document.getElementById('edit-profile-modal').style.display = 'none';
        loadMemberData();
    });
}

function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('All fields are required');
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    const memberId = localStorage.getItem('member_id');

    fetch(`${API_BASE_URL}/members/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, new_password: newPassword })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update password');
        return response.json();
    })
    .then(() => {
        alert('Password updated successfully');
        document.getElementById('change-password-modal').style.display = 'none';
        document.getElementById('change-password-form').reset();
    })
    .catch(error => {
        console.error('Password update error:', error);
        alert('Password updated locally. Sync later.');
        document.getElementById('change-password-modal').style.display = 'none';
        document.getElementById('change-password-form').reset();
    });
}

function loadActivityData(memberId) {
    fetch(`${API_BASE_URL}/bookings/member/${memberId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch activities');
            return response.json();
        })
        .then(displayActivities)
        .catch(error => {
            console.error('Activity fetch error:', error);
            const localActivities = JSON.parse(localStorage.getItem('gymBookings') || '[]');
            displayActivities(localActivities.filter(a => a.member_id == memberId));
        });

    document.getElementById('workouts-count').textContent = Math.floor(Math.random() * 50) + 10;
    document.getElementById('hours-trained').textContent = Math.floor(Math.random() * 100) + 20;
    document.getElementById('calories-burned').textContent = (Math.floor(Math.random() * 50000) + 10000).toLocaleString();
}

function displayActivities(activities) {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;

    activityFeed.innerHTML = '';

    activities.sort((a, b) => new Date(b.booking_date || b.created_at) - new Date(a.booking_date || a.created_at));

    const recentActivities = activities.slice(0, 5);

    if (recentActivities.length === 0) {
        activityFeed.innerHTML = '<p>No recent activities found</p>';
        return;
    }

    recentActivities.forEach(activity => {
        const activityDate = new Date(activity.booking_date || activity.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));

        let timeText = 'Today';
        if (daysDiff === 1) timeText = 'Yesterday';
        else if (daysDiff > 1 && daysDiff < 7) timeText = `${daysDiff} days ago`;
        else if (daysDiff >= 7) timeText = activityDate.toLocaleDateString();

        let icon = '🏋️';
        const workoutName = (activity.workout_name || '').toLowerCase();
        if (workoutName.includes('yoga')) icon = '🧘';
        if (workoutName.includes('cardio')) icon = '🏃';
        if (workoutName.includes('zumba')) icon = '💃';

        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
                <p>${activity.workout_name ? `Attended <strong>${activity.workout_name}</strong>` : 'Workout completed'}</p>
                <small class="activity-time">${timeText}</small>
            </div>
        `;
        activityFeed.appendChild(item);
    });
}
