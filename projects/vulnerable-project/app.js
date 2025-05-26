// Vulnerable Node.js application demonstrating XSS and SQL injection vulnerabilities

const express = require('express');
const mysql = require('mysql');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Database connection setup (vulnerable to SQL injection)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'vulnerable_db'
});

db.connect((err) => {
  if (err) {
    console.error('error connecting:', err);
    return;
  }
  console.log('connected as id ' + db.threadId);
});

// XSS vulnerability: directly rendering user input
app.get('/', (req, res) => {
  const userInput = req.query.input;
  res.send(`<h1>Hello, ${userInput}</h1>`);
});

// SQL injection vulnerability: directly concatenating user input into SQL query
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('error:', err);
      res.status(500).send('Internal Server Error');
    } else if (results.length > 0) {
      res.send('Login successful!');
    } else {
      res.send('Invalid credentials');
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
