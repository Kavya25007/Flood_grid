# Run from the project root (flood_grid / FloodGrid folder) AFTER cd frontend; npm install axios react-router-dom
git pull --rebase origin main
function C($msg, $paths) { git add $paths; git commit -m $msg }
C "add schema: requests, assignments, audit log, view, procedure, trigger" @("database/schema.sql")
C "add database setup script with seed requests"    @("backend/setupDb.js")
C "add input validation middleware"                 @("backend/middleware/validate.js")
C "add audit log helper"                            @("backend/utils/audit.js")
C "add citizen request APIs"                        @("backend/routes/citizen.routes.js")
C "add admin stats and audit APIs"                  @("backend/routes/admin.routes.js")
C "add router, axios, app routes and protected route" @("frontend/package.json","frontend/package-lock.json","frontend/src/App.jsx","frontend/src/index.css","frontend/src/App.css","frontend/src/components/ProtectedRoute.jsx")
C "add request form and citizen dashboard"          @("frontend/src/components/RequestForm.jsx","frontend/src/pages/CitizenDashboard.jsx")
C "add admin dashboard"                             @("frontend/src/pages/AdminDashboard.jsx")
C "add API list, threat model, security checklist, data classification" @("docs/api-list.md","docs/threat-model.md","docs/security-checklist.md","docs/data-classification.md")
git push origin main
git log --oneline -12
