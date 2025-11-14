import requests
import numpy as np
from typing import List, Dict, Set
import os
import json
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

class ESCOSkillsMatchingSystem:
    def __init__(self, use_cache=True):
        """
        Initialize the skills matching system with ESCO integration
        
        Args:
            use_cache: Whether to cache ESCO API responses
        """
        self.use_cache = use_cache
        self.cache_dir = "esco_cache"
        self.esco_base_url = "https://esco.ec.europa.eu/api"  # Updated API URL
        
        # Create cache directory if it doesn't exist
        if self.use_cache and not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
        
        # Load sentence transformer model for semantic similarity
        self.model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
        
        # Dictionary of common abbreviations and their full forms
        self.abbreviations = {
            "ai": "artificial intelligence",
            "ml": "machine learning",
            "dl": "deep learning",
            "nlp": "natural language processing",
            "cv": "computer vision",
            "tf": "tensorflow",
            "pt": "pytorch",
            "js": "javascript",
            "ts": "typescript",
            "py": "python",
            "react": "reactjs",
            "vue": "vuejs",
            "ng": "angular",
            "node": "node.js",
            "nodejs": "node.js",
            "expressjs": "express.js",
            "k8s": "kubernetes",
            "aws": "amazon web services",
            "gcp": "google cloud platform",
            "ui": "user interface",
            "ux": "user experience",
            "api": "application programming interface",
            "rest": "representational state transfer",
            "restful": "representational state transfer",
            "db": "database",
            "sql": "structured query language",
            "nosql": "not only sql",
            "oop": "object oriented programming",
            "devops": "development operations",
            "sre": "site reliability engineering",
            "cicd": "ci/cd",
            "ci/cd": "continuous integration and continuous deployment",
            "llm": "large language model",
            "ds": "data science",
            "da": "data analysis",
            "dnn": "deep neural network",
            "cnn": "convolutional neural network",
            "rnn": "recurrent neural network",
            "gan": "generative adversarial network",
            "bert": "bidirectional encoder representations from transformers",
            "gpt": "generative pre-trained transformer",
            "qa": "quality assurance",
            "fe": "frontend",
            "be": "backend",
            "fs": "fullstack",
            "html": "hypertext markup language",
            "css": "cascading style sheets",
            "seo": "search engine optimization",
            "saas": "software as a service",
            "paas": "platform as a service",
            "iaas": "infrastructure as a service",
            "vcs": "version control system",
            "iot": "internet of things",
            # Additional abbreviations to add to the existing dictionary
            # Programming Languages
            "cpp": "c++",
            "cs": "c#",
            "rb": "ruby",
            "go": "golang",
            "ts": "typescript",
            "php": "php hypertext preprocessor",
            "rust": "rust programming language",
            "scala": "scala programming language",
            "swift": "swift programming language",
            "kotlin": "kotlin programming language",
            "dart": "dart programming language",
            "perl": "perl programming language",
            "r": "r programming language",
            "vba": "visual basic for applications",
            "asm": "assembly language",
            # Frameworks & Libraries
            "vue": "vuejs",
            "ng": "angular",
            "rn": "react native",
            "rxjs": "reactive extensions for javascript",
            "tf": "tensorflow",
            "pt": "pytorch",
            "jq": "jquery",
            "d3": "data-driven documents",
            "wp": "wordpress",
            "dj": "django",
            "ror": "ruby on rails",
            "ef": "entity framework",
            "mvc": "model view controller",
            "mvvm": "model view viewmodel",
            "wpf": "windows presentation foundation",
            "svelte": "svelte framework",
            "bs": "bootstrap",
            "spring": "spring framework",
            "laravel": "laravel framework",
            "sails": "sails.js",
            "nuxt": "nuxt.js",
            "next": "next.js",
            "nest": "nest.js",
            "fastapi": "fastapi framework",
            "flask": "flask framework",
            "pandas": "pandas library",
            "sklearn": "scikit-learn",
            "npm": "node package manager",
            "nx": "nx monorepo",
            "nx workspace": "nx monorepo",
            # Cloud & DevOps
            "aws": "amazon web services",
            "ec2": "elastic compute cloud",
            "s3": "simple storage service",
            "gcp": "google cloud platform",
            "gke": "google kubernetes engine",
            "aks": "azure kubernetes service",
            "eks": "elastic kubernetes service",
            "az": "microsoft azure",
            "do": "digital ocean",
            "k8s": "kubernetes",
            "iaas": "infrastructure as a service",
            "paas": "platform as a service",
            "saas": "software as a service",
            "faas": "function as a service",
            "caas": "container as a service",
            "daas": "database as a service",
            "iac": "infrastructure as code",
            "cicd": "continuous integration and continuous deployment",
            "ci": "continuous integration",
            "cd": "continuous deployment",
            "vcs": "version control system",
            "scm": "source code management",
            "git": "git version control",
            "gh": "github",
            "gl": "gitlab",
            "bb": "bitbucket",
            "tf": "terraform",
            "cf": "cloudformation",
            "chef": "chef automation",
            "puppet": "puppet automation",
            "ansible": "ansible automation",
            "sre": "site reliability engineering",
            "ssm": "aws systems manager",
            "ecs": "elastic container service",
            "fargate": "aws fargate",
            "lambda": "aws lambda",
            "dyn": "aws dynamodb",
            "rds": "relational database service",
            "vpn": "virtual private network",
            "vpc": "virtual private cloud",
            "cdn": "content delivery network",
            "waf": "web application firewall",
            "alb": "application load balancer",
            "elb": "elastic load balancer",
            "nlb": "network load balancer",
            "nat": "network address translation",
            "asg": "auto scaling group",
            # Data & Database
            "db": "database",
            "rdbms": "relational database management system",
            "nosql": "not only sql",
            "sql": "structured query language",
            "psql": "postgresql",
            "pg": "postgresql",
            "mysql": "mysql database",
            "mssql": "microsoft sql server",
            "oracle": "oracle database",
            "mongo": "mongodb",
            "dynamo": "dynamodb",
            "redis": "redis database",
            "elastic": "elasticsearch",
            "cassan": "cassandra database",
            "neo4j": "neo4j graph database",
            "couchdb": "apache couchdb",
            "dw": "data warehouse",
            "dwh": "data warehouse",
            "olap": "online analytical processing",
            "oltp": "online transaction processing",
            "etl": "extract transform load",
            "elt": "extract load transform",
            "bi": "business intelligence",
            "ds": "data science",
            "da": "data analytics",
            "de": "data engineering",
            "dba": "database administrator",
            "dbt": "data build tool",
            "orm": "object-relational mapping",
            # Web & Frontend
            "html": "hypertext markup language",
            "css": "cascading style sheets",
            "sass": "syntactically awesome style sheets",
            "scss": "sassy css",
            "less": "leaner style sheets",
            "dom": "document object model",
            "bom": "browser object model",
            "api": "application programming interface",
            "rest": "representational state transfer",
            "soap": "simple object access protocol",
            "graphql": "graph query language",
            "grpc": "google remote procedure call",
            "ajax": "asynchronous javascript and xml",
            "json": "javascript object notation",
            "xml": "extensible markup language",
            "yaml": "yaml ain't markup language",
            "toml": "tom's obvious minimal language",
            "jwt": "json web token",
            "oauth": "open authorization",
            "oidc": "openid connect",
            "saml": "security assertion markup language",
            "spa": "single page application",
            "pwa": "progressive web application",
            "seo": "search engine optimization",
            "ssr": "server-side rendering",
            "csr": "client-side rendering",
            "ui": "user interface",
            "ux": "user experience",
            # AI & Machine Learning
            "ai": "artificial intelligence",
            "ml": "machine learning",
            "dl": "deep learning",
            "nn": "neural network",
            "cnn": "convolutional neural network",
            "rnn": "recurrent neural network",
            "lstm": "long short-term memory",
            "gru": "gated recurrent unit",
            "gan": "generative adversarial network",
            "nlp": "natural language processing",
            "nlu": "natural language understanding",
            "nlg": "natural language generation",
            "cv": "computer vision",
            "ocr": "optical character recognition",
            "rl": "reinforcement learning",
            "ann": "artificial neural network",
            "svm": "support vector machine",
            "knn": "k-nearest neighbors",
            "rf": "random forest",
            "gb": "gradient boosting",
            "xgb": "xgboost",
            "lgbm": "lightgbm",
            "catb": "catboost",
            "glm": "generalized linear model",
            "pca": "principal component analysis",
            "tfidf": "term frequency-inverse document frequency",
            "w2v": "word2vec",
            "bert": "bidirectional encoder representations from transformers",
            "gpt": "generative pre-trained transformer",
            "llm": "large language model",
            "genai": "generative ai",
            "rag": "retrieval-augmented generation",
            "mlops": "machine learning operations",
            "mle": "machine learning engineer",
            "ds": "data science",
            "da": "data analysis",
            "t5": "text-to-text transfer transformer",
            "vae": "variational autoencoder",
            "ae": "autoencoder",
            # Mobile Development
            "ios": "iphone operating system",
            "andrd": "android",
            "rn": "react native",
            "xcod": "xcode",
            "anst": "android studio",
            "ar": "augmented reality",
            "vr": "virtual reality",
            "mr": "mixed reality",
            "xr": "extended reality",
            # Testing & Quality Assurance
            "qa": "quality assurance",
            "qe": "quality engineering",
            "tdd": "test driven development",
            "bdd": "behavior driven development",
            "e2e": "end to end testing",
            "ut": "unit testing",
            "it": "integration testing",
            "st": "system testing",
            "pt": "performance testing",
            "ct": "contract testing",
            "sdet": "software development engineer in test",
            "stlc": "software testing life cycle",
            "sdlc": "software development life cycle",
            # Project Management & Methodologies
            "agile": "agile methodology",
            "scrum": "scrum methodology",
            "kanban": "kanban methodology",
            "pm": "project management",
            "po": "product owner",
            "sm": "scrum master",
            "pmp": "project management professional",
            "wbs": "work breakdown structure",
            "lean": "lean methodology",
            "xp": "extreme programming",
            "ddd": "domain driven design",
            "bpm": "business process management",
            "jira": "jira software",
            "wf": "waterfall methodology",
            # Cybersecurity & Networking
            "sec": "security",
            "infosec": "information security",
            "netsec": "network security",
            "appsec": "application security",
            "devsecops": "development security operations",
            "pentest": "penetration testing",
            "soc": "security operations center",
            "siem": "security information and event management",
            "dlp": "data loss prevention",
            "ids": "intrusion detection system",
            "ips": "intrusion prevention system",
            "iam": "identity and access management",
            "mfa": "multi-factor authentication",
            "2fa": "two-factor authentication",
            "pki": "public key infrastructure",
            "ssl": "secure sockets layer",
            "tls": "transport layer security",
            "vpn": "virtual private network",
            "dns": "domain name system",
            "ip": "internet protocol",
            "tcp": "transmission control protocol",
            "udp": "user datagram protocol",
            "http": "hypertext transfer protocol",
            "https": "hypertext transfer protocol secure",
            "ftp": "file transfer protocol",
            "sftp": "secure file transfer protocol",
            "ssh": "secure shell",
            "dhcp": "dynamic host configuration protocol",
            "nat": "network address translation",
            "lan": "local area network",
            "wan": "wide area network",
            "cdn": "content delivery network",
            "bgp": "border gateway protocol",
            "ospf": "open shortest path first",
            "osi": "open systems interconnection",
            # Big Data & Analytics
            "bd": "big data",
            "hdfs": "hadoop distributed file system",
            "hive": "apache hive",
            "hbase": "hadoop database",
            "spark": "apache spark",
            "flink": "apache flink",
            "kafka": "apache kafka",
            "kinesis": "aws kinesis",
            "emr": "elastic mapreduce",
            "redshift": "amazon redshift",
            "bq": "bigquery",
            "snowflake": "snowflake data warehouse",
            "airflow": "apache airflow",
            "nifi": "apache nifi",
            "dbt": "data build tool",
            "dvc": "data version control",
            # Blockchain & Web3
            "bc": "blockchain",
            "eth": "ethereum",
            "btc": "bitcoin",
            "sol": "solidity",
            "nft": "non-fungible token",
            "dao": "decentralized autonomous organization",
            "defi": "decentralized finance",
            "dapp": "decentralized application",
            "evm": "ethereum virtual machine",
            "web3": "web 3.0",
            # Game Development
            "ue": "unreal engine",
            "unity": "unity engine",
            "godot": "godot engine",
            "gd": "game development",
            "gamedev": "game development",
            # Operating Systems & System Administration
            "os": "operating system",
            "linux": "linux operating system",
            "unix": "unix operating system",
            "win": "windows operating system",
            "macos": "mac operating system",
            "bash": "bourne again shell",
            "ps": "powershell",
            "cmd": "command prompt",
            "vm": "virtual machine",
            "dc": "data center",
            "virt": "virtualization",
            "kvm": "kernel-based virtual machine",
            "esxi": "vmware esxi",
            "hyper-v": "microsoft hyper-v",
            "docker": "docker containerization",
            "podman": "podman containerization",
            "sysprep": "system preparation",
            "ad": "active directory",
            "ldap": "lightweight directory access protocol",
            "dhcp": "dynamic host configuration protocol",
            "dns": "domain name system",
            # Hardware & IoT
            "iot": "internet of things",
            "hw": "hardware",
            "mcu": "microcontroller unit",
            "soc": "system on chip",
            "fpga": "field-programmable gate array",
            "gpio": "general-purpose input/output",
            "i2c": "inter-integrated circuit",
            "spi": "serial peripheral interface",
            "uart": "universal asynchronous receiver-transmitter",
            "can": "controller area network",
            "ble": "bluetooth low energy",
            "esp": "espressif systems",
            "rpi": "raspberry pi",
            # General Technical
            "poc": "proof of concept",
            "mvp": "minimum viable product",
            "sdk": "software development kit",
            "ide": "integrated development environment",
            "ui": "user interface",
            "ux": "user experience",
            "dx": "developer experience",
            "crud": "create read update delete",
            "cwe": "common weakness enumeration",
            "cve": "common vulnerabilities and exposures",
            "api": "application programming interface",
            "gui": "graphical user interface",
            "cli": "command line interface",
            "tui": "text-based user interface",
            "vcs": "version control system",
            "sla": "service level agreement",
            "slo": "service level objective",
            "sli": "service level indicator",
            "roi": "return on investment",
            "lms": "learning management system",
            "crm": "customer relationship management",
            "erp": "enterprise resource planning",
            "itsm": "it service management"
        }

        # Knowledge base of broader skill categories and their related skills
        self.skill_categories = {
            "web development": [
                "html", "css", "javascript", "js", "typescript", "react", "angular", 
                "vue", "jquery", "bootstrap", "sass", "less", "webpack", "frontend", 
                "backend", "fullstack", "responsive design", "spa", "pwa", "web design",
                "dom", "ajax", "restful api", "node.js", "express.js", "nextjs"
            ],
            "ai": [
                "artificial intelligence", "machine learning", "deep learning", "neural networks",
                "nlp", "natural language processing", "computer vision", "reinforcement learning",
                "tensorflow", "pytorch", "keras", "scikit-learn", "transformers", "llm"
            ],
            "data science": [
                "data analysis", "big data", "data mining", "data visualization", "statistics",
                "python", "r", "pandas", "numpy", "scipy", "matplotlib", "tableau", "power bi",
                "sql", "database", "etl", "data warehouse", "predictive modeling", "regression",
                "classification", "clustering", "time series", "hypothesis testing"
            ],
            "backend development": [
                "node.js", "express", "django", "flask", "fastapi", "php", "laravel", 
                "ruby on rails", "spring boot", "java", "c#", ".net", "api", "rest", "graphql",
                "database", "mysql", "postgresql", "mongodb", "redis", "orm", "microservices"
            ],
            "devops": [
                "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins",
                "gitlab ci", "github actions", "ci/cd", "infrastructure as code", "monitoring",
                "logging", "linux", "bash", "shell", "cloud computing", "networking", "security"
            ],
            "mobile development": [
                "android", "ios", "swift", "kotlin", "react native", "flutter", "xamarin",
                "mobile ui", "responsive design", "app development", "mobile app", "hybrid app"
            ],
            "cloud computing": [
                "aws", "amazon web services", "azure", "google cloud platform", "gcp",
                "lambda", "ec2", "s3", "kubernetes", "serverless", "cloud formation",
                "terraform", "cloud storage", "cloud security", "multi-cloud",
                "load balancing", "auto-scaling", "cloud migration", "cloudwatch"
            ],
            "cybersecurity": [
                "network security", "ethical hacking", "penetration testing", "siem",
                "soc", "firewalls", "vpn", "encryption", "ssl/tls", "owasp",
                "vulnerability assessment", "incident response", "iso 27001", "pci dss",
                "zero trust", "iam", "saml", "oauth", "jwt", "waf"
            ],
            "testing/qa": [
                "unit testing", "integration testing", "test automation", "selenium",
                "cypress", "jest", "junit", "pytest", "load testing", "jmeter",
                "postman", "soapui", "tdd", "bdd", "testrail", "qa processes",
                "regression testing", "ci/cd pipelines", "performance testing"
            ],
            "frontend development": [
                "react", "angular", "vue", "svelte", "redux", "mobx",
                "web components", "accessibility", "wcag", "responsive design",
                "cross-browser compatibility", "web performance", "lighthouse",
                "graphql", "apollo", "webassembly", "progressive enhancement"
            ],
            "database": [
                "sql", "nosql", "mysql", "postgresql", "mongodb", "redis",
                "cassandra", "dynamodb", "database design", "orm", "prisma",
                "sqlalchemy", "indexing", "query optimization", "acid",
                "transactions", "replication", "sharding", "data modeling"
            ],
            "networking": [
                "tcp/ip", "dns", "http/https", "rest", "grpc", "websockets",
                "cdn", "vpc", "subnets", "routing", "load balancers", "api gateway",
                "network security", "ssh", "ssl termination", "packet analysis",
                "wireshark", "osi model", "latency optimization"
            ],
            "ui/ux design": [
                "figma", "sketch", "adobe xd", "user research", "wireframing",
                "prototyping", "design systems", "material design", "usability testing",
                "interaction design", "user flows", "information architecture",
                "responsive design", "mobile-first design", "a/b testing", "heuristic evaluation"
            ],
            "blockchain/web3": [
                "solidity", "smart contracts", "ethereum", "hyperledger", "nft",
                "defi", "web3.js", "ether.js", "truffle", "hardhat", "ipfs",
                "consensus algorithms", "tokenomics", "dapp development", "daos",
                "cryptography", "zero-knowledge proofs", "layer 2 solutions"
            ],
            "devops/sre": [
                "observability", "prometheus", "grafana", "elk stack", "splunk",
                "chaos engineering", "disaster recovery", "incident management",
                "service level objectives", "error budgets", "capacity planning",
                "cost optimization", "gitops", "argo cd", "spinnaker", "immutable infrastructure"
            ],
            "machine learning ops": [
                "mlflow", "kubeflow", "model deployment", "model monitoring",
                "feature stores", "data versioning", "a/b testing models",
                "model quantization", "onnx", "tf serving", "vertex ai",
                "sagemaker", "distributed training", "hyperparameter tuning"
            ],
            "embedded systems": [
                "iot", "arduino", "raspberry pi", "rtos", "firmware",
                "device drivers", "sensors", "bluetooth low energy", "zigbee",
                "memory management", "power optimization", "embedded linux",
                "real-time systems", "can bus", "modbus", "industrial protocols"
            ],
            "soft skills": [
                "communication", "teamwork", "problem-solving", "critical thinking",
                "time management", "agile methodology", "scrum", "kanban",
                "mentoring", "technical writing", "stakeholder management",
                "conflict resolution", "presentation skills", "remote collaboration"
            ],
            "game development": [
                "unity", "unreal engine", "c#", "3d modeling", "physics engines",
                "shaders", "vr development", "ar development", "game ai",
                "multiplayer networking", "particle systems", "animation systems",
                "game optimization", "procedural generation", "game design patterns"
            ],
            "quantum computing": [
                "qiskit", "quantum algorithms", "quantum circuits", "qubit",
                "superposition", "entanglement", "quantum error correction",
                "quantum cryptography", "quantum machine learning", "shor's algorithm"
            ]
        }
        
        # Build a map of all skills (including misspellings) for faster lookups
        self.all_skills = set()
        for category, skills in self.skill_categories.items():
            self.all_skills.add(category)
            for skill in skills:
                self.all_skills.add(skill)
                
        # Normalize and expand skill categories for lookup
        self.normalized_categories = self._normalize_skill_categories()
        
        # Initialize cache for ESCO API calls
        self.api_cache = {}
        self._load_cache()
    
    def _normalize_skill_categories(self) -> Dict[str, str]:
        """Create lookup dictionary of skills to their categories"""
        normalized = {}
        for category, skills in self.skill_categories.items():
            for skill in skills:
                normalized[skill] = category
            # Add the category name itself as a skill
            normalized[category] = category
        return normalized
    
    def _load_cache(self) -> None:
        """Load cached ESCO API responses"""
        if not self.use_cache:
            return
            
        cache_file = os.path.join(self.cache_dir, "esco_cache.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r') as f:
                    self.api_cache = json.load(f)
                print(f"Loaded {len(self.api_cache)} cached items from {cache_file}")
            except Exception as e:
                print(f"Error loading cache: {e}")
                self.api_cache = {}
        else:
            print(f"No cache file found at {cache_file}. Starting with empty cache.")
            self.api_cache = {}
    
    def _save_cache(self) -> None:
        """Save cached ESCO API responses to file"""
        if not self.use_cache:
            return
            
        cache_file = os.path.join(self.cache_dir, "esco_cache.json")
        try:
            with open(cache_file, 'w') as f:
                json.dump(self.api_cache, f)
            print(f"Saved {len(self.api_cache)} items to cache at {cache_file}")
        except Exception as e:
            print(f"Error saving cache: {e}")
    
    def normalize_skill(self, skill: str) -> str:
        """
        Normalize a skill by correcting spelling and expanding abbreviations
        
        Args:
            skill: Input skill string
            
        Returns:
            Normalized skill string
        """
        skill_lower = skill.lower().strip()
        
        # Check for direct abbreviation match
        if skill_lower in self.abbreviations:
            return self.abbreviations[skill_lower]
            
        # Check for spelling errors using fuzzy matching
        best_match = None
        best_score = 0
        
        # First check for exact matches
        if skill_lower in self.all_skills:
            return skill_lower
            
        # Then try fuzzy matching
        for known_skill in self.all_skills:
            # Calculate string similarity
            similarity = fuzz.ratio(skill_lower, known_skill)
            
            # If similarity is high enough, consider it a match
            if similarity > 85 and similarity > best_score:
                best_score = similarity
                best_match = known_skill
        
        # Return best match or original if no good match found
        return best_match if best_match else skill_lower
    
    def query_esco_api(self, endpoint: str, params: Dict = None) -> Dict:
        """
        Query the ESCO API with caching
        
        Args:
            endpoint: API endpoint to query
            params: Query parameters
            
        Returns:
            JSON response from the API
        """
        # Create cache key from endpoint and params
        cache_key = f"{endpoint}_{json.dumps(params or {})}"
        
        # Check cache first
        if cache_key in self.api_cache:
            return self.api_cache[cache_key]
        
        # Prepare headers for JSON response
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Query API
        url = f"{self.esco_base_url}/{endpoint}"
        try:
            # Print the full URL for debugging
            print(f"Requesting URL: {url}")
            print(f"With params: {params}")
            
            response = requests.get(url, params=params, headers=headers)
            
            # Check content type
            content_type = response.headers.get('Content-Type', '')
            if 'application/json' not in content_type and 'text/json' not in content_type:
                print(f"Warning: Response is not JSON. Content-Type: {content_type}")
                print(f"Response preview: {response.text[:200]}...")
                return {}
            
            if response.status_code == 200:
                result = response.json()
                
                # Cache result
                if self.use_cache:
                    self.api_cache[cache_key] = result
                    self._save_cache()
                    
                return result
            else:
                print(f"ESCO API error: {response.status_code} - {response.text}")
                return {}
        except Exception as e:
            print(f"Error querying ESCO API: {e}")
            return {}
    
    def get_esco_skill_info(self, skill: str) -> Dict:
        """
        Get skill information from ESCO API or local knowledge base
        
        Args:
            skill: Skill to search for
            
        Returns:
            Dictionary with skill information including URI and related skills
        """
        # Normalize the skill first to handle misspellings and abbreviations
        normalized_skill = self.normalize_skill(skill)
        skill_lower = normalized_skill.lower()
        
        # Create cache key for this skill
        cache_key = f"local_skill_{skill_lower}"
        
        # Check cache first
        if cache_key in self.api_cache:
            return self.api_cache[cache_key]
        
        skill_info = {
            "uri": None,
            "exact_match": False,
            "related_skills": [],
            "broader_skills": [],
            "narrower_skills": [],
            "normalized_skill": normalized_skill  # Include the normalized form
        }
        
        # Always use our local knowledge base for tech skills
        # This is more reliable than the ESCO API for programming languages and frameworks
        
        # Check if the skill is in our normalized categories
        if skill_lower in self.normalized_categories:
            category = self.normalized_categories[skill_lower]
            related_skills = []
            
            # Get all skills in the same category
            for category_skill in self.skill_categories[category]:
                if category_skill.lower() != skill_lower:
                    related_skills.append(category_skill)
            
            skill_info["uri"] = f"local:{skill_lower}"
            skill_info["exact_match"] = True
            skill_info["related_skills"] = related_skills
            
            # Cache the result
            if self.use_cache:
                self.api_cache[cache_key] = skill_info
                self._save_cache()
                
            return skill_info
        
        # If not found in our knowledge base, try to find similar skills
        for category, skills in self.skill_categories.items():
            for category_skill in skills:
                # Calculate similarity between the input skill and category skill
                similarity = fuzz.ratio(skill_lower, category_skill.lower())
                
                # If similarity is high enough, consider it a match
                if similarity > 80:
                    related_skills = []
                    for related_skill in skills:
                        if related_skill.lower() != category_skill.lower():
                            related_skills.append(related_skill)
                    
                    skill_info["uri"] = f"local:{category_skill.lower()}"
                    skill_info["exact_match"] = similarity > 90
                    skill_info["related_skills"] = related_skills
                    
                    # Cache the result
                    if self.use_cache:
                        self.api_cache[cache_key] = skill_info
                        self._save_cache()
                        
                    return skill_info
        
        # If no match found, still cache the empty result
        if self.use_cache:
            self.api_cache[cache_key] = skill_info
            self._save_cache()
            
        # If no match found, return empty skill info
        return skill_info
    
    def enrich_skills_with_esco(self, skills: List[str]) -> Dict[str, Dict]:
        """
        Enrich skills with ESCO data and relationships
        
        Args:
            skills: List of skills to enrich
            
        Returns:
            Dictionary mapping skills to their related skills from ESCO
        """
        enriched_skills = {}
        
        for skill in skills:
            # Normalize the skill first
            normalized_skill = self.normalize_skill(skill)
            
            # Get skill info from ESCO
            skill_info = self.get_esco_skill_info(normalized_skill)
            
            # If no info found in ESCO, use our knowledge base
            if not skill_info["uri"]:
                related_skills = []
                
                # Check if skill is in our category knowledge base
                if normalized_skill in self.normalized_categories:
                    category = self.normalized_categories[normalized_skill]
                    # Get all skills in the same category
                    for category_skill in self.skill_categories[category]:
                        if category_skill != normalized_skill:
                            related_skills.append(category_skill)
                
                enriched_skills[skill] = {
                    "direct_match": False,
                    "category": self.normalized_categories.get(normalized_skill),
                    "related_skills": related_skills,
                    "normalized_form": normalized_skill
                }
            else:
                # Use ESCO data
                category = None
                if normalized_skill in self.normalized_categories:
                    category = self.normalized_categories[normalized_skill]
                
                enriched_skills[skill] = {
                    "direct_match": skill_info["exact_match"],
                    "category": category,
                    "related_skills": skill_info["related_skills"],
                    "normalized_form": normalized_skill
                }
        
        return enriched_skills
    
    def calculate_similarity(self, skill1: str, skill2: str) -> float:
        """
        Calculate similarity between two skills
        
        Args:
            skill1: First skill
            skill2: Second skill
            
        Returns:
            Similarity score between 0 and 1
        """
        # Normalize both skills to handle misspellings and abbreviations
        norm_skill1 = self.normalize_skill(skill1)
        norm_skill2 = self.normalize_skill(skill2)
        
        # Check for exact match after normalization
        if norm_skill1.lower() == norm_skill2.lower():
            return 1.0
        
        # Check if skills are in the same category
        skill1_category = self.normalized_categories.get(norm_skill1.lower())
        skill2_category = self.normalized_categories.get(norm_skill2.lower())
        
        if skill1_category and skill2_category and skill1_category == skill2_category:
            return 0.9
        
        # Check if one skill is the category of the other
        if skill1_category == norm_skill2.lower() or skill2_category == norm_skill1.lower():
            return 0.9
        
        # Check for high fuzzy match ratio after normalization (handles slight spelling variations)
        fuzzy_ratio = fuzz.ratio(norm_skill1.lower(), norm_skill2.lower())
        if fuzzy_ratio > 85:
            return fuzzy_ratio / 100.0
        
        # Calculate semantic similarity using sentence transformers
        embeddings = self.model.encode([norm_skill1, norm_skill2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        return float(similarity)
    
    def match_skills(self, job_skills: List[str], candidate_skills: List[str]) -> Dict:
        """
        Match candidate skills with job requirements and calculate score
        
        Args:
            job_skills: List of skills required for the job
            candidate_skills: List of skills possessed by the candidate
            
        Returns:
            Dictionary with matching results and scores
        """
        # Normalize all skills first
        normalized_job_skills = [self.normalize_skill(skill) for skill in job_skills]
        normalized_candidate_skills = [self.normalize_skill(skill) for skill in candidate_skills]
        
        # Map from original to normalized skills
        job_skill_mapping = {original: normalized for original, normalized in zip(job_skills, normalized_job_skills)}
        candidate_skill_mapping = {original: normalized for original, normalized in zip(candidate_skills, normalized_candidate_skills)}
        
        # Reverse mapping for getting original form
        rev_job_mapping = {}
        for orig, norm in job_skill_mapping.items():
            if norm not in rev_job_mapping:
                rev_job_mapping[norm] = []
            rev_job_mapping[norm].append(orig)
            
        rev_candidate_mapping = {}
        for orig, norm in candidate_skill_mapping.items():
            if norm not in rev_candidate_mapping:
                rev_candidate_mapping[norm] = []
            rev_candidate_mapping[norm].append(orig)
        
        # Enrich skills with ESCO and knowledge base
        enriched_job_skills = self.enrich_skills_with_esco(normalized_job_skills)
        enriched_candidate_skills = self.enrich_skills_with_esco(normalized_candidate_skills)
        
        # Calculate score matrix
        matches = []
        total_score = 0
        max_possible_score = len(job_skills)  # Maximum score is one per job skill
        
        # For each job skill, find best matching candidate skill
        for job_skill in job_skills:
            normalized_job_skill = job_skill_mapping[job_skill]
            best_match = None
            best_orig_match = None  # Store original form of the best match
            best_score = 0
            
            # First try direct matches after normalization
            for candidate_skill in candidate_skills:
                normalized_candidate_skill = candidate_skill_mapping[candidate_skill]
                if normalized_job_skill.lower() == normalized_candidate_skill.lower():
                    best_match = normalized_candidate_skill
                    best_orig_match = candidate_skill
                    best_score = 1.0
                    break
            
            # If no direct match, try category and semantic matching
            if not best_match:
                for candidate_skill in candidate_skills:
                    normalized_candidate_skill = candidate_skill_mapping[candidate_skill]
                    
                    # Check if job skill is a category and candidate skill belongs to it
                    if normalized_job_skill in self.skill_categories and normalized_candidate_skill in self.skill_categories.get(normalized_job_skill, []):
                        score = 0.9
                    # Check if candidate skill is a category and job skill belongs to it
                    elif normalized_candidate_skill in self.skill_categories and normalized_job_skill in self.skill_categories.get(normalized_candidate_skill, []):
                        score = 0.9
                    # Use semantic similarity
                    else:
                        score = self.calculate_similarity(normalized_job_skill, normalized_candidate_skill)
                    
                    if score > best_score:
                        best_score = score
                        best_match = normalized_candidate_skill
                        best_orig_match = candidate_skill
            
            # Add match to results
            if best_match:
                job_category = normalized_job_skill in self.normalized_categories and self.normalized_categories.get(normalized_job_skill)
                candidate_category = best_match in self.normalized_categories and self.normalized_categories.get(best_match)
                
                matches.append({
                    "job_skill": job_skill,
                    "normalized_job_skill": normalized_job_skill,
                    "candidate_skill": best_orig_match,
                    "normalized_candidate_skill": best_match,
                    "score": best_score,
                    "related": best_score < 1.0 and best_score >= 0.7,
                    "category_match": job_category and candidate_category and job_category == candidate_category
                })
                total_score += best_score
            else:
                matches.append({
                    "job_skill": job_skill,
                    "normalized_job_skill": normalized_job_skill,
                    "candidate_skill": None,
                    "normalized_candidate_skill": None,
                    "score": 0,
                    "related": False,
                    "category_match": False
                })
        
        # Calculate overall match percentage
        match_percentage = (total_score / max_possible_score) * 100 if max_possible_score > 0 else 0
        
        # Check for additional candidate skills not matched to job skills
        additional_skills = []
        matched_candidate_skills = {match["normalized_candidate_skill"] for match in matches if match["normalized_candidate_skill"]}
        
        for skill in candidate_skills:
            normalized_skill = candidate_skill_mapping[skill]
            if normalized_skill not in matched_candidate_skills:
                # Find which job category it might belong to
                relevant_job_categories = set()
                skill_category = self.normalized_categories.get(normalized_skill.lower())
                
                for job_skill in normalized_job_skills:
                    job_category = self.normalized_categories.get(job_skill.lower())
                    if job_category and skill_category and job_category == skill_category:
                        relevant_job_categories.add(job_category)
                
                additional_skills.append({
                    "skill": skill,
                    "normalized_skill": normalized_skill,
                    "relevant_job_categories": list(relevant_job_categories)
                })
        
        return {
            "matches": matches,
            "total_score": total_score,
            "max_possible_score": max_possible_score,
            "match_percentage": match_percentage,
            "additional_skills": additional_skills
        }

# Create FastAPI app
app = FastAPI(
    title="Skills Matching API",
    description="API for matching job requirements with candidate skills"
)

# Define request/response models
class SkillsMatchRequest(BaseModel):
    job_skills: List[str]
    candidate_skills: List[str]

class SkillMatch(BaseModel):
    job_skill: str
    normalized_job_skill: str
    candidate_skill: str | None
    normalized_candidate_skill: str | None
    score: float
    related: bool
    category_match: bool

class AdditionalSkill(BaseModel):
    skill: str
    normalized_skill: str
    relevant_job_categories: List[str]

class SkillsMatchResponse(BaseModel):
    matches: List[SkillMatch]
    total_score: float
    max_possible_score: float
    match_percentage: float
    additional_skills: List[AdditionalSkill]

# Initialize the matcher
matcher = ESCOSkillsMatchingSystem()

@app.post("/match-skills", response_model=SkillsMatchResponse)
async def match_skills(request: SkillsMatchRequest):
    """
    Match job requirements with candidate skills and return detailed analysis
    """
    try:
        # Clean input skills
        job_skills = [skill.strip() for skill in request.job_skills if skill.strip()]
        candidate_skills = [skill.strip() for skill in request.candidate_skills if skill.strip()]
        
        if not job_skills or not candidate_skills:
            raise HTTPException(status_code=400, detail="Both job skills and candidate skills must be provided")
            
        # Perform matching
        result = matcher.match_skills(job_skills, candidate_skills)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/match-percentage")
async def get_match_percentage(job_skills: str, candidate_skills: str):
    """
    Get match percentage between job skills and candidate skills
    Skills should be comma-separated in the URL
    Example: /match-percentage?job_skills=python,javascript,react&candidate_skills=python,nodejs,react
    """
    try:
        # Split and clean the input skills
        job_skills_list = [skill.strip() for skill in job_skills.split(",") if skill.strip()]
        candidate_skills_list = [skill.strip() for skill in candidate_skills.split(",") if skill.strip()]
        
        if not job_skills_list or not candidate_skills_list:
            raise HTTPException(status_code=400, detail="Both job skills and candidate skills must be provided")
            
        # Perform matching
        result = matcher.match_skills(job_skills_list, candidate_skills_list)
        
        # Generate report
        report = generate_skills_match_report(result)
        
        # Return only the match percentage
        return {
            "match_percentage": round(result["match_percentage"], 2),
            "report": report
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/normalize-skill")
async def normalize_skill(skill: str):
    """
    Normalize a skill by correcting spelling and expanding abbreviations
    Example: /normalize-skill?skill=machine%20larning
    """
    try:
        normalized = matcher.normalize_skill(skill.strip())
        return {
            "original": skill,
            "normalized": normalized,
            "is_abbreviation": skill.lower() in matcher.abbreviations,
            "category": matcher.normalized_categories.get(normalized.lower())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/expand-abbreviation")
async def expand_abbreviation(abbr: str):
    """
    Expand a technical abbreviation to its full form
    Example: /expand-abbreviation?abbr=ml
    """
    try:
        abbr_lower = abbr.strip().lower()
        if abbr_lower in matcher.abbreviations:
            return {
                "abbreviation": abbr,
                "full_form": matcher.abbreviations[abbr_lower],
                "found": True
            }
        else:
            return {
                "abbreviation": abbr,
                "full_form": None,
                "found": False
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-skill-category")
async def get_skill_category(skill: str):
    """
    Get the category for a skill
    Example: /get-skill-category?skill=python
    """
    try:
        normalized = matcher.normalize_skill(skill.strip())
        category = matcher.normalized_categories.get(normalized.lower())
        
        return {
            "skill": skill,
            "normalized": normalized,
            "category": category,
            "related_skills": matcher.skill_categories.get(category, []) if category else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/skill-similarity")
async def get_skill_similarity(skill1: str, skill2: str):
    """
    Calculate similarity between two skills
    Example: /skill-similarity?skill1=python&skill2=programming
    """
    try:
        similarity = matcher.calculate_similarity(skill1.strip(), skill2.strip())
        
        norm_skill1 = matcher.normalize_skill(skill1.strip())
        norm_skill2 = matcher.normalize_skill(skill2.strip())
        
        return {
            "skill1": skill1,
            "skill2": skill2,
            "normalized_skill1": norm_skill1,
            "normalized_skill2": norm_skill2,
            "similarity_score": round(similarity, 4),
            "category1": matcher.normalized_categories.get(norm_skill1.lower()),
            "category2": matcher.normalized_categories.get(norm_skill2.lower())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_skills_match_report(result: dict) -> str:
    """
    Generate a human-readable report from skills matching results
    
    Args:
        result: The result dictionary from the skills matcher
        
    Returns:
        A formatted report string
    """
    import random
    
    # Extract key metrics
    match_percentage = round(result["match_percentage"], 1)
    matches = result["matches"]
    additional_skills = result["additional_skills"]
    
    # Define strength levels
    if match_percentage >= 90:
        match_strength = "exceptional"
    elif match_percentage >= 80:
        match_strength = "strong"
    elif match_percentage >= 70:
        match_strength = "good"
    elif match_percentage >= 60:
        match_strength = "moderate"
    elif match_percentage >= 50:
        match_strength = "fair"
    else:
        match_strength = "limited"
    
    # Introduction variations
    intros = [
        f"The candidate shows a {match_strength} skills match of {match_percentage}% with the job requirements.",
        f"Analysis of the candidate's skills reveals a {match_strength} alignment ({match_percentage}%) with the position requirements.",
        f"The candidate's skillset demonstrates a {match_strength} fit ({match_percentage}%) with the required job skills."
    ]
    
    # Count direct matches, related matches, and missing skills
    direct_matches = [m for m in matches if m["score"] >= 0.9]
    related_matches = [m for m in matches if 0.7 <= m["score"] < 0.9]
    weak_matches = [m for m in matches if 0.4 <= m["score"] < 0.7]
    missing_skills = [m for m in matches if m["score"] < 0.4 or m["candidate_skill"] is None]
    
    # Generate report sections with variations for non-static responses
    skill_breakdown = []
    
    # Strong matches section
    if direct_matches:
        strong_match_intros = [
            f"The candidate directly matches {len(direct_matches)} of the required skills:",
            f"There are {len(direct_matches)} skills where the candidate shows strong proficiency:",
            f"The following {len(direct_matches)} skills are well-aligned with the job requirements:"
        ]
        skill_breakdown.append(f"{random.choice(strong_match_intros)} {', '.join([m['job_skill'] for m in direct_matches])}.")
    
    # Related matches section
    if related_matches:
        related_match_intros = [
            f"The candidate has {len(related_matches)} related or transferable skills:",
            f"For {len(related_matches)} job requirements, the candidate offers related expertise:",
            f"The candidate demonstrates related competencies for {len(related_matches)} skills:"
        ]
        related_details = []
        for match in related_matches:
            related_details.append(f"{match['job_skill']} (matched with {match['candidate_skill']})")
        skill_breakdown.append(f"{random.choice(related_match_intros)} {', '.join(related_details)}.")
    
    # Weak matches section
    if weak_matches:
        weak_match_intros = [
            f"The candidate shows partial alignment in {len(weak_matches)} areas:",
            f"There are {len(weak_matches)} skills where the match is present but weaker:",
            f"The following skill areas show minimal overlap:"
        ]
        weak_details = []
        for match in weak_matches:
            if match["candidate_skill"]:
                weak_details.append(f"{match['job_skill']} (partially matched with {match['candidate_skill']})")
        if weak_details:
            skill_breakdown.append(f"{random.choice(weak_match_intros)} {', '.join(weak_details)}.")
    
    # Missing skills section
    if missing_skills:
        missing_intros = [
            f"The candidate is missing {len(missing_skills)} required skills:",
            f"There are {len(missing_skills)} skill gaps in the candidate's profile:",
            f"The following required skills were not found in the candidate's profile:"
        ]
        skill_breakdown.append(f"{random.choice(missing_intros)} {', '.join([m['job_skill'] for m in missing_skills])}.")
    
    # Additional skills section
    if additional_skills:
        relevant_additional = [s for s in additional_skills if s["relevant_job_categories"]]
        other_additional = [s for s in additional_skills if not s["relevant_job_categories"]]
        
        if relevant_additional:
            relevant_intros = [
                f"The candidate brings {len(relevant_additional)} additional relevant skills:",
                f"Beyond the job requirements, the candidate offers {len(relevant_additional)} relevant skills:",
                f"The candidate possesses {len(relevant_additional)} supplementary skills relevant to the role:"
            ]
            skill_breakdown.append(f"{random.choice(relevant_intros)} {', '.join([s['skill'] for s in relevant_additional])}.")
        
        if other_additional:
            other_intros = [
                f"The candidate also has {len(other_additional)} other skills that may provide broader perspective:",
                f"Additionally, the candidate brings {len(other_additional)} skills from other domains:",
                f"The candidate's {len(other_additional)} extra skills outside the core requirements include:"
            ]
            skill_breakdown.append(f"{random.choice(other_intros)} {', '.join([s['skill'] for s in other_additional])}.")
    
    # Analysis and recommendations based on match percentage
    if match_percentage >= 85:
        analysis_options = [
            f"The candidate demonstrates an excellent skill match for this position. Their profile shows strong alignment with the core requirements, making them a highly suitable candidate from a technical standpoint.",
            f"With a match score of {match_percentage}%, the candidate's technical expertise strongly aligns with the position requirements. They appear well-equipped to handle the technical demands of this role.",
            f"The candidate's skill profile indicates they would likely excel in this position. Their technical capabilities closely align with the job requirements, suggesting minimal onboarding and training would be needed."
        ]
    elif match_percentage >= 70:
        analysis_options = [
            f"The candidate shows a good overall match with the position requirements. While some skill gaps exist, their strong areas align well with the core needs of the role.",
            f"With a {match_percentage}% match, the candidate demonstrates solid alignment with most job requirements. Some targeted training may be beneficial to address specific skill gaps.",
            f"The candidate's profile indicates they would be suitable for the position with some onboarding. Their technical foundation aligns with most key requirements, though some additional development in specific areas would be beneficial."
        ]
    elif match_percentage >= 50:
        analysis_options = [
            f"The candidate shows moderate alignment with the position requirements. There are significant skill matches but also notable gaps that would require substantial training or development.",
            f"With a {match_percentage}% match, the candidate has some relevant skills but lacks proficiency in several key areas. Consider whether training resources are available to bridge these gaps.",
            f"The candidate's profile suggests they may be able to perform in this role with proper support and development. Their technical foundation has relevant elements, but significant skill building would be needed."
        ]
    else:
        analysis_options = [
            f"The candidate's skills show limited alignment with the position requirements. There are substantial gaps in critical areas that would require extensive training or development.",
            f"With only a {match_percentage}% match, the candidate's current skill profile is not well-aligned with the job requirements. Consider whether alternative candidates might be more suitable.",
            f"The candidate's technical profile indicates a significant mismatch with the position needs. Their expertise appears to be in different domains than what the role requires."
        ]
    
    # Combine report sections
    report = f"{random.choice(intros)}\n\n"
    report += "\n".join(skill_breakdown)
    report += f"\n\nAnalysis: {random.choice(analysis_options)}"
    
    return report

@app.post("/match-skills-report")
async def match_skills_with_report(request: SkillsMatchRequest):
    """
    Match job requirements with candidate skills and return detailed analysis with human-readable report
    """
    try:
        # Clean input skills
        job_skills = [skill.strip() for skill in request.job_skills if skill.strip()]
        candidate_skills = [skill.strip() for skill in request.candidate_skills if skill.strip()]
        
        if not job_skills or not candidate_skills:
            raise HTTPException(status_code=400, detail="Both job skills and candidate skills must be provided")
            
        # Perform matching
        result = matcher.match_skills(job_skills, candidate_skills)
        
        # Generate human-readable report
        report = generate_skills_match_report(result)
        
        # Return both the detailed result and the human-readable report
        return {
            "match_details": result,
            "report": report
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/match-report")
async def get_match_report(job_skills: str, candidate_skills: str):
    """
    Get a comprehensive match report between job skills and candidate skills
    Skills should be comma-separated in the URL
    Example: /match-report?job_skills=python,javascript,react&candidate_skills=python,nodejs,react
    """
    try:
        # Split and clean the input skills
        job_skills_list = [skill.strip() for skill in job_skills.split(",") if skill.strip()]
        candidate_skills_list = [skill.strip() for skill in candidate_skills.split(",") if skill.strip()]
        
        if not job_skills_list or not candidate_skills_list:
            raise HTTPException(status_code=400, detail="Both job skills and candidate skills must be provided")
            
        # Perform matching
        result = matcher.match_skills(job_skills_list, candidate_skills_list)
        
        # Generate report
        report = generate_skills_match_report(result)
        
        return {
            "match_percentage": round(result["match_percentage"], 2),
            "job_skills": job_skills_list,
            "candidate_skills": candidate_skills_list,
            "report": report
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# uvicorn esco-skills-matching:app --reload
# http://localhost:8000/match-percentage?job_skills=python,javascript,react,restful%20apis&candidate_skills=nodejs,react
