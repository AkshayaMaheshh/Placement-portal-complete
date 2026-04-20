import sys
import json
import spacy
import re

def extract_information(text):
    # Load the Large model for significantly better context awareness and accuracy
    try:
        nlp = spacy.load("en_core_web_lg")
    except OSError:
        # Fallback to small if large hasn't finished downloading yet
        nlp = spacy.load("en_core_web_sm")
        
    # An incredibly expansive rule-based dictionary of technical and soft skills
    predefined_skills = [
        "Java", "Spring", "Spring Boot", "React", "React.js", "Angular", "Vue.js", "NodeJS", "Node.js", "Python",
        "Machine Learning", "Deep Learning", "SQL", "PostgreSQL", "Docker", "AWS", "Azure", "GCP", "Kubernetes",
        "REST API", "GraphQL", "Data Structures", "Algorithms", "Git", "GitHub", "GitLab", "C++", "C", "C#", "JavaScript",
        "TypeScript", "HTML", "CSS", "SASS", "MongoDB", "MySQL", "Oracle", "Django", "Flask", "FastAPI",
        "System Design", "DSA", "Linux", "Unix", "Bash", "Shell Scripting", "Redis", "Kafka", "RabbitMQ",
        "Microservices", "Jenkins", "CI/CD", "Terraform", "Ansible", "Scrum", "Agile", "Jira", "Figma",
        "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "Cypress", "Selenium", "Jest", "JUnit",
        "Kotlin", "Swift", "Flutter", "Dart", "React Native", "Firebase", "Supabase", "Next.js", "Nuxt.js",
        "PHP", "Laravel", "Ruby", "Ruby on Rails", "Go", "Golang", "Rust", "Haskell", "Scala", "Spark",
        "Hadoop", "Tailwind CSS", "Bootstrap", "Material UI", "Redux", "Zustand", "Webpack", "Vite"
    ]
    
    # HIGHER ACCURACY STEP: Inject a custom Rule Engine directly into the brain (spaCy pipeline)
    # This replaces naive Regex with context-aware token matching.
    if "entity_ruler" not in nlp.pipe_names:
        ruler = nlp.add_pipe("entity_ruler", before="ner")
        patterns = [{"label": "SKILL", "pattern": [{"LOWER": word.lower()} for word in skill.split()]} for skill in predefined_skills]
        # Handle exact edge cases gracefully (like C++) by also adding exact string matches
        patterns += [{"label": "SKILL", "pattern": [{"TEXT": skill}]} for skill in predefined_skills if "+" in skill or "#" in skill or "." in skill]
        ruler.add_patterns(patterns)

    # Now we process the text with our newly smarter brain
    doc = nlp(text)
    
    skills_found = set()

    # Extract Entities using spaCy NER
    organizations = set()
    locations = set()
    
    for ent in doc.ents:
        cleaned_text = ent.text.strip().replace('\n', ' ')
        
        # If the brain detected it as one of our SKILLS, add it instantly!
        if ent.label_ == "SKILL":
            # Map back to standard casing if possible, or just keep as matched
            # Easiest way is to match against the predefined list based on lowercase
            matched = next((s for s in predefined_skills if s.lower() == cleaned_text.lower()), cleaned_text)
            skills_found.add(matched)
            continue
            
        if len(cleaned_text) < 3 or cleaned_text.isnumeric():
             continue
             
        if ent.label_ == "ORG":
            # Filter standard noise
            if not any(noise in cleaned_text.lower() for noise in ['www.', '.com', 'http', 'page']):
                organizations.add(cleaned_text)
        elif ent.label_ == "GPE" or ent.label_ == "LOC":
            locations.add(cleaned_text)

    # Intelligent Summary Extraction (Find 'Summary' or 'Profile' heading, else grab first chunk)
    summary_text = "No distinct summary paragraph located in the document structure."
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    for i, line in enumerate(lines):
        if line.lower() in ["summary", "profile", "objective", "about me", "professional summary", "about"]:
            if i + 1 < len(lines):
                # Grab the next non-empty chunk of text as summary
                summary_chunk = " ".join(lines[i+1 : i+5]) # limit roughly 4 lines
                if len(summary_chunk) > 30:
                    summary_text = summary_chunk[:500] + ("..." if len(summary_chunk) > 500 else "")
                break
                
    if summary_text.startswith("No distinct summary") and len(lines) > 0:
         # Fallback: Read the beginning of the resume (often contains the profile implicitly)
         fallback = " ".join(lines[:6])
         if len(fallback) > 50:
             summary_text = fallback[:400] + "..."
            
    # Compile results
    result = {
        "skills": list(skills_found),
        "organizations": list(organizations)[:8], 
        "locations": list(locations)[:8],
        "summary": summary_text
    }
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # read text from file to avoid command line limits
        file_path = sys.argv[1]
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            analysis = extract_information(text)
            print(json.dumps(analysis))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print(json.dumps({"error": "No file path provided"}))
