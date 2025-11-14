import pandas as pd
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Defining the FastAPI application
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loading the dataset
# Use the correct path to the Excel file
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, "QuestionDataset.xlsx")
df = pd.read_excel(file_path, engine="openpyxl")

@app.get("/generate_questionnaire/")
def generate_questionnaire():
    """
    Generates a questionnaire with 20 random questions from the entire dataset.
    :return: List of 20 MCQs in JSON format.
    """
    # Check if there are enough questions in the dataset
    if len(df) < 20:
        return {"error": "Not enough questions in the dataset."}
    
    # Randomly selecting 20 questions from the entire dataset
    selected_questions = df.sample(n=20, random_state=random.randint(1, 1000)).to_dict(orient="records")

    return {"questions": selected_questions}
