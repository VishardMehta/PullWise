import { DottedSurface } from "@/components/DottedSurface";
import { Footer } from "@/components/Footer";
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
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
                onClick={() => window.open("https://github.com/VishardMehta/PullWise#readme", "_blank")}
              >
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
                  description: "Advanced ML models detect issues and suggest fixes with natural language explanations",
                  color: "bg-purple-500/20",
                  iconColor: "text-purple-400"
                },
                {
                  icon: <GitPullRequest className="w-8 h-8" />,
                  title: "Git Integration",
                  description: "Seamless integration with GitHub and GitLab for automated PR reviews",
                  color: "bg-blue-500/20",
                  iconColor: "text-blue-400"
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "One-Click Fixes",
                  description: "Apply suggested fixes instantly in a sandboxed environment",
                  color: "bg-yellow-500/20",
                  iconColor: "text-yellow-400"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Static Analysis",
                  description: "Combine traditional static analyzers with AI for comprehensive coverage",
                  color: "bg-green-500/20",
                  iconColor: "text-green-400"
                },
                {
                  icon: <Code2 className="w-8 h-8" />,
                  title: "Auto Branching",
                  description: "Automatic branch creation and draft PR generation",
                  color: "bg-pink-500/20",
                  iconColor: "text-pink-400"
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Team Analytics",
                  description: "Track improvements and performance metrics across your team",
                  color: "bg-indigo-500/20",
                  iconColor: "text-indigo-400"
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all"
                >
                  <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                    <div className={feature.iconColor}>{feature.icon}</div>
                  </div>
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
      
      <Footer />
    </div>
  );
};

export default Index;
