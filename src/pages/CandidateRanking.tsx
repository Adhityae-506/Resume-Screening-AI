import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useResumeStore, Candidate } from "@/store/useResumeStore";
import { toast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Trophy,
  User,
  Sparkles,
  RefreshCw,
  Brain,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const simulateAIAnalysis = async (
  candidate: Candidate,
  jobSkills: string[]
): Promise<Partial<Candidate>> => {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Generate mock skills based on candidate name
  const allSkills = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java",
    "SQL", "MongoDB", "AWS", "Docker", "Git", "REST APIs",
    "GraphQL", "CSS", "HTML", "Redux", "Next.js", "Vue.js",
    "Machine Learning", "Data Analysis", "Agile", "Scrum"
  ];

  // Randomly select skills
  const numSkills = 5 + Math.floor(Math.random() * 8);
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
  const extractedSkills = shuffled.slice(0, numSkills);

  // Calculate matches
  const matchedSkills = extractedSkills.filter((skill) =>
    jobSkills.some((js) => js.toLowerCase().includes(skill.toLowerCase()) || 
                          skill.toLowerCase().includes(js.toLowerCase()))
  );

  const missingSkills = jobSkills.filter(
    (skill) => !matchedSkills.some((ms) => 
      ms.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(ms.toLowerCase())
    )
  ).slice(0, 4);

  // Calculate score
  const matchScore = Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 100);

  return {
    extractedSkills,
    matchedSkills,
    missingSkills,
    matchScore: Math.min(Math.max(matchScore + Math.floor(Math.random() * 20) - 10, 20), 98),
    status: 'analyzed',
  };
};

// Extract key skills from job description
const extractJobSkills = (description: string): string[] => {
  const skillPatterns = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js",
    "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
    "Git", "REST", "GraphQL", "Microservices", "Agile", "Scrum",
    "Machine Learning", "AI", "Data Science", "Analytics"
  ];

  const foundSkills: string[] = [];
  const lowerDesc = description.toLowerCase();

  skillPatterns.forEach((skill) => {
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
};

export default function CandidateRanking() {
  const navigate = useNavigate();
  const { jobDescription, candidates, updateCandidate, setIsProcessing, isProcessing } = useResumeStore();
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);

  // Redirect if no job description or candidates
  if (!jobDescription) {
    return (
      <PageLayout>
        <div className="container py-12">
          <Card className="max-w-lg mx-auto text-center p-8">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">No Job Description Found</h2>
            <p className="text-muted-foreground mb-6">
              Please define your job requirements first.
            </p>
            <Button onClick={() => navigate("/Elaborate the job description")}>
              <ArrowLeft className="h-4 w-4" />
              Go to Job Description
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (candidates.length === 0) {
    return (
      <PageLayout>
        <div className="container py-12">
          <Card className="max-w-lg mx-auto text-center p-8">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">No Resumes Uploaded</h2>
            <p className="text-muted-foreground mb-6">
              Please upload candidate resumes first.
            </p>
            <Button onClick={() => navigate("/upload")}>
              <ArrowLeft className="h-4 w-4" />
              Upload Resumes
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const jobSkills = extractJobSkills(jobDescription.description);
  const analyzedCandidates = candidates
    .filter((c) => c.status === 'analyzed')
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const runAnalysis = async () => {
    setIsProcessing(true);
    setAnalysisComplete(false);

    for (const candidate of candidates) {
      if (candidate.status !== 'analyzed') {
        setCurrentlyProcessing(candidate.id);
        updateCandidate(candidate.id, { status: 'processing' });

        try {
          const results = await simulateAIAnalysis(candidate, jobSkills);
          updateCandidate(candidate.id, results);
        } catch (error) {
          updateCandidate(candidate.id, { status: 'error' });
        }
      }
    }

    setCurrentlyProcessing(null);
    setIsProcessing(false);
    setAnalysisComplete(true);
    
    toast({
      title: "Analysis Complete",
      description: "All candidates have been analyzed and ranked.",
    });
  };

  useEffect(() => {
    const unanalyzed = candidates.some((c) => c.status === 'uploaded');
    if (unanalyzed && !isProcessing) {
      runAnalysis();
    } else if (!unanalyzed) {
      setAnalysisComplete(true);
    }
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "score-high";
    if (score >= 50) return "score-medium";
    return "score-low";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Strong Match";
    if (score >= 50) return "Moderate Match";
    return "Low Match";
  };

  return (
    <PageLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Candidate Rankings
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              AI-powered analysis for: <strong className="text-foreground">{jobDescription.title}</strong>
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Job Details</span>
            </div>
            <div className="w-8 h-px bg-success" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Upload Resumes</span>
            </div>
            <div className="w-8 h-px bg-success" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm font-medium text-foreground">View Rankings</span>
            </div>
          </div>

          {/* Job Skills Reference */}
          <Card className="shadow-soft border-border mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Required Skills for This Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {jobSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="skill-tag">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Processing State */}
          {isProcessing && (
            <Card className="shadow-soft border-border mb-8 overflow-hidden">
              <div className="gradient-hero p-6 text-primary-foreground">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Brain className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold mb-1">
                      Analyzing Resumes with AI
                    </h3>
                    <p className="text-primary-foreground/80 text-sm">
                      Extracting skills and calculating match scores...
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Progress value={(analyzedCandidates.length / candidates.length) * 100} className="h-2 bg-white/20" />
                  <p className="text-sm text-primary-foreground/80">
                    {analyzedCandidates.length} of {candidates.length} candidates analyzed
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Candidate Cards */}
          <div className="space-y-4 mb-8">
            {isProcessing ? (
              candidates.map((candidate, index) => (
                <Card
                  key={candidate.id}
                  className={cn(
                    "shadow-soft border-border transition-all",
                    candidate.status === 'processing' && "ring-2 ring-primary"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        {candidate.status === 'processing' ? (
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        ) : candidate.status === 'analyzed' ? (
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.fileName}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {candidate.status === 'processing' ? (
                          <span className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-4 w-4" />
                            Analyzing...
                          </span>
                        ) : candidate.status === 'analyzed' ? (
                          <Badge className={cn("font-semibold", getScoreColor(candidate.matchScore || 0))}>
                            {candidate.matchScore}% Match
                          </Badge>
                        ) : (
                          "Waiting..."
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              analyzedCandidates.map((candidate, index) => (
                <Card
                  key={candidate.id}
                  className={cn(
                    "shadow-soft border-border card-hover",
                    index === 0 && "ring-2 ring-accent"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Rank & Avatar */}
                      <div className="flex items-center gap-4 md:gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg",
                          index === 0 ? "bg-accent text-accent-foreground" :
                          index === 1 ? "bg-secondary text-secondary-foreground" :
                          index === 2 ? "bg-warning text-warning-foreground" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="md:hidden">
                          <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">{candidate.fileName}</p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="hidden md:block mb-3">
                          <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">{candidate.fileName}</p>
                        </div>

                        {/* Matched Skills */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Matched Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.matchedSkills?.slice(0, 6).map((skill) => (
                              <Badge key={skill} variant="secondary" className="skill-tag-matched text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {(candidate.matchedSkills?.length || 0) > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.matchedSkills!.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Skills to Develop</p>
                            <div className="flex flex-wrap gap-1.5">
                              {candidate.missingSkills.slice(0, 4).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs text-muted-foreground">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="flex md:flex-col items-center gap-3 md:items-end">
                        <div className="flex-1 md:flex-none">
                          <div className={cn(
                            "px-4 py-2 rounded-xl border font-semibold text-center",
                            getScoreColor(candidate.matchScore || 0)
                          )}>
                            <div className="text-2xl">{candidate.matchScore}%</div>
                            <div className="text-xs font-normal">
                              {getScoreLabel(candidate.matchScore || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-32">
                          <Progress 
                            value={candidate.matchScore} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Disclaimer */}
          <Card className="bg-muted/50 border-border mb-8">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Important:</strong> This AI-powered system assists in the screening process. 
                Final hiring decisions should always be made by humans with careful consideration of all factors.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/upload")}
              className="flex-1"
            >
              <ArrowLeft className="h-5 w-5" />
              Upload More Resumes
            </Button>
            <Button
              size="lg"
              onClick={runAnalysis}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Re-analyze All
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
