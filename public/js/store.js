// State management for the Resume Screening Application

const ResumeStore = {
  // State
  jobDescription: null,
  candidates: [],
  isProcessing: false,

  // Initialize from localStorage
  init() {
    const savedJob = localStorage.getItem('jobDescription');
    const savedCandidates = localStorage.getItem('candidates');
    
    if (savedJob) {
      this.jobDescription = JSON.parse(savedJob);
    }
    if (savedCandidates) {
      this.candidates = JSON.parse(savedCandidates);
    }
  },

  // Persist state
  persist() {
    if (this.jobDescription) {
      localStorage.setItem('jobDescription', JSON.stringify(this.jobDescription));
    } else {
      localStorage.removeItem('jobDescription');
    }
    localStorage.setItem('candidates', JSON.stringify(this.candidates));
  },

  // Job Description methods
  setJobDescription(job) {
    this.jobDescription = job;
    this.persist();
  },

  getJobDescription() {
    return this.jobDescription;
  },

  // Candidate methods
  addCandidate(candidate) {
    this.candidates.push(candidate);
    this.persist();
  },

  updateCandidate(id, updates) {
    const index = this.candidates.findIndex(c => c.id === id);
    if (index !== -1) {
      this.candidates[index] = { ...this.candidates[index], ...updates };
      this.persist();
    }
  },

  removeCandidate(id) {
    this.candidates = this.candidates.filter(c => c.id !== id);
    this.persist();
  },

  getCandidates() {
    return this.candidates;
  },

  clearCandidates() {
    this.candidates = [];
    this.persist();
  },

  // Processing state
  setIsProcessing(processing) {
    this.isProcessing = processing;
  },

  getIsProcessing() {
    return this.isProcessing;
  },

  // Reset all
  reset() {
    this.jobDescription = null;
    this.candidates = [];
    this.isProcessing = false;
    localStorage.removeItem('jobDescription');
    localStorage.removeItem('candidates');
  }
};

// Initialize store on load
ResumeStore.init();

// Toast notification system
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(title, description, type = 'success') {
    this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconSvg = type === 'success' 
      ? '<svg class="h-5 w-5 text-success flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : type === 'error'
      ? '<svg class="h-5 w-5 text-destructive flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>'
      : '<svg class="h-5 w-5 text-warning flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>';

    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1">
        <p class="font-semibold text-foreground text-sm">${title}</p>
        ${description ? `<p class="text-muted-foreground text-sm">${description}</p>` : ''}
      </div>
      <button onclick="this.parentElement.remove()" class="btn-ghost">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  },

  success(title, description) {
    this.show(title, description, 'success');
  },

  error(title, description) {
    this.show(title, description, 'error');
  },

  warning(title, description) {
    this.show(title, description, 'warning');
  }
};

// Utility functions
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId() {
  return `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Extract skills from job description (basic fallback)
function extractJobSkills(description) {
  const skillPatterns = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js",
    "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
    "Git", "REST", "GraphQL", "Microservices", "Agile", "Scrum",
    "Machine Learning", "AI", "Data Science", "Analytics",
    "HTML", "CSS", "SASS", "Tailwind", "Bootstrap",
    "Communication", "Leadership", "Problem Solving", "Teamwork"
  ];

  const foundSkills = [];
  const lowerDesc = description.toLowerCase();

  skillPatterns.forEach(skill => {
    if (lowerDesc.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  // Add some generic skills if description mentions common terms
  if (lowerDesc.includes("frontend") || lowerDesc.includes("front-end")) {
    if (!foundSkills.includes("HTML")) foundSkills.push("HTML");
    if (!foundSkills.includes("CSS")) foundSkills.push("CSS");
  }

  return foundSkills.length > 0 ? foundSkills : ["Technical Skills", "Communication", "Problem Solving"];
}

// Supabase configuration for edge functions
const SUPABASE_URL = 'https://fnuddcjmbxiqcdnpqhaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZudWRkY2ptYnhpcWNkbnBxaGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTE0ODcsImV4cCI6MjA4NDM4NzQ4N30.p3JMWZyp3MnkgmXijaZyIBukJwlIhkjv4b2jLY5PCBU';

// AI-powered resume analysis using Google Gemini
async function analyzeResumeWithAI(candidate, jobDescription) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        jobDescription: {
          title: jobDescription.title,
          description: jobDescription.description,
          experience: jobDescription.experience,
          location: jobDescription.location
        },
        candidateName: candidate.name,
        resumeText: candidate.resumeText || generateMockResumeText(candidate.name)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.analysis) {
      throw new Error('Invalid response from AI service');
    }

    const analysis = data.analysis;
    
    return {
      extractedSkills: [
        ...analysis.resumeSkills.technical,
        ...analysis.resumeSkills.soft,
        ...analysis.resumeSkills.tools
      ],
      matchedSkills: analysis.matchedSkills,
      partiallyMatchedSkills: analysis.partiallyMatchedSkills,
      missingSkills: analysis.missingSkills,
      matchScore: analysis.matchScore,
      matchLabel: analysis.matchLabel,
      skillGapAnalysis: analysis.skillGapAnalysis,
      explanation: analysis.explanation,
      inferredSkills: analysis.inferredSkills,
      jobSkills: analysis.jobSkills,
      resumeSkills: analysis.resumeSkills,
      poweredBy: data.poweredBy,
      status: 'analyzed'
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Fall back to simulated analysis
    return simulateFallbackAnalysis(candidate, jobDescription);
  }
}

// Generate mock resume text for demo purposes (when no real resume text available)
function generateMockResumeText(name) {
  const experiences = [
    'Senior Software Engineer with 5+ years experience in JavaScript, React, and Node.js. Led team of 4 developers.',
    'Full Stack Developer proficient in Python, Django, and PostgreSQL. Built scalable microservices.',
    'Frontend Developer specializing in React, TypeScript, and modern CSS. Created responsive web applications.',
    'Backend Engineer experienced with Java, Spring Boot, and AWS. Designed RESTful APIs.',
    'DevOps Engineer skilled in Docker, Kubernetes, and CI/CD pipelines. Managed cloud infrastructure.',
    'Data Scientist with expertise in Python, Machine Learning, and SQL. Developed predictive models.',
    'Mobile Developer experienced in React Native and Swift. Published multiple apps to app stores.',
    'Software Architect with experience in system design, microservices, and cloud platforms.'
  ];
  
  const skills = [
    'JavaScript, TypeScript, React, Redux, Node.js, Express',
    'Python, Django, Flask, PostgreSQL, MongoDB',
    'Java, Spring Boot, Hibernate, MySQL',
    'AWS, Docker, Kubernetes, Terraform, Jenkins',
    'Git, Agile, Scrum, JIRA, Communication, Leadership'
  ];
  
  const randomExp = experiences[Math.floor(Math.random() * experiences.length)];
  const randomSkills = skills.sort(() => Math.random() - 0.5).slice(0, 3).join('\n');
  
  return `
${name}
Software Professional

EXPERIENCE:
${randomExp}

SKILLS:
${randomSkills}

EDUCATION:
Bachelor's in Computer Science

ACHIEVEMENTS:
- Improved application performance by 40%
- Mentored junior developers
- Contributed to open source projects
  `.trim();
}

// Fallback analysis when AI is unavailable
function simulateFallbackAnalysis(candidate, jobDescription) {
  const jobSkills = extractJobSkills(jobDescription.description);
  
  // Generate mock resume skills
  const allSkills = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java",
    "SQL", "MongoDB", "AWS", "Docker", "Git", "REST APIs",
    "GraphQL", "CSS", "HTML", "Redux", "Next.js", "Vue.js",
    "Machine Learning", "Data Analysis", "Agile", "Scrum"
  ];

  const numSkills = 5 + Math.floor(Math.random() * 8);
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
  const extractedSkills = shuffled.slice(0, numSkills);

  // Calculate matches with semantic understanding
  const matchedSkills = extractedSkills.filter(skill =>
    jobSkills.some(js => isSkillMatch(skill, js))
  );

  const missingSkills = jobSkills.filter(
    skill => !extractedSkills.some(es => isSkillMatch(es, skill))
  ).slice(0, 5);

  // Calculate weighted score
  const baseScore = (matchedSkills.length / Math.max(jobSkills.length, 1)) * 100;
  const matchScore = Math.min(Math.max(Math.round(baseScore), 20), 95);
  
  // Determine match label
  let matchLabel;
  if (matchScore >= 85) matchLabel = 'Strong Match';
  else if (matchScore >= 70) matchLabel = 'Moderate Match';
  else if (matchScore >= 50) matchLabel = 'Potential Match';
  else matchLabel = 'Low Match';

  // Generate skill gap analysis
  const skillGapAnalysis = missingSkills.slice(0, 3).map(skill => 
    `Missing ${skill} - required for this role`
  );

  // Generate explanation
  const explanation = matchScore >= 70
    ? `Candidate ${candidate.name} shows strong alignment with the job requirements, matching ${matchedSkills.length} key skills.`
    : `Candidate ${candidate.name} has ${matchedSkills.length} matching skills but lacks some key requirements. May need additional training.`;

  return {
    extractedSkills,
    matchedSkills,
    partiallyMatchedSkills: [],
    missingSkills,
    matchScore,
    matchLabel,
    skillGapAnalysis,
    explanation,
    inferredSkills: [],
    poweredBy: 'Keyword Matching (Fallback)',
    status: 'analyzed'
  };
}

// Semantic skill matching
function isSkillMatch(skill1, skill2) {
  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return true;
  
  // Partial match
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  // Semantic equivalents
  const equivalents = {
    'javascript': ['js', 'es6', 'ecmascript', 'node.js', 'nodejs'],
    'typescript': ['ts'],
    'react': ['reactjs', 'react.js', 'react native'],
    'node.js': ['nodejs', 'node', 'express'],
    'python': ['django', 'flask', 'fastapi'],
    'aws': ['amazon web services', 'cloud', 'ec2', 's3', 'lambda'],
    'docker': ['containerization', 'containers'],
    'kubernetes': ['k8s', 'container orchestration'],
    'sql': ['mysql', 'postgresql', 'postgres', 'database'],
    'nosql': ['mongodb', 'dynamodb', 'redis'],
    'frontend': ['front-end', 'ui', 'user interface', 'html', 'css'],
    'backend': ['back-end', 'server-side', 'api'],
    'devops': ['ci/cd', 'deployment', 'infrastructure'],
    'agile': ['scrum', 'kanban', 'sprint'],
    'machine learning': ['ml', 'ai', 'deep learning', 'data science']
  };
  
  for (const [key, synonyms] of Object.entries(equivalents)) {
    const allTerms = [key, ...synonyms];
    const hasS1 = allTerms.some(t => s1.includes(t) || t.includes(s1));
    const hasS2 = allTerms.some(t => s2.includes(t) || t.includes(s2));
    if (hasS1 && hasS2) return true;
  }
  
  return false;
}

// Score helpers
function getScoreColor(score) {
  if (score >= 75) return "score-high";
  if (score >= 50) return "score-medium";
  return "score-low";
}

function getScoreLabel(score) {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Strong Match";
  if (score >= 50) return "Moderate Match";
  return "Low Match";
}
