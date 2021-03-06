const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// endpoint to handle error if email is already in users obj
const getUserByEmail = (email, users) => {
  let existingUser = null;  
  for (let user in users) {
    if (users[user].email === email) {
      existingUser = users[user];
    } 
  } 
  return existingUser;
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

module.exports = { generateRandomString, getUserByEmail, urlsForUser };