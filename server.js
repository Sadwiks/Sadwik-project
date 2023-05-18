var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
const https = require("https");
const webpush = require("web-push");
var mysql = require("mysql2");

//use the application off of express.
var app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//define the route for "/"
const session = require("express-session");
app.use(session({ secret: "storage", resave: true, saveUninitialized: true }));

const conn = mysql.createConnection({
  host: "storage",
  user: "bus",
  password: "bus",
  database: "bus_storage",
});

app.get("/", function (request, response) {
  //show this file when the "/" is requested
  response.sendFile(__dirname + "/index.html");
});

app.get("/logout", function (request, response) {
  //show this file when the "/" is requested
  request.session.userName = "";

  response.sendFile(__dirname + "/index.html");
});

app.post("/login", function (request, response) {
  const { userName, password } = request.body;
  conn.query(
    'select * from  user_subscription  where username = "' +
      userName +
      '"  and  password ="' +
      password +
      '"',
    function (error, dataset, column) {
      console.log(error);
      if (error == null && dataset.length > 0) {
        request.session.userName = userName;
        const url =
          "https://api.tfl.gov.uk/Line/Mode/bus/Route?serviceTypes=Regular";
        let data = "";
        https
          .get(url, (res) => {
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              data = JSON.parse(data);
              setInterval(
                () =>
                  arrivalNotifcation(
                    dataset[0]["lineid"],
                    dataset[0]["stationid"]
                  ),
                30000
              );
              response.render("BusServices", {
                response: data,
                lineid: dataset[0]["lineid"],
                stationid: dataset[0]["stationid"],
                message: "",
              });
            });
          })
          .on("error", (err) => {
            console.log(err.message);
            response.sendFile(__dirname + "/index.html");
          });
      } else {
        response.sendFile(__dirname + "/index.html");
      }
    }
  );
});

app.post("/updatesubscribe", function (request, response) {
  let { lineid, stationid } = request.body;
  conn.query(
    'update user_subscription set lineid="' +
      lineid +
      '", stationid="' +
      stationid +
      '" where username = "' +
      request.session.userName +
      '"',
    function (err, results, fields) {
      console.log(err);
      const url =
        "https://api.tfl.gov.uk/Line/Mode/bus/Route?serviceTypes=Regular";
      let data = "";
      https
        .get(url, (res) => {
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            data = JSON.parse(data);
            response.render("BusServices", {
              response: data,
              lineid: lineid,
              stationid: stationid,
              message: "subscribed successfully",
            });
          });
        })
        .on("error", (err) => {
          console.log(err.message);
        });
    }
  );
});

app.post("/signup", function (request, response) {
  const { userName, password } = request.body;
  console.log(request.body);
  conn.query(
    'insert into user_subscription  (username,password) values ("' +
      userName +
      '","' +
      password +
      '")',
    function (error, dataset, column) {
      console.log(error);
      response.sendFile(__dirname + "/index.html");
    }
  );
});

app.get("/signup", function (request, response) {
  response.render("signup");
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
        response.render("BusServices", {
          response: data,
          lineid: "",
          stationid: "",
          message: "",
        });
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
  "BOksX3cwyMRAid63ofmoLr3IuOOIJaj_tmQKyKG6OxwgcM7bt_XtA-CuFYvBSsmQp7YZEOr2MaedimHlWrmpmhg";

const privateVapidKey = "o94XvEQQb-4Ta2ZoevzqI2YzbnjD6eVJHxEEa_yEXK8";

// Setup the public and private VAPID keys to web-push library.
webpush.setVapidDetails(
  "mailto:sadwikkastala@gmail.com",
  publicVapidKey,
  privateVapidKey
);
let subscription = {};
// Create route for allow client to subscribe to push notification.
app.post("/subscribe", (req, res) => {
  console.log(req.body);
  subscription = req.body;
  res.status(201).json({});
  const payload = JSON.stringify({
    title: "Bus Arrival Notification",
    body: "Demo Notification",
  });
  console.log(subscription);
  console.log(payload);
  webpush.sendNotification(subscription, payload).catch(console.log);
});

function arrivalNotifcation(lineid, stopId) {
  stopPointUrl =
    " https://api.tfl.gov.uk/Line/" + lineid + "/Arrivals/" + stopId;
  let data = "";
  https
    .get(stopPointUrl, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (data != null) {
          try {
            data = JSON.parse(data);
            console.log(data);
            let notify = "";

            for (let bus of data || []) {
              console.log(bus["expectedArrival"]);
              var currentDate = new Date();
              var arrivalDate = new Date(bus["expectedArrival"]);
              var diff = parseInt(
                (arrivalDate - currentDate) / (1000 * 60),
                10
              );
              console.log(diff);
              if (diff <= 5) {
                notify =
                  notify +
                  bus["vehicleId"] +
                  " arrives in " +
                  bus["expectedArrival"];
              }
            }
            if (notify != "") {
              webpush
                .sendNotification(
                  subscription,
                  JSON.stringify({
                    title: "Bus Arrival Notification",
                    body: notify,
                  })
                )
                .catch(console.log);
            }
          } catch (err) {}
        }
      });
    })
    .on("error", (err) => {
      console.log(err.message);
    });
}

function initialize() {
  conn.query(
    "create table if not exists user_subscription (username varchar(200) PRIMARY KEY, password varchar(200), lineid varchar(200), stationid varchar(200))",
    function (error, dataset, column) {
      console.log(error);
    }
  );
}
initialize();

//start the server
app.listen(6060, function (request, response) {
  console.log("Server running @ http://localhost:6060");
  console.log("Press Control C to show down");
});
