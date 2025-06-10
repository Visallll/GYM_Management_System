// Base URL for API endpoints
const API_BASE_URL = 'http://localhost:5000/api'; // <-- add /api to base

// Helper function for making API requests
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error making request:', error);
        throw error;
    }
}

// Member registration
async function registerMember(memberData) {
    return makeRequest(`${API_BASE_URL}/members`, 'POST', memberData); // /api/members
}

// Member login
async function loginMember(credentials) {
    return makeRequest(`${API_BASE_URL}/login`, 'POST', credentials); // /api/login
}

// Process payment
async function processPayment(paymentData) {
    return makeRequest(`${API_BASE_URL}/payments`, 'POST', paymentData); // /api/payments
}

// Submit feedback
async function submitFeedback(feedbackData) {
    return makeRequest(`${API_BASE_URL}/feedback`, 'POST', feedbackData); // /api/feedback
}

// You do NOT have /contact and /getData APIs yet

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerMember,
        loginMember,
        processPayment,
        submitFeedback,
    };
}
