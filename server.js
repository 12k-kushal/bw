var express = require('express'); // ExperssJS Framework
var app = express(); // Invoke express to variable for use in application
var formidable = require('formidable');
var upload = require('express-fileupload');
const http = require('http');
var port = process.env.PORT || 8080; // Set default port or assign a port in enviornment
var morgan = require('morgan'); // Import Morgan Package
var mongoose = require('mongoose'); // HTTP request logger middleware for Node.js
var bodyParser = require('body-parser'); // Node.js body parsing middleware. Parses incoming request bodies in a middleware before your handlers, available under req.body.
var router = express.Router(); // Invoke the Express Router
var appRoutes = require('./app/routes/api')(router); // Import the application end points/API
var path = require('path'); // Import path module
var passport = require('passport'); // Express-compatible authentication middleware for Node.js.
var social = require('./app/passport/passport')(app, passport); // Import passport.js End Points/API
var fs = require('fs');
var engines = require('consolidate');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;

app.use(upload()); // configure middleware
app.use(morgan('dev')); // Morgan Middleware
app.use(bodyParser.json()); // Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/public')); // Allow front end to access public folder
app.use('/api', appRoutes); // Assign name to end points (e.g., '/api/management/', '/api/users' ,etc. )
app.set('view engine', 'html');
app.set('views', __dirname + '/views');


// 
// <---------- REPLACE WITH YOUR MONGOOSE CONFIGURATION ---------->
// dev:dev@ds125489.mlab.com:25489/mydatabase
//localhost:27017/bwdatabase
mongoose.connect('mongodb://localhost:27017/bwdatabase', function(err) {
    if (err) {
        console.log('Not connected to the database: ' + err); // Log to console if unable to connect to database   //mongodb://root:password@ds027215.mlab.com:27215/gugui3z24
    } else {
        console.log('Successfully connected to MongoDB'); // Log to console if able to connect to database
    }
});

// Set Application Static Layout
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/app/views/index.html')); // Set index.html as layout
});

// Start Server
app.listen(port, function() {
    console.log('Running the server on port ' + port); // Listen on configured port
});
