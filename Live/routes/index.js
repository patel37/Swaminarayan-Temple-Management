'use strict';

let express = require('express');
let router = express.Router();
const fs = require('fs');


/* GET home page. */
router.get('/', function(req, res) {
	res.render('/index.html', { foo: 'bar' });
});

/* View api documentation */
router.get('/api-doc', (req, res) => {
    res.redirect('/fetch-mobile-api-doc/apidoc/index.html');
});
router.get('/paymentSuccess', function(req, res) {
    let data = req.body;
    fs.appendFileSync('payment_successfull.json', '\n' + JSON.stringify(data), (err) => {
        if (err) throw err;
            console.log("Data written to file");
        });
     fs.readFile('./public/paymentSuccess.html', { encoding: 'utf-8' }, function (err, f) {
        if(!err){
            res.send(f)
        }
     });
 });

router.get('/paymentFail', function(req, res) {
    let data = req.body;
    fs.appendFileSync('payment_faild.json', '\n' + JSON.stringify(data), (err) => {
        if (err) throw err;
            console.log("Data written to file");
        });
    fs.readFile('./public/paymentFail.html', { encoding: 'utf-8' }, function (err, f) {
       if(!err){
           res.send(f)
       }
    });
});
module.exports = router;