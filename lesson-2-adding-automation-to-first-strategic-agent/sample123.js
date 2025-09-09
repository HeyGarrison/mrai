function processUserData(userData) {
  const email = userData.email.toLowerCase();

  const users = getAllUsers();
  for (let i = 0; i <= users.length; i++) { // Bug: off-by-one
    if (users[i].email === email) {
      return users[i];
    }
  }

  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return database.query(query);
}

