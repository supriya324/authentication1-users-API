const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db"); //userData is the database
let db = null;
const InitilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
InitilizeDbAndServer();
//create user API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUserQuery = `SELECT *FROM user WHERE username=${username}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const insertQuery = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES(
           '${username}',
           '${name}',
           '${hashedPassword}',
           '${gender}',
           '${location}'
        )
        `;
    await db.run(insertQuery);
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginUser = `SELECT * FROM user WHERE username=${username}`;
  const dbUser = await db.get(loginUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//update changepassword API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const changePasswordUser = `SELECT * FROM user WHERE username=${username}`;
  const dbUser = await db.get(changePasswordUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    const newpassword = await bcrypt.compare(newPassword, dbUser.newPassword);
    if (newpassword.length > 4) {
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  }
});
module.exports = app;
