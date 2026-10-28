const port = process.env.PORT || 5001;

// http://localhost:5001/form should return a form with input elements for username, email, and submit button

// http://localhost:5001/submit should return all the data the user entered

const express = require('express');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/form', (req, res) => {
  res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Contact Form</title>
        </head>
        <body>
            <main>
                <section>
                    <h1>Form</h1>
            
                    <form action="/submit" method="POST">

                        <div class="input-section">
                            <label for="username">Username:</label>
                            <input type="text" id="username" name="username" required />
                        </div>

                        <div class="input-section">
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" required />
                        </div>

                        <div class="input-section">
                            <label for="comments">Comments:</label>
                            <textarea id="comments" name="comments"></textarea>
                        </div>

                        <div class="input-section">
                            <label>Sign up for the newsletter</label>
                            <input type="checkbox" name="newsletter" value="yes"> 
                        </div>

            
                        <button type="submit">Submit</button>
                    </form>
                </section>
            </main>
        </body>
      </html>
    `);
});

// Process the submitted form
app.post('/submit', (req, res) => {
  const { username, email, comments, newsletter } = req.body;

  res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Form Response</title>
        </head>
        <body>
          <h1>We have sold your data</h1>
          <p>Newsletter signup${newsletter}</p>
          <p>Thank god your not using PHP ${username}</p>
          <p>You would get so many emailes at ${email}</p>
          <p>${comments}</p>
        </body>
      </html>
    `);
});

// Handle unmatched routes
app.use((req, res) => {
  res.status(404).send('<div>404 - page not found</div>');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});