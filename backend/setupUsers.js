require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('./db');

(async () => {
  const pool = await getPool();

  await pool.request().query(`
    IF OBJECT_ID('Roles') IS NULL
    CREATE TABLE Roles (
      RoleId INT IDENTITY(1,1) PRIMARY KEY,
      RoleName VARCHAR(20) NOT NULL UNIQUE
    );
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Roles)
    INSERT INTO Roles (RoleName) VALUES ('citizen'), ('volunteer'), ('ngo'), ('admin');
  `);

  await pool.request().query(`
    IF OBJECT_ID('Users') IS NULL
    CREATE TABLE Users (
      UserId INT IDENTITY(1,1) PRIMARY KEY,
      FullName VARCHAR(100) NOT NULL,
      Email VARCHAR(150) NOT NULL UNIQUE,
      PasswordHash VARCHAR(100) NOT NULL,
      RoleId INT NOT NULL FOREIGN KEY REFERENCES Roles(RoleId),
      CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
  `);

  const users = [
    ['Riya Citizen', 'citizen@test.com', 'citizen'],
    ['Vikas Volunteer', 'volunteer@test.com', 'volunteer'],
    ['Admin User', 'admin@test.com', 'admin'],
  ];

  for (const [name, email, role] of users) {
    const hash = await bcrypt.hash('Test@1234', 10);
    await pool.request()
      .input('n', sql.VarChar(100), name)
      .input('e', sql.VarChar(150), email)
      .input('h', sql.VarChar(100), hash)
      .input('r', sql.VarChar(20), role)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = @e)
        INSERT INTO Users (FullName, Email, PasswordHash, RoleId)
        SELECT @n, @e, @h, RoleId FROM Roles WHERE RoleName = @r
      `);
  }

  const result = await pool.request().query(
    'SELECT u.Email, r.RoleName FROM Users u JOIN Roles r ON r.RoleId = u.RoleId'
  );
  console.log('Users in database:', result.recordset);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});