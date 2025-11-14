from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional, Union
from fastapi.middleware.cors import CORSMiddleware
import json
import random
import requests

# Import components from each API
from dc1 import compare_majors_list, generate_major_list_report
from degree_check import compare_degrees_list, generate_degrees_list_report
from proj_check import calculate_job_match, generate_project_match_report

# We'll use the project_check spaCy model for our combined API
from proj_check import nlp

app = FastAPI(
    title="Combined Job Applicant Evaluation API",
    description="API for comprehensive evaluation of job applicants based on degree, major, skills, and projects"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
class ProjectInfo(BaseModel):
    name: str
    description: str
    skills: List[str]

class CombinedRequest(BaseModel):
    job_title: str
    job_major: str  
    job_degree: str
    job_skills: List[str]
    candidate_majors: List[str]
    candidate_degrees: List[str]  # Changed from singular to plural
    candidate_skills: List[str]
    candidate_projects: List[ProjectInfo]

class ComponentScore(BaseModel):
    score: float
    component: str
    report: str

class CombinedResponse(BaseModel):
    overall_score: float
    major_score: float
    degree_score: float
    skills_score: float
    project_score: float
    component_reports: Dict[str, str]
    overall_report: str

def calculate_weighted_score(scores: Dict[str, float]) -> float:
    """
    Calculate weighted score based on component scores.
    
    Weights:
    - Degree: 15%
    - Major: 20%
    - Skills: 35% 
    - Projects: 30%
    """
    weights = {
        "degree": 0.15,
        "major": 0.20,
        "skills": 0.35,
        "projects": 0.30
    }
    
    weighted_score = 0
    for component, score in scores.items():
        weighted_score += score * weights[component]
    
    return round(weighted_score, 2)

def generate_combined_report(
    major_score: float, 
    degree_score: float,
    skills_score: float,
    project_score: float,
    overall_score: float,
    component_reports: Dict[str, str]
) -> str:
    """
    Generate a comprehensive, dynamic report combining insights from all components.
    """
    # Determine strength categories for the overall match
    if overall_score >= 85:
        match_strength = "exceptional"
    elif overall_score >= 75:
        match_strength = "strong"
    elif overall_score >= 65:
        match_strength = "good" 
    elif overall_score >= 55:
        match_strength = "moderate"
    elif overall_score >= 45:
        match_strength = "fair"
    else:
        match_strength = "limited"
    
    # Dynamic introduction templates
    intro_templates = [
        f"The candidate demonstrates an {match_strength} overall match of {overall_score}% based on combined assessment across education and experience.",
        f"With an overall score of {overall_score}%, the candidate shows {match_strength} alignment with the position requirements across multiple dimensions.",
        f"Comprehensive evaluation of the candidate yields a {match_strength} overall match ({overall_score}%) with the job requirements."
    ]
    
    # Component breakdown
    component_scores = {
        "degree": degree_score,
        "major": major_score,
        "skills": skills_score,
        "projects": project_score
    }
    
    # Sort components by score for highlighting strengths and weaknesses
    sorted_components = sorted(component_scores.items(), key=lambda x: x[1], reverse=True)
    strongest_component = sorted_components[0]
    weakest_component = sorted_components[-1]
    
    # Create component breakdown section
    component_breakdown = []
    score_descriptions = {
        "degree": "educational qualification level",
        "major": "field of study alignment",
        "skills": "required skills match",
        "projects": "practical experience"
    }
    
    component_section_intros = [
        "The candidate's scores across different evaluation dimensions are as follows:",
        "Breaking down the evaluation by component reveals:",
        "The candidate's profile can be analyzed across these dimensions:"
    ]
    
    component_list = [f"{component.capitalize()} Match: {score}% ({score_descriptions[component]})" 
                     for component, score in sorted_components]
    
    component_breakdown.append(f"{random.choice(component_section_intros)}")
    component_breakdown.append(", ".join(component_list))
    
    # Highlight key strengths and areas of concern
    strength_templates = [
        f"The candidate's greatest strength is their {score_descriptions[strongest_component[0]]} with a score of {strongest_component[1]}%.",
        f"Most notable is the candidate's {strongest_component[1]}% score in {score_descriptions[strongest_component[0]]}.",
        f"The candidate particularly excels in {score_descriptions[strongest_component[0]]} ({strongest_component[1]}%)."
    ]
    
    concern_templates = []
    if weakest_component[1] < 60:
        concern_templates = [
            f"The candidate's {score_descriptions[weakest_component[0]]} is notably weaker at {weakest_component[1]}%, which may require attention.",
            f"An area of potential concern is the candidate's {score_descriptions[weakest_component[0]]} score of {weakest_component[1]}%.",
            f"The evaluation indicates that the candidate's {score_descriptions[weakest_component[0]]} ({weakest_component[1]}%) may need supplementary assessment."
        ]
    
    # Generate detailed analysis based on the overall score
    if overall_score >= 85:
        detailed_analysis = random.choice([
            "Overall, the candidate presents an exceptional match for this position across multiple dimensions. Their combination of education, field of study, skills, and practical experience indicates they are likely to excel in this role with minimal onboarding time.",
            "The comprehensive evaluation shows this candidate is exceptionally well-suited to the position requirements. Their strong performance across all evaluation criteria suggests they would be able to contribute effectively from day one.",
            "This candidate demonstrates remarkable alignment with the position requirements. Their balanced strengths across education and experience dimensions indicate they would be a valuable addition to the team."
        ])
    elif overall_score >= 75:
        detailed_analysis = random.choice([
            "Overall, the candidate presents a strong match for this position with notable strengths in multiple areas. While some aspects may benefit from development, their overall profile suggests they would perform well in this role.",
            "The comprehensive evaluation indicates this candidate is well-suited to the position. Their profile shows strong alignment in key areas, suggesting they would require only minimal additional training or support.",
            "This candidate demonstrates solid alignment with the position requirements. Their combination of education and experience provides a strong foundation for success in this role."
        ])
    elif overall_score >= 65:
        detailed_analysis = random.choice([
            "Overall, the candidate presents a good match for this position with particular strengths in some areas. Some aspects of their profile may require development, but their foundation appears suitable for the role.",
            "The comprehensive evaluation shows this candidate has good potential for the position. While not exceptional in all areas, their balanced profile suggests they could succeed with appropriate onboarding and support.",
            "This candidate demonstrates good alignment with several key position requirements. With targeted development in specific areas, they could become a strong contributor."
        ])
    elif overall_score >= 55:
        detailed_analysis = random.choice([
            "Overall, the candidate presents a moderate match for this position with mixed strengths and weaknesses. Significant development would be needed in some areas, but there is potential for growth.",
            "The comprehensive evaluation indicates this candidate has moderate alignment with the position. Consider whether resources are available for substantial training and development to address gaps.",
            "This candidate demonstrates reasonable alignment in some areas but notable gaps in others. Success in this role would depend on their ability to quickly develop in weaker areas."
        ])
    else:
        detailed_analysis = random.choice([
            "Overall, the candidate presents a limited match for this position. Their profile shows significant gaps relative to the requirements that would require extensive development.",
            "The comprehensive evaluation indicates this candidate may not be well-aligned with the position requirements. Consider whether alternative candidates might be better prepared.",
            "This candidate demonstrates limited alignment with key position requirements. The substantial gap between their profile and the job requirements suggests they may not be the best fit."
        ])
    
    # Construct the final report
    sections = [random.choice(intro_templates)]
    sections.append("\n\n" + "\n".join(component_breakdown))
    sections.append("\n\n" + random.choice(strength_templates))
    
    if concern_templates:
        sections.append(" " + random.choice(concern_templates))
    
    sections.append("\n\n" + detailed_analysis)
    
    # Add recommendation based on score
    if overall_score >= 80:
        recommendation = "RECOMMENDATION: This candidate is strongly recommended for interview based on their comprehensive evaluation."
    elif overall_score >= 70:
        recommendation = "RECOMMENDATION: This candidate is recommended for interview to further assess their fit and capabilities."
    elif overall_score >= 60:
        recommendation = "RECOMMENDATION: Consider interviewing this candidate if stronger alternatives are not available, with focus on addressing identified gaps."
    else:
        recommendation = "RECOMMENDATION: This candidate may not be the best fit based on their comprehensive evaluation. Consider alternative candidates."
    
    sections.append("\n\n" + recommendation)
    
    return "".join(sections)

@app.post("/evaluate-candidate")
async def evaluate_candidate(request: CombinedRequest):
    """
    Comprehensively evaluate a candidate against job requirements
    """
    try:
        # Print the request data to console
        print("\n----- NEW REQUEST TO /evaluate-candidate -----")
        print(f"Job Title: {request.job_title}")
        print(f"Job Major: {request.job_major}")
        print(f"Job Degree: {request.job_degree}")
        print(f"Job Skills: {', '.join(request.job_skills)}")
        print(f"Candidate Majors: {', '.join(request.candidate_majors)}")
        print(f"Candidate Degrees: {', '.join(request.candidate_degrees)}")
        print(f"Candidate Skills: {', '.join(request.candidate_skills)}")
        print(f"Number of Projects: {len(request.candidate_projects)}")
        print("------------------------------------------\n")
        
        # 1. Calculate Major Similarity (using the list version)
        majors_result = compare_majors_list(request.job_major, request.candidate_majors)
        major_score = round(float(majors_result["similarity"]) * 100, 2)
        major_report = generate_major_list_report(request.job_major, majors_result)
        
        # 2. Calculate Degree Similarity (now using the list version)
        degrees_result = compare_degrees_list(request.job_degree, request.candidate_degrees)
        degree_score = degrees_result["similarity"]
        degree_report = generate_degrees_list_report(request.job_degree, degrees_result)
        
        # 3. Calculate Skills Match
        # For simplicity, we'll use a basic skills matching that checks direct matches and partial matches
        # This is a simplified version since we don't have the full ESCO skills matching system
        direct_matches = sum(1 for s in request.candidate_skills if s.lower() in [js.lower() for js in request.job_skills])
        partial_matches = 0
        
        for job_skill in request.job_skills:
            job_skill_doc = nlp(job_skill.lower())
            if not any(cs.lower() == job_skill.lower() for cs in request.candidate_skills):
                # Check for partial matches using similarity
                best_similarity = 0
                for candidate_skill in request.candidate_skills:
                    candidate_skill_doc = nlp(candidate_skill.lower())
                    if job_skill_doc.vector_norm and candidate_skill_doc.vector_norm:
                        similarity = job_skill_doc.similarity(candidate_skill_doc)
                        best_similarity = max(best_similarity, similarity)
                
                if best_similarity >= 0.7:
                    partial_matches += best_similarity
        
        skills_score = ((direct_matches + (0.7 * partial_matches)) / len(request.job_skills)) * 100 if request.job_skills else 0
        skills_score = round(min(100, skills_score), 2)  # Cap at 100%
        
        # Generate a simplified skills report
        matched_skills = [s for s in request.candidate_skills if s.lower() in [js.lower() for js in request.job_skills]]
        missing_skills = [s for s in request.job_skills if not any(cs.lower() == s.lower() for cs in request.candidate_skills)]
        
        skills_match_templates = [
            f"The candidate demonstrates {direct_matches} of {len(request.job_skills)} required skills directly, with approximately {round(partial_matches, 1)} additional skills showing partial or related matches.",
            f"Analysis shows the candidate possesses {direct_matches} skills that directly match job requirements, plus {round(partial_matches, 1)} related or similar skills.",
            f"The candidate's skills profile includes {direct_matches} exact matches to job requirements and {round(partial_matches, 1)} related skills."
        ]
        
        if matched_skills:
            matched_skills_text = f"Matched skills include: {', '.join(matched_skills[:5])}"
            if len(matched_skills) > 5:
                matched_skills_text += f" and {len(matched_skills) - 5} more"
        else:
            matched_skills_text = "No direct skill matches were found."
            
        if missing_skills:
            missing_skills_text = f"Skills not found in the candidate's profile: {', '.join(missing_skills[:5])}"
            if len(missing_skills) > 5:
                missing_skills_text += f" and {len(missing_skills) - 5} more"
        else:
            missing_skills_text = "The candidate's profile covers all required skills."
        
        skills_report = f"{random.choice(skills_match_templates)}\n\n{matched_skills_text}\n\n{missing_skills_text}"
        
        # 4. Calculate Project Match
        projects = []
        for project in request.candidate_projects:
            projects.append({
                "name": project.name,
                "description": project.description,
                "skills": project.skills
            })
        
        project_score, project_details = calculate_job_match(request.job_skills, projects)
        project_report = generate_project_match_report(project_score, project_details)
        
        # 5. Calculate Combined Score with Weights
        component_scores = {
            "degree": degree_score,
            "major": major_score,
            "skills": skills_score,
            "projects": project_score
        }
        
        overall_score = calculate_weighted_score(component_scores)
        
        # 6. Generate Combined Report
        component_reports = {
            "degree": degree_report,
            "major": major_report,
            "skills": skills_report,
            "projects": project_report
        }
        
        combined_report = generate_combined_report(
            major_score, 
            degree_score, 
            skills_score, 
            project_score, 
            overall_score,
            component_reports
        )
        
        # 7. Create Response
        response = {
            "overall_score": overall_score,
            "major_score": major_score,
            "degree_score": degree_score,
            "skills_score": skills_score,
            "project_score": project_score,
            "component_reports": component_reports,
            "overall_report": combined_report
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/simple-evaluation")
async def simple_evaluation(
    job_major: str = Query(..., description="Required major for the job"),
    job_degree: str = Query(..., description="Required degree for the job (e.g., BSc, MSc, PhD)"),
    job_skills: str = Query(..., description="Comma-separated list of required skills"),
    candidate_majors: str = Query(..., description="Comma-separated list of candidate's majors"),
    candidate_degrees: str = Query(..., description="Comma-separated list of candidate's degrees"),  # Changed from singular to plural
    candidate_skills: str = Query(..., description="Comma-separated list of candidate's skills"),
    projects_json: str = Query(..., description="JSON string of candidate's projects")
):
    """
    Simplified version of candidate evaluation using GET parameters
    """
    try:
        # Print the request data to console
        print("\n----- NEW REQUEST TO /simple-evaluation -----")
        print(f"Job Major: {job_major}")
        print(f"Job Degree: {job_degree}")
        print(f"Job Skills: {job_skills}")
        print(f"Candidate Majors: {candidate_majors}")
        print(f"Candidate Degrees: {candidate_degrees}")
        print(f"Candidate Skills: {candidate_skills}")
        print(f"Projects JSON: {projects_json}")
        print("------------------------------------------\n")
        
        # Parse skills, majors, and degrees
        job_skills_list = [skill.strip() for skill in job_skills.split(",") if skill.strip()]
        candidate_skills_list = [skill.strip() for skill in candidate_skills.split(",") if skill.strip()]
        candidate_majors_list = [major.strip() for major in candidate_majors.split(",") if major.strip()]
        candidate_degrees_list = [degree.strip() for degree in candidate_degrees.split(",") if degree.strip()]  # Parse degrees list
        
        # Parse projects
        try:
            projects_data = json.loads(projects_json)
            projects = projects_data.get("projects", [])
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid projects JSON format")
        
        # Create a full request object
        request = CombinedRequest(
            job_title="Not Specified",
            job_major=job_major,
            job_degree=job_degree,
            job_skills=job_skills_list,
            candidate_majors=candidate_majors_list,
            candidate_degrees=candidate_degrees_list,  # Use the list of degrees
            candidate_skills=candidate_skills_list,
            candidate_projects=[
                ProjectInfo(
                    name=project.get("name", "Unnamed Project"),
                    description=project.get("description", ""),
                    skills=project.get("skills", [])
                )
                for project in projects
            ]
        )
        
        # Use the full evaluation endpoint
        return await evaluate_candidate(request)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Sample usage:
# uvicorn combined_check:app --reload
# POST to /evaluate-candidate with a JSON body
# GET /simple-evaluation?job_major=Computer%20Science&job_degree=BSc&job_skills=python,machine%20learning,sql&candidate_majors=Software%20Engineering,IT,Data%20Science&candidate_degrees=MSc,BSc&candidate_skills=python,data%20analysis&projects_json={"projects":[{"name":"ML%20Project","description":"Built%20ML%20model%20using%20Python","skills":["python","tensorflow"]}]} 
