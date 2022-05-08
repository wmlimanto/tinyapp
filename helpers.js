// endpoint to handle error if email is already in users obj
const getUserByEmail = (email, users) => {
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

module.exports = { getUserByEmail, urlsForUser };