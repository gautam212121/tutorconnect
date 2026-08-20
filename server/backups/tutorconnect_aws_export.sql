-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: tutorconnect
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `category` enum('auth','booking','payment','lead','dispute','subscription','payout','admin','profile','system') DEFAULT 'system',
  `details` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip` varchar(100) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `targetModel` varchar(100) DEFAULT NULL,
  `targetId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user`),
  KEY `idx_category` (`category`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment_submissions`
--

DROP TABLE IF EXISTS `assignment_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignmentId` int(11) NOT NULL,
  `studentId` int(11) NOT NULL,
  `content` text DEFAULT NULL,
  `fileUrl` varchar(500) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Submitted',
  `grade` varchar(50) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assignmentId` (`assignmentId`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignmentId`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_submissions`
--

LOCK TABLES `assignment_submissions` WRITE;
/*!40000 ALTER TABLE `assignment_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `courseId` int(11) DEFAULT NULL,
  `studentId` int(11) DEFAULT NULL,
  `tutorId` int(11) NOT NULL,
  `dueDate` varchar(100) DEFAULT NULL,
  `startTime` varchar(50) DEFAULT NULL,
  `endTime` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tutorId` (`tutorId`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`tutorId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,'hii','hfidifdff',NULL,11,4,'2026-08-18','09:00','12:00','active','2026-08-17 02:04:21','2026-08-17 02:04:21');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `userEmail` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ipAddress` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'admin@tutorconnect.com','LAUNCH_CAMPAIGN','{\"title\":\"Platform Update\",\"channel\":\"push\",\"audience\":\"students\",\"recipientCount\":4}','127.0.0.1','2026-08-17 02:45:24'),(2,1,'admin@tutorconnect.com','RUN_BACKUP','{\"filename\":\"backup-2026-08-16T21-15-35-918Z.json\"}','127.0.0.1','2026-08-17 02:45:35');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blogs`
--

DROP TABLE IF EXISTS `blogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `excerpt` text NOT NULL,
  `content` longtext NOT NULL,
  `category` varchar(100) NOT NULL,
  `author` varchar(100) NOT NULL,
  `role` varchar(100) DEFAULT 'Educator',
  `readTime` varchar(50) DEFAULT '5 min read',
  `image` varchar(500) DEFAULT 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blogs`
--

LOCK TABLES `blogs` WRITE;
/*!40000 ALTER TABLE `blogs` DISABLE KEYS */;
INSERT INTO `blogs` VALUES (1,'How to Choose the Right Home Tutor for Your Child','Finding the perfect tutor goes beyond qualifications. Here are key things parents should evaluate before hiring.','Finding the perfect tutor for your child is a crucial decision that can significantly impact their academic journey and self-confidence. While academic qualifications are important, they are only part of the equation.\n\n### 1. Identify Your Goals\nBefore you start searching, clearly define what you want to achieve. Is your child struggling to keep up, or do they need help preparing for a specific competitive exam like JEE or NEET?\n\n### 2. Look for Teaching Experience\nA tutor might be a subject expert, but explaining complex topics to a young student requires patience and pedagogical skills.\n\n### 3. Check for Safety & Verifications\nSince a home tutor will be coming to your house, safety is paramount.','Parents Guide','Sunita Sharma','Parenting Consultant','4 min read','https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60','2026-08-11 16:53:57','2026-08-11 16:53:57'),(2,'5 Effective Study Habits for Class 10 Board Exams','Prepare strategically for your boards. Learn how to manage time, structure study notes, and write optimal responses.','Board exams can be stressful, but with the right study strategies, you can ace them with physical colors.\n\n### 1. Use Active Recall\nInstead of just reading and re-reading your textbooks, test yourself.\n\n### 2. Follow the Pomodoro Technique\nStudy in focused bursts of 25 minutes, followed by a 5-minute break.\n\n### 3. Solve Mock Papers Under Real Exam Conditions\nSuccess in board exams isn\'t just about what you know; it\'s also about managing your time.','Study Tips','Rahul Verma','Physics & Maths Tutor','6 min read','https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60','2026-08-11 16:53:57','2026-08-11 16:53:57');
/*!40000 ALTER TABLE `blogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requestType` enum('booking','consultation','registration') DEFAULT 'booking',
  `source` varchar(100) DEFAULT 'website',
  `student` int(11) DEFAULT NULL,
  `tutor` int(11) DEFAULT NULL,
  `course` int(11) DEFAULT NULL,
  `studentSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`studentSnapshot`)),
  `tutorSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tutorSnapshot`)),
  `subject` varchar(100) DEFAULT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `examType` varchar(100) DEFAULT NULL,
  `mode` enum('Home','Online') DEFAULT 'Home',
  `scheduledAt` datetime DEFAULT NULL,
  `duration` int(11) DEFAULT 60,
  `message` text DEFAULT NULL,
  `addressFull` text DEFAULT NULL,
  `addressArea` varchar(100) DEFAULT NULL,
  `addressCity` varchar(100) DEFAULT NULL,
  `addressPincode` varchar(20) DEFAULT NULL,
  `meetLink` varchar(500) DEFAULT NULL,
  `status` varchar(100) DEFAULT 'Pending',
  `amount` decimal(10,2) DEFAULT 0.00,
  `adminRate` decimal(5,4) DEFAULT 0.2000,
  `tutorRate` decimal(5,4) DEFAULT 0.8000,
  `tutorEarning` decimal(10,2) DEFAULT 0.00,
  `adminCommission` decimal(10,2) DEFAULT 0.00,
  `paymentStatus` varchar(100) DEFAULT 'Pending',
  `razorpayOrderId` varchar(255) DEFAULT NULL,
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student` (`student`),
  KEY `tutor` (`tutor`),
  KEY `course` (`course`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`course`) REFERENCES `courses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'registration','student-registration',5,NULL,NULL,'{\"name\":\"hhi\",\"phone\":\"56789\",\"email\":\"ajeetgautam8052@gmail.com\",\"grade\":\"Class 9\",\"address\":\"Bhanpur\"}',NULL,'Class 9','Class 9','New Student Registration','Home',NULL,0,'New student registration from hhi',NULL,NULL,NULL,NULL,NULL,'Completed',0.00,0.2000,0.8000,0.00,0.00,'Pending',NULL,NULL,'2026-08-12 22:34:55','2026-08-14 03:10:44'),(2,'registration','student-registration',6,NULL,NULL,'{\"name\":\"abhi kumar\",\"phone\":\"9484787654\",\"email\":\"akasharya306@gmail.com\",\"grade\":\"Class 10\",\"classLevel\":\"Class 10\",\"subject\":\"MATH\",\"location\":\"luckonw Uttar pradesh\",\"mode\":\"Home\",\"address\":\"luckonw Uttar pradesh\",\"role\":\"student\"}',NULL,'MATH','Class 10','New Student Registration','Home',NULL,0,'New student registration from abhi kumar — Subject: MATH','luckonw Uttar pradesh',NULL,'luckonw Uttar pradesh',NULL,NULL,'Completed',0.00,0.2000,0.8000,0.00,0.00,'Pending',NULL,NULL,'2026-08-13 17:51:35','2026-08-14 03:10:51'),(3,'registration','student-registration',11,4,NULL,'{\"name\":\"abhinav\",\"phone\":\"8947474744\",\"email\":\"rohitkumar83035@gmail.com\",\"grade\":\"Class 12\",\"classLevel\":\"Class 12\",\"subject\":\"Math ,Physic ,Chemistry\",\"location\":\"bkt,Lucknow,UP\",\"mode\":\"Home\",\"address\":\"bkt,Lucknow,UP\",\"role\":\"student\"}','{\"id\":4,\"name\":\"Praveen Pal\",\"email\":\"palpraveen3125@gmail.com\",\"mobile\":\"8604889884\",\"price\":250,\"subjects\":[\"Mathematics\",\"Physics\",\"English\",\"Chemistry\"]}','Math ,Physic ,Chemistry','Class 12','New Student Registration','Home',NULL,0,'New student registration from abhinav — Subject: Math ,Physic ,Chemistry','bkt,Lucknow,UP',NULL,'bkt,Lucknow,UP',NULL,NULL,'Admin Approved',750.00,0.2000,0.8000,600.00,150.00,'Claimed',NULL,NULL,'2026-08-16 15:19:29','2026-08-17 01:31:10');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `callback_requests`
--

DROP TABLE IF EXISTS `callback_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `callback_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `role` enum('student','teacher') DEFAULT 'student',
  `classLevel` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `location` varchar(255) DEFAULT 'Lucknow',
  `mode` enum('Home','Online','Both') DEFAULT 'Home',
  `tutor` int(11) DEFAULT NULL,
  `status` enum('Pending','Called','Confirmed','Completed','Declined','Cancelled') DEFAULT 'Pending',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tutor` (`tutor`),
  CONSTRAINT `callback_requests_ibfk_1` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `callback_requests`
--

LOCK TABLES `callback_requests` WRITE;
/*!40000 ALTER TABLE `callback_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `callback_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `careers`
--

DROP TABLE IF EXISTS `careers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `careers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `dob` varchar(50) DEFAULT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`address`)),
  `education` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`education`)),
  `teaching` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`teaching`)),
  `experienceDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`experienceDetails`)),
  `availability` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`availability`)),
  `fees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fees`)),
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `password` varchar(255) DEFAULT NULL,
  `status` enum('pending','under review','approved','rejected') DEFAULT 'pending',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `careers`
--

LOCK TABLES `careers` WRITE;
/*!40000 ALTER TABLE `careers` DISABLE KEYS */;
/*!40000 ALTER TABLE `careers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('High','Medium','Low') DEFAULT 'Medium',
  `status` enum('active','inactive') DEFAULT 'active',
  `type` enum('Academics','Competitive Exams','Arts & Music','Fitness & Sports','Skills & Tech','Languages') DEFAULT 'Academics',
  `curriculum` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`curriculum`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Mathematics ','/uploads/1786665818744-math-chalkboard.jpg','It uses logic and counting to solve problems. People use math to measure','High','active','Academics','\"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\"','2026-08-11 18:15:33','2026-08-14 05:33:38'),(2,'Biology','/uploads/1786728392992-bio.jpg','Biology is the natural science that studies life and living organisms, including their structure, function, growth, origin, evolution, and distribution.','High','active','Academics','\"\\\"[]\\\"\"','2026-08-11 18:20:11','2026-08-14 22:56:33'),(3,'Chemistry ','/uploads/1786725861196-chemistry.jpg','Chemistry is the branch of science that studies matter, its properties, how and why substances combine or separate to form other substances, and the energy that accompanies these changes','High','active','Academics','\"[]\"','2026-08-11 18:57:09','2026-08-14 22:14:21'),(7,'English','/uploads/1786798025879-english.webp','English','Medium','active','Academics',NULL,'2026-08-15 18:17:05','2026-08-15 18:17:05');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `subject` varchar(100) NOT NULL,
  `classLevel` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `mode` enum('Online','Home','Hybrid') DEFAULT 'Online',
  `status` enum('active','draft','archived') DEFAULT 'active',
  `tutor` int(11) DEFAULT NULL,
  `enrollments` int(11) DEFAULT 0,
  `thumbnail` varchar(500) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tutor` (`tutor`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_disputes`
--

DROP TABLE IF EXISTS `lead_disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lead_disputes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead` int(11) NOT NULL,
  `tutor` int(11) NOT NULL,
  `reason` enum('Fake / Not Responding','Wrong Location','Wrong Subject','Duplicate Lead','Not Interested','Invalid Contact','Other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('auto-resolved','pending-review','under-review','escalated','resolved','rejected') DEFAULT 'pending-review',
  `autoResolved` tinyint(1) DEFAULT 0,
  `autoResolvedAt` datetime DEFAULT NULL,
  `adminResolvedBy` int(11) DEFAULT NULL,
  `adminResolvedAt` datetime DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `resolutionAction` enum('replaced','credited','rejected','refunded') DEFAULT NULL,
  `replacementLead` int(11) DEFAULT NULL,
  `disputeDisplayId` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `disputeDisplayId` (`disputeDisplayId`),
  KEY `idx_tutor_status` (`tutor`,`status`),
  KEY `idx_lead` (`lead`),
  KEY `adminResolvedBy` (`adminResolvedBy`),
  CONSTRAINT `lead_disputes_ibfk_1` FOREIGN KEY (`lead`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lead_disputes_ibfk_2` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lead_disputes_ibfk_3` FOREIGN KEY (`adminResolvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_disputes`
--

LOCK TABLES `lead_disputes` WRITE;
/*!40000 ALTER TABLE `lead_disputes` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student` int(11) NOT NULL,
  `tutor` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `classLevel` varchar(100) NOT NULL,
  `board` varchar(100) DEFAULT NULL,
  `locationCity` varchar(100) DEFAULT NULL,
  `locationArea` varchar(100) DEFAULT NULL,
  `locationPincode` varchar(20) DEFAULT NULL,
  `locationFull` text DEFAULT NULL,
  `mode` enum('Home','Online','Both') DEFAULT 'Home',
  `budget` decimal(10,2) DEFAULT NULL,
  `preferredGender` enum('Male','Female','Any') DEFAULT 'Any',
  `message` text DEFAULT NULL,
  `preferredTiming` varchar(100) DEFAULT NULL,
  `weeklyDays` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`weeklyDays`)),
  `isOtpVerified` tinyint(1) DEFAULT 0,
  `studentPhone` varchar(50) DEFAULT NULL,
  `studentEmail` varchar(255) DEFAULT NULL,
  `status` enum('new','contacted','responded','converted','expired','replaced','disputed','fake') DEFAULT 'new',
  `source` enum('search','admin','auto','booking') DEFAULT 'search',
  `deliveredAt` datetime DEFAULT current_timestamp(),
  `contactedAt` datetime DEFAULT NULL,
  `respondedAt` datetime DEFAULT NULL,
  `convertedAt` datetime DEFAULT NULL,
  `disputeReason` text DEFAULT NULL,
  `disputedAt` datetime DEFAULT NULL,
  `replacementLeadId` int(11) DEFAULT NULL,
  `isFreeLeadSlot` tinyint(1) DEFAULT 1,
  `booking` int(11) DEFAULT NULL,
  `leadDisplayId` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `leadDisplayId` (`leadDisplayId`),
  KEY `idx_tutor_status` (`tutor`,`status`),
  KEY `idx_student` (`student`),
  KEY `idx_deliveredAt` (`deliveredAt`),
  KEY `booking` (`booking`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leads_ibfk_3` FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking` int(11) DEFAULT NULL,
  `from` int(11) NOT NULL,
  `to` int(11) NOT NULL,
  `type` enum('text','image','pdf','document','meet_link','notification','system') DEFAULT 'text',
  `content` text NOT NULL,
  `meetUrl` varchar(500) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `read` tinyint(1) DEFAULT 0,
  `readAt` datetime DEFAULT NULL,
  `delivered` tinyint(1) DEFAULT 0,
  `deliveredAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_from_to` (`from`,`to`),
  KEY `idx_booking` (`booking`),
  KEY `to` (`to`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`from`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`to`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,3,1,11,'notification','A tutor (Praveen Pal) has been assigned to your booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-16 15:23:31','2026-08-16 15:23:31'),(2,3,1,4,'notification','You have been assigned to a new booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-16 15:23:31','2026-08-16 15:23:31'),(3,3,1,11,'notification','A tutor (Praveen Pal) has been assigned to your booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-16 15:24:59','2026-08-16 15:24:59'),(4,3,1,4,'notification','You have been assigned to a new booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-16 15:24:59','2026-08-16 15:24:59'),(5,NULL,4,1,'text','hii',NULL,NULL,0,NULL,0,NULL,'2026-08-16 16:15:23','2026-08-16 16:15:23'),(6,NULL,4,1,'text','hii',NULL,NULL,0,NULL,0,NULL,'2026-08-16 16:15:26','2026-08-16 16:15:26'),(7,3,1,11,'notification','A tutor (Praveen Pal) has been assigned to your booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-16 16:16:28','2026-08-16 16:16:28'),(8,3,1,4,'notification','You have been assigned to a new booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-16 16:16:28','2026-08-16 16:16:28'),(9,3,1,11,'notification','A tutor (Praveen Pal) has been assigned to your booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-17 00:30:20','2026-08-17 00:30:20'),(10,3,1,4,'notification','You have been assigned to a new booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-17 00:30:20','2026-08-17 00:30:20'),(11,3,1,11,'notification','A tutor (Praveen Pal) has been assigned to your booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-17 00:37:07','2026-08-17 00:37:07'),(12,3,1,4,'notification','You have been assigned to a new booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-17 00:37:07','2026-08-17 00:37:07'),(13,3,1,11,'notification','A tutor (Praveen Pal) has been assigned to your booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-17 01:30:25','2026-08-17 01:30:25'),(14,3,1,4,'notification','You have been assigned to a new booking for Math ,Physic ,Chemistry.',NULL,NULL,0,NULL,0,NULL,'2026-08-17 01:30:25','2026-08-17 01:30:25');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletters`
--

DROP TABLE IF EXISTS `newsletters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newsletters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `subscribedAt` datetime DEFAULT current_timestamp(),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletters`
--

LOCK TABLES `newsletters` WRITE;
/*!40000 ALTER TABLE `newsletters` DISABLE KEYS */;
/*!40000 ALTER TABLE `newsletters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_campaigns`
--

DROP TABLE IF EXISTS `notification_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `channel` varchar(50) NOT NULL,
  `audience` varchar(100) NOT NULL,
  `recipientCount` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'delivered',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_campaigns`
--

LOCK TABLES `notification_campaigns` WRITE;
/*!40000 ALTER TABLE `notification_campaigns` DISABLE KEYS */;
INSERT INTO `notification_campaigns` VALUES (1,'Welcome Message','Thank you for using VerifiedTutor!','push','all',8,'delivered','2026-08-17 02:44:00','2026-08-17 02:44:00'),(2,'Platform Update','New features available!','push','students',4,'delivered','2026-08-17 02:45:24','2026-08-17 02:45:24');
/*!40000 ALTER TABLE `notification_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipient` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('system','booking','payment','review','approval','lead','lead_dispute','subscription','payout','session_reminder','chat','general') DEFAULT 'general',
  `read` tinyint(1) DEFAULT 0,
  `readAt` datetime DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_recipient_read` (`recipient`,`read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`recipient`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,11,'Platform Update','New features available!','general',0,NULL,'#',NULL,NULL,'2026-08-17 02:45:24','2026-08-17 02:45:24'),(2,6,'Platform Update','New features available!','general',0,NULL,'#',NULL,NULL,'2026-08-17 02:45:24','2026-08-17 02:45:24'),(3,5,'Platform Update','New features available!','general',0,NULL,'#',NULL,NULL,'2026-08-17 02:45:24','2026-08-17 02:45:24'),(4,3,'Platform Update','New features available!','general',0,NULL,'#',NULL,NULL,'2026-08-17 02:45:24','2026-08-17 02:45:24');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp` varchar(50) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (5,'tutor@tutorconnect.com','285696','2026-08-12 22:08:08',1,'2026-08-12 21:58:08','2026-08-12 21:58:13'),(6,'admin@tutorconnect.com','474225','2026-08-12 22:08:13',1,'2026-08-12 21:58:13','2026-08-12 21:58:18'),(10,'akasharya306@gmail.com','758216','2026-08-16 15:24:53',1,'2026-08-16 15:14:53','2026-08-16 15:15:18'),(16,'rohitkumar83035@gmail.com','744659','2026-08-17 01:38:09',1,'2026-08-17 01:28:09','2026-08-17 01:29:20'),(17,'palpraveen3125@gmail.com','477493','2026-08-17 02:42:31',0,'2026-08-17 02:32:31','2026-08-17 02:32:31'),(18,'student@tutorconnect.com','604345','2026-08-17 03:16:26',0,'2026-08-17 03:06:26','2026-08-17 03:06:26');
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking` int(11) NOT NULL,
  `student` int(11) NOT NULL,
  `tutor` int(11) NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `tutorShare` decimal(10,2) NOT NULL,
  `adminShare` decimal(10,2) NOT NULL,
  `adminRate` decimal(5,4) NOT NULL,
  `tutorRate` decimal(5,4) NOT NULL,
  `status` varchar(100) DEFAULT 'Pending',
  `method` varchar(100) DEFAULT 'Razorpay',
  `razorpayOrderId` varchar(255) DEFAULT NULL,
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `razorpaySignature` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking` (`booking`),
  KEY `student` (`student`),
  KEY `tutor` (`tutor`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_config`
--

DROP TABLE IF EXISTS `platform_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platform_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `freeLeadsPerMonth` int(11) DEFAULT 5,
  `leadDisputeWindowHours` int(11) DEFAULT 48,
  `autoReplacementEnabled` tinyint(1) DEFAULT 1,
  `otpVerificationForLeads` tinyint(1) DEFAULT 1,
  `commissionTiers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`commissionTiers`)),
  `payoutWindowDays` int(11) DEFAULT 5,
  `minimumWithdrawalAmount` decimal(10,2) DEFAULT 500.00,
  `platformName` varchar(255) DEFAULT 'TutorConnect',
  `supportEmail` varchar(255) DEFAULT 'support@tutorconnect.com',
  `supportPhone` varchar(100) DEFAULT '+91 123 456 7890',
  `platformAddress` varchar(255) DEFAULT 'Lucknow, Uttar Pradesh, India',
  `gstRate` decimal(5,2) DEFAULT 18.00,
  `gstEnabled` tinyint(1) DEFAULT 0,
  `maintenanceMode` tinyint(1) DEFAULT 0,
  `maintenanceMessage` text DEFAULT NULL,
  `smtp` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`smtp`)),
  `razorpayKeyId` varchar(255) DEFAULT NULL,
  `razorpayKeySecret` varchar(255) DEFAULT NULL,
  `cloudinaryCloudName` varchar(255) DEFAULT NULL,
  `cloudinaryApiKey` varchar(255) DEFAULT NULL,
  `cloudinaryApiSecret` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_config`
--

LOCK TABLES `platform_config` WRITE;
/*!40000 ALTER TABLE `platform_config` DISABLE KEYS */;
INSERT INTO `platform_config` VALUES (1,5,48,1,1,'[{\"minSessions\": 0, \"maxSessions\": 20, \"rate\": 0.15, \"label\": \"0 – 20 Sessions\"}, {\"minSessions\": 21, \"maxSessions\": 100, \"rate\": 0.10, \"label\": \"21 – 100 Sessions\"}, {\"minSessions\": 101, \"maxSessions\": 999999, \"rate\": 0.05, \"label\": \"100+ Sessions\"}]',5,500.00,'TutorConnect','support@tutorconnect.com','+91 123 456 7890','Lucknow, Uttar Pradesh, India',18.00,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-11 16:53:57','2026-08-11 16:53:57');
/*!40000 ALTER TABLE `platform_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking` int(11) DEFAULT NULL,
  `student` int(11) NOT NULL,
  `tutor` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `status` enum('visible','hidden','reported') DEFAULT 'visible',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking` (`booking`),
  KEY `student` (`student`),
  KEY `tutor` (`tutor`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking` int(11) DEFAULT NULL,
  `student` int(11) NOT NULL,
  `tutor` int(11) NOT NULL,
  `date` varchar(50) NOT NULL,
  `startTime` varchar(50) NOT NULL,
  `endTime` varchar(50) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `selectedSubjects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`selectedSubjects`)),
  `duration` int(11) DEFAULT 60,
  `location` varchar(255) DEFAULT NULL,
  `addressFull` text DEFAULT NULL,
  `addressArea` varchar(100) DEFAULT NULL,
  `addressCity` varchar(100) DEFAULT NULL,
  `addressPincode` varchar(20) DEFAULT NULL,
  `status` varchar(100) DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `adminNotes` text DEFAULT NULL,
  `approvedBy` int(11) DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `rejectedBy` int(11) DEFAULT NULL,
  `rejectedAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking` (`booking`),
  KEY `student` (`student`),
  KEY `tutor` (`tutor`),
  KEY `approvedBy` (`approvedBy`),
  KEY `rejectedBy` (`rejectedBy`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`booking`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`student`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_4` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `schedules_ibfk_5` FOREIGN KEY (`rejectedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES (1,3,11,4,'2026-08-16','08:00','09:00','Math ,Physic ,Chemistry','N/A','[\"Math ,Physic ,Chemistry\"]',60,'','','','','','Approved','','',1,'2026-08-17 02:02:23',NULL,NULL,'2026-08-17 02:01:11','2026-08-17 02:02:23');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platformName` varchar(255) DEFAULT 'TutorConnect',
  `supportEmail` varchar(255) DEFAULT NULL,
  `commissionRate` decimal(5,2) DEFAULT 10.00,
  `gstRate` decimal(5,2) DEFAULT 18.00,
  `maintenanceMode` tinyint(1) DEFAULT 0,
  `heroTitle` varchar(255) DEFAULT 'Quality Home Tuition',
  `heroSubtitle` varchar(255) DEFAULT 'Verified tutors at your doorstep',
  `heroImage` varchar(500) DEFAULT '/hero-banner.jpg',
  `smtp` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`smtp`)),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `paymentMethods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`paymentMethods`)),
  `tagline` varchar(255) DEFAULT NULL,
  `siteUrl` varchar(255) DEFAULT NULL,
  `phoneSupport` varchar(100) DEFAULT NULL,
  `minPayout` int(11) DEFAULT 500,
  `payoutCycle` varchar(50) DEFAULT 'weekly',
  `emailVerification` tinyint(1) DEFAULT 1,
  `phoneVerification` tinyint(1) DEFAULT 1,
  `registrationOpen` tinyint(1) DEFAULT 1,
  `twoFactorAdmin` tinyint(1) DEFAULT 0,
  `autoApprove` tinyint(1) DEFAULT 0,
  `emailNewBooking` tinyint(1) DEFAULT 1,
  `emailPayment` tinyint(1) DEFAULT 1,
  `emailMarketing` tinyint(1) DEFAULT 0,
  `smsBooking` tinyint(1) DEFAULT 1,
  `smsPayment` tinyint(1) DEFAULT 1,
  `primaryColor` varchar(50) DEFAULT '#056852',
  `accentColor` varchar(50) DEFAULT '#0ea5e9',
  `darkMode` tinyint(1) DEFAULT 0,
  `smtpHost` varchar(255) DEFAULT NULL,
  `smtpPort` int(11) DEFAULT NULL,
  `smtpUser` varchar(255) DEFAULT NULL,
  `smtpPass` varchar(255) DEFAULT NULL,
  `smsProvider` varchar(100) DEFAULT NULL,
  `smsApiKey` varchar(255) DEFAULT NULL,
  `smsSenderId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'TutorConnect','null',10.00,18.00,1,'Quality Home Tuition','Verified tutors at your doorstep','/uploads/1786666127523-hero11.jpg','\"[object Object]\"','2026-08-11 17:08:04','2026-08-17 00:35:07','[{\"id\":1786906889408,\"label\":\"8052550771\",\"upiId\":\"ajeet123456@\",\"qrImage\":\"data:image/jpeg;base64,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\"}]',NULL,NULL,NULL,500,'weekly',1,1,1,0,0,1,1,0,1,1,'#056852','#0ea5e9',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_materials`
--

DROP TABLE IF EXISTS `study_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `fileUrl` varchar(500) NOT NULL,
  `courseId` int(11) DEFAULT NULL,
  `studentId` int(11) DEFAULT NULL,
  `tutorId` int(11) NOT NULL,
  `type` varchar(100) DEFAULT 'PDF',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tutorId` (`tutorId`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `study_materials_ibfk_1` FOREIGN KEY (`tutorId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `study_materials_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_materials`
--

LOCK TABLES `study_materials` WRITE;
/*!40000 ALTER TABLE `study_materials` DISABLE KEYS */;
INSERT INTO `study_materials` VALUES (1,'hii','https://verifiedtutor.in/',NULL,11,4,'PDF','2026-08-17 01:53:30','2026-08-17 01:53:30');
/*!40000 ALTER TABLE `study_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 1,
  `durationLabel` varchar(100) DEFAULT '1 Month',
  `leadLimit` int(11) DEFAULT 20,
  `leadLimitLabel` varchar(100) DEFAULT '20 Leads',
  `commissionRate` decimal(5,4) NOT NULL DEFAULT 0.1000,
  `searchBoost` tinyint(1) DEFAULT 0,
  `priorityBadge` tinyint(1) DEFAULT 0,
  `premiumSupport` tinyint(1) DEFAULT 0,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `status` enum('active','inactive','archived') DEFAULT 'active',
  `sortOrder` int(11) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'Basic',499.00,1,'1 Month',20,'20 Leads',0.1000,0,0,0,'[\"20 leads/month\", \"10% commission rate\", \"Basic support\"]','active',1,'2026-08-11 16:53:57','2026-08-11 16:53:57'),(2,'Pro',1299.00,1,'1 Month',50,'50 Leads',0.0500,1,1,0,'[\"50 leads/month\", \"5% commission rate\", \"Search boost\", \"Priority badge\", \"Premium support\"]','active',2,'2026-08-11 16:53:57','2026-08-11 16:53:57'),(3,'Premium',11999.00,12,'12 Months',-1,'Unlimited',0.0000,1,1,1,'[\"Unlimited leads\", \"0% commission\", \"Top search ranking\", \"Premium badge\", \"Dedicated support\", \"Profile boost\"]','active',3,'2026-08-11 16:53:57','2026-08-11 16:53:57');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tutor` int(11) NOT NULL,
  `plan` int(11) NOT NULL,
  `startDate` datetime NOT NULL DEFAULT current_timestamp(),
  `endDate` datetime NOT NULL,
  `status` enum('active','expired','cancelled','pending') DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  `razorpayOrderId` varchar(255) DEFAULT NULL,
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `razorpaySubscriptionId` varchar(255) DEFAULT NULL,
  `leadLimit` int(11) DEFAULT NULL,
  `commissionRate` decimal(5,4) DEFAULT NULL,
  `autoRenew` tinyint(1) DEFAULT 0,
  `cancelledAt` datetime DEFAULT NULL,
  `cancelReason` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tutor_status` (`tutor`,`status`),
  KEY `idx_endDate` (`endDate`),
  KEY `plan` (`plan`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`plan`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(50) DEFAULT 'Open',
  `adminReply` text DEFAULT NULL,
  `repliedAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','tutor','admin') NOT NULL DEFAULT 'student',
  `avatar` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive','blocked','pending','verified','suspended','rejected') NOT NULL DEFAULT 'active',
  `headline` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `priceMax` decimal(10,2) DEFAULT NULL,
  `experience` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `subjects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`subjects`)),
  `classesTaught` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`classesTaught`)),
  `mode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mode`)),
  `verified` tinyint(1) DEFAULT 0,
  `emailVerified` tinyint(1) DEFAULT 0,
  `googleId` varchar(255) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `reviews` int(11) DEFAULT 0,
  `demoVideoUrl` varchar(500) DEFAULT NULL,
  `completedSessions` int(11) DEFAULT 0,
  `currentCommissionRate` decimal(5,4) DEFAULT 0.1500,
  `walletPendingBalance` decimal(10,2) DEFAULT 0.00,
  `walletAvailableBalance` decimal(10,2) DEFAULT 0.00,
  `walletPaidBalance` decimal(10,2) DEFAULT 0.00,
  `activeSubscription` int(11) DEFAULT NULL,
  `freeLeadsUsed` int(11) DEFAULT 0,
  `freeLeadsResetDate` datetime DEFAULT NULL,
  `bankAccountName` varchar(255) DEFAULT NULL,
  `bankAccountNumber` varchar(100) DEFAULT NULL,
  `bankIfscCode` varchar(50) DEFAULT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `upiId` varchar(255) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`languages`)),
  `feeType` enum('Hourly','Monthly') DEFAULT 'Hourly',
  `availableDays` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`availableDays`)),
  `availableTimeSlots` varchar(255) DEFAULT NULL,
  `addressCity` varchar(100) DEFAULT NULL,
  `addressArea` varchar(100) DEFAULT NULL,
  `addressPincode` varchar(20) DEFAULT NULL,
  `addressState` varchar(100) DEFAULT NULL,
  `addressFull` text DEFAULT NULL,
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `kycStatus` enum('pending','submitted','verified','rejected') DEFAULT 'pending',
  `backgroundVerified` tinyint(1) DEFAULT 0,
  `idVerified` tinyint(1) DEFAULT 0,
  `addressVerified` tinyint(1) DEFAULT 0,
  `experienceVerified` tinyint(1) DEFAULT 0,
  `referenceVerified` tinyint(1) DEFAULT 0,
  `dob` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `board` varchar(100) DEFAULT NULL,
  `school` varchar(255) DEFAULT NULL,
  `medium` varchar(100) DEFAULT NULL,
  `schedule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`schedule`)),
  `learningGoal` text DEFAULT NULL,
  `specialRequirements` text DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `preferredTutorGender` enum('Male','Female','Any') DEFAULT 'Any',
  `wishlist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`wishlist`)),
  `referralCode` varchar(100) DEFAULT NULL,
  `referredBy` int(11) DEFAULT NULL,
  `referralCount` int(11) DEFAULT 0,
  `lastLoginAt` datetime DEFAULT NULL,
  `isOnline` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `referralCode` (`referralCode`),
  KEY `idx_role_status` (`role`,`status`),
  KEY `idx_role_verified` (`role`,`verified`),
  KEY `idx_rating` (`rating`),
  KEY `idx_referralCode` (`referralCode`),
  KEY `referredBy` (`referredBy`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`referredBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@tutorconnect.com','$2a$10$w8/0mE6F0o/.R4.3B7oV2e88t.4/6s2uD9e.s7m41K48/9r0w3g0S','admin',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0.00,0,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Hourly',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,'TCAD1234',NULL,0,NULL,1,'2026-08-11 16:53:57','2026-08-17 02:02:41'),(2,'Rahul Sharma','tutor@tutorconnect.com','$2a$10$fV3.vB4tN9sS0g2F2F2F2eu8r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m','tutor',NULL,'active','Expert Physics & Maths Tutor','Experienced home tutor with 5+ years teaching Physics and Mathematics for Class 9-12, JEE, and NEET preparation.',600.00,NULL,'5 years','Lucknow','[\"Physics\", \"Maths\"]','[\"Class 9\", \"Class 10\", \"Class 11\", \"Class 12\"]','[\"Home\", \"Online\"]',1,0,NULL,4.80,12,NULL,35,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[\"Hindi\", \"English\"]','Hourly',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,'TCRU1234',NULL,0,NULL,1,'2026-08-11 16:53:57','2026-08-12 21:58:13'),(3,'Ananya Singh','student@tutorconnect.com','$2a$10$fV3.vB4tN9sS0g2F2F2F2eu8r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m','student',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0.00,0,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Hourly',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,'TCAN1234',NULL,0,NULL,1,'2026-08-11 16:53:57','2026-08-14 22:35:30'),(4,'Praveen Pal','palpraveen3125@gmail.com','$2a$10$fBYpZbP026f3l8bs9C7kB.jc0syaH3DCYZIpOX3kjLpYSqFcmzfem','tutor','/uploads/1786795090526-praveen-profile.jpeg','active','Tutor',NULL,250.00,NULL,'2 year','Luckonw','[\"Mathematics\", \"Physics\", \"English\", \"Chemistry\"]',NULL,'[\"Online\",\"Home Tuition\",\"Student Home\"]',1,0,NULL,4.80,40,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'8604889884',NULL,NULL,'Hourly',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,NULL,NULL,0,NULL,1,'2026-08-11 19:32:32','2026-08-17 02:32:31'),(5,'hhi','ajeetgautam8052@gmail.com','$2a$10$UI/2RaBZC6Sn.kShY/5zkOJ2hApQDGMvUOfft4CpNz8mXtRn5tH9u','student',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'[]','[]','[]',0,0,NULL,0.00,0,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,'','','','',NULL,'56789',NULL,'[]','Hourly','[]',NULL,'Bhanpur','','','','Bhanpur','[]','pending',0,0,0,0,0,NULL,NULL,'Class 9',NULL,NULL,NULL,'{}',NULL,NULL,NULL,'Any','[]','TCHHMSQCAT8A',NULL,0,NULL,0,'2026-08-12 22:34:55','2026-08-14 22:35:21'),(6,'abhi kumar','akasharya306@gmail.com','$2a$10$Gt9sAd4wYKT7TGoj0xi9BudkbE2S6f.quXRJtNkaw4rLAdscim3OC','student',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0.00,0,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'9484787654',NULL,NULL,'Hourly',NULL,NULL,'luckonw Uttar pradesh',NULL,NULL,NULL,'luckonw Uttar pradesh',NULL,'pending',0,0,0,0,0,NULL,NULL,'Class 10',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,'TCABMSRHMA5M',NULL,0,NULL,0,'2026-08-13 17:51:35','2026-08-16 15:15:55'),(10,'Ajeet Gautam','ajeetgautam805@gmail.com','$2a$10$Xf3yfrhihq7lv508PUWbwe7Nj0O4DYGNAfBTqC6BRX0y7Jg3olLqO','tutor','/uploads/1786797084643-ajeet-alj.jpg','active','Tutor',NULL,300.00,NULL,'2 year','LUCKNOW','[\"Mathmatics\",\"physics\",\"Computer\"]','[]','[\"Home Tuition\",\"Student Home\"]',1,0,NULL,4.70,14,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'+918052559771','N/A','[]','Hourly','[]',NULL,'','','','','',NULL,'pending',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,NULL,NULL,0,NULL,0,'2026-08-15 18:01:24','2026-08-17 00:38:43'),(11,'abhinav','rohitkumar83035@gmail.com','$2a$10$fBYpZbP026f3l8bs9C7kB.jc0syaH3DCYZIpOX3kjLpYSqFcmzfem','student',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0.00,0,NULL,0,0.1500,0.00,0.00,0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'8947474744',NULL,NULL,'Hourly',NULL,NULL,'bkt,Lucknow,UP',NULL,NULL,NULL,'bkt,Lucknow,UP',NULL,'pending',0,0,0,0,0,NULL,NULL,'Class 12',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Any',NULL,'TCABMSVMI8LP',NULL,0,NULL,1,'2026-08-16 15:19:29','2026-08-17 02:41:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawals`
--

DROP TABLE IF EXISTS `withdrawals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `withdrawals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tutor` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','processing','paid','rejected') DEFAULT 'pending',
  `payoutMethod` enum('bank','upi') DEFAULT 'bank',
  `bankDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bankDetails`)),
  `upiId` varchar(255) DEFAULT NULL,
  `processedAt` datetime DEFAULT NULL,
  `processedBy` int(11) DEFAULT NULL,
  `transactionId` varchar(255) DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL,
  `payoutDisplayId` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payoutDisplayId` (`payoutDisplayId`),
  KEY `idx_tutor_status` (`tutor`,`status`),
  KEY `processedBy` (`processedBy`),
  CONSTRAINT `withdrawals_ibfk_1` FOREIGN KEY (`tutor`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `withdrawals_ibfk_2` FOREIGN KEY (`processedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawals`
--

LOCK TABLES `withdrawals` WRITE;
/*!40000 ALTER TABLE `withdrawals` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdrawals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'tutorconnect'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-17  4:36:38
