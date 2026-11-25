# Azure services setup (Blob, Cosmos DB, Key Vault, firewall)

All steps use the Azure portal. Use the cheapest options (Serverless, Standard LRS). The app still runs if Blob or Cosmos are not configured.

## 1. Blob Storage (delivery proof photos)
1. Storage accounts, Create. Name in lower case such as `floodgridstore`, Performance Standard, Redundancy LRS.
2. After it is created: Security + networking, Access keys, copy **Connection string** of key1.
3. The app creates the private container `proofs` by itself on first upload.
4. Add the connection string as an App Service setting named `AZURE_STORAGE_CONNECTION_STRING` (see step 4), and in `backend/.env` for local runs.

## 2. Cosmos DB (activity events)
1. Azure Cosmos DB, Create, **Azure Cosmos DB for NoSQL**, Capacity mode **Serverless** (or apply the free tier discount).
2. After it is created: Settings, Keys, copy **URI** and **PRIMARY KEY**.
3. Settings to add: `COSMOS_ENDPOINT` (URI) and `COSMOS_KEY` (primary key). The app creates database `floodgrid` and container `events` (partition key `/userId`) on the first event.
4. Check: Data Explorer, floodgrid, events, Items. After a login you see an event document.

## 3. Key Vault (secrets)
1. Key vaults, Create, name such as `floodgrid-kv`, Standard, Permission model **Azure role-based access control**.
2. In the vault: Access control (IAM), Add role assignment, role **Key Vault Secrets Officer**, assign to yourself.
3. Objects, Secrets, Generate/Import: create `db-password`, `jwt-secret`, `storage-connection`, `cosmos-key` with the real values.
4. Web App, Settings, Identity, System assigned, **On**, Save.
5. Key vault, Access control (IAM), Add role assignment, role **Key Vault Secrets User**, assign to the web app's managed identity.
6. Web App, Settings, Environment variables: change each secret setting to a reference, for example
   `@Microsoft.KeyVault(SecretUri=https://floodgrid-kv.vault.azure.net/secrets/db-password/)`
   The status shows a green tick when it resolves. Take a screenshot for the security check.

## 4. App Service settings to add
`AZURE_STORAGE_CONNECTION_STRING`, `COSMOS_ENDPOINT`, `COSMOS_KEY` (plus the existing `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`). Apply, then restart. Check `/api/health`: it shows `"blob":true` and `"cosmos":true`.

## 5. Tighten the database firewall (before the security check)
Azure SQL server, Networking: delete the temporary rule `0.0.0.0 to 255.255.255.255`. Keep **Allow Azure services and resources to access this server** ticked (the App Service needs it) and add only your own laptop IPs. HTTPS only: Web App, Settings, Configuration (General settings), HTTPS Only On.

## 6. After the demo (save credit)
Delete the App Service Plan, or stop the Web App and scale the plan to the lowest tier. Serverless SQL and Cosmos cost very little when idle.
