const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8)
};

const getUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    } 
  } return false;
};

const urlsForUser = (userID, urlDatabase) => {
  const userURL = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      userURL[url] = urlDatabase[url];
    }
  } return userURL;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };