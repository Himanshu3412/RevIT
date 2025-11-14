# RecruitAI

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21+-blue.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.6+-orange.svg)](https://firebase.google.com/)
[![spaCy](https://img.shields.io/badge/spaCy-3.7+-blue.svg)](https://spacy.io/)

An AI-powered recruitment platform that streamlines the hiring process by evaluating candidates based on their degrees, majors, skills, and project experience. The platform provides comprehensive candidate assessment through automated scoring and reporting.

## Screenshots

### Landing Page
![LandingPage](https://github.com/user-attachments/assets/908c9e5b-f6cc-4222-a59d-ab62a194728f)


### Authentication Pages
![LoginPage](https://github.com/user-attachments/assets/ae273d40-05d4-4823-9646-693ecb818f20)
![SignUpPage](https://github.com/user-attachments/assets/447d081a-6241-490f-a746-dbbaafb1ba0b)


### Dashboard Views
![CandidateDashboard](https://github.com/user-attachments/assets/f8454015-745c-4e60-b43d-10fd2dd7b571)
![RecruiterDashboard](https://github.com/user-attachments/assets/755077c7-23ce-414f-88e1-8a10ee19decf)


### Resume Analysis
![ResumeAnalysis1](https://github.com/user-attachments/assets/0519cd00-1728-4a11-a768-f9d89bfd3a15)
![ResumeAnalysis2](https://github.com/user-attachments/assets/ac297b45-8109-44eb-b651-77c2d60d592b)


## Features

- **Candidate Evaluation**: Automated scoring based on job requirements vs. candidate qualifications
- **Multi-Criteria Assessment**: Evaluates degrees, majors, skills, and project experience
- **User Authentication**: Secure login/signup for candidates and recruiters using Firebase
- **Resume Management**: Form-based resume submission and storage
- **Dashboard Access**: Separate dashboards for candidates and recruiters
- **Quiz Generation**: Automated questionnaire generation for skill assessment
- **Real-time Scoring**: Weighted scoring algorithm for comprehensive evaluation

## Tech Stack

### Backend
- **🐍 Python FastAPI**: Main API for candidate evaluation
- **🟩 Node.js Express**: Web server for frontend and authentication
- **🔥 Firebase**: Authentication and database storage

### Frontend
- **HTML5/CSS3/JavaScript**: Responsive web interface
- **Vanilla JS**: Client-side functionality

### AI/ML Components
- **spaCy**: Natural language processing for project analysis
- **Sentence Transformers**: Skill matching and semantic similarity
- **scikit-learn**: Machine learning algorithms
- **pandas**: Data manipulation and analysis

## Prerequisites

Before running this application, make sure you have the following installed:

- **Python 3.8+**: For the FastAPI backend
- **Node.js 14+**: For the Express server
- **Git**: For version control
- **Firebase Account**: For authentication and database

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/RecruitAI.git
   cd RecruitAI
   ```

2. **Set up Python environment:**
   ```bash
   cd backend-api
   python -m venv myenv
   myenv\Scripts\activate  # On Windows
   pip install -r requirements.txt
   ```

3. **Set up Node.js server:**
   ```bash
   cd ../web-app/server
   npm install
   ```

4. **Configure Firebase:**
   - Follow the instructions in `web-app/server/FIREBASE_SETUP.md`
   - Set up your Firebase project and update the configuration files

## Running the Application

### Development Mode

1. **Start the FastAPI backend:**
   ```bash
   cd backend-api
   myenv\Scripts\activate
   uvicorn combined_check:app --reload
   ```

2. **Start the Node.js server:**
   ```bash
   cd ../web-app/server
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

### Production Mode

1. **Build and start the Node.js server:**
   ```bash
   cd web-app/server
   npm start
   ```

2. **Deploy the FastAPI backend:**
   ```bash
   cd backend-api
   myenv\Scripts\activate
   uvicorn combined_check:app
   ```

## API Endpoints

### Candidate Evaluation API (FastAPI)
- `POST /evaluate-candidate`: Comprehensive candidate evaluation
- `GET /simple-evaluation`: Simplified evaluation with query parameters

### Authentication API (Express)
- `POST /api/auth/register/candidate`: Register new candidate
- `POST /api/auth/register/recruiter`: Register new recruiter
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout

### Resume API (Express)
- `POST /api/resume/submit`: Submit candidate resume
- `GET /api/resume/{id}`: Get resume by ID

## Deployment

### GitHub Pages (Frontend Only)
1. Build the static files
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Select the appropriate branch/folder

### Full Deployment
For full deployment with backend:
1. Deploy FastAPI to services like Heroku, Railway, or AWS
2. Deploy Node.js server to services like Vercel, Netlify, or AWS
3. Update frontend API calls to point to deployed backend URLs
4. Configure environment variables for production

### Environment Variables
Create `.env` files in respective directories:

**backend-api/.env:**
```
# Add your environment variables here
```

**web-app/server/.env:**
```
PORT=3000
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
# Add other Firebase config
```

## Project Structure

```
RecruitAI/
├── backend-api/                # Python FastAPI backend
│   ├── combined_check.py        # Main API file
│   ├── requirements.txt         # Python dependencies
│   ├── myenv/                   # Virtual environment
│   └── QuizGenerator/           # Quiz generation module
├── web-app/                    # Frontend and Node.js server
│   ├── server/                  # Express server
│   │   ├── app.js              # Main server file
│   │   ├── package.json        # Node dependencies
│   │   └── routes/             # API routes
│   ├── LandingPage/            # Landing page
│   ├── Login/                  # Login page
│   ├── SignUp/                 # Signup page
│   ├── ResumeForm/             # Resume submission
│   ├── Candidate_Dashboard/    # Candidate dashboard
│   └── Recruiter_Dashboard/    # Recruiter dashboard
├── README.md                   # This file
└── .gitignore                  # Git ignore rules
```

## Usage

1. **For Candidates:**
   - Register/Login to the platform
   - Fill out the resume form
   - View evaluation results in dashboard

2. **For Recruiters:**
   - Register/Login as recruiter
   - Access recruiter dashboard
   - View candidate evaluations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Testing

### API Testing
Use the Swagger UI at http://localhost:8000/docs for interactive API testing.

### Manual Testing
- Test all user flows: registration, login, resume submission, dashboard access
- Verify candidate evaluation accuracy
- Check responsive design on different devices



## Support

For support, email ihimanshukumar.hk@gmail.com or create an issue in this repository.

## Acknowledgments

- Built with FastAPI, Express.js, and Firebase
- Uses spaCy for NLP processing
- Sentence Transformers for semantic matching
