# Power BI Analytics Guide

Power BI Desktop connects to Azure SQL and reads two views made for reporting.

## Steps
1. Open Power BI Desktop, Get data, Azure SQL database.
2. Server: `<your-server>.database.windows.net`, Database: `<your-db>`. Choose Database login (admin user).
3. If it says the IP is not allowed: Azure Portal, SQL server, Networking, add your client IP.
4. Select `vw_PowerBI_Requests` and `vw_PowerBI_Stock`, click Load (Import mode).

## Report page 1: Relief operations
- Card: count of RequestId (total requests)
- Card: average of ResponseMinutes
- Clustered bar: Type by count of RequestId
- Donut: Status by count of RequestId
- Column chart: Urgency by count of RequestId

## Report page 2: Camp stock
- Table: CampName, ItemName, CurrentQuantity
- Bar chart: ItemName by sum of CurrentQuantity
- Line chart: MovementAt (date) by sum of QtyChange, legend Reason

## Submission
Save as `FloodGrid.pbix`, take a screenshot of each page, put the screenshots in `docs/screenshots/`.
Run the app first and create a few requests and allocations so the charts are not empty.
