# cab-api
testing
11
15
99
 mongorestore --uri="mongodb://localhost:27017" C:\Users\gajer\Desktop\delete\01-12-2024_dump\db\01-12-2024_dump\cabappdev-test-1

db.haribhagats.find({ haribhagat_id: { $gte: "3" } }).forEach(function(doc) {
    // Convert haribhagat_id (string) to an integer
    let newHaribhagatId = parseInt(doc.haribhagat_id) - 1;

    // Update the document with the incremented haribhagat_id
    db.haribhagats.updateOne(
        { _id: doc._id },  // Target the current document by _id
        { $set: { haribhagat_id: newHaribhagatId.toString() } }  // Set the new haribhagat_id (converted back to string)
    );
});


db backup store at AWS_DB_BUCKET=waajee-cab/consumers-test/db-dump