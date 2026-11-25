@echo off
echo === FloodGrid commit script (Ananya) ===
git rev-parse --is-inside-work-tree >nul 2>&1 || (echo ERROR: yeh Flood_grid folder nahi hai. Is file ko Flood_grid ke andar rakho aur wahin se chalao. & pause & exit /b 1)
git add frontend/src/index.css
git commit -m "add shared theme styles"
git add frontend/src/components/Navbar.jsx frontend/src/components/RequestCard.jsx
git commit -m "restyle navbar and request card with proof photo button"
git add frontend/src/pages/Login.jsx
git commit -m "restyle login page with ngo redirect"
git add backend/utils/blob.js
git commit -m "add Azure Blob helper for delivery proofs"
git add backend/utils/events.js backend/utils/audit.js
git commit -m "add Cosmos DB activity event logger"
git add backend/setupProof.js
git commit -m "add DeliveryProofs table setup script"
git add backend/routes/volunteer.routes.js
git commit -m "volunteer delivery with proof photo upload"
git add backend/routes/proof.routes.js backend/index.js
git commit -m "add proof photo download route"
git add backend/package.json backend/package-lock.json backend/.env.example
git commit -m "add multer, azure storage and cosmos dependencies"
git add frontend/src/pages/VolunteerDashboard.jsx
git commit -m "volunteer dashboard with proof upload"
git add backend/public
git commit -m "update production build"
git add docs/azure-setup.md docs/security-checklist.md
git commit -m "add Azure setup guide and security checklist"
git add README.md
git commit -m "update README with final status"
echo.
echo === pull aur push ===
git pull --rebase origin main
git push origin main
echo.
echo === Last commits ===
git log --oneline -12
echo.
echo Agar upar koi ERROR dikhe to screenshot bhejo.
pause
