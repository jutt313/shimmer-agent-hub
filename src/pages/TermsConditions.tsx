
import { Card, CardContent } from "@/components/ui/card";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Terms & Conditions
          </h1>
          <p className="text-purple-200 text-lg">Legal framework for our services</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/10 backdrop-blur-lg border border-blue-500/30 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-white space-y-8">
            
            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-3"></div>
                Acceptance of Terms
              </h2>
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-blue-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed">
                  By accessing or using any part of our Services, you constitute your unequivocal acceptance and agreement to be bound by these Terms and our Privacy Policy. Your continued use signifies ongoing agreement to these conditions.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                Services Description
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Yusrai offers sophisticated AI-powered workflow automation tools designed to streamline operations:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-800/20 p-4 rounded-lg border border-blue-400/20 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">AI</span>
                    </div>
                    <h4 className="text-blue-300 font-semibold mb-2">AI Automation</h4>
                    <p className="text-gray-300 text-sm">Intelligent workflow automation</p>
                  </div>
                  <div className="bg-purple-800/20 p-4 rounded-lg border border-purple-400/20 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                    <h4 className="text-purple-300 font-semibold mb-2">Analytics</h4>
                    <p className="text-gray-300 text-sm">Performance monitoring dashboards</p>
                  </div>
                  <div className="bg-blue-800/20 p-4 rounded-lg border border-blue-400/20 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">🔗</span>
                    </div>
                    <h4 className="text-blue-300 font-semibold mb-2">Integrations</h4>
                    <p className="text-gray-300 text-sm">Third-party API connections</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-3"></div>
                Account Responsibilities
              </h2>
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-blue-400/20 glow-effect">
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Provide accurate and complete registration information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Maintain confidentiality of account credentials</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Notify us immediately of unauthorized access</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                Intellectual Property
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed">
                  All intellectual property rights in the Services, including copyrights, trademarks, patents, and proprietary rights, remain the exclusive property of Yusrai or its licensors. You retain ownership of your User Data while granting us necessary licenses to provide our services.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 p-6 rounded-lg border border-blue-400/20 text-center">
              <h3 className="text-xl font-semibold text-blue-300 mb-2">Questions?</h3>
              <p className="text-gray-300 mb-2">Contact us regarding these Terms & Conditions</p>
              <a href="mailto:terms@yusrai.com" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 underline">
                terms@yusrai.com
              </a>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsConditions;
