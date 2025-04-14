const mongoose = require('mongoose');
 mongoose.connect(process.env.DATABASE_URL).then((result) => {
    console.log("database connected")
}).catch((error) => {
    console.log("Error while connect to database")
});
const dbConnection = mongoose.connection;