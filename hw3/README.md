## Socket.io 

Run the Socket.io exercise by opening terminal and running this command: $ node index.js
This will run the server and then if not automatically opened, go to a browser and open localhost:3000 to see the webpage.

## Typescript

Run the TS exercise by opening terminal and running $ npx tsc exercise1.ts.
You may need to install TS with $ npm install -D tsx

## Express

cd into the Express folder and then the express-locallibrary-tutorial

run $ npm i

then $ DEBUG=express-locallibrary-tutorial:* npm start

If there are issues with DB connections

create/update atlas-credentials.env with appropriate credentials
with the very least
MONGODB_URI="mongodb+srv://db_user:password.twbojwz.mongodb.net"

run this to load credentials and open localhost:3000

$node --env-file=./atlas-credentials.env ./bin/www