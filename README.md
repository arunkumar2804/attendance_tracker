# AttendAI — Face Recognition Attendance Management System

A production-ready, AI-powered Face Recognition Attendance Management System built with **Next.js 15 (TypeScript)**, **`face-api.js`**, **Google Sheets**, and **Google Apps Script**.

---

## Key Features

- 🎥 **Continuous Live Face Scanning**: Automatic face detection & recognition via webcam with zero manual button presses.
- 🔊 **Instant Audio & Visual Feedback**: Plays Web Audio chime and displays success banner overlay upon attendance marking.
- 📋 **Student Registration Wizard**: Multi-sample face descriptor capture (captures 5-10 vectors across angles) with duplicate phone validation.
- 📊 **Google Sheets Integration**: Automatic synchronisation with Google Sheets database (`Students` and `Attendance` sheets).
- ⚡ **Automatic Absentee Generation**: One-click Admin feature to mark unscanned students as `Present = 0` for today.
- 📈 **Automatic Attendance % Calculation**: Dynamically updates attendance percentage (`Present Days / Total Working Days * 100`) in Google Sheets.
- 📁 **Data Export & Reporting**: Export logs to CSV, Excel, or formatted Print reports with custom date, course, and batch filters.
- 🌙 **Modern Glassmorphic Dark UI**: Built with Tailwind CSS, Lucide icons, responsive layout, and dark mode support.

---

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, React Hook Form
- **AI / Computer Vision**: `@vladmandic/face-api` (SSD Mobilenet v1, 68 Landmark, 128D Face Recognition)
- **Backend / Database**: Google Apps Script (`Code.gs`), Google Sheets, Next.js API Routes
- **Deployment**: Vercel & Google Apps Script Web App

---

## 1. Google Sheets & Google Apps Script Setup

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a blank spreadsheet.
2. Rename the spreadsheet to `Attendance Management Database`.

### Step 2: Set Up Google Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**.
2. Erase any existing code in `Code.gs`.
3. Open `google/scripts/Code.gs` from this project repository and copy its entire contents into the Google Apps Script editor.
4. Click the 💾 **Save** icon.

### Step 3: Deploy as Web App
1. Click **Deploy** → **New deployment**.
2. Select type: **Web app**.
3. Fill in configuration:
   - **Description**: `AttendAI Production Backend API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (Required for Next.js web calls)
4. Click **Deploy**, authorize permissions when prompted.
5. Copy the generated **Web App URL** (format: `https://script.google.com/macros/s/.../exec`).

---

## 2. Next.js Application Setup

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd attendence_tracker
npm install
```

### Step 2: Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

> **Note**: You can also configure or change the Google Apps Script URL directly inside the application UI under **Settings** ⚙️. If left blank, the application automatically runs in local in-memory mock mode for immediate testing.

### Step 3: Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Vercel Deployment Guide

1. Push your code repository to GitHub/GitLab.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Set the Environment Variable:
   - Key: `NEXT_PUBLIC_GAS_WEB_APP_URL`
   - Value: `Your Google Apps Script Web App URL`
4. Click **Deploy**.

---

## 4. Google Sheets Database Schema

### Sheet 1: `Students`
| Column | Name | Description |
|---|---|---|
| A | `Student ID` | Auto-generated ID (e.g. `STD001`) |
| B | `Name` | Full Name |
| C | `Phone` | Unique 10-digit phone number |
| D | `Course` | Enrolled Course |
| E | `Batch` | Batch identifier |
| F | `Attendance Percentage` | Automatically calculated % |
| G | `Face Descriptor` | JSON string of 128D face vector |
| H | `Created At` | Registration Timestamp |

### Sheet 2: `Attendance`
| Column | Name | Description |
|---|---|---|
| A | `Date` | Date in `DD-MM-YYYY` format |
| B | `Student ID` | Reference to `Students` sheet |
| C | `Present` | `1` for Present, `0` for Absent |

---

## Project Structure

```
├── app/
│   ├── api/             # Next.js API routes (students, attendance, stats, generate-absent)
│   ├── globals.css      # Design system & dark mode styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Dashboard main page
├── components/          # React components (Webcam, Directory, History, Modals, Navbar)
├── google/
│   └── scripts/
│       └── Code.gs      # Production Google Apps Script backend
├── hooks/               # Custom React hooks (useWebcam, useFaceApi, useAttendance, useSettings)
├── lib/                 # Utilities (faceApi, audio synthesizer, export helpers, GAS client)
├── services/            # API Service layer
├── types/               # TypeScript interface definitions
├── .env.example
└── README.md
```
