const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User'); // Ensure you have a User model
const Request = require('./models/Request');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware for parsing request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Change this to a secure random value
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.COOKIE_SECURE || false } // Set to true if using HTTPS
}));

// Use the user router
app.use('/api/users', userRoutes);

// Render home page
app.get('/', (req, res) => {
    res.render('index');
});

// Login route
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });

    if (user && user.password === password) {
        req.session.user = user; // Store user data in session

        // Redirect based on role
        switch (user.role) {
            case 'admin':
                return res.redirect('/admin/dashboard');
            case 'driver':
                return res.redirect('/driver/dashboard');
            case 'hod':
                return res.redirect('/hod/dashboard');
            case 'employee':
                return res.redirect('/employee/dashboard');
            default:
                res.status(401).send('Invalid role');
        }
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('adminDashboard');
    } else {
        res.redirect('/');
    }
});

// HOD Dashboard
app.get('/hod/dashboard', (req, res) => {
    if (req.session.user && req.session.user.role === 'hod') {
        res.render('hodDashboard');
    } else {
        res.redirect('/');
    }
});

// View form to HOD
app.get('/hod/driverForm', (req, res) => {
    res.render('driverForm');
});
app.get('/hod/str', (req, res) => {
    res.render('hodStrres');
});




// Save HOD form to driver in MongoDB
app.post('/api/users/hod/bookings', async (req, res) => {
    try {
        const newBooking = new Request(req.body);
        await newBooking.save();
        res.status(201).send('Booking saved successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/hod/TRF_req', (req, res) => {
    res.render('hodTRFres');
});
app.get('/hod/Str_req', (req, res) => {
    res.render('hodStrres');
});









// Driver Dashboard
app.get('/driver/dashboard', async (req, res) => {
    if (req.session.user && req.session.user.role === 'driver') {
        try {
            const bookingList = await Request.find();
            res.render('driverDashboard', { bookingList });
        } catch (err) {
            console.error('Error fetching bookings:', err);
            res.status(500).send('Server error');
        }
    } else {
        res.redirect('/');
    }
});

// Route to handle form submission
app.post('/saveBooking', (req, res) => {
    const { distance, tollUsage } = req.body;
    console.log(`Distance Traveled: ${distance}`);
    console.log(`Toll Usage: ${tollUsage}`);
    res.redirect('/driver/dashboard');
});

// Update form
app.post('/api/driver/updateBooking', async (req, res) => {
    const { bookingId, distanceTraveled, tollUsage } = req.body;

    try {
        const booking = await Request.findById(bookingId);
        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        booking.distanceTraveled = distanceTraveled;
        booking.tollUsage = tollUsage;

        await booking.save();
        res.status(200).send('Booking updated successfully');
    } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).send('Server error');
    }
});

// Show driver history
app.get('/driver/history', async (req, res) => {
    if (req.session.user && req.session.user.role === 'driver') {
        try {
            const bookings = await Request.find({ driverId: req.session.user.driverId });
            res.render('driverHistory', { bookings });
        } catch (err) {
            console.error('Error fetching bookings:', err);
            res.status(500).send('Server error');
        }
    } else {
        res.redirect('/');
    }
});

// Employee Dashboard
app.get('/employee/dashboard', (req, res) => {
    if (req.session.user && req.session.user.role === 'employee') {
        res.render('employeeDashboard');
    } else {
        res.redirect('/');
    }
});

// demo 
app.get('/employee/travel-request-form', (req, res) => {
    res.render('em_TRF');
});
app.get('/employee/Sta', (req, res) => {
    res.render('emp_sta');
});
app.get('/employee/Sta_f', (req, res) => {
    res.render('emp_sta_f');
});














// Route to display bookings for HOD
app.get('/hod/bookings', async (req, res) => {
    try {
        const bookings = await Request.find();
        res.render('hodBookings', { bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Error fetching bookings');
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB connected');

        // Check if the admin user already exists
        const existingAdmin = await User.findOne({ userId: 'admin' });
        if (!existingAdmin) {
            // Create admin user if not exists
            const adminUser = new User({
                userId: 'admin',
                name: 'Admin',
                role: 'admin',
                department: 'Administration',
                password: '123', // Store the password as plain text (not recommended for production)
            });

            await adminUser.save();
            console.log('Admin user created');
        } else {
            console.log('Admin user already exists');
        }
    })
    .catch(err => console.log('MongoDB connection error:', err));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
