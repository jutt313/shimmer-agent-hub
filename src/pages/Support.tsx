
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Support Center
          </h1>
          <p className="text-blue-200 text-lg">We're here to help you succeed</p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border border-blue-500/30 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500 hover:transform hover:scale-[1.02]">
            <CardContent className="p-6 text-white text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-300 mb-2">Email Support</h3>
              <p className="text-gray-300 mb-4">Get detailed help for complex issues</p>
              <a href="mailto:support@yusrai.com">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0">
                  Email Us
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border border-purple-500/30 shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-500 hover:transform hover:scale-[1.02]">
            <CardContent className="p-6 text-white text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-purple-300 mb-2">Support Form</h3>
              <p className="text-gray-300 mb-4">Structured assistance for faster resolution</p>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0">
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Support Card */}
        <Card className="bg-white/10 backdrop-blur-lg border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-white space-y-8">
            
            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full mr-3"></div>
                Frequently Asked Questions
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6 rounded-lg border border-indigo-400/20 glow-effect">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-indigo-800/20 p-4 rounded-lg border border-indigo-400/20">
                      <h4 className="text-indigo-300 font-semibold mb-2">🚀 Getting Started</h4>
                      <p className="text-gray-300 text-sm">Create your first automation and set up triggers</p>
                    </div>
                    <div className="bg-purple-800/20 p-4 rounded-lg border border-purple-400/20">
                      <h4 className="text-purple-300 font-semibold mb-2">🤖 AI Agents</h4>
                      <p className="text-gray-300 text-sm">Configure and optimize AI agents for tasks</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-blue-800/20 p-4 rounded-lg border border-blue-400/20">
                      <h4 className="text-blue-300 font-semibold mb-2">🔗 Integrations</h4>
                      <p className="text-gray-300 text-sm">Connect external services and manage credentials</p>
                    </div>
                    <div className="bg-indigo-800/20 p-4 rounded-lg border border-indigo-400/20">
                      <h4 className="text-indigo-300 font-semibold mb-2">💳 Billing</h4>
                      <p className="text-gray-300 text-sm">Subscription management and account settings</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                Documentation & Guides
              </h2>
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">📚</span>
                    </div>
                    <h4 className="text-indigo-300 font-semibold mb-2">User Manual</h4>
                    <p className="text-gray-300 text-sm">Complete platform guide</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">🎯</span>
                    </div>
                    <h4 className="text-purple-300 font-semibold mb-2">Blueprint Guide</h4>
                    <p className="text-gray-300 text-sm">Automation best practices</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">⚙️</span>
                    </div>
                    <h4 className="text-blue-300 font-semibold mb-2">API Tutorials</h4>
                    <p className="text-gray-300 text-sm">Integration instructions</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                Support Request Form
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-blue-400/20 glow-effect">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-blue-300 font-semibold mb-2">Your Name</label>
                      <div className="bg-white/10 border border-blue-400/30 rounded-lg p-3 text-gray-400">
                        [Input field for full name]
                      </div>
                    </div>
                    <div>
                      <label className="block text-purple-300 font-semibold mb-2">Email Address</label>
                      <div className="bg-white/10 border border-purple-400/30 rounded-lg p-3 text-gray-400">
                        [Required for communication]
                      </div>
                    </div>
                    <div>
                      <label className="block text-indigo-300 font-semibold mb-2">Category</label>
                      <div className="bg-white/10 border border-indigo-400/30 rounded-lg p-3 text-gray-400">
                        [Dropdown: Technical, Billing, Feature Request]
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-blue-300 font-semibold mb-2">Subject</label>
                      <div className="bg-white/10 border border-blue-400/30 rounded-lg p-3 text-gray-400">
                        [Brief description of issue]
                      </div>
                    </div>
                    <div>
                      <label className="block text-purple-300 font-semibold mb-2">Description</label>
                      <div className="bg-white/10 border border-purple-400/30 rounded-lg p-6 text-gray-400">
                        [Detailed description with steps to reproduce]
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 p-6 rounded-lg border border-blue-400/20 text-center">
              <h3 className="text-xl font-semibold text-blue-300 mb-2">Response Time</h3>
              <p className="text-gray-300 mb-2">We respond to all inquiries within 24-48 business hours</p>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">24h</div>
                  <div className="text-sm text-gray-300">Email Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">99%</div>
                  <div className="text-sm text-gray-300">Satisfaction Rate</div>
                </div>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
