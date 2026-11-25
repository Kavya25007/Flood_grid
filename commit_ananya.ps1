# Ananya: run from the project root (Flood_grid folder) in PowerShell
# Pehle: cd backend ; npm install ; cd ..
git pull --rebase origin main
function C($msg, $paths) { git add $paths; git commit -m $msg }
C "add shared theme styles"                         @("frontend/src/index.css")
C "restyle navbar and request card, add proof photo button" @("frontend/src/components/Navbar.jsx","frontend/src/components/RequestCard.jsx")
C "restyle login page with role redirects incl. ngo" @("frontend/src/pages/Login.jsx")
C "add Azure Blob helper for delivery proofs"        @("backend/utils/blob.js")
C "add Cosmos DB activity event logger"              @("backend/utils/events.js")
C "send audit entries to Cosmos DB as events"        @("backend/utils/audit.js")
C "add DeliveryProofs table setup script"            @("backend/setupProof.js")
C "volunteer delivery with proof photo upload"       @("backend/routes/volunteer.routes.js")
C "add proof photo download route with access checks" @("backend/routes/proof.routes.js")
C "wire proof and ngo routes, extend health check"   @("backend/index.js")
C "add multer, azure storage and cosmos dependencies" @("backend/package.json","backend/package-lock.json","backend/.env.example")
C "volunteer dashboard with proof upload"            @("frontend/src/pages/VolunteerDashboard.jsx")
C "add Azure setup guide: Blob, Cosmos, Key Vault"   @("docs/azure-setup.md")
C "update security checklist with final configuration" @("docs/security-checklist.md")
C "update production build"                          @("backend/public")
C "update README with final status"                  @("README.md")
git push origin main
git log --oneline -16
