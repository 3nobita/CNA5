const mongoose = require('mongoose');

const TravelRequestSchema = new mongoose.Schema({
    travellerName: String,
    mobileNo: String,
    dateOfRequest: Date,
    employeeCode: String,
    departmentName: String,
    bandDesignation: String,
    emailAddress: String,
    hodName: String,
    departureDate: Date,
    departFrom: String,
    departureTime: String,
    arrivalTo: String,
    arrivalTime: String,
    hotelName: String,
    hotelCity: String,
    checkInDate: Date,
    checkOutDate: Date,
    nights: Number,
    location: String
});

module.exports = mongoose.model('TravelRequest', TravelRequestSchema);
