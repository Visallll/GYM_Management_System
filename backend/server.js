// Load environment variables from .env file
require('dotenv').config();


// Import required modules
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Database connection pool
const bcrypt = require('bcrypt'); // Password hashing
const rateLimit = require('express-rate-limit'); // Rate limiting
const { body, validationResult } = require('express-validator'); // Input validation
const { exec, spawn } = require('child_process'); // For executing shell commands
const fs = require('fs');

// Initialize Express application
const app = express();
const port = process.env.PORT || 5000; // Use environment port or default to 5000

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Root endpoint - Basic health check
app.get('/', (req, res) => {
  res.send('BigBoss Gym Backend Running!');
});

/**
 * Rate limiting configuration for login endpoint
 * Limits to 10 requests per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts, please try again later.' });
  }
});

/**
 * LOGIN ENDPOINT
 * Validates email and password, authenticates user
 */
app.post('/api/login', loginLimiter, [
  // Input validation
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Query database for user
    const [rows] = await pool.query(`SELECT * FROM members WHERE member_email = ?`, [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    // Compare hashed passwords
    const isValid = await bcrypt.compare(password, user.member_password);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    // Successful login response
    res.json({
      id: user.member_id,
      name: user.member_name,
      phone: user.member_tel,
      email: user.member_email,
      dob: user.dob,
      membership_type: user.membership_type || 'Standard Membership'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * MEMBER REGISTRATION ENDPOINT
 * Creates a new member account
 */
app.post('/api/members', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, email, phone, membership_type = 'Standard', join_date, dob, password } = req.body;

  try {
    // Generate unique member ID
    let member_id;
    let isUnique = false;
    while (!isUnique) {
      member_id = `MBR${Math.floor(100000 + Math.random() * 900000)}`;
      const [existing] = await pool.query('SELECT 1 FROM members WHERE member_id = ?', [member_id]);
      if (existing.length === 0) isUnique = true;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(`
      INSERT INTO members (
        member_id,
        member_name,
        member_email,
        member_password,
        member_tel,
        dob,
        join_date,
        membership_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member_id,
        name,
        email,
        hashedPassword,
        phone,
        dob || null,
        join_date || new Date(),
        membership_type
      ]
    );

    // Send welcome email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to BigBoss Gym!',
      text: `Hello ${name},\n\nYour account has been created successfully!\n\nMember ID: ${member_id}\nEmail: ${email}\nPassword: ${password}\n\nYou can now login to your account.`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) console.warn('Email sending failed:', error);
    });

    res.status(201).json({ message: 'Member added successfully', member_id });
  } catch (err) {
    console.error('Insert member error:', err);
    res.status(500).json({ error: 'Failed to register member', details: err.sqlMessage });
  }
});

/// ✅ Move this first
app.get('/api/members/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS totalMembers FROM members');
    res.json({ totalMembers: rows[0].totalMembers });
  } catch (err) {
    console.error('Count members error:', err);
    res.status(500).json({ error: 'Failed to count members' });
  }
});

// ✅ THEN define this route AFTER
app.get('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Member not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch member error:', err);
    res.status(500).json({ error: 'Fetch member failed' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * UPDATE MEMBER ENDPOINT
 * Modifies member details
 */
app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, dob, membership_type, join_date } = req.body;

  if (!name || !email || !phone || !dob || !membership_type || !join_date) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    await pool.query(`
      UPDATE members 
      SET member_name = ?, member_email = ?, member_tel = ?, dob = ?, membership_type = ?, join_date = ?
      WHERE member_id = ?
    `, [name, email, phone, dob, membership_type, join_date, id]);

    res.json({ message: 'Member updated successfully' });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * DELETE MEMBER ENDPOINT
 */
app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM members WHERE member_id = ?', [id]);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

/**
 * UPDATE PASSWORD ENDPOINT
 * Changes member password
 */
app.post('/api/members/password', async (req, res) => {
  const { id, new_password } = req.body;
  
  // Validate required fields
  if (!id || !new_password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Hash new password before storing
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE members SET member_password = ? WHERE member_id = ?`, [hashed, id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Password update failed' });
  }
});

/**
 * FEEDBACK SUBMISSION ENDPOINT
 * Stores member feedback about trainers
 */
app.post('/api/feedback', async (req, res) => {
  const { trainer_name, member_id, rating, comment } = req.body;
  
  // Validate required fields
  if (!trainer_name || !member_id || !rating || !comment) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    await pool.query(`
      INSERT INTO feedback (trainer_name, member_id, rating, comment)
      VALUES (?, ?, ?, ?)`,
      [trainer_name, member_id, rating, comment]
    );
    res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error('Feedback insert error:', err);
    res.status(500).json({ error: 'Save feedback failed' });
  }
});

/**
 * GET ALL TRAINERS ENDPOINT
 * Returns list of all gym trainers
 */
app.get('/api/trainers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trainers');
    res.json(rows);
  } catch (err) {
    console.error('Fetch trainers error:', err);
    res.status(500).json({ error: 'Fetch trainers failed' });
  }
});
// CREATE new trainer
app.post('/api/trainers', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('specialty').notEmpty(),
  body('experience').isInt(),
  body('schedule').notEmpty(),
  body('rating').isFloat({ min: 0, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, email, specialty, experience, schedule, rating } = req.body;

  try {
    const [result] = await pool.query(`
      INSERT INTO trainers (name, email, specialty, experience, schedule, rating)
      VALUES (?, ?, ?, ?, ?, ?)`, 
      [name, email, specialty, experience, schedule, rating]
    );
    res.status(201).json({ message: 'Trainer added', trainer_id: result.insertId });
  } catch (err) {
    console.error('Add trainer error:', err);
    res.status(500).json({ error: 'Failed to add trainer' });
  }
});

app.put('/api/trainers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, specialty, experience, schedule, rating } = req.body;

  if (!name || !email || !specialty || !experience || !schedule || !rating) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    await pool.query(`
      UPDATE trainers
      SET name = ?, email = ?, specialty = ?, experience = ?, schedule = ?, rating = ?
      WHERE id = ?`,  
      [name, email, specialty, experience, schedule, rating, id]
    );
    res.json({ message: 'Trainer updated successfully' });
  } catch (err) {
    console.error('Update trainer error:', err);
    res.status(500).json({ error: 'Failed to update trainer' });
  }
});

// DELETE trainer
app.delete('/api/trainers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM trainers WHERE id = ?', [id]);
    res.json({ message: 'Trainer deleted successfully' });
  } catch (err) {
    console.error('Delete trainer error:', err);
    res.status(500).json({ error: 'Failed to delete trainer' });
  }
});

/**
 * MEMBER COUNT ENDPOINT
 * Returns total number of members
 */
app.get('/api/members/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS totalMembers FROM members');
    res.json({ totalMembers: rows[0].totalMembers });
  } catch (err) {
    console.error('Count members error:', err);
    res.status(500).json({ error: 'Failed to count members' });
  }
});

/**
 * TRAINER COUNT ENDPOINT
 * Returns total number of trainers
 */
app.get('/api/trainers/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS totalTrainers FROM trainers');
    res.json({ totalTrainers: rows[0].totalTrainers });
  } catch (err) {
    console.error('Count trainers error:', err);
    res.status(500).json({ error: 'Failed to count trainers' });
  }
});

/**
 * TOTAL INCOME ENDPOINT
 * Returns sum of all payments
 */
app.get('/api/payments/total', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT SUM(total_amount) AS totalIncome FROM payments');
    res.json({ 
      totalIncome: rows[0].totalIncome ? parseFloat(rows[0].totalIncome).toFixed(2) : '0.00' 
    });
  } catch (err) {
    console.error('Total income error:', err);
    res.status(500).json({ error: 'Failed to calculate income' });
  }
});

/**
 * GET ALL PAYMENTS
 */
app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// PUT update payment
app.put('/api/payments/:id', [
  body('member_id').notEmpty(),
  body('total_amount').isDecimal(),
  body('payment_method').notEmpty()
], async (req, res) => {
  const { id } = req.params;
  const { member_id, total_amount, payment_method, promo_used } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const [result] = await pool.query(`
      UPDATE payments 
      SET member_id = ?, total_amount = ?, payment_method = ?, promo_used = ?
      WHERE payment_id = ?
    `, [member_id, total_amount, payment_method, promo_used || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});


// DELETE payment
app.delete('/api/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM payments WHERE payment_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

/**
 * CREATE NEW PAYMENT
 */
app.post('/api/payments', [
  body('member_id').notEmpty(),
  body('total_amount').isDecimal(),
  body('payment_method').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { member_id, total_amount, payment_method, promo_used } = req.body;

  try {
    const [result] = await pool.query(`
      INSERT INTO payments (member_id, total_amount, payment_method, promo_used, payment_date)
      VALUES (?, ?, ?, ?, NOW())`,
      [member_id, total_amount, payment_method, promo_used || null]
    );
    res.status(201).json({ 
      message: 'Payment recorded successfully',
      payment_id: result.insertId 
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.get('/api/payments/monthly', async (req, res) => {
  try {
    let query = `
      SELECT 
        DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
        m.membership_type,
        SUM(p.total_amount) AS total
      FROM payments p
      JOIN members m ON p.member_id = m.member_id
    `;
    
    const conditions = [];
    const params = [];
    
    // Year filter
    if (req.query.year) {
      conditions.push('YEAR(p.payment_date) = ?');
      params.push(req.query.year);
    }

    // Month range filter
    if (req.query.fromMonth && req.query.toMonth) {
      conditions.push('MONTH(p.payment_date) BETWEEN ? AND ?');
      params.push(req.query.fromMonth, req.query.toMonth);
    }
    
    // Membership type filter
    if (req.query.membershipType && req.query.membershipType !== '') {
      conditions.push('m.membership_type = ?');
      params.push(req.query.membershipType);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Group by month and membership_type
    query += ' GROUP BY month, m.membership_type';
    
    // Order by month ascending
    query += ' ORDER BY month';
    
    const [rows] = await pool.query(query, params);
    
    // Format response: membership_type fallback for single filtered type
    const response = rows.map(row => ({
      month: row.month,
      membership_type: row.membership_type || req.query.membershipType || 'All Memberships',
      total: parseFloat(row.total)
    }));
    
    res.json(response);
  } catch (err) {
    console.error('Monthly income error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly income' });
  }
});

/**
 * CHATBOT ENDPOINT - Clean Text Version
 * Interfaces with external Java chatbot using stdin/stdout
 */
app.get('/chatbot', async (req, res) => {
    const msg = req.query.msg;
    if (!msg) {
        console.error('[CHATBOT] [ERROR] Missing message parameter');
        return res.status(400).send('Please enter your question');
    }

    try {
        const projectRoot = path.normalize('C:/tepy/Year 4/Y4S2/BigBossGym_Final_Project/Project');
        const sanitizedMsg = msg.replace(/"/g, '\\"').replace(/\n/g, ' ');

        console.log('[CHATBOT] [INFO] Processing query:', sanitizedMsg);

        const command = `java -cp "${projectRoot}/bigboss_rmi;${projectRoot}" bigboss_rmi.ChatBridge "${sanitizedMsg}"`;
        
        const child = exec(command, { 
            cwd: projectRoot,
            timeout: 5000
        });

        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', (data) => {
            stdoutData += data;
            // Filter and log only debug messages
            if (!data.startsWith('CHATBOT_RESPONSE:')) {
                console.log('[JAVA]', data.trim());
            }
        });

        child.stderr.on('data', (data) => {
            stderrData += data;
            console.error('[JAVA] [ERROR]', data.trim());
        });

        child.on('close', (code) => {
            const lastLine = stdoutData.trim().split('\n').pop() || '';
            
            if (lastLine.startsWith('CHATBOT_RESPONSE:')) {
                const response = lastLine.replace('CHATBOT_RESPONSE:', '').trim();
                console.log('[CHATBOT] [INFO] Response ready');
                res.send(response);
            }
            else if (lastLine.startsWith('CHATBOT_ERROR:')) {
                const error = lastLine.replace('CHATBOT_ERROR:', '').trim();
                console.error('[CHATBOT] [ERROR]', error);
                res.status(500).send('Unable to process your request');
            }
            else {
                console.error('[CHATBOT] [ERROR] Invalid response format');
                res.status(500).send('Service error');
            }
        });

    } catch (err) {
        console.error('[SYSTEM] [ERROR]', err);
        res.status(500).send('Service unavailable');
    }
});
// Insert sample trainers on startup
async function insertSampleTrainers() {
  try {
    const [results] = await pool.query('SELECT COUNT(*) as count FROM trainers');
    if (results[0].count === 0) {
      const trainers = [
        ['Bun Ratnatepy', 'bunratnatepy@gmail.com', 'Yoga', 2, 'Mon-Fri 6AM-12PM', 4.8],
        ['Chhin Visal', 'chhinvisal@gmail.com', 'Cardio', 8, 'Tue-Thu 10AM-6PM', 4.9],
        ['Haysavin RongRavidwin', 'winwin@gmail.com', 'Strength', 5, 'Tue-Thu 8AM-4PM', 4.9],
        ["HOUN Sithai", "sithai@example.com", "Pilates", 1, "Wed-Fri 7AM-2PM", 4.0]
      ];

      for (let t of trainers) {
        await pool.query(
          `INSERT INTO trainers (name, email, specialty, experience, schedule, rating) 
           VALUES (?, ?, ?, ?, ?, ?)`, t
        );
      }
      console.log("Sample trainers inserted.");
    }
  } catch (err) {
    console.error("Error inserting sample trainers:", err);
  }
}

// Start the server
insertSampleTrainers().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});