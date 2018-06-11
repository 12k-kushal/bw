var User = require('../models/user'); // Import User Model
var Project = require('../models/project'); // Import Project Model
var Orders = require('../models/orders');
var formidable = require('formidable');
var upload = require('express-fileupload');
var express = require('express'); // ExperssJS Framework
var app = express(); // Invoke express to variable for use in application
const http = require('http');
var jwt = require('jsonwebtoken'); // Import JWT Package
var fs = require('fs');
var secret = 'harrypotter'; // Create custom secret for use in JWT
var nodemailer = require('nodemailer'); // Import Nodemailer Package
var sgTransport = require('nodemailer-sendgrid-transport'); // Import Nodemailer Sengrid Transport Package
var path = require('path');
var sha512 = require('js-sha512');//Payment encryption

var fname;//to display file name in dashcheckout

function errorHandler(err, req, res, next) {
    console.error(err.message);
    console.error(err.stack);
    res.status(500).render("error_template", { error: err});
}
module.exports = function(router) {
    // Nodemailer options (use with g-mail or SMTP)
    var client = nodemailer.createTransport({
        service: 'Zoho',
        auth: {
            user: 'accounts@brahm.works', // Your email address
            pass: '$@nj@ymn88' // Your password
        },
        tls: { rejectUnauthorized: false }
    });


    //Generate Hash for payumoney
    router.post('/createHash', function (req, res) {
        var salt = 'perqkBd267';
        var hash = sha512(req.body.preHashString + salt);
        console.log(hash);
        res.send({success : true, hash: hash});
    });

    //payumoney Status page
    router.post('/PaymentStatus', function (req, res) {
        console.log('Api payment status ');
        if(req.body.status== 'success'){
            Project.findByIdAndRemove(req.body.udf1,req.body, function(err,data)
            {
                if(!err){
                    console.log("Deleted");
                }
            });
            Orders.update({ objectid: req.body.udf1 }, { $set: { paymentfinal: true}}, callback);
            function callback(err,numAffected){
                if(err){
                    res.send(err);
                }
                else{
                    res.sendFile(path.join(__dirname + '../../../public/app/views/pages/users/payment_success.html'));
                }
            }
            
        }else{
            res.sendFile(path.join(__dirname + '../../../public/app/views/pages/users/payment_failure.html'));
        }
    });

    // Route to register new users  
    router.post('/users', function(req, res) {
        var user = new User(); // Create new User object
        user.username = req.body.email; // Save username from request to User object
        user.password = req.body.password; // Save password from request to User object
        user.email = req.body.email; // Save email from request to User object
        user.phone = req.body.phone; // Save phone from request to user object
        user.name = req.body.name; // Save name from request to User object
        user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail

        // Check if request is valid and not empty or null
        if (req.body.username === null || req.body.username === '' || req.body.password === null || req.body.password === '' || req.body.email === null || req.body.email === '' ||req.body.phone === null || req.body.phone === '' || req.body.name === null || req.body.name === '') {
            res.json({ success: false, message: 'Ensure username, email, phone no, and password were provided' });
        } else {
            // Save new user to database
            user.save(function(err) {
                if (err) {
                        // Check if duplication error exists
                        if (err.code == 11000) {
                            if (err.errmsg[61] == "u") {
                                res.json({ success: false, message: 'That username is already taken' }); // Display error if username already taken
                            } else if (err.errmsg[61] == "e") {
                                res.json({ success: false, message: 'That e-mail is already taken' }); // Display error if e-mail already taken
                            }
                    } else if (err) {
                    // Check if any validation errors exists (from user model)
                    if (err.errors !== null) {
                        if (err.errors.name) {
                            res.json({ success: false, message: err.errors.name.message }); // Display error in validation (name)
                        } else if (err.errors.email) {
                            res.json({ success: false, message: err.errors.email.message }); // Display error in validation (email)
                        } else if (err.errors.phone) {
                            res.json({success: false, message: err.errors.phone.message }); // Display error in validation (phone)
                        } else if (err.errors.username) {
                            res.json({ success: false, message: err.errors.username.message }); // Display error in validation (username)
                        } else if (err.errors.password) {
                            res.json({ success: false, message: err.errors.password.message }); // Display error in validation (password)
                        } else {
                            res.json({ success: false, message: err }); // Display any other errors with validation
                        }

                        } else {
                            res.json({ success: false, message: 'Something went wrong!!' }); // Display any other error
                        }
                    }
                } else {
                    // Create e-mail object to send to user
                    var email = {
                        from: 'Fabtiv staff, accounts@brahm.works',
                        to: [user.email, ''],
                        subject: 'Your Activation Link',
                        text: 'Hello ' + user.name + ', thank you for registering at Fabtiv. Please click on the following link to complete your activation: https://fabtiv.com/activate/' + user.temporarytoken,
                        html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Thank you for registering at fabtiv.com. Please click on the link below to complete your activation:<br><br><a href="https://fabtiv.com/activate/' + user.temporarytoken + '">https://fabtiv.com/activate/</a>'
                    };
                    // Function to send e-mail to the user
                    client.sendMail(email, function(err, info) {
                        if (err) {
                            console.log(err); // If error with sending e-mail, log to console/terminal
                        } else {
                            console.log(info); // Log success message to console if sent
                            console.log(user.email); // Display e-mail that it was sent to
                        }
                    });
                    res.json({ success: true, message: 'Account registered! Please check your e-mail for activation link.' }); // Send success message back to controller/request
                }
            });
        }
    });

    //Route to contact form in index.html
    router.post('/contact', function(req, res){
        // setup email data with unicode symbols
        var email = {
            from: '"Fabtiv Staff", accounts@brahm.works', // sender address
            to: ['sanjay@brahm.works', ''],// list of receivers
            subject: req.body.subject, // Subject line
            html: `<p>You have a new contact request from fabtiv.com</p>
                <h3> Contact details</h3>
                <ul><li>Name: ${req.body.name}</li>
                <li>Email: ${req.body.email}</li>
                <li>Phone: ${req.body.mobile}</li>
                </ul>
                <br/>
                <h3>Message</h3>
                <p> ${req.body.text}</p>
                `
        };
        // send mail with defined transport object
        client.sendMail(email, function(error, info) {
            if (error) {
                res.send(error);
            }else{
                console.log('Message sent');
                res.send('Message sent');  
            }
        });
    });

    // Route to check if username chosen on registration page is taken
    router.post('/checkusername', function(req, res) {
        User.findOne({ username: req.body.username }).select('username').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                if (user) {
                    res.json({ success: false, message: 'That username is already taken' }); // If user is returned, then username is taken
                } else {
                    res.json({ success: true, message: 'Valid username' }); // If user is not returned, then username is not taken
                }
            }
        });
    });

    // Route to check if e-mail chosen on registration page is taken    
    router.post('/checkemail', function(req, res) {
        User.findOne({ email: req.body.email }).select('email').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                if (user) {
                    res.json({ success: false, message: 'That e-mail is already taken' }); // If user is returned, then e-mail is taken
                } else {
                    res.json({ success: true, message: 'Valid e-mail' }); // If user is not returned, then e-mail is not taken
                }
            }
        });
    });

    // Route for user logins
    router.post('/authenticate', function(req, res) {
        if(req.body.username == null || req.body.username == '' ){
            res.json({ success: false, message: 'Please enter your Email-id' });
        }
        else{
        var loginUser = (req.body.username).toLowerCase(); // Ensure username is checked in lowercase against database
        
        User.findOne({ username: loginUser }).select('email username password active').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported:' + err,
                    html: 'The following error has been reported:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if user is found in the database (based on username)           
                if (!user) {
                    res.json({ success: false, message: 'Email-id not found' }); // Username not found in database
                    /* if (!req.body.password) {
                        res.json({ success: false, message: 'blah' });
                    }*/
                } else if (user) {
                    // Check if user does exist, then compare password provided by user
                    if (!req.body.password) {
                        res.json({ success: false, message: 'No password provided' }); // Password was not provided
                    } else {
                        var validPassword = user.comparePassword(req.body.password); // Check if password matches password provided by user 
                        if (!validPassword) {
                            res.json({ success: false, message: 'Incorrect password' }); // Password does not match password in database
                        } else if (!user.active) {
                            res.json({ success: false, message: 'Account is not yet activated. Please check your e-mail for activation link.', expired: true }); // Account is not activated 
                        } else {
                            var token = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Logged in: Give user token
                            res.json({ success: true, message: 'User authenticated!', token: token }); // Return token in JSON object to controller
                        }
                    }
                }
            }
        });
    
    }
    });
    // Route to activate the user's account 
    router.put('/activate/:token', function(req, res) {
        User.findOne({ temporarytoken: req.params.token }, function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                var token = req.params.token; // Save the token from URL for verification 
                // Function to verify the user's token
                jwt.verify(token, secret, function(err, decoded) {
                    if (err) {
                        res.json({ success: false, message: 'Activation link has expired.' }); // Token is expired
                    } else if (!user) {
                        res.json({ success: false, message: 'Activation link has expired.' }); // Token may be valid but does not match any user in the database
                    } else {
                        user.temporarytoken = false; // Remove temporary token
                        user.active = true; // Change account status to Activated
                        // Mongoose Method to save user into the database
                        user.save(function(err) {
                            if (err) {
                                console.log(err); // If unable to save user, log error info to console/terminal
                            } else {
                                // If save succeeds, create e-mail object
                                var email = {
                                    from: 'Fabtiv staff, accounts@brahm.works',
                                    to: user.email,
                                    subject: 'Account Activated',
                                    text: 'Hello ' + user.name + ', Your account has been successfully activated!',
                                    html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Your account has been successfully activated!'
                                };
                                // Send e-mail object to user
                                client.sendMail(email, function(err, info) {
                                    if (err) console.log(err); // If unable to send e-mail, log error info to console/terminal
                                });
                                res.json({ success: true, message: 'Account activated!' }); // Return success message to controller
                            }
                        });
                    }
                });
            }
        });
    });

    // Route to verify user credentials before re-sending a new activation link 
    router.post('/resend', function(req, res) {
        User.findOne({ username: req.body.username }).select('username password active').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if username is found in database
                if (!user) {
                    res.json({ success: false, message: 'Could not authenticate user' }); // Username does not match username found in database
                } else if (user) {
                    // Check if password is sent in request
                    if (req.body.password) {
                        var validPassword = user.comparePassword(req.body.password); // Password was provided. Now check if matches password in database
                        if (!validPassword) {
                            res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password found in database
                        } else if (user.active) {
                            res.json({ success: false, message: 'Account is already activated.' }); // Account is already activated
                        } else {
                            res.json({ success: true, user: user });
                        }
                    } else {
                        res.json({ success: false, message: 'No password provided' }); // No password was provided
                    }
                }
            }
        });
    });

    // Route to send user a new activation link once credentials have been verified
    router.put('/resend', function(req, res) {
        User.findOne({ username: req.body.username }).select('username name email temporarytoken').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Give the user a new token to reset password
                // Save user's new token to the database
                user.save(function(err) {
                    if (err) {
                        console.log(err); // If error saving user, log it to console/terminal
                    } else {
                        // If user successfully saved to database, create e-mail object
                        var email = {
                            from: 'Fabtiv staff, accounts@brahm.works',
                            to: user.email,
                            subject: 'Activation Link Request',
                            text: 'Hello ' + user.name + ', You recently requested a new account activation link. Please click on the following link to complete your activation: https://fabtiv.com/activate/' + user.temporarytoken,
                            html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="https://fabtiv.com/activate/' + user.temporarytoken + '">https://fabtiv.com/activate/</a>'
                        };
                        // Function to send e-mail to user
                        client.sendMail(email, function(err, info) {
                            if (err) console.log(err); // If error in sending e-mail, log to console/terminal
                        });
                        res.json({ success: true, message: 'Activation link has been sent to ' + user.email + '!' }); // Return success message to controller
                    }
                });
            }
        });
    });

    // Route to send user's username to e-mail
    router.get('/resetusername/:email', function(req, res) {
        User.findOne({ email: req.params.email }).select('email name username').exec(function(err, user) {
            if (err) {
                res.json({ success: false, message: err }); // Error if cannot connect
            } else {
                if (!user) {
                    res.json({ success: false, message: 'E-mail was not found' }); // Return error if e-mail cannot be found in database
                } else {
                    // If e-mail found in database, create e-mail object
                    var email = {
                        from: 'Fabtiv Staff, accounts@brahm.works',
                        to: user.email,
                        subject: 'Fabtiv Username Request',
                        text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files: ' + user.username,
                        html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
                    };

                    // Function to send e-mail to user
                    client.sendMail(email, function(err, info) {
                        if (err) {
                            console.log(err); // If error in sending e-mail, log to console/terminal
                        } else {
                            console.log(info); // Log confirmation to console
                        }
                    });
                    res.json({ success: true, message: 'Username has been sent to e-mail! ' }); // Return success message once e-mail has been sent
                }
            }
        });
    });

    // Route to send reset link to the user
    router.put('/resetpassword', function(req, res) {
        User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                if (!user) {
                    res.json({ success: false, message: 'Username was not found' }); // Return error if username is not found in database
                } else if (!user.active) {
                    res.json({ success: false, message: 'Account has not yet been activated' }); // Return error if account is not yet activated
                } else {
                    user.resettoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail
                    // Save token to user in database
                    user.save(function(err) {
                        if (err) {
                            res.json({ success: false, message: err }); // Return error if cannot connect
                        } else {
                            // Create e-mail object to send to user
                            var email = {
                                from: 'Fabtiv staff, accounts@brahm.works',
                                to: user.email,
                                subject: 'Reset Password Request',
                                text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="https://fabtiv.com/reset/' + user.resettoken,
                                html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="https://fabtiv.com/reset/' + user.resettoken + '">https://fabtiv.com/reset/</a>'
                            };
                            // Function to send e-mail to the user
                            client.sendMail(email, function(err, info) {
                                if (err) {
                                    console.log(err); // If error with sending e-mail, log to console/terminal
                                } else {
                                    console.log(info); // Log success message to console
                                    console.log('sent to: ' + user.email); // Log e-mail 
                                }
                            });
                            res.json({ success: true, message: 'Please check your e-mail for password reset link' }); // Return success message
                        }
                    });
                }
            }
        });
    });

    // Route to verify user's e-mail activation link
    router.get('/resetpassword/:token', function(req, res) {
        User.findOne({ resettoken: req.params.token }).select().exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                var token = req.params.token; // Save user's token from parameters to variable
                // Function to verify token
                jwt.verify(token, secret, function(err, decoded) {
                    if (err) {
                        res.json({ success: false, message: 'Password link has expired' }); // Token has expired or is invalid
                    } else {
                        if (!user) {
                            res.json({ success: false, message: 'Password link has expired' }); // Token is valid but not no user has that token anymore
                        } else {
                            res.json({ success: true, user: user }); // Return user object to controller
                        }
                    }
                });
            }
        });
    });

    // Save user's new password to database
    router.put('/savepassword', function(req, res) {
        User.findOne({ username: req.body.username }).select('username email name password resettoken').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                if (req.body.password === null || req.body.password === '') {
                    res.json({ success: false, message: 'Password not provided' });
                } else {
                    user.password = req.body.password; // Save user's new password to the user object
                    user.resettoken = false; // Clear user's resettoken 
                    // Save user's new data
                    user.save(function(err) {
                        if (err) {
                            res.json({ success: false, message: err });
                        } else {
                            // Create e-mail object to send to user
                            var email = {
                                from: 'Fabtiv staff, accounts@brahm.works',
                                to: user.email,
                                subject: 'Password Recently Reset',
                                text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at https://fabtiv.com',
                                html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at https://fabtiv.com'
                            };
                            // Function to send e-mail to the user
                            client.sendMail(email, function(err, info) {
                                if (err) console.log(err); // If error with sending e-mail, log to console/terminal
                            });
                            res.json({ success: true, message: 'Password has been reset!' }); // Return success message
                        }
                    });
                }
            }
        });
    });

    // Middleware for Routes that checks for token - Place all routes after this route that require the user to already be logged in
    router.use(function(req, res, next) {
        var token = req.body.token || req.body.query || req.headers['x-access-token']; // Check for token in body, URL, or headers

        // Check if token is valid and not expired  
        if (token) {
            // Function to verify token
            jwt.verify(token, secret, function(err, decoded) {
                if (err) {
                    res.json({ success: false, message: 'Token invalid' }); // Token has expired or is invalid
                } else {
                    req.decoded = decoded; // Assign to req. variable to be able to use it in next() route ('/me' route)
                    next(); // Required to leave middleware
                }
            });
        } else {
            res.json({ success: false, message: 'No token provided' }); // Return error if no token was provided in the request
        }
    });

    // Route to get the currently logged in user    
    router.post('/me', function(req, res) {
        res.send(req.decoded); // Return the token acquired from middleware
    });

    router.get('/getuserdetails', function(req, res, next) {
        User.find({email : req.query.name})
        .exec(function(err, data){
            if(err){
                res.json(err)
            } else {
                res.json(data)
            }
        });
    });

    // Route to provide the user with a new token to renew session
    router.get('/renewToken/:username', function(req, res) {
        User.findOne({ username: req.params.username }).select('username email').exec(function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: '',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if username was found in database
                if (!user) {
                    res.json({ success: false, message: 'No user was found' }); // Return error
                } else {
                    var newToken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Give user a new token
                    res.json({ success: true, token: newToken }); // Return newToken in JSON object to controller
                }
            }
        });
    });

    // Route to get the current user's permission level
    router.get('/permission', function(req, res) {
        User.findOne({ username: req.decoded.username }, function(err, user) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if username was found in database
                if (!user) {
                    res.json({ success: false, message: 'No user was found' }); // Return an error
                } else {
                    res.json({ success: true, permission: user.permission }); // Return the user's permission
                }
            }
        });
    });

    // Route to get all users for management page
    router.get('/management', function(req, res) {
        User.find({}, function(err, users) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                User.findOne({ username: req.decoded.username }, function(err, mainUser) {
                    if (err) {
                        // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                        var email = {
                            from: 'Fabtiv staff, accounts@brahm.works',
                            to: 'accounts@brahm.works',
                            subject: 'Error Logged',
                            text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                            html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                        };
                        // Function to send e-mail to myself
                        client.sendMail(email, function(err, info) {
                            if (err) {
                                console.log(err); // If error with sending e-mail, log to console/terminal
                            } else {
                                console.log(info); // Log success message to console if sent
                                console.log(user.email); // Display e-mail that it was sent to
                            }
                        });
                        res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                    } else {
                        // Check if logged in user was found in database
                        if (!mainUser) {
                            res.json({ success: false, message: 'No user found' }); // Return error
                        } else {
                            // Check if user has editing/deleting privileges 
                            if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                                // Check if users were retrieved from database
                                if (!users) {
                                    res.json({ success: false, message: 'Users not found' }); // Return error
                                } else {
                                    res.json({ success: true, users: users, permission: mainUser.permission }); // Return users, along with current user's permission
                                }
                            } else {
                                res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                            }
                        }
                    }
                });
            }
        });
    });

    // Route to delete a user
    router.delete('/management/:username', function(req, res) {
        var deletedUser = req.params.username; // Assign the username from request parameters to a variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if current user was found in database
                if (!mainUser) {
                    res.json({ success: false, message: 'No user found' }); // Return error
                } else {
                    // Check if curent user has admin access
                    if (mainUser.permission !== 'admin') {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    } else {
                        // Fine the user that needs to be deleted
                        User.findOneAndRemove({ username: deletedUser }, function(err, user) {
                            if (err) {
                                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                                var email = {
                                    from: 'Fabtiv staff, accounts@brahm.works',
                                    to: 'accounts@brahm.works',
                                    subject: 'Error Logged',
                                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                                };
                                // Function to send e-mail to myself
                                client.sendMail(email, function(err, info) {
                                    if (err) {
                                        console.log(err); // If error with sending e-mail, log to console/terminal
                                    } else {
                                        console.log(info); // Log success message to console if sent
                                        console.log(user.email); // Display e-mail that it was sent to
                                    }
                                });
                                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                            } else {
                                res.json({ success: true }); // Return success status
                            }
                        });
                    }
                }
            }
        });
    });

    // Route to get the user that needs to be edited
    router.get('/edit/:id', function(req, res) {
        var editUser = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if logged in user was found in database
                if (!mainUser) {
                    res.json({ success: false, message: 'No user found' }); // Return error
                } else {
                    // Check if logged in user has editing privileges
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Find the user to be editted
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) {
                                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                                var email = {
                                    from: 'Fabtiv staff, accounts@brahm.works',
                                    to: 'accounts@brahm.works',
                                    subject: 'Error Logged',
                                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                                };
                                // Function to send e-mail to myself
                                client.sendMail(email, function(err, info) {
                                    if (err) {
                                        console.log(err); // If error with sending e-mail, log to console/terminal
                                    } else {
                                        console.log(info); // Log success message to console if sent
                                        console.log(user.email); // Display e-mail that it was sent to
                                    }
                                });
                                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                            } else {
                                // Check if user to edit is in database
                                if (!user) {
                                    res.json({ success: false, message: 'No user found' }); // Return error
                                } else {
                                    res.json({ success: true, user: user }); // Return the user to be editted
                                }
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permission' }); // Return access error
                    }
                }
            }
        });
    });


    // Route to update/edit a user
    router.put('/edit', function(req, res) {
        var editUser = req.body._id; // Assign _id from user to be editted to a variable
        if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
        if (req.body.username) var newUsername = req.body.username; // Check if a change to username was requested
        if (req.body.email) var newEmail = req.body.email; // Check if a change to e-mail was requested
        if (req.body.permission) var newPermission = req.body.permission; // Check if a change to permission was requested
        // Look for logged in user in database to check if have appropriate access
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) {
                // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                var email = {
                    from: 'Fabtiv staff, accounts@brahm.works',
                    to: 'accounts@brahm.works',
                    subject: 'Error Logged',
                    text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                    html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                };
                // Function to send e-mail to myself
                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err); // If error with sending e-mail, log to console/terminal
                    } else {
                        console.log(info); // Log success message to console if sent
                        console.log(user.email); // Display e-mail that it was sent to
                    }
                });
                res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
            } else {
                // Check if logged in user is found in database
                if (!mainUser) {
                    res.json({ success: false, message: "no user found" }); // Return error
                } else {
                    // Check if a change to name was requested
                    if (newName) {
                        // Check if person making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                            // Look for user in database
                            User.findOne({ _id: editUser }, function(err, user) {
                                if (err) {
                                    // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                                    var email = {
                                        from: 'Fabtiv staff, accounts@brahm.works',
                                        to: 'accounts@brahm.works',
                                        subject: 'Error Logged',
                                        text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                                        html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                                    };
                                    // Function to send e-mail to myself
                                    client.sendMail(email, function(err, info) {
                                        if (err) {
                                            console.log(err); // If error with sending e-mail, log to console/terminal
                                        } else {
                                            console.log(info); // Log success message to console if sent
                                            console.log(user.email); // Display e-mail that it was sent to
                                        }
                                    });
                                    res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                                } else {
                                    // Check if user is in database
                                    if (!user) {
                                        res.json({ success: false, message: 'No user found' }); // Return error
                                    } else {
                                        user.name = newName; // Assign new name to user in database
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); // Log any errors to the console
                                            } else {
                                                res.json({ success: true, message: 'Name has been updated!' }); // Return success message
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                        }
                    }

                    // Check if a change to username was requested
                    if (newUsername) {
                        // Check if person making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                            // Look for user in database
                            User.findOne({ _id: editUser }, function(err, user) {
                                if (err) {
                                    // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                                    var email = {
                                        from: 'Fabtiv staff, accounts@brahm.works',
                                        to: 'accounts@brahm.works',
                                        subject: 'Error Logged',
                                        text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                                        html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                                    };
                                    // Function to send e-mail to myself
                                    client.sendMail(email, function(err, info) {
                                        if (err) {
                                            console.log(err); // If error with sending e-mail, log to console/terminal
                                        } else {
                                            console.log(info); // Log success message to console if sent
                                            console.log(user.email); // Display e-mail that it was sent to
                                        }
                                    });
                                    res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                                } else {
                                    // Check if user is in database
                                    if (!user) {
                                        res.json({ success: false, message: 'No user found' }); // Return error
                                    } else {
                                        user.username = newUsername; // Save new username to user in database
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); // Log error to console
                                            } else {
                                                res.json({ success: true, message: 'Username has been updated' }); // Return success
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                        }
                    }

                    // Check if change to e-mail was requested
                    if (newEmail) {
                        // Check if person making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                            // Look for user that needs to be editted
                            User.findOne({ _id: editUser }, function(err, user) {
                                if (err) {
                                    // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                                    var email = {
                                        from: 'Fabtiv staff, accounts@brahm.works',
                                        to: 'accounts@brahm.works',
                                        subject: 'Error Logged',
                                        text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                                        html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                                    };
                                    // Function to send e-mail to myself
                                    client.sendMail(email, function(err, info) {
                                        if (err) {
                                            console.log(err); // If error with sending e-mail, log to console/terminal
                                        } else {
                                            console.log(info); // Log success message to console if sent
                                            console.log(user.email); // Display e-mail that it was sent to
                                        }
                                    });
                                    res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                                } else {
                                    // Check if logged in user is in database
                                    if (!user) {
                                        res.json({ success: false, message: 'No user found' }); // Return error
                                    } else {
                                        user.email = newEmail; // Assign new e-mail to user in databse
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); // Log error to console
                                            } else {
                                                res.json({ success: true, message: 'E-mail has been updated' }); // Return success
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                        }
                    }

                    // Check if a change to permission was requested
                    if (newPermission) {
                        // Check if user making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                            // Look for user to edit in database
                            User.findOne({ _id: editUser }, function(err, user) {
                                if (err) {
                                    // Create an e-mail object that contains the error. Set to automatically send it to myself for troubleshooting.
                                    var email = {
                                        from: 'Fabtiv staff, accounts@brahm.works',
                                        to: 'accounts@brahm.works',
                                        subject: 'Error Logged',
                                        text: 'The following error has been reported in the MEAN Stack Application: ' + err,
                                        html: 'The following error has been reported in the MEAN Stack Application:<br><br>' + err
                                    };
                                    // Function to send e-mail to myself
                                    client.sendMail(email, function(err, info) {
                                        if (err) {
                                            console.log(err); // If error with sending e-mail, log to console/terminal
                                        } else {
                                            console.log(info); // Log success message to console if sent
                                            console.log(user.email); // Display e-mail that it was sent to
                                        }
                                    });
                                    res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                                } else {
                                    // Check if user is found in database
                                    if (!user) {
                                        res.json({ success: false, message: 'No user found' }); // Return error
                                    } else {
                                        // Check if attempting to set the 'user' permission
                                        if (newPermission === 'user') {
                                            // Check the current permission is an admin
                                            if (user.permission === 'admin') {
                                                // Check if user making changes has access
                                                if (mainUser.permission !== 'admin') {
                                                    res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade an admin.' }); // Return error
                                                } else {
                                                    user.permission = newPermission; // Assign new permission to user
                                                    // Save changes
                                                    user.save(function(err) {
                                                        if (err) {
                                                            console.log(err); // Long error to console
                                                        } else {
                                                            res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                        }
                                                    });
                                                }
                                            } else {
                                                user.permission = newPermission; // Assign new permission to user
                                                // Save changes
                                                user.save(function(err) {
                                                    if (err) {
                                                        console.log(err); // Log error to console
                                                    } else {
                                                        res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                    }
                                                });
                                            }
                                        }
                                        // Check if attempting to set the 'moderator' permission
                                        if (newPermission === 'moderator') {
                                            // Check if the current permission is 'admin'
                                            if (user.permission === 'admin') {
                                                // Check if user making changes has access
                                                if (mainUser.permission !== 'admin') {
                                                    res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade another admin' }); // Return error
                                                } else {
                                                    user.permission = newPermission; // Assign new permission
                                                    // Save changes
                                                    user.save(function(err) {
                                                        if (err) {
                                                            console.log(err); // Log error to console
                                                        } else {
                                                            res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                        }
                                                    });
                                                }
                                            } else {
                                                user.permission = newPermission; // Assign new permssion
                                                // Save changes
                                                user.save(function(err) {
                                                    if (err) {
                                                        console.log(err); // Log error to console
                                                    } else {
                                                        res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                    }
                                                });
                                            }
                                        }

                                        // Check if assigning the 'admin' permission
                                        if (newPermission === 'admin') {
                                            // Check if logged in user has access
                                            if (mainUser.permission === 'admin') {
                                                user.permission = newPermission; // Assign new permission
                                                // Save changes
                                                user.save(function(err) {
                                                    if (err) {
                                                        console.log(err); // Log error to console
                                                    } else {
                                                        res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                    }
                                                });
                                            } else {
                                                res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level' }); // Return error
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                        }
                    }
                }
            }
        });
    });

    
    router.get('/records', function(req, res, next) {
        Project.find({email : req.query.name})
        .exec(function(err, data){
            if(err){
                res.json(err);
            } else {
                res.json(data);
            }
        });
    });

    router.post('/records', function(req, res, next){
        console.log(req.body);
        var pro = new Project();
        pro.project=req.body.project;
        pro.description=req.body.description;
        pro.filename=fname;
        pro.process=req.body.process;
        pro.material=req.body.material;
        pro.email=req.body.email;
        pro.cost=req.body.cost;
        pro.quantity=req.body.quantity;
        pro.save(function (err) {
            res.json('POST records clear');
            }); 
        fname= "";
    });

    router.delete('/records/:id', function(req, res, next){
        var id = req.params.id;
        console.log("delete " + id);
        Project.findByIdAndRemove(req.params.id, (err, todo) => {  
        if (err) return res.status(500).send(err);
            res.json('deleted');
        });

    });
   
    router.post('/upload', function(req,res){
        console.log(req.files.file);
        var file = req.files.file,
        name = file.name,
        type = file.mimetype;
        fname=name;        
        console.log('mimetype'+type);
        var uploadpath ='./uploads/' +name;
        console.log(uploadpath);
        file.mv(uploadpath,function(err){
            if(err){
               console.log("File Upload Failed",name,err);
             res.send("Error Occured!")
            }
            else {
               console.log("File Uploaded",name);
               res.send('Done uploading files');
            }
        });
    });   
    
    router.post('/quote/:id',function(req,res,next){
        var id = req.params.id;
        console.log(id);
        var f,m, pro, p,d,c,e,multiplier;

        Project.findById(id,function(err,doc){
            f=doc.filename;
            m= doc.material;
            pro= doc.process;
            p=doc.project;
            d=doc.description;
            c=doc.cost;
            e=doc.email; 

            switch (m){
                case 'PLA'      :multiplier=35;break;
                case 'ABS'      :multiplier=40;break;
                case 'PA 2200'  :multiplier=150;break;
                case 'Nylon 12' :multiplier=150;break;
                case 'Visijet'  :multiplier=125;break;
                case 'Accura 25':multiplier=125;break;
                case 'Accura 60':multiplier=125;break;
            }
            var stl = NodeStl('./uploads/'+ f);
            console.log(stl.volume + ' cm^3');
            if(stl.volume>8000){
                res.send("file too large");
            }
            else{
                function precisionRound(number, precision) {
                    var factor = Math.pow(10, precision);
                    return Math.round(number * factor) / factor;
                }

                var res=stl.volume*multiplier;
                var cost=precisionRound(res, 2);
                console.log(cost);
                
                updatecost(cost);
            }
            //var idO = mongoose.Types.ObjectId(id);
        });

        function updatecost(cost){
        Project.findByIdAndUpdate(id, { $set: {
            project: p,
            filename: f,
            material: m,
            process: pro,
            description: d,
            email: e,
            cost:cost,
            }}, { new: true }, 

            function (err, tank) {
                if (err) return handleError(err);
                res.json(tank);
        });
    }
        // Vertex
        function Vertex (v1,v2,v3) {
            this.v1 = Number(v1);
            this.v2 = Number(v2);
            this.v3 = Number(v3);
        }

        // Vertex Holder
        function VertexHolder (vertex1,vertex2,vertex3) {
            this.vert1 = vertex1;
            this.vert2 = vertex2;
            this.vert3 = vertex3;
        }

        // transforming a Node.js Buffer into a V8 array buffer
        function _toArrayBuffer (buffer) {
            var 
            ab = new ArrayBuffer(buffer.length),
            view = new Uint8Array(ab);
            
            for (var i = 0; i < buffer.length; ++i) {
                view[i] = buffer[i];
            }
            return ab;
        }

        // calculation of the triangle volume
        // source: http://stackoverflow.com/questions/6518404/how-do-i-calculate-the-volume-of-an-object-stored-in-stl-files
        function _triangleVolume (vertexHolder) {
            var 
            v321 = Number(vertexHolder.vert3.v1 * vertexHolder.vert2.v2 * vertexHolder.vert1.v3),
            v231 = Number(vertexHolder.vert2.v1 * vertexHolder.vert3.v2 * vertexHolder.vert1.v3),
            v312 = Number(vertexHolder.vert3.v1 * vertexHolder.vert1.v2 * vertexHolder.vert2.v3),
            v132 = Number(vertexHolder.vert1.v1 * vertexHolder.vert3.v2 * vertexHolder.vert2.v3),
            v213 = Number(vertexHolder.vert2.v1 * vertexHolder.vert1.v2 * vertexHolder.vert3.v3),
            v123 = Number(vertexHolder.vert1.v1 * vertexHolder.vert2.v2 * vertexHolder.vert3.v3);
          // 
            return Number(1.0/6.0)*(-v321 + v231 + v312 - v132 - v213 + v123);
        }

        function _boundingBox (vertexes) {
          if (vertexes.length === 0) return [0,0,0]
          
          var minx = Infinity,  maxx = -Infinity,  miny = Infinity,  maxy = -Infinity,  minz = Infinity,  maxz = -Infinity;
          var tminx = Infinity, tmaxx = -Infinity, tminy = Infinity, tmaxy = -Infinity, tminz = Infinity, tmaxz = -Infinity;

          vertexes.forEach(function(vertexHolder) {
            tminx = Math.min(vertexHolder.vert1.v1, vertexHolder.vert2.v1, vertexHolder.vert3.v1)
            minx  = tminx < minx ? tminx : minx
            tmaxx = Math.max(vertexHolder.vert1.v1, vertexHolder.vert2.v1, vertexHolder.vert3.v1)
            maxx  = tmaxx > maxx ? tmaxx : maxx


            tminy = Math.min(vertexHolder.vert1.v2, vertexHolder.vert2.v2, vertexHolder.vert3.v2)
            miny  = tminy < miny ? tminy : miny
            tmaxy = Math.max(vertexHolder.vert1.v2, vertexHolder.vert2.v2, vertexHolder.vert3.v2)
            maxy  = tmaxy > maxy ? tmaxy : maxy


            tminz = Math.min(vertexHolder.vert1.v3, vertexHolder.vert2.v3, vertexHolder.vert3.v3)
            minz  = tminz < minz ? tminz : minz
            tmaxz = Math.max(vertexHolder.vert1.v3, vertexHolder.vert2.v3, vertexHolder.vert3.v3)
            maxz  = tmaxz > maxz ? tmaxz : maxz
          });

          return [maxx - minx, maxy - miny, maxz - minz];
        }

        // parsing an STL ASCII string
        function _parseSTLString (stl) {
            var totalVol = 0;
            // yes, this is the regular expression, matching the vertexes
            // it was kind of tricky but it is fast and does the job
            var vertexes = stl.match(/facet\s+normal\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+outer\s+loop\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+endloop\s+endfacet/g);

          var preVertexHolder;
          var verteces = Array(vertexes.length)
            vertexes.forEach(function (vert, i) {
                preVertexHolder = new VertexHolder();
                vert.match(/vertex\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s+([-+]?\b(?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\b)\s/g).forEach(function (vertex, i) {
                    var tempVertex  = vertex.replace('vertex', '').match(/[-+]?[0-9]*\.?[0-9]+/g);
                    var preVertex   = new Vertex(tempVertex[0],tempVertex[1],tempVertex[2]);
                    preVertexHolder['vert'+(i+1)] = preVertex;
                });
                var partVolume = _triangleVolume(preVertexHolder);
                totalVol += Number(partVolume);
            verteces[i] = preVertexHolder
            })

            var volumeTotal = Math.abs(totalVol)/1000;
            return {
                volume: volumeTotal,            // cubic cm
                weight: volumeTotal * 1.04, // gm
            boundingBox: _boundingBox(verteces),
            }
        }

        // parsing an STL Binary File
        // (borrowed some code from here: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js)
        function _parseSTLBinary (buf) {
            buf = _toArrayBuffer(buf);

            var 
            headerLength    = 80,
            dataOffset      = 84,
            faceLength      = 12*4 + 2,
            le = true; // is little-endian

            var 
            dvTriangleCount = new DataView(buf, headerLength, 4),
            numTriangles    = dvTriangleCount.getUint32(0, le),
            totalVol        = 0;

          var verteces = Array(numTriangles)
            for (var i = 0; i < numTriangles; i++) {
                var 
                dv          = new DataView(buf, dataOffset + i*faceLength, faceLength),
                normal      = new Vertex(dv.getFloat32(0, le), dv.getFloat32(4, le), dv.getFloat32(8, le)),
                vertHolder  = new VertexHolder();
                for(var v = 3; v < 12; v+=3) {
                    var vert = new Vertex(dv.getFloat32(v*4, le), dv.getFloat32((v+1)*4, le), dv.getFloat32( (v+2)*4, le ) );
                    vertHolder['vert'+(v/3)] = vert;
                }
                totalVol += _triangleVolume(vertHolder);
            verteces[i] = vertHolder;
            }

            var volumeTotal = Math.abs(totalVol)/1000;
            return {
                volume: volumeTotal,            // cubic cm
                weight: volumeTotal * 1.04, // gm
            boundingBox: _boundingBox(verteces),
            }
        }

        // NodeStl     
        function NodeStl (stlPath) {
            console.log(stlPath);
            var buf;
            if(Object.prototype.toString.call(stlPath)=='[object String]')
                buf = fs.readFileSync(stlPath);
            else if(Object.prototype.toString.call(stlPath)=='[object Uint8Array]')
                buf=stlPath;
            //console.log(buf +' NODESTL FUNCTION');
            isAscii = true;    
            for (var i=0, len=buf.length; i<len; i++) {
                if (buf[i] > 127) { isAscii=false; break; }
            }

            if (isAscii)
                return _parseSTLString(buf.toString());
            else
                return _parseSTLBinary(buf);
        }
    });

    router.post('/checkoutrecord/:id',function(req,res){
        Project.findById(req.params.id, function(err,next){
            if(err){
                res.json(err);
            }
            else{
            console.log(next);
            res.json(next);
            }
        })
    });

    /*router.get('/getfile', function(req,res,next){
        console.log(req.query.filename);
        res.sendFile(path.join(__dirname, '../abc.stl'));
    });*/


    router.put('/review/:id',function(req,res){
        var projectid = req.params.id;
        var emailid = req.decoded.email;
        var filename, pro,material,description,cost;
        Project.update({ _id: req.params.id }, { $set: { review: true }}, callback);
        function callback(err,numAffected){
            if(err){
                res.send(err);
            }
            else{
            Project.find({ '_id': projectid }, function (err, docs) {                
                    filename=docs[0].filename;
                    pro=docs[0].process;
                    material=docs[0].material;
                    description=docs[0].description;
                    cost=docs[0].cost;
                    User.find({'email': emailid}, function(err,docs){
                        phone = docs[0].phone;
                        name = docs[0].name;
                        console.log(name);
                    
                   
                    var email = {
                        from: 'Fabtiv staff, accounts@brahm.works',
                        to: ['sanjay@brahm.works', ''],
                        subject: '[BW] There is a project under review',
                        html: `<p>You have a new project for review</p>
                                <h3> Details:</h3>
                                <ul>
                                <li>Name:${docs[0].name}</li>
                                <li>Email: ${docs[0].email}</li>
                                <li>Phone:${docs[0].phone}</li>
                                <li>Process: ${pro}</li>
                                <li>Material: ${material}</li>
                                
                                <li>Description:${description}</li>
                                <li><b>Estimated cost: ${cost}</b></li>
                                <br>
                                <a href="www.google.com">Click here to login</a>
                                </ul>
                                `,

                       attachments: [
                                {   // filename and content type is derived from path
                                    path : 'uploads/'+filename 
                                },

                        ],
                    };
                    // Function to send e-mail to the user
                    client.sendMail(email, function(err, info) {
                        if (err) {
                            res.send(err); // If error with sending e-mail, log to console/terminal
                        } else {
                            res.send(info); // Log success message to console if sent
                            //console.log(user.email); // Display e-mail that it was sent to
                        }
                    });

                    });
             });
        }}
    });

    router.post('/getreview', function(req,res){
        Project.find({ 'review': true }, function (err, docs) { 
            if(err){
                res.send(err);
            }else{
                res.send(docs);
            }
        });
    });

    router.post('/getreviewdone', function(req,res){
        Project.find({ 'payment': true }, function (err, docs) { 
            if(err){
                res.send(err);
            }else{
                res.send(docs);
            }
        });
    });

    router.get('/setpayments/:id', function(req,res){
        console.log(req.query.cost);
        console.log(req.query.comment);
        Project.update({ _id: req.params.id }, { $set: { review: false, payment: true, fcost: req.query.cost, comment: req.query.comment}}, callback);
        function callback(err,numAffected){
            if(err){
                res.send(err);
            }
            else{
                res.send('1 ROW AFFECTED');
        }
    }    
    });

    //add records to order db
    router.post('/addorders', function(req, res, next){
        console.log(req.body);
        var ord = new Orders();
        ord.projectname=req.body.project_name;
        ord.material=req.body.material;
        ord.process=req.body.process;
        ord.email=req.body.email;
        ord.quantity=req.body.quantity;
        ord.costpregst=req.body.cost_pregst;
        //ord.paymentfinal=req.body.cost;
        ord.costpostgst=req.body.amount;
        //ord.invoiceno=req.body.quantity;
        ord.date=req.body.date;
        ord.objectid=req.body.objectid;
        ord.gstnumber=req.body.gst;
        ord.baddress=req.body.bstreet;
        ord.bcity=req.body.bcity;
        ord.bstate=req.body.bstate;
        ord.bcountry=req.body.bcountry;
        ord.bzip=req.body.bzip;
        ord.firstname=req.body.firstname;
        ord.phonenumber=req.body.phonenumber;
        ord.saddress=req.body.sstreet;
        ord.scity=req.body.scity;
        ord.sstate=req.body.sstate;
        ord.scountry=req.body.scountry;
        ord.szip=req.body.szip;

        ord.save(function (err) {
            res.json('POST records clear');
            }); 
        
    });

    //get order details to display in "my orders"
    router.post('/getorders', function(req,res){
        User.findOne({ username: req.decoded.username }, function(err, user) {
            if (err) {
                res.json('Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' );
            } else {
                // Check if username was found in database
                if (!user) {
                    res.json('No user was found'); // Return an error
                } else {
                    if(user.permission=='user'){
                        Orders.find({ 'paymentfinal': true, 'email': req.decoded.username }, function (err, docs) { 
                            if(err){
                                res.send(err);
                            }else{
                                res.send(docs);
                            }
                        });
                    }
                    if(user.permission=='admin'){
                        Orders.find({ 'paymentfinal' : true}, function(err,docs){
                            if(err){
                                res.send(err);
                            }else{
                                res.send(docs);
                            }
                        
                        });
                    }
                }
            }
        });
    });

    //get data from orders to display in invoice
    router.post('/getinvoicedetails/:id',function(req,res){
        console.log(req.params.id);
        Orders.find({ '_id': req.params.id }, function (err, docs) { 
            if(err){
                res.send(err);
            }else{
                res.send(docs);
            }
        });
    });

/*    router.use(errorHandler);
    var server = router.listen(process.env.PORT || 3000, function() {
        var port = server.address().port;
        console.log('Express server listening on port %s.', port);
    })*/

    return router; // Return the router object to server
};