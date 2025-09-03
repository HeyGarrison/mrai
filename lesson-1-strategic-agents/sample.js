function processUserData(userData) {
  // Bug: no null check
  const email = userData.email.toLowerCase();

  // Performance issue: inefficient search
  const users = getAllUsers();
  for (let i = 0; i <= users.length; i++) { // Bug: off-by-one
    if (users[i].email === email) {
      return users[i];
    }
  }

  // Security issue: no input validation
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return database.query(query);
}

