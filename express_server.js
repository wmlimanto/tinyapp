const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { 
  generateRandomString,
  getUserByEmail, 
  urlsForUser 
} = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2', 'key3'],
  maxAge: 24 * 60 * 60 * 1000 // max cookie age 24 hours
}));

const users = {
  "bob": {
    id: "bob", 
    email: "bob@gmail.com",
    password: "123456abc"
  },
  "alex": {
    id: "alex",
    email: "alex@gmail.com",
    password: "12345def"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "bob"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "alex"
  }
};

// ** GET & POST for registration **

app.get("/register", (req, res) => {
  const templateVars = {
    "user_id": req.session.user_id,
    "user": users[req.session.user_id]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // if email or password are empty strings
  if (!email || !password) {
    return res.status(400).send("Email and Password must be filled in!");
  }
  const newUser = {
    'id': userID,
    'email': email,
    'password': hashedPassword,
  };

  // if email is already in users obj
  if (getUserByEmail(email, newUser)) {
    return res.status(400).send("Email has already been taken!");
  }
  users[userID] = newUser;
  req.session.user_id = userID;
  res.redirect("/urls");
});


// ** GET & POST for login **

app.get('/login', (req, res) => {
  const templateVars = {
    "user_id": req.session.user_id,
    "user": users[req.session.user_id]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  // if user with that email cannot be found
  if (!user) {
    return res.status(403).send("This email does not exist, please try again!");
  }

  // if user password verification passes
  if (bcrypt.compare(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
    return;
  } else {
    // if password does not match
    return res.status(403).send("Wrong password, please try again!");
  }
});


// ** GET REQUESTS **

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// only logged in users can see their shortened urls
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    const templateVars = {
      user: users[userID],
      urls: urlsForUser(userID, urlDatabase)
    };
    res.render("urls_index", templateVars);
  } else {
    return res.status(401).send("Please login to access the site!");
  }
});

// redirect to login page if user is not logged in
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    const templateVars = {
      urls: urlDatabase,
      userID: req.session.user_id,
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    return res.status(401).send("Please login to access the site!");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userID: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

// requests to the endpoint will redirect to its longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL]['longURL'];
    res.redirect(longURL);
  } else {
    res.status(404).send("This URL ID does not exist, please check again!");
  }
});


// ** POST REQUESTS **

// server generates a shortURL and adds it to database
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/urls");
  }
});

// handle post request to update a resource
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403).send("You are not logged in!");
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID
    };
    res.redirect("/urls");
  }
});

// only creator of the url can edit or delete the link
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if (userID !== urlDatabase[shortURL].userID) {
    res.status(403).send("You are not logged in!");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// endpoint to handle post to logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
