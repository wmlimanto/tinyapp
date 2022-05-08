const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const { restart } = require("nodemon");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8)
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// endpoint to handle error if email is already in users obj
const verifyEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    } 
  } return false;
};

// urls belong to users
const urlsForUser = (userID, urlDatabase) => {
  const userURL = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      userURL[url] = urlDatabase[url];
    }
  } return userURL;
};

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
  if (verifyEmail(email, users)) {
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

// endpoint to handle post to login
app.get('/login', (req, res) => {
  const templateVars = {
    "user_id": req.cookies["user_id"],
    "user": users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

// endpoint to handle post to login using email address
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = verifyEmail(email, users);

  // if user with that email cannot be found
  if (!user) {
    return res.status(403).send("This email does not exist, please try again!");
  }

  // if user password verification passes
  if (user.password === password) {
    res.cookie('user_id', user.id);
    res.redirect("/urls");
    return;
  } else {
    // if password does not match
    return res.status(403).send("Wrong password, please try again!");
  }
});

// only logged in users can see their shortened urls
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!user) {
    return res.status(400).send("Please login to access the site!");
  } else {
    const templateVars = {
      user: users[userID], 
      urls: urlsForUser(userID, urlDatabase)
    };
    console.log("checkDatabase", urlsForUser("alex", urlDatabase));
    res.render("urls_index", templateVars);
  }
});

// redirect to login page if user is not logged in
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    const templateVars = {
      urls: urlDatabase,
      userID: req.cookies["user_id"],
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
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
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL]['longURL'];
    res.redirect(longURL);
  } else {
    res.status(400).send("This URL ID does not exist, please check again!");
  }
});

// server generates a shortURL and adds it to database
app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/urls");
  }
});

// handle post request to update a resource
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.status(403).send("You are not logged in!");
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID
    };
    res.redirect("urls_index");
  }
});

// only creator of the url can edit or delete the link
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  if (userID !== urlDatabase[shortURL].userID) {
    res.status(403).send("You are not logged in!");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// endpoint to handle post to logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});