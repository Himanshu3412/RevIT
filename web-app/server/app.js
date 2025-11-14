const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);

// Serve static files from each respective directory
app.use('/LandingPage', express.static(path.join(__dirname, '../LandingPage')));
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/SignUp', express.static(path.join(__dirname, '../SignUp')));
app.use('/ResumeForm', express.static(path.join(__dirname, '../ResumeForm')));
app.use('/Recruiter_Dashboard', express.static(path.join(__dirname, '../Recruiter_Dashboard')));
app.use('/Candidate_Dashboard', express.static(path.join(__dirname, '../Candidate_Dashboard')));
app.use('/Quiz', express.static(path.join(__dirname, '../Quiz')));

// Add a redirect from Student_Dashboard to Candidate_Dashboard for backward compatibility
app.get('/Student_Dashboard*', (req, res) => {
  res.redirect('/Candidate_Dashboard');
});

// Default route redirects to landing page
app.get('/', (req, res) => {
  res.redirect('/LandingPage');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 