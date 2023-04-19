var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
const https = require('https')
//use the application off of express.
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

//define the route for "/"
app.get("/", function (request, response) {
    //show this file when the "/" is requested
    response.sendFile(__dirname + "/index.html");
});


app.post("/bus-services", function (request, response) {
    
    const url = "https://api.tfl.gov.uk/Line/Mode/bus/Route?serviceTypes=Regular";
    let data = '';
    https.get(url, res => {
        
        res.on('data', chunk => {
            data += chunk;
        });
        res.on('end', () => {
            data = JSON.parse(data);
            response.render('response', { response: data });
        })
    }).on('error', err => {
        console.log(err.message);
    })
   // response.render('response', { response: data });

    
});



//start the server
app.listen(3000, function (request, response) {
    console.log("Server running @ http://localhost:3000");
    console.log('Press Control C to show down');
});

