# TutorConnect

TutorConnect Backend & Frontend Application (MySQL + Node.js Express + React / Vanilla JS).

## XAMPP / MySQL Setup Instructions

Follow these exact steps to set up and run TutorConnect with MySQL running through XAMPP:

### Step 1: Start XAMPP Services
- Open **XAMPP Control Panel**.
- Click **Start** for **Apache** and **MySQL**.

### Step 2: Open phpMyAdmin
- Navigate to `http://51.21.255.194/phpmyadmin` in your web browser.

### Step 3: Import Database
- Click on **Import** in phpMyAdmin top menu bar.
- Choose file: `database/tutorconnect.sql` from this repository.
- Click **Go** / **Import** to execute the SQL script. This will create the `tutorconnect` database and all 21 tables with default seed data.

### Step 4: Configure `.env`
- Go to `server/` directory.
- Verify or edit `.env`:
  ```env
  PORT=5000
  CLIENT_URL=http://51.21.255.194:3000
  JWT_SECRET=tutorconnect-demo-secret
  DB_HOST=51.21.255.194
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=tutorconnect
  ```

### Step 5: Install Dependencies
- Open terminal in `server/` directory and run:
  ```bash
  cd server
  npm install
  ```

### Step 6: Start Backend Server
- Run the server in development mode:
  ```bash
  npm run dev
  ```
  or production mode:
  ```bash
  npm start
  ```

---

## Default Seed Accounts
- **Admin**: `admin@tutorconnect.com` / `admin123`
- **Tutor**: `tutor@tutorconnect.com` / `tutor123`
- **Student**: `student@tutorconnect.com` / `student123`
