const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const { restart } = require("nodemon");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8)
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// users obj to store and access users in the app
const users = {
  "bob": {
    id: "bob", 
    email: "bob@gmail.com",
    password: "123456"
  },
  "alex": {
    id: "alex",
    email: "alex@gmail.com",
    password: "12345"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

// endpoint to handle error if email is already in users obj
const emailAlreadyExists = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    } 
  } return false;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase, 
    userID: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

// server renders urls_new template and user inputs new longURL to shorten
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    userID: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

// server generates a shortURL and adds it to database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL], 
    userID: req.cookies["user_id"],
    user: users[req.cookies["user_id"]] 
  };
  res.render("urls_show", templateVars);
});

// requests to the endpoint will redirect to its longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// delete operation to remove existing shortURL from our database and redirect user back to index page
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// handle post request to update a resource
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

// endpoint to handle post to login
app.get('/login', (req, res) => {
  const templateVars = {
    "user_id": req.cookies["user_id"],
    "user": users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

// endpoint to handle post to logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// endpoint to handle get to register/sign up
app.get("/register", (req, res) => {
  const templateVars = {
    "user_id": req.cookies["user_id"],
    "user": users[req.cookies["user_id"]]
  };
  res.render("register", templateVars);
});

// endpoint to handle post to registration form data
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  // if email or password are empty strings
  if (!email || !password) {
    return res.status(400).send("Email and Password must be filled in!");
  }
  // if email is already in users obj
  if (emailAlreadyExists(email, users)) {
    return res.status(400).send("Email has already been taken!");
  }

  const user = {
    id: userID,
    email: email,
    password: password
  };
  users[userID] = user;
  console.log(users);
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

// new branch