# Run from the project root (flood_grid / FloodGrid folder) AFTER npm install helmet express-rate-limit
git pull --rebase origin main
function C($msg, $paths) { git add $paths; git commit -m $msg }
C "add jwt verify and role check middleware"        @("backend/middleware/auth.js")
C "add login API with bcrypt and jwt"               @("backend/routes/auth.routes.js")
C "add volunteer APIs: open, accepted, accept, deliver" @("backend/routes/volunteer.routes.js")
C "register routes, add helmet and login rate limit" @("backend/index.js","backend/package.json","backend/package-lock.json")
C "add axios instance with token"                   @("frontend/src/api.js")
C "add login page with role redirect"               @("frontend/src/pages/Login.jsx")
C "add navbar and request card components"          @("frontend/src/components/Navbar.jsx","frontend/src/components/RequestCard.jsx")
C "add volunteer dashboard with accept and deliver" @("frontend/src/pages/VolunteerDashboard.jsx")
C "add ER diagram and architecture notes"           @("docs/er-diagram.md","docs/architecture.md")
C "update README with setup and test logins"        @("README.md")
git push origin main
git log --oneline -12
