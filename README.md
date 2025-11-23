Inventory Management - Minimal Starter

Structure:
- backend/ : Node + Express + SQLite server
  - server.js : API routes (products, import/export, history)
  - package.json : dependencies list (run `npm install` here)
  - uploads/ : temporary file uploads
- frontend/ : Minimal React app (plain CSS)
  - package.json : dependencies list (run `npm install` here)
  - public/, src/

Setup:
1. Backend
   cd backend
   npm install
   npm run dev   # or npm start

2. Frontend
   cd frontend
   npm install
   npm start

Notes:
- This archive does NOT include node_modules. Install dependencies locally.
- Default backend port: 5000
- React app expects backend at http://localhost:5000 by default.
- You can change backend URL by setting REACT_APP_API_URL in frontend/.env

