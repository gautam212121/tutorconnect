import 'dotenv/config';
import pool from './src/config/db.js';

async function updateDb() {
  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM settings LIKE "paymentMethods"');
    if (rows.length === 0) {
      console.log('Adding paymentMethods column...');
      await pool.query('ALTER TABLE settings ADD COLUMN paymentMethods JSON');
      console.log('Column added successfully.');
    } else {
      console.log('paymentMethods column already exists.');
    }

    console.log('Modifying bookings table status and paymentStatus columns...');
    await pool.query('ALTER TABLE bookings MODIFY COLUMN status VARCHAR(100) DEFAULT "Pending"');
    await pool.query('ALTER TABLE bookings MODIFY COLUMN paymentStatus VARCHAR(100) DEFAULT "Pending"');

    console.log('Modifying payments table status and method columns...');
    await pool.query('ALTER TABLE payments MODIFY COLUMN status VARCHAR(100) DEFAULT "Pending"');
    await pool.query('ALTER TABLE payments MODIFY COLUMN method VARCHAR(100) DEFAULT "Razorpay"');

    console.log('Creating schedules table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`schedules\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`booking\` INT NULL,
        \`student\` INT NOT NULL,
        \`tutor\` INT NOT NULL,
        \`date\` VARCHAR(50) NOT NULL,
        \`startTime\` VARCHAR(50) NOT NULL,
        \`endTime\` VARCHAR(50) NOT NULL,
        \`subject\` VARCHAR(255) NULL,
        \`grade\` VARCHAR(100) NULL,
        \`selectedSubjects\` JSON NULL,
        \`duration\` INT DEFAULT 60,
        \`location\` VARCHAR(255) NULL,
        \`addressFull\` TEXT NULL,
        \`addressArea\` VARCHAR(100) NULL,
        \`addressCity\` VARCHAR(100) NULL,
        \`addressPincode\` VARCHAR(20) NULL,
        \`status\` VARCHAR(100) DEFAULT 'Pending',
        \`notes\` TEXT NULL,
        \`adminNotes\` TEXT NULL,
        \`approvedBy\` INT NULL,
        \`approvedAt\` DATETIME NULL,
        \`rejectedBy\` INT NULL,
        \`rejectedAt\` DATETIME NULL,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`booking\`) REFERENCES \`bookings\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`student\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`tutor\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`approvedBy\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`rejectedBy\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating assignments table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`assignments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`courseId\` INT NULL,
        \`studentId\` INT NULL,
        \`tutorId\` INT NOT NULL,
        \`dueDate\` VARCHAR(100) NULL,
        \`startTime\` VARCHAR(50) NULL,
        \`endTime\` VARCHAR(50) NULL,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`tutorId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`studentId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns exist if table was already created
    try {
      await pool.query('ALTER TABLE assignments ADD COLUMN startTime VARCHAR(50) NULL AFTER dueDate');
      await pool.query('ALTER TABLE assignments ADD COLUMN endTime VARCHAR(50) NULL AFTER startTime');
    } catch (e) {
      // Ignore if columns already exist
    }

    console.log('Creating study_materials table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`study_materials\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`fileUrl\` VARCHAR(500) NOT NULL,
        \`courseId\` INT NULL,
        \`studentId\` INT NULL,
        \`tutorId\` INT NOT NULL,
        \`type\` VARCHAR(100) DEFAULT 'PDF',
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`tutorId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`studentId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating assignment_submissions table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`assignment_submissions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`assignmentId\` INT NOT NULL,
        \`studentId\` INT NOT NULL,
        \`content\` TEXT NULL,
        \`fileUrl\` VARCHAR(500) NULL,
        \`status\` VARCHAR(50) DEFAULT 'Submitted',
        \`grade\` VARCHAR(50) NULL,
        \`feedback\` TEXT NULL,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`assignmentId\`) REFERENCES \`assignments\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`studentId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating support_tickets table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`support_tickets\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`studentId\` INT NOT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'Open',
        \`adminReply\` TEXT NULL,
        \`repliedAt\` DATETIME NULL,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`studentId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating notification_campaigns table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`notification_campaigns\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`channel\` VARCHAR(50) NOT NULL,
        \`audience\` VARCHAR(100) NOT NULL,
        \`recipientCount\` INT DEFAULT 0,
        \`status\` VARCHAR(50) DEFAULT 'delivered',
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating audit_logs table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`userId\` INT NOT NULL,
        \`userEmail\` VARCHAR(255) NOT NULL,
        \`action\` VARCHAR(255) NOT NULL,
        \`details\` TEXT NULL,
        \`ipAddress\` VARCHAR(100) NULL,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Modifying settings table columns...');
    const settingsColumns = [
      { name: 'tagline', type: 'VARCHAR(255) NULL' },
      { name: 'siteUrl', type: 'VARCHAR(255) NULL' },
      { name: 'phoneSupport', type: 'VARCHAR(100) NULL' },
      { name: 'minPayout', type: 'INT DEFAULT 500' },
      { name: 'payoutCycle', type: 'VARCHAR(50) DEFAULT "weekly"' },
      { name: 'emailVerification', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'phoneVerification', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'registrationOpen', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'twoFactorAdmin', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'autoApprove', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'emailNewBooking', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'emailPayment', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'emailMarketing', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'smsBooking', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'smsPayment', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'primaryColor', type: 'VARCHAR(50) DEFAULT "#056852"' },
      { name: 'accentColor', type: 'VARCHAR(50) DEFAULT "#0ea5e9"' },
      { name: 'darkMode', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'smtpHost', type: 'VARCHAR(255) NULL' },
      { name: 'smtpPort', type: 'INT NULL' },
      { name: 'smtpUser', type: 'VARCHAR(255) NULL' },
      { name: 'smtpPass', type: 'VARCHAR(255) NULL' },
      { name: 'smsProvider', type: 'VARCHAR(100) NULL' },
      { name: 'smsApiKey', type: 'VARCHAR(255) NULL' },
      { name: 'smsSenderId', type: 'VARCHAR(100) NULL' }
    ];

    for (const col of settingsColumns) {
      try {
        await pool.query(`ALTER TABLE settings ADD COLUMN \`${col.name}\` ${col.type}`);
        console.log(`Added column settings.${col.name}`);
      } catch (e) {
        // Column already exists, ignore
      }
    }

    console.log('Database schema updated successfully.');
  } catch (err) {
    console.error('Error during database update:', err);
  } finally {
    process.exit(0);
  }
}

updateDb();
