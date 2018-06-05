var mongoose = require('mongoose'); // Import Mongoose Package
var Schema = mongoose.Schema; // Assign Mongoose Schema function to variable
var titlize = require('mongoose-title-case'); // Import Mongoose Title Case Plugin
var validate = require('mongoose-validator'); // Import Mongoose Validator Plugin

var orderschema= new Schema({
	firstname: {type: String},
	phonenumber: {type: String},
	projectname: {type: String},
	material: {type: String},
	process: {type: String},
	email: {type: String},
	quantity: {type: Number},
	costpregst: {type: String},
	paymentfinal: {type: Boolean, default: false},
	costpostgst: {type: String},
	invoiceno: {type: String},
	objectid:{ type: String},
	gstnumber: { type: String},
	date:{type: String},
	baddress:{ type: String},
	bcity:{ type: String},
	bstate:{ type: String},
	bcountry:{ type: String},
	bzip:{ type: Number},
	saddress:{ type: String},
	scity:{ type: String},
	sstate:{ type: String},
	scountry:{ type: String},
	szip:{ type: Number},




});


module.exports = mongoose.model('Orders', orderschema); // Export Order Model for use in API
