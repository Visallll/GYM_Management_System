-- Members table (aligned with backend ID generation)
CREATE TABLE IF NOT EXISTS members (
  member_id VARCHAR(20) PRIMARY KEY,  -- Changed from INT to VARCHAR for 'MBR' format
  member_name VARCHAR(100) NOT NULL,
  member_email VARCHAR(100) UNIQUE NOT NULL,
  member_password VARCHAR(255) NOT NULL,
  member_tel VARCHAR(20),
  dob DATE,
  join_date DATE DEFAULT CURRENT_DATE,
  membership_type VARCHAR(50) DEFAULT 'Standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table (correct column names)
CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(20) NOT NULL,     -- Matches members.member_id type
  total_amount DECIMAL(10,2) NOT NULL, -- Changed from 'amount'
  payment_method VARCHAR(50) NOT NULL,
  promo_used VARCHAR(100),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);

-- Trainers table (unchanged but verified)
CREATE TABLE IF NOT EXISTS trainers (
  trainer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  specialty VARCHAR(100),
  experience INT,
  schedule TEXT,
  rating FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainer_name VARCHAR(100),
  member_id BIGINT,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT,
  workout_name VARCHAR(100) NOT NULL,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
