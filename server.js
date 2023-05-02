var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
const https = require("https");
const webpush = require("web-push");

//use the application off of express.
var app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//define the route for "/"
app.get("/", function (request, response) {
  //show this file when the "/" is requested
  response.sendFile(__dirname + "/index.html");
});

app.post("/bus-services", function (request, response) {
  const url = "https://api.tfl.gov.uk/Line/Mode/bus/Route?serviceTypes=Regular";
  let data = "";
  https
    .get(url, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        data = JSON.parse(data);
        response.render("BusServices", { response: data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
    });
  // response.render('response', { response: data });
});

app.get("/stop-points", function (request, response) {
  stopPointUrl =
    " https://api.tfl.gov.uk/Line/" + request.query["lineid"] + "/StopPoints";
  let data = "";
  https
    .get(stopPointUrl, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        data = JSON.parse(data);
        response.render("Station", {
          response: data,
          lineid: request.query["lineid"],
        });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
    });
});

app.get("/arrival-stop-points", function (request, response) {
  stopPointUrl =
    " https://api.tfl.gov.uk/Line/" +
    request.query["lineid"] +
    "/Arrivals/" +
    request.query["stoppoint"];
  let data = "";
  https
    .get(stopPointUrl, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        data = JSON.parse(data);
        response.render("Arrival", { response: data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
    });
});

const publicVapidKey =
  "BOzs1nqycOjCfUzkZ9a3eUHhLTR9bZYbptPED1o_P-XhiN48KcuHR2BhFCJ2zA4Vz0yBsUL_XfxA0cZyI2aB3DQ";

const privateVapidKey = "MtkOwurgD3KI57ps5iyXqBdDy44UO2i4Nct9dvyKe9c";

// Setup the public and private VAPID keys to web-push library.
webpush.setVapidDetails(
  "mailto:sadwikkastala@gmail.com",
  publicVapidKey,
  privateVapidKey
);

// Create route for allow client to subscribe to push notification.
app.post("/subscribe", (req, res) => {
  console.log(req.body);
  const subscription = req.body;
  res.status(201).json({});
  const payload = JSON.stringify({
    title: "Bus Arrival Notification",
    body: "Demo Notification",
  });
  console.log(subscription);
  console.log(payload);
  webpush.sendNotification(subscription, payload).catch(console.log);
});

//start the server
app.listen(6060, function (request, response) {
  console.log("Server running @ http://localhost:6060");
  console.log("Press Control C to show down");
});
