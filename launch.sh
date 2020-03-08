socat tcp-listen:3001,reuseaddr,fork tcp:localhost:3000 &
node app.js
