const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let database = null;
const initializationDbAndServers = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is start");
    });
  } catch (error) {
    console.log(`Db Error : ${error.message}`);
    process.exit(1);
  }
};

initializationDbAndServers();

// API 1 registration

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userDbQuery = `
        SELECT *
        FROM 
        user
        WHERE
        username = '${username}';
    `;
  const getUser = await database.get(userDbQuery);
  if (getUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      userCreateQuery = `
            INSERT INTO user (username,name,password,gender,location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                ${location}
            )
        `;
      await database.run(userCreateQuery);

      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}'
    `;
  const checkUser = await database.get(checkUserQuery);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isCurrentPassword = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (isCurrentPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = bcrypt.hash(newPassword);
  const dbUserQuery = `
        SELECT *
        FROM
        user
        WHERE username = '${username}'
    `;
  const getDb = await database.get(dbUserQuery);
  const checkPassword = await bcrypt.compare(oldPassword, getDb.password);
  if (checkPassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updateQuery = `
                UPDATE 
                user
                SET 
                password = '${hashedNewPassword}'
                WHERE 
                username = '${username}';
            `;
      await database.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
