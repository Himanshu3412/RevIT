import spacy
import re
from collections import Counter
from fastapi import FastAPI, HTTPException
from typing import List
import json

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_md")  # Medium-sized model with word vectors
except:
    print("Installing spaCy model...")
    import os
    os.system("python -m spacy download en_core_web_md")
    nlp = spacy.load("en_core_web_md")

def calculate_job_match(job_requirements, projects):
    """
    Calculate how well a candidate's projects match job requirements.
    
    Args:
        job_requirements: list of skills required for the job
        projects: list of dictionaries containing project information
            Each project has 'name', 'description', and 'skills' keys
            
    Returns:
        overall_match_percentage: float representing the overall match percentage
        consolidated_report: dictionary with consolidated match information
    """
    # Normalize all skills (lowercase for case-insensitive comparison)
    job_requirements = [skill.lower().strip() for skill in job_requirements]
    
    # Create spaCy docs for job requirements for semantic matching
    job_req_docs = [nlp(req) for req in job_requirements]
    
    # Create a knowledge base of common skill synonyms and related terms
    skill_relationships = {
        "python": ["python programming", "py", "python3", "coding", "programming"],
        "machine learning": ["ml", "deep learning", "neural networks", "ai", "artificial intelligence", 
                           "predictive modeling", "predictive analytics", "neural network", "clustering",
                           "classification", "regression", "computer vision", "nlp", "natural language processing"],
        "data analysis": ["data analytics", "data mining", "statistical analysis", "data science", 
                        "data visualization", "data processing", "analytics", "statistics", "forecasting"],
        "sql": ["database", "mysql", "postgresql", "postgres", "sqlite", "nosql", "relational database"],
        "tensorflow": ["tf", "keras", "deep learning framework"],
        "javascript": ["js", "ecmascript", "node.js", "nodejs"],
        "react": ["reactjs", "react.js"],
        "java": ["j2ee", "spring", "hibernate"],
        "c#": ["csharp", ".net", "dotnet"],
        "docker": ["containerization", "kubernetes", "k8s"],
    }
    
    # Check for domain alignment - detect if the projects are in the same domain as the job
    job_domain = detect_domain(job_requirements)
    
    # Track match details for each project
    project_scores = []
    project_matches = []
    
    # Track skills across all projects
    all_demonstrated_skills = set()
    skill_demonstrated_in = {req: [] for req in job_requirements}
    skill_match_types = {req: set() for req in job_requirements}
    
    # Analyze each project
    for project in projects:
        project_skills = [skill.lower().strip() for skill in project['skills']]
        project_domain = detect_domain(project_skills + [project['name'].lower()])
        
        # 1. Direct skill matches
        direct_matches = set()
        for skill in project_skills:
            if skill in job_requirements:
                direct_matches.add(skill)
                skill_demonstrated_in[skill].append(project['name'])
                skill_match_types[skill].add("direct")
        
        # 2. Synonym matching using the knowledge base
        synonym_matches = set()
        for skill in project_skills:
            for req in job_requirements:
                # Check if skill is a synonym of a required skill
                if req in skill_relationships and skill in skill_relationships[req]:
                    synonym_matches.add(req)
                    skill_demonstrated_in[req].append(project['name'])
                    skill_match_types[req].add("synonym")
                # Check if required skill is a synonym of the candidate's skill
                elif skill in skill_relationships and req in skill_relationships[skill]:
                    synonym_matches.add(req)
                    skill_demonstrated_in[req].append(project['name'])
                    skill_match_types[req].add("synonym")
        
        # 3. Semantic similarity matching using spaCy word vectors
        semantic_matches = set()
        for skill_doc in [nlp(skill) for skill in project_skills]:
            for i, req_doc in enumerate(job_req_docs):
                # If similarity is above threshold, consider it a match
                if skill_doc.vector_norm and req_doc.vector_norm:  # Check if vectors exist
                    similarity = skill_doc.similarity(req_doc)
                    # Lower the threshold from 0.75 to 0.6 for more matches
                    if similarity > 0.6 and job_requirements[i] not in direct_matches and job_requirements[i] not in synonym_matches:
                        semantic_matches.add(job_requirements[i])
                        skill_demonstrated_in[job_requirements[i]].append(project['name'])
                        skill_match_types[job_requirements[i]].add("semantic")
        
        # 4. Extract implicit skills from project description
        implicit_matches = extract_implicit_skills(project['description'], job_requirements, job_req_docs, skill_relationships)
        for skill in implicit_matches:
            skill_demonstrated_in[skill].append(project['name'])
            skill_match_types[skill].add("implicit")
        
        # Combine all matched skills for this project
        project_matching_skills = direct_matches.union(synonym_matches).union(semantic_matches).union(implicit_matches)
        all_demonstrated_skills.update(project_matching_skills)
        
        # Calculate raw match percentage
        raw_match_percentage = (len(project_matching_skills) / len(job_requirements)) * 100 if job_requirements else 0
        
        # Apply domain alignment bonus (if project domain matches job domain)
        domain_bonus = 0
        domain_match = False
        if job_domain and project_domain and job_domain == project_domain:
            domain_match = True
            domain_bonus = min(20, 100 - raw_match_percentage)  # Up to 20% bonus, not exceeding 100%
        
        # Calculate final match percentage
        match_percentage = min(100, raw_match_percentage + domain_bonus)
        
        # Store project match information
        project_match = {
            'name': project['name'],
            'match_percentage': round(match_percentage, 2),
            'raw_percentage': round(raw_match_percentage, 2),
            'domain_match': domain_match,
            'domain_bonus': round(domain_bonus, 2),
            'matching_skills': list(project_matching_skills),
            'missing_skills': [skill for skill in job_requirements if skill not in project_matching_skills]
        }
        project_matches.append(project_match)
        project_scores.append(match_percentage)
    
    # Calculate overall match percentage using a weighted approach that favors best matches
    if project_scores:
        # 60% weight to the best project, 40% to the average of all projects
        best_match = max(project_scores)
        avg_match = sum(project_scores) / len(project_scores)
        overall_match_percentage = (0.6 * best_match) + (0.4 * avg_match)
    else:
        overall_match_percentage = 0
    
    # Create a consolidated skills report
    skills_report = []
    for req in job_requirements:
        if req in all_demonstrated_skills:
            match_type = ", ".join(skill_match_types[req])
            projects_with_skill = skill_demonstrated_in[req]
            skills_report.append({
                'skill': req,
                'demonstrated': True,
                'match_type': match_type,
                'projects': projects_with_skill
            })
        else:
            skills_report.append({
                'skill': req,
                'demonstrated': False,
                'match_type': "not found",
                'projects': []
            })
    
    # Create a consolidated report
    consolidated_report = {
        'overall_match': round(overall_match_percentage, 2),
        'skills_assessment': skills_report,
        'project_matches': sorted(project_matches, key=lambda x: x['match_percentage'], reverse=True),
        'missing_skills': [req for req in job_requirements if req not in all_demonstrated_skills],
        'job_domain': job_domain
    }
    
    return round(overall_match_percentage, 2), consolidated_report

def extract_implicit_skills(description, job_requirements, job_req_docs, skill_relationships):
    """
    Extract implicit skills from project descriptions.
    
    Uses NLP techniques to find indications of skills in the description
    that may not be explicitly listed in the skills section.
    """
    implicit_skills = set()
    
    # Process the description with spaCy
    description_doc = nlp(description.lower())
    
    # 1. Direct mention of skills in the description
    for req in job_requirements:
        if req in description_doc.text:
            implicit_skills.add(req)
        # Check for skill synonyms in the description
        if req in skill_relationships:
            for synonym in skill_relationships[req]:
                if synonym in description_doc.text:
                    implicit_skills.add(req)
    
    # 2. Check for phrases that indicate use of skills - more comprehensive patterns
    skill_indicators = [
        (r"(?:used|utilizing|with|using|implemented|built with|developed with|coded in|programmed in|created with)\s+(\w+[\s\w]*)", 1),
        (r"(\w+[\s\w]*)\s+(?:implementation|development|programming|database|framework|algorithm|model|technique)", 0),
        (r"(?:proficient in|experience with|knowledge of|expertise in|skilled in)\s+(\w+[\s\w]*)", 1),
        (r"(?:analysis|analytics|processing|mining|visualization|modeling)\s+(?:of|for|with)\s+(\w+[\s\w]*)", 1),
        (r"(?:developed|built|created|designed|implemented)\s+(?:a|an)\s+(\w+[\s\w]*)\s+(?:system|application|algorithm|model|tool)", 1)
    ]
    
    for pattern, group in skill_indicators:
        matches = re.finditer(pattern, description_doc.text)
        for match in matches:
            potential_skill = match.group(group).strip()
            # Check if this potential skill matches or is similar to any job requirement
            potential_skill_doc = nlp(potential_skill)
            
            # Direct check
            for i, req in enumerate(job_requirements):
                if req in potential_skill:
                    implicit_skills.add(req)
            
            # Semantic check
            for i, req_doc in enumerate(job_req_docs):
                # Lower threshold for implicit skills
                if potential_skill_doc.vector_norm and req_doc.vector_norm and potential_skill_doc.similarity(req_doc) > 0.55:
                    implicit_skills.add(job_requirements[i])
    
    # 3. Domain-specific keyword detection for popular skills
    ml_keywords = ["neural", "deep learning", "classifier", "regression", "training", "model", "prediction", 
                  "feature extraction", "clustering", "segmentation", "ai", "algorithm", "ml"]
    data_analysis_keywords = ["analytics", "statistical", "forecast", "visualization", "dashboard", "mining", 
                             "insight", "trends", "metrics", "reporting", "statistics"]
    database_keywords = ["query", "sql", "database", "schema", "table", "relational", "nosql", "db"]
    python_keywords = ["python", "script", "module", "package", "library", "pandas", "numpy", "scikit"]
    tensorflow_keywords = ["tf", "tensorflow", "keras", "neural network", "deep learning framework"]
    
    text = description_doc.text
    
    # Map keywords to skills
    keyword_to_skill = {
        "machine learning": ml_keywords,
        "data analysis": data_analysis_keywords,
        "sql": database_keywords,
        "python": python_keywords,
        "tensorflow": tensorflow_keywords
    }
    
    # Check for keywords
    for skill, keywords in keyword_to_skill.items():
        if skill in job_requirements:
            for keyword in keywords:
                if keyword in text:
                    implicit_skills.add(skill)
                    break
    
    return implicit_skills

def detect_domain(skills_list):
    """Detect the domain of skills or project title"""
    # Convert to lowercase strings
    skills_text = " ".join(skills_list).lower()
    
    # Define domain detection rules
    domains = {
        "machine learning": ["machine learning", "ml", "deep learning", "neural network", "ai", "artificial intelligence",
                           "model", "predictive", "classification", "clustering", "tensorflow", "keras"],
        "web development": ["web", "javascript", "html", "css", "react", "angular", "vue", "frontend", "backend",
                          "fullstack", "node", "express"],
        "data science": ["data science", "data analysis", "analytics", "visualization", "statistics", 
                        "dashboard", "bi", "business intelligence"],
        "devops": ["devops", "docker", "kubernetes", "k8s", "ci/cd", "pipeline", "jenkins", "aws", "cloud"],
        "mobile": ["mobile", "android", "ios", "swift", "flutter", "react native", "app"]
    }
    
    # Score each domain
    domain_scores = {}
    for domain, keywords in domains.items():
        score = sum(1 for keyword in keywords if keyword in skills_text)
        domain_scores[domain] = score
    
    # Return the domain with the highest score, if any
    max_domain = max(domain_scores.items(), key=lambda x: x[1])
    return max_domain[0] if max_domain[1] > 0 else None

# Create FastAPI app
app = FastAPI(
    title="Project Skills Matching API",
    description="API for matching job requirements with project skills"
)

@app.get("/match-projects")
async def get_project_match(job_skills: str, projects_json: str):
    """
    Get match percentage and key insights between job requirements and projects
    
    Args:
        job_skills: Comma-separated list of required skills
        projects_json: URL-encoded JSON string containing projects information
        
    Example URL:
    /match-projects?job_skills=python,machine learning,sql&projects_json={"projects":[{"name":"ML Project","description":"Built ML model","skills":["python","tensorflow"]}]}
    """
    try:
        # Parse job skills
        job_requirements = [skill.strip() for skill in job_skills.split(",") if skill.strip()]
        
        # Parse projects JSON
        try:
            projects_data = json.loads(projects_json)
            projects = projects_data.get("projects", [])
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid projects JSON format")
        
        if not job_requirements or not projects:
            raise HTTPException(status_code=400, detail="Both job skills and projects must be provided")
        
        # Calculate match
        overall_match, detailed_report = calculate_job_match(job_requirements, projects)
        
        # Generate human-readable report
        report = generate_project_match_report(overall_match, detailed_report)
        
        # Create simplified response with just score and report
        response = {
            "match_percentage": overall_match,
            "report": report
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_recommendation(match_percentage: float) -> str:
    """Generate a recommendation based on the match percentage"""
    if match_percentage >= 85:
        return "STRONG MATCH: Candidate has demonstrated most or all required skills. Recommended for immediate interview."
    elif match_percentage >= 70:
        return "GOOD MATCH: Candidate has demonstrated many required skills. Consider interviewing to assess depth of knowledge."
    elif match_percentage >= 50:
        return "PARTIAL MATCH: Candidate has demonstrated some required skills. Consider if missing skills can be learned."
    else:
        return "WEAK MATCH: Projects don't align well with required skills. Consider other candidates."

def generate_project_match_report(overall_match: float, report: dict) -> str:
    """
    Generate a detailed, human-readable report of how well a candidate's projects match job requirements.
    
    Args:
        overall_match: The overall match percentage
        report: The detailed report dictionary from calculate_job_match
        
    Returns:
        A comprehensive, human-readable report
    """
    import random
    
    # Define match strength
    if overall_match >= 85:
        match_strength = "excellent"
    elif overall_match >= 70:
        match_strength = "strong"
    elif overall_match >= 55:
        match_strength = "good"
    elif overall_match >= 40:
        match_strength = "moderate"
    else:
        match_strength = "limited"
    
    # Introduction variations
    intro_templates = [
        f"The candidate's project portfolio demonstrates a {match_strength} match ({overall_match}%) with the job requirements.",
        f"Analysis of the candidate's projects shows a {match_strength} skills alignment ({overall_match}%) with the position requirements.",
        f"The candidate's project experience indicates a {match_strength} fit ({overall_match}%) with the required job skills."
    ]
    
    # Get key metrics from the report
    demonstrated_skills = [skill for skill in report["skills_assessment"] if skill["demonstrated"]]
    missing_skills = report["missing_skills"]
    projects = report["project_matches"]
    job_domain = report["job_domain"] or "general technical"
    
    # Skills breakdown section
    skills_section = []
    
    if demonstrated_skills:
        skill_intros = [
            f"The candidate has demonstrated {len(demonstrated_skills)} of {len(report['skills_assessment'])} required skills across their projects:",
            f"The candidate's projects showcase {len(demonstrated_skills)} of the {len(report['skills_assessment'])} required skills:",
            f"From the {len(report['skills_assessment'])} required skills, the candidate has shown competency in {len(demonstrated_skills)}:"
        ]
        
        demonstrated_skills_list = []
        for skill in demonstrated_skills:
            skill_name = skill["skill"]
            projects_showing_skill = skill["projects"]
            match_type = skill["match_type"]
            
            if match_type == "direct":
                demonstrated_skills_list.append(f"{skill_name} (explicitly shown in {', '.join(projects_showing_skill)})")
            elif "implicit" in match_type:
                demonstrated_skills_list.append(f"{skill_name} (implicitly demonstrated in {', '.join(projects_showing_skill)})")
            else:
                demonstrated_skills_list.append(f"{skill_name} (shown in {', '.join(projects_showing_skill)})")
        
        skills_section.append(f"{random.choice(skill_intros)} {', '.join(demonstrated_skills_list)}.")
    
    if missing_skills:
        missing_intros = [
            f"The candidate's projects don't demonstrate {len(missing_skills)} required skills:",
            f"There are {len(missing_skills)} skills not evident in the candidate's project portfolio:",
            f"The following required skills are not demonstrated in the candidate's projects:"
        ]
        skills_section.append(f"{random.choice(missing_intros)} {', '.join(missing_skills)}.")
    
    # Project assessment section
    project_section = []
    
    if projects:
        best_project = projects[0]  # Projects are already sorted by match percentage
        
        best_project_intros = [
            f"The candidate's strongest project is '{best_project['name']}' with a {best_project['match_percentage']}% match to the job requirements.",
            f"'{best_project['name']}' is the most relevant project, matching {best_project['match_percentage']}% of job requirements.",
            f"Most aligned with the job is the '{best_project['name']}' project at {best_project['match_percentage']}% match."
        ]
        project_section.append(random.choice(best_project_intros))
        
        if len(projects) > 1:
            other_projects = []
            for i, project in enumerate(projects[1:3]):  # Limit to next 2 projects for brevity
                other_projects.append(f"'{project['name']}' ({project['match_percentage']}% match)")
            
            if other_projects:
                other_project_text = [
                    f"Other noteworthy projects include {' and '.join(other_projects)}.",
                    f"Additional relevant work includes {' and '.join(other_projects)}.",
                    f"The portfolio also contains {' and '.join(other_projects)}."
                ]
                project_section.append(random.choice(other_project_text))
    
    # Domain alignment section
    domain_section = []
    if job_domain:
        domain_intros = [
            f"The job appears to be in the {job_domain} domain.",
            f"This position is primarily focused on {job_domain}.",
            f"The required skills indicate this is a {job_domain} role."
        ]
        
        # Check if any projects align with the domain
        domain_aligned_projects = [p for p in projects if p.get("domain_match")]
        
        if domain_aligned_projects:
            domain_matches = [
                f"The candidate has {len(domain_aligned_projects)} projects in this domain, showing relevant experience.",
                f"{len(domain_aligned_projects)} of the candidate's projects align with the {job_domain} domain.",
                f"The candidate demonstrates domain-specific experience through {len(domain_aligned_projects)} {job_domain} projects."
            ]
            domain_section.append(f"{random.choice(domain_intros)} {random.choice(domain_matches)}")
        else:
            domain_mismatches = [
                f"None of the candidate's projects specifically target this domain.",
                f"The candidate's projects don't show specific experience in {job_domain}.",
                f"The candidate lacks portfolio evidence of {job_domain} experience."
            ]
            domain_section.append(f"{random.choice(domain_intros)} {random.choice(domain_mismatches)}")
    
    # Overall assessment based on match percentage
    if overall_match >= 85:
        assessment_options = [
            f"Overall, the candidate's project portfolio strongly demonstrates the skills required for this position. Their projects show practical experience with most or all of the key requirements, suggesting they could hit the ground running with minimal onboarding time for technical skills.",
            f"The candidate's project experience is exceptionally well-aligned with this role. Their hands-on work with the required technologies indicates they've already put these skills into practice, making them likely to be productive quickly.",
            f"This candidate's project work demonstrates excellent preparation for the role. With practical experience in nearly all required areas, they appear technically well-qualified and ready to contribute immediately."
        ]
    elif overall_match >= 70:
        assessment_options = [
            f"Overall, the candidate shows good alignment with job requirements through their project work. While there are some skill gaps, their strong areas cover many key requirements, suggesting good potential with some targeted training.",
            f"The candidate's project experience covers many of the required skills for this role. They would likely need minimal training on core technologies, though some complementary skills may require development.",
            f"This candidate demonstrates solid relevant experience through their projects. Their practical application of many required skills suggests they would require only moderate onboarding for certain technologies."
        ]
    elif overall_match >= 55:
        assessment_options = [
            f"The candidate's projects show moderate alignment with the position requirements. There are several skill matches but also significant gaps that would require substantial training or skill development.",
            f"While the candidate has project experience with some required technologies, their portfolio reveals important skill gaps. Consider whether training resources and time are available to develop these missing competencies.",
            f"This candidate demonstrates partial qualification through their project work. Some key skills are present, but others would need to be acquired, suggesting a longer onboarding period would be needed."
        ]
    else:
        assessment_options = [
            f"The candidate's projects show limited alignment with the position requirements. The significant skill gaps would require extensive training and development time.",
            f"Based on project experience, this candidate doesn't appear to have hands-on experience with many of the required technologies. Consider whether alternative candidates might be better prepared.",
            f"This candidate's project portfolio indicates minimal practical experience with the required skills. The substantial gap between their demonstrated abilities and job requirements suggests they may not be the best fit."
        ]
    
    # Combine all sections
    sections = [random.choice(intro_templates)]
    if skills_section:
        sections.append("\n\n" + "\n".join(skills_section))
    if project_section:
        sections.append("\n\n" + "\n".join(project_section))
    if domain_section:
        sections.append("\n\n" + "\n".join(domain_section))
    
    # Add final assessment
    sections.append(f"\n\nAssessment: {random.choice(assessment_options)}")
    
    return "".join(sections)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)





# uvicorn proj_check:app --reload
# http://localhost:8000/match-projects?job_skills=python,machine learning,sql&projects_json={"projects":[{"name":"ML Project","description":"Built ML model using Python and TensorFlow","skills":["python","tensorflow"]},{"name":"Data Analysis Project","description":"Analyzed customer data using SQL and Python","skills":["python","sql","data analysis"]}]}
