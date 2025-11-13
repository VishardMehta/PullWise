import { DottedSurface } from "@/components/DottedSurface";
import { Button } from "@/components/ui/button";
import { Code2, GitPullRequest, Sparkles, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dotted Surface Background */}
      <DottedSurface />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Code Review</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              PullWise
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Automatically analyze pull requests, detect issues, and generate intelligent fix suggestions with advanced machine learning
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate("/auth")}>
                Get Started
                <GitPullRequest className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
                <Code2 className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Powerful Features for Modern Teams
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Sparkles className="w-8 h-8" />,
                  title: "AI Analysis",
                  description: "Advanced ML models detect issues and suggest fixes with natural language explanations"
                },
                {
                  icon: <GitPullRequest className="w-8 h-8" />,
                  title: "Git Integration",
                  description: "Seamless integration with GitHub and GitLab for automated PR reviews"
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "One-Click Fixes",
                  description: "Apply suggested fixes instantly in a sandboxed environment"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Static Analysis",
                  description: "Combine traditional static analyzers with AI for comprehensive coverage"
                },
                {
                  icon: <Code2 className="w-8 h-8" />,
                  title: "Auto Branching",
                  description: "Automatic branch creation and draft PR generation"
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Team Analytics",
                  description: "Track improvements and performance metrics across your team"
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all"
                >
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 mb-20">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Code Review?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join teams using PullWise to enhance software quality and save development time
            </p>
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
