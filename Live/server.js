const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the ./dist directory
app.use(express.static('./dist'));

// Serve index.html for all routes
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, './dist', 'index.html'));
});

app.listen(9353, () => {
    console.log("Server is running on port 9353");
});