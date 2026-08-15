# Dina Vasool (தின வசூல்) — Daily Collection App

## What's built
- Login (JWT, stored on device, persists across app restarts)
- Customers screen: search saved customers, add new ones by picking from your phone's contacts
- Customer Detail: view active loan phases (adapu, aadhaiyam, total payable, status), disburse a new
  phase/category, record a daily collection amount (any dynamic value)
- Reports screen: preview and close the day using the mun-irupu (a → b → c) formula from the backend

## Before running
1. Make sure the Spring Boot backend is running and reachable.
2. Open `src/api/client.js` and set `BASE_URL` to your PC's local network IP (NOT localhost/127.0.0.1 —
   your phone can't reach your PC's localhost over WiFi). Find it on Windows with `ipconfig` (IPv4 Address),
   e.g. `http://192.168.1.5:8080`.
3. Your phone and PC must be on the **same WiFi network** for this to work during testing.

## How to run and test on your Android phone
1. Install Node.js (if not already) from nodejs.org.
2. Open a terminal in this folder and run:
   ```
   npm install
   npx expo start
   ```
3. Install the **Expo Go** app from the Play Store on your Android phone.
4. Scan the QR code shown in the terminal/browser using Expo Go.
5. The app loads live on your phone. Any code changes you make will hot-reload automatically.

## Login
Use the default admin account the backend creates on first run:
- username: `admin`
- password: `ChangeMe123!`

## Responsive design notes
All spacing/font sizes go through `src/utils/responsive.js`, which scales values relative to
device width/height instead of using fixed pixels — so layouts adapt across small phones,
large phones, and tablets automatically.

## Known gaps / next steps
- Offline mode (local storage + sync) not built yet — app currently requires internet to reach the backend
- No expense-entry screen yet (backend API exists: POST /api/expenses)
- No staff/user management screen yet (use POST /api/admin/users directly for now)
- Once ready for real field use (not just same-WiFi testing), deploy the backend online (Railway/Render)
  and point BASE_URL at that public URL instead
