const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");

const databasePath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const dataBaseUser = await database.get(checkTheUsername);

  if (dataBaseUser === undefined) {
    const createUserQuery = `
        INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (validatePassword(password)) {
      await database.run(createUserQuery);
      response.send("User Created Successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const dataBaseUser = await database.get(selectUserQuery);

  if (dataBaseUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dataBaseUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login  Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const dataBaseUser = await database.get(selectUserQuery);

  if (dataBaseUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dataBaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE
            user
            SET
            password='${hashedPassword}'
            WHERE
            username = '${username}';`;
        const user = await database.run(updatePasswordQuery);
        response.send("Password Updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid Current Password");
    }
  }
});
module.exports = app;
