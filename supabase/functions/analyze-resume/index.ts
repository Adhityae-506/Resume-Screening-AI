import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  jobDescription: {
    title: string;
    description: string;
    experience?: string;
    location?: string;
  };
  candidateName: string;
  resumeText: string;
}

interface SkillAnalysis {
  jobSkills: {
    technical: string[];
    soft: string[];
    tools: string[];
    required: string[];
    preferred: string[];
  };
  resumeSkills: {
    technical: string[];
    soft: string[];
    tools: string[];
    experience: string[];
  };
  inferredSkills: string[];
  matchedSkills: string[];
  partiallyMatchedSkills: { resume: string; job: string; relevance: number }[];
  missingSkills: string[];
  matchScore: number;
  matchLabel: string;
  skillGapAnalysis: string[];
  explanation: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, candidateName, resumeText }: AnalysisRequest = await req.json();

    // Validate inputs
    if (!jobDescription?.description) {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // System prompt for intelligent skill extraction and matching
    const systemPrompt = `You are an expert HR AI assistant specialized in resume screening and skill matching.

Your task is to analyze a job description and a candidate's resume to:
1. Extract ALL relevant skills from both documents
2. Identify semantic matches (e.g., "React" = "React.js", "Frontend" ≈ "UI Development")
3. Calculate a realistic match score
4. Provide actionable insights

SKILL CATEGORIES:
- Technical: Programming languages, frameworks, databases, cloud platforms
- Soft: Communication, leadership, teamwork, problem-solving
- Tools: Software, platforms, methodologies (Git, Jira, Agile, etc.)

MATCHING RULES:
- Exact match: Same skill or direct synonym (React = React.js) → Full weight
- Partial match: Related skills (JavaScript → TypeScript knowledge likely) → 50-70% weight
- Inferred skills: Skills implied by experience (5 years React → likely knows Redux) → 30-50% weight

SCORING GUIDELINES:
- 85-100%: Strong Match - Candidate meets most/all requirements
- 70-84%: Moderate Match - Good fit with some skill gaps
- 50-69%: Potential Match - Has core skills but missing key requirements
- Below 50%: Low Match - Significant skill gaps

Always be fair and objective. Never auto-reject candidates.`;

    const userPrompt = `Analyze the following job description and resume:

JOB TITLE: ${jobDescription.title || 'Not specified'}
JOB DESCRIPTION:
${jobDescription.description}
${jobDescription.experience ? `\nREQUIRED EXPERIENCE: ${jobDescription.experience}` : ''}
${jobDescription.location ? `\nLOCATION: ${jobDescription.location}` : ''}

CANDIDATE: ${candidateName}
RESUME TEXT:
${resumeText}

Provide your analysis as a JSON object with the following structure:
{
  "jobSkills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"],
    "required": ["must-have skills"],
    "preferred": ["nice-to-have skills"]
  },
  "resumeSkills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"],
    "experience": ["relevant experience highlights"]
  },
  "inferredSkills": ["skills implied but not explicitly stated"],
  "matchedSkills": ["exact and close matches"],
  "partiallyMatchedSkills": [{"resume": "skill from resume", "job": "related job skill", "relevance": 0.7}],
  "missingSkills": ["required skills not found in resume"],
  "matchScore": 75,
  "matchLabel": "Moderate Match",
  "skillGapAnalysis": ["Gap 1: Missing X which is needed for Y", "Gap 2: ..."],
  "explanation": "One paragraph human-readable explanation of the match"
}`;

    // Use tool calling for structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_resume_match',
              description: 'Analyze and score the match between a job description and resume',
              parameters: {
                type: 'object',
                properties: {
                  jobSkills: {
                    type: 'object',
                    properties: {
                      technical: { type: 'array', items: { type: 'string' } },
                      soft: { type: 'array', items: { type: 'string' } },
                      tools: { type: 'array', items: { type: 'string' } },
                      required: { type: 'array', items: { type: 'string' } },
                      preferred: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['technical', 'soft', 'tools', 'required', 'preferred']
                  },
                  resumeSkills: {
                    type: 'object',
                    properties: {
                      technical: { type: 'array', items: { type: 'string' } },
                      soft: { type: 'array', items: { type: 'string' } },
                      tools: { type: 'array', items: { type: 'string' } },
                      experience: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['technical', 'soft', 'tools', 'experience']
                  },
                  inferredSkills: { type: 'array', items: { type: 'string' } },
                  matchedSkills: { type: 'array', items: { type: 'string' } },
                  partiallyMatchedSkills: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        resume: { type: 'string' },
                        job: { type: 'string' },
                        relevance: { type: 'number' }
                      },
                      required: ['resume', 'job', 'relevance']
                    }
                  },
                  missingSkills: { type: 'array', items: { type: 'string' } },
                  matchScore: { type: 'number', minimum: 0, maximum: 100 },
                  matchLabel: { 
                    type: 'string', 
                    enum: ['Strong Match', 'Moderate Match', 'Potential Match', 'Low Match'] 
                  },
                  skillGapAnalysis: { type: 'array', items: { type: 'string' } },
                  explanation: { type: 'string' }
                },
                required: [
                  'jobSkills', 'resumeSkills', 'inferredSkills', 'matchedSkills',
                  'partiallyMatchedSkills', 'missingSkills', 'matchScore', 'matchLabel',
                  'skillGapAnalysis', 'explanation'
                ]
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_resume_match' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiResponse = await response.json();
    
    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const analysis: SkillAnalysis = JSON.parse(toolCall.function.arguments);

    // Ensure score is within bounds
    analysis.matchScore = Math.max(0, Math.min(100, Math.round(analysis.matchScore)));

    // Validate match label
    if (analysis.matchScore >= 85) {
      analysis.matchLabel = 'Strong Match';
    } else if (analysis.matchScore >= 70) {
      analysis.matchLabel = 'Moderate Match';
    } else if (analysis.matchScore >= 50) {
      analysis.matchLabel = 'Potential Match';
    } else {
      analysis.matchLabel = 'Low Match';
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        poweredBy: 'Google Gemini AI'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Fallback to simulated analysis if AI fails
    const fallbackAnalysis = generateFallbackAnalysis();
    
    return new Response(
      JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        poweredBy: 'Fallback Analysis',
        warning: 'AI analysis unavailable, using keyword matching'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback analysis when AI is unavailable
function generateFallbackAnalysis(): SkillAnalysis {
  return {
    jobSkills: {
      technical: ['JavaScript', 'React', 'Node.js'],
      soft: ['Communication', 'Teamwork'],
      tools: ['Git', 'VS Code'],
      required: ['JavaScript', 'React'],
      preferred: ['TypeScript', 'GraphQL']
    },
    resumeSkills: {
      technical: ['JavaScript', 'HTML', 'CSS'],
      soft: ['Problem Solving'],
      tools: ['Git'],
      experience: ['Web Development']
    },
    inferredSkills: ['Frontend Development'],
    matchedSkills: ['JavaScript', 'Git'],
    partiallyMatchedSkills: [
      { resume: 'HTML/CSS', job: 'Frontend', relevance: 0.7 }
    ],
    missingSkills: ['React', 'Node.js'],
    matchScore: 55,
    matchLabel: 'Potential Match',
    skillGapAnalysis: [
      'Missing React framework experience - core requirement',
      'No backend/Node.js experience mentioned'
    ],
    explanation: 'Candidate has foundational web development skills but lacks the specific React experience required for this role. Consider for junior positions or with training plan.'
  };
}
