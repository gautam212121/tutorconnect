-- TutorConnect MySQL Database Dump
-- Compatible with XAMPP / phpMyAdmin / MySQL 5.7+ & 8.0 / MariaDB

CREATE DATABASE IF NOT EXISTS `tutorconnect` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tutorconnect`;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'tutor', 'admin') NOT NULL DEFAULT 'student',
  `avatar` VARCHAR(500) NULL,
  `status` ENUM('active', 'inactive', 'blocked', 'pending', 'verified', 'suspended', 'rejected') NOT NULL DEFAULT 'active',
  
  -- Tutor Specific Fields
  `headline` VARCHAR(255) NULL,
  `bio` TEXT NULL,
  `price` DECIMAL(10, 2) NULL,
  `priceMax` DECIMAL(10, 2) NULL,
  `experience` VARCHAR(100) NULL,
  `location` VARCHAR(255) NULL,
  `subjects` JSON NULL,
  `classesTaught` JSON NULL,
  `mode` JSON NULL,
  `verified` TINYINT(1) DEFAULT 0,
  `emailVerified` TINYINT(1) DEFAULT 0,
  `googleId` VARCHAR(255) NULL,
  `rating` DECIMAL(3, 2) DEFAULT 0.00,
  `reviews` INT DEFAULT 0,
  `demoVideoUrl` VARCHAR(500) NULL,
  
  -- Monetization (Tutor)
  `completedSessions` INT DEFAULT 0,
  `currentCommissionRate` DECIMAL(5, 4) DEFAULT 0.1500,
  `walletPendingBalance` DECIMAL(10, 2) DEFAULT 0.00,
  `walletAvailableBalance` DECIMAL(10, 2) DEFAULT 0.00,
  `walletPaidBalance` DECIMAL(10, 2) DEFAULT 0.00,
  `activeSubscription` INT NULL,
  `freeLeadsUsed` INT DEFAULT 0,
  `freeLeadsResetDate` DATETIME NULL,
  
  -- Bank Details (Tutor)
  `bankAccountName` VARCHAR(255) NULL,
  `bankAccountNumber` VARCHAR(100) NULL,
  `bankIfscCode` VARCHAR(50) NULL,
  `bankName` VARCHAR(255) NULL,
  `upiId` VARCHAR(255) NULL,
  
  -- Registration Fields
  `mobile` VARCHAR(50) NULL,
  `qualification` VARCHAR(255) NULL,
  `languages` JSON NULL,
  `feeType` ENUM('Hourly', 'Monthly') DEFAULT 'Hourly',
  `availableDays` JSON NULL,
  `availableTimeSlots` VARCHAR(255) NULL,
  `addressCity` VARCHAR(100) NULL,
  `addressArea` VARCHAR(100) NULL,
  `addressPincode` VARCHAR(20) NULL,
  `addressState` VARCHAR(100) NULL,
  `addressFull` TEXT NULL,
  
  -- Documents (Tutor)
  `documents` JSON NULL,
  
  -- KYC / Verification (Tutor)
  `kycStatus` ENUM('pending', 'submitted', 'verified', 'rejected') DEFAULT 'pending',
  `backgroundVerified` TINYINT(1) DEFAULT 0,
  `idVerified` TINYINT(1) DEFAULT 0,
  `addressVerified` TINYINT(1) DEFAULT 0,
  `experienceVerified` TINYINT(1) DEFAULT 0,
  `referenceVerified` TINYINT(1) DEFAULT 0,
  
  -- Student Specific Fields
  `dob` VARCHAR(50) NULL,
  `gender` ENUM('Male', 'Female', 'Other') NULL,
  `grade` VARCHAR(100) NULL,
  `board` VARCHAR(100) NULL,
  `school` VARCHAR(255) NULL,
  `medium` VARCHAR(100) NULL,
  `schedule` JSON NULL,
  `learningGoal` TEXT NULL,
  `specialRequirements` TEXT NULL,
  `budget` DECIMAL(10, 2) NULL,
  `preferredTutorGender` ENUM('Male', 'Female', 'Any') DEFAULT 'Any',
  
  -- Wishlist (Student)
  `wishlist` JSON NULL,
  
  -- Referral
  `referralCode` VARCHAR(100) UNIQUE NULL,
  `referredBy` INT NULL,
  `referralCount` INT DEFAULT 0,
  
  -- Last Active
  `lastLoginAt` DATETIME NULL,
  `isOnline` TINYINT(1) DEFAULT 0,
  
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY `idx_role_status` (`role`, `status`),
  KEY `idx_role_verified` (`role`, `verified`),
  KEY `idx_rating` (`rating`),
  KEY `idx_referralCode` (`referralCode`),
  FOREIGN KEY (`referredBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `subscription_plans`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `price` DECIMAL(10, 2) NOT NULL,
  `duration` INT NOT NULL DEFAULT 1,
  `durationLabel` VARCHAR(100) DEFAULT '1 Month',
  `leadLimit` INT DEFAULT 20,
  `leadLimitLabel` VARCHAR(100) DEFAULT '20 Leads',
  `commissionRate` DECIMAL(5, 4) NOT NULL DEFAULT 0.1000,
  `searchBoost` TINYINT(1) DEFAULT 0,
  `priorityBadge` TINYINT(1) DEFAULT 0,
  `premiumSupport` TINYINT(1) DEFAULT 0,
  `features` JSON NULL,
  `status` ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  `sortOrder` INT DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `subscriptions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tutor` INT NOT NULL,
  `plan` INT NOT NULL,
  `startDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endDate` DATETIME NOT NULL,
  `status` ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
  `amount` DECIMAL(10, 2) NOT NULL,
  `razorpayOrderId` VARCHAR(255) NULL,
  `razorpayPaymentId` VARCHAR(255) NULL,
  `razorpaySubscriptionId` VARCHAR(255) NULL,
  `leadLimit` INT NULL,
  `commissionRate` DECIMAL(5, 4) NULL,
  `autoRenew` TINYINT(1) DEFAULT 0,
  `cancelledAt` DATETIME NULL,
  `cancelReason` TEXT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_tutor_status` (`tutor`, `status`),
  KEY `idx_endDate` (`endDate`),
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `courses`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `classLevel` VARCHAR(100) NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `duration` VARCHAR(100) NULL,
  `mode` ENUM('Online', 'Home', 'Hybrid') DEFAULT 'Online',
  `status` ENUM('active', 'draft', 'archived') DEFAULT 'active',
  `tutor` INT NULL,
  `enrollments` INT DEFAULT 0,
  `thumbnail` VARCHAR(500) NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `bookings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `requestType` ENUM('booking', 'consultation', 'registration') DEFAULT 'booking',
  `source` VARCHAR(100) DEFAULT 'website',
  `student` INT NULL,
  `tutor` INT NULL,
  `course` INT NULL,
  `studentSnapshot` JSON NULL,
  `tutorSnapshot` JSON NULL,
  `subject` VARCHAR(100) NULL,
  `grade` VARCHAR(100) NULL,
  `examType` VARCHAR(100) NULL,
  `mode` ENUM('Home', 'Online') DEFAULT 'Home',
  `scheduledAt` DATETIME NULL,
  `duration` INT DEFAULT 60,
  `message` TEXT NULL,
  `addressFull` TEXT NULL,
  `addressArea` VARCHAR(100) NULL,
  `addressCity` VARCHAR(100) NULL,
  `addressPincode` VARCHAR(20) NULL,
  `meetLink` VARCHAR(500) NULL,
  `status` ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected', 'Declined') DEFAULT 'Pending',
  `amount` DECIMAL(10, 2) DEFAULT 0.00,
  `adminRate` DECIMAL(5, 4) DEFAULT 0.2000,
  `tutorRate` DECIMAL(5, 4) DEFAULT 0.8000,
  `tutorEarning` DECIMAL(10, 2) DEFAULT 0.00,
  `adminCommission` DECIMAL(10, 2) DEFAULT 0.00,
  `paymentStatus` ENUM('Pending', 'Paid', 'Refunded', 'Failed') DEFAULT 'Pending',
  `razorpayOrderId` VARCHAR(255) NULL,
  `razorpayPaymentId` VARCHAR(255) NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`course`) REFERENCES `courses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `leads`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `leads`;
CREATE TABLE `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student` INT NOT NULL,
  `tutor` INT NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `classLevel` VARCHAR(100) NOT NULL,
  `board` VARCHAR(100) NULL,
  `locationCity` VARCHAR(100) NULL,
  `locationArea` VARCHAR(100) NULL,
  `locationPincode` VARCHAR(20) NULL,
  `locationFull` TEXT NULL,
  `mode` ENUM('Home', 'Online', 'Both') DEFAULT 'Home',
  `budget` DECIMAL(10, 2) NULL,
  `preferredGender` ENUM('Male', 'Female', 'Any') DEFAULT 'Any',
  `message` TEXT NULL,
  `preferredTiming` VARCHAR(100) NULL,
  `weeklyDays` JSON NULL,
  `isOtpVerified` TINYINT(1) DEFAULT 0,
  `studentPhone` VARCHAR(50) NULL,
  `studentEmail` VARCHAR(255) NULL,
  `status` ENUM('new', 'contacted', 'responded', 'converted', 'expired', 'replaced', 'disputed', 'fake') DEFAULT 'new',
  `source` ENUM('search', 'admin', 'auto', 'booking') DEFAULT 'search',
  `deliveredAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `contactedAt` DATETIME NULL,
  `respondedAt` DATETIME NULL,
  `convertedAt` DATETIME NULL,
  `disputeReason` TEXT NULL,
  `disputedAt` DATETIME NULL,
  `replacementLeadId` INT NULL,
  `isFreeLeadSlot` TINYINT(1) DEFAULT 1,
  `booking` INT NULL,
  `leadDisplayId` VARCHAR(50) UNIQUE NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_tutor_status` (`tutor`, `status`),
  KEY `idx_student` (`student`),
  KEY `idx_deliveredAt` (`deliveredAt`),
  FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `lead_disputes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `lead_disputes`;
CREATE TABLE `lead_disputes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lead` INT NOT NULL,
  `tutor` INT NOT NULL,
  `reason` ENUM('Fake / Not Responding', 'Wrong Location', 'Wrong Subject', 'Duplicate Lead', 'Not Interested', 'Invalid Contact', 'Other') NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('auto-resolved', 'pending-review', 'under-review', 'escalated', 'resolved', 'rejected') DEFAULT 'pending-review',
  `autoResolved` TINYINT(1) DEFAULT 0,
  `autoResolvedAt` DATETIME NULL,
  `adminResolvedBy` INT NULL,
  `adminResolvedAt` DATETIME NULL,
  `resolution` TEXT NULL,
  `resolutionAction` ENUM('replaced', 'credited', 'rejected', 'refunded') NULL,
  `replacementLead` INT NULL,
  `disputeDisplayId` VARCHAR(50) UNIQUE NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_tutor_status` (`tutor`, `status`),
  KEY `idx_lead` (`lead`),
  FOREIGN KEY (`lead`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`adminResolvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `payments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking` INT NOT NULL,
  `student` INT NOT NULL,
  `tutor` INT NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `tutorShare` DECIMAL(10, 2) NOT NULL,
  `adminShare` DECIMAL(10, 2) NOT NULL,
  `adminRate` DECIMAL(5, 4) NOT NULL,
  `tutorRate` DECIMAL(5, 4) NOT NULL,
  `status` ENUM('Pending', 'Completed', 'Refunded', 'Failed') DEFAULT 'Pending',
  `method` ENUM('Razorpay', 'Cash', 'Mock') DEFAULT 'Razorpay',
  `razorpayOrderId` VARCHAR(255) NULL,
  `razorpayPaymentId` VARCHAR(255) NULL,
  `razorpaySignature` VARCHAR(255) NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `reviews`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking` INT NULL,
  `student` INT NOT NULL,
  `tutor` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NULL,
  `status` ENUM('visible', 'hidden', 'reported') DEFAULT 'visible',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `messages`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking` INT NULL,
  `from` INT NOT NULL,
  `to` INT NOT NULL,
  `type` ENUM('text', 'image', 'pdf', 'document', 'meet_link', 'notification', 'system') DEFAULT 'text',
  `content` TEXT NOT NULL,
  `meetUrl` VARCHAR(500) NULL,
  `attachments` JSON NULL,
  `read` TINYINT(1) DEFAULT 0,
  `readAt` DATETIME NULL,
  `delivered` TINYINT(1) DEFAULT 0,
  `deliveredAt` DATETIME NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_from_to` (`from`, `to`),
  KEY `idx_booking` (`booking`),
  FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`from`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `notifications`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient` INT NULL, -- NULL = broadcast
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('system', 'booking', 'payment', 'review', 'approval', 'lead', 'lead_dispute', 'subscription', 'payout', 'session_reminder', 'chat', 'general') DEFAULT 'general',
  `read` TINYINT(1) DEFAULT 0,
  `readAt` DATETIME NULL,
  `link` VARCHAR(500) NULL,
  `icon` VARCHAR(100) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_recipient_read` (`recipient`, `read`),
  FOREIGN KEY (`recipient`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `activity_logs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` INT NULL,
  `action` VARCHAR(255) NOT NULL,
  `category` ENUM('auth', 'booking', 'payment', 'lead', 'dispute', 'subscription', 'payout', 'admin', 'profile', 'system') DEFAULT 'system',
  `details` TEXT NULL,
  `metadata` JSON NULL,
  `ip` VARCHAR(100) NULL,
  `userAgent` TEXT NULL,
  `targetModel` VARCHAR(100) NULL,
  `targetId` INT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_user` (`user`),
  KEY `idx_category` (`category`),
  FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `blogs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `blogs`;
CREATE TABLE `blogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `excerpt` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `role` VARCHAR(100) DEFAULT 'Educator',
  `readTime` VARCHAR(50) DEFAULT '5 min read',
  `image` VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `callback_requests`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `callback_requests`;
CREATE TABLE `callback_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `role` ENUM('student', 'teacher') DEFAULT 'student',
  `classLevel` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) DEFAULT 'Lucknow',
  `mode` ENUM('Home', 'Online', 'Both') DEFAULT 'Home',
  `tutor` INT NULL,
  `status` ENUM('Pending', 'Called', 'Confirmed', 'Completed', 'Declined', 'Cancelled') DEFAULT 'Pending',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `careers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `careers`;
CREATE TABLE `careers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `gender` VARCHAR(50) NULL,
  `dob` VARCHAR(50) NULL,
  `address` JSON NULL,
  `education` JSON NULL,
  `teaching` JSON NULL,
  `experienceDetails` JSON NULL,
  `availability` JSON NULL,
  `fees` JSON NULL,
  `skills` JSON NULL,
  `documents` JSON NULL,
  `password` VARCHAR(255) NULL,
  `status` ENUM('pending', 'under review', 'approved', 'rejected') DEFAULT 'pending',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `image` TEXT NULL,
  `description` TEXT NULL,
  `priority` ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `type` ENUM('Academics', 'Competitive Exams', 'Arts & Music', 'Fitness & Sports', 'Skills & Tech', 'Languages') DEFAULT 'Academics',
  `curriculum` JSON NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `newsletters`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `newsletters`;
CREATE TABLE `newsletters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `subscribedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `otps`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `otps`;
CREATE TABLE `otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `otp` VARCHAR(50) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `platform_config`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `platform_config`;
CREATE TABLE `platform_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `freeLeadsPerMonth` INT DEFAULT 5,
  `leadDisputeWindowHours` INT DEFAULT 48,
  `autoReplacementEnabled` TINYINT(1) DEFAULT 1,
  `otpVerificationForLeads` TINYINT(1) DEFAULT 1,
  `commissionTiers` JSON NULL,
  `payoutWindowDays` INT DEFAULT 5,
  `minimumWithdrawalAmount` DECIMAL(10, 2) DEFAULT 500.00,
  `platformName` VARCHAR(255) DEFAULT 'TutorConnect',
  `supportEmail` VARCHAR(255) DEFAULT 'support@tutorconnect.com',
  `supportPhone` VARCHAR(100) DEFAULT '+91 123 456 7890',
  `platformAddress` VARCHAR(255) DEFAULT 'Lucknow, Uttar Pradesh, India',
  `gstRate` DECIMAL(5, 2) DEFAULT 18.00,
  `gstEnabled` TINYINT(1) DEFAULT 0,
  `maintenanceMode` TINYINT(1) DEFAULT 0,
  `maintenanceMessage` TEXT NULL,
  `smtp` JSON NULL,
  `razorpayKeyId` VARCHAR(255) NULL,
  `razorpayKeySecret` VARCHAR(255) NULL,
  `cloudinaryCloudName` VARCHAR(255) NULL,
  `cloudinaryApiKey` VARCHAR(255) NULL,
  `cloudinaryApiSecret` VARCHAR(255) NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `platformName` VARCHAR(255) DEFAULT 'TutorConnect',
  `supportEmail` VARCHAR(255) NULL,
  `commissionRate` DECIMAL(5, 2) DEFAULT 10.00,
  `gstRate` DECIMAL(5, 2) DEFAULT 18.00,
  `maintenanceMode` TINYINT(1) DEFAULT 0,
  `heroTitle` VARCHAR(255) DEFAULT 'Quality Home Tuition',
  `heroSubtitle` VARCHAR(255) DEFAULT 'Verified tutors at your doorstep',
  `heroImage` VARCHAR(500) DEFAULT '/hero-banner.jpg',
  `smtp` JSON NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `withdrawals`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `withdrawals`;
CREATE TABLE `withdrawals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tutor` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'approved', 'processing', 'paid', 'rejected') DEFAULT 'pending',
  `payoutMethod` ENUM('bank', 'upi') DEFAULT 'bank',
  `bankDetails` JSON NULL,
  `upiId` VARCHAR(255) NULL,
  `processedAt` DATETIME NULL,
  `processedBy` INT NULL,
  `transactionId` VARCHAR(255) NULL,
  `rejectionReason` TEXT NULL,
  `payoutDisplayId` VARCHAR(50) UNIQUE NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_tutor_status` (`tutor`, `status`),
  FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`processedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Default Seed Data
-- --------------------------------------------------------

-- Default Users (Passwords: admin123, tutor123, student123 hashed via bcrypt)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `verified`, `headline`, `bio`, `subjects`, `classesTaught`, `mode`, `price`, `experience`, `location`, `languages`, `rating`, `reviews`, `completedSessions`, `referralCode`) VALUES
(1, 'Admin', 'admin@tutorconnect.com', '$2a$10$w8/0mE6F0o/.R4.3B7oV2e88t.4/6s2uD9e.s7m41K48/9r0w3g0S', 'admin', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, 0, 'TCAD1234'),
(2, 'Rahul Sharma', 'tutor@tutorconnect.com', '$2a$10$fV3.vB4tN9sS0g2F2F2F2eu8r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m', 'tutor', 'active', 1, 'Expert Physics & Maths Tutor', 'Experienced home tutor with 5+ years teaching Physics and Mathematics for Class 9-12, JEE, and NEET preparation.', '["Physics", "Maths"]', '["Class 9", "Class 10", "Class 11", "Class 12"]', '["Home", "Online"]', 600.00, '5 years', 'Lucknow', '["Hindi", "English"]', 4.80, 12, 35, 'TCRU1234'),
(3, 'Ananya Singh', 'student@tutorconnect.com', '$2a$10$fV3.vB4tN9sS0g2F2F2F2eu8r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m', 'student', 'active', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, 0, 'TCAN1234');

-- Default Platform Config
INSERT INTO `platform_config` (`id`, `freeLeadsPerMonth`, `leadDisputeWindowHours`, `autoReplacementEnabled`, `otpVerificationForLeads`, `commissionTiers`) VALUES
(1, 5, 48, 1, 1, '[{"minSessions": 0, "maxSessions": 20, "rate": 0.15, "label": "0 – 20 Sessions"}, {"minSessions": 21, "maxSessions": 100, "rate": 0.10, "label": "21 – 100 Sessions"}, {"minSessions": 101, "maxSessions": 999999, "rate": 0.05, "label": "100+ Sessions"}]');

-- Default Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `price`, `duration`, `durationLabel`, `leadLimit`, `leadLimitLabel`, `commissionRate`, `searchBoost`, `priorityBadge`, `premiumSupport`, `features`, `sortOrder`) VALUES
(1, 'Basic', 499.00, 1, '1 Month', 20, '20 Leads', 0.1000, 0, 0, 0, '["20 leads/month", "10% commission rate", "Basic support"]', 1),
(2, 'Pro', 1299.00, 1, '1 Month', 50, '50 Leads', 0.0500, 1, 1, 0, '["50 leads/month", "5% commission rate", "Search boost", "Priority badge", "Premium support"]', 2),
(3, 'Premium', 11999.00, 12, '12 Months', -1, 'Unlimited', 0.0000, 1, 1, 1, '["Unlimited leads", "0% commission", "Top search ranking", "Premium badge", "Dedicated support", "Profile boost"]', 3);

-- Default Blogs
INSERT INTO `blogs` (`id`, `title`, `excerpt`, `content`, `category`, `author`, `role`, `readTime`, `image`) VALUES
(1, 'How to Choose the Right Home Tutor for Your Child', 'Finding the perfect tutor goes beyond qualifications. Here are key things parents should evaluate before hiring.', 'Finding the perfect tutor for your child is a crucial decision that can significantly impact their academic journey and self-confidence. While academic qualifications are important, they are only part of the equation.\n\n### 1. Identify Your Goals\nBefore you start searching, clearly define what you want to achieve. Is your child struggling to keep up, or do they need help preparing for a specific competitive exam like JEE or NEET?\n\n### 2. Look for Teaching Experience\nA tutor might be a subject expert, but explaining complex topics to a young student requires patience and pedagogical skills.\n\n### 3. Check for Safety & Verifications\nSince a home tutor will be coming to your house, safety is paramount.', 'Parents Guide', 'Sunita Sharma', 'Parenting Consultant', '4 min read', 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60'),
(2, '5 Effective Study Habits for Class 10 Board Exams', 'Prepare strategically for your boards. Learn how to manage time, structure study notes, and write optimal responses.', 'Board exams can be stressful, but with the right study strategies, you can ace them with physical colors.\n\n### 1. Use Active Recall\nInstead of just reading and re-reading your textbooks, test yourself.\n\n### 2. Follow the Pomodoro Technique\nStudy in focused bursts of 25 minutes, followed by a 5-minute break.\n\n### 3. Solve Mock Papers Under Real Exam Conditions\nSuccess in board exams isn\'t just about what you know; it\'s also about managing your time.', 'Study Tips', 'Rahul Verma', 'Physics & Maths Tutor', '6 min read', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60');
