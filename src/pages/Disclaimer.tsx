
import { Card, CardContent } from "@/components/ui/card";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Disclaimer
          </h1>
          <p className="text-purple-200 text-lg">Important limitations and notices</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/10 backdrop-blur-lg border border-purple-500/30 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-white space-y-8">
            
            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                General Information Purpose
              </h2>
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed">
                  All information, content, and materials provided through our services are for general informational purposes only. While we strive for accuracy, Yusrai makes no representations or warranties regarding completeness, accuracy, or reliability of any information.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full mr-3"></div>
                "As Is" Service Provision
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6 rounded-lg border border-indigo-400/20 glow-effect">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-purple-800/20 p-4 rounded-lg border border-purple-400/20">
                    <h4 className="text-purple-300 font-semibold mb-3">No Warranties</h4>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li>• Merchantability</li>
                      <li>• Fitness for purpose</li>
                      <li>• Non-infringement</li>
                      <li>• Uninterrupted access</li>
                    </ul>
                  </div>
                  <div className="bg-indigo-800/20 p-4 rounded-lg border border-indigo-400/20">
                    <h4 className="text-indigo-300 font-semibold mb-3">Service Limitations</h4>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li>• Error-free operation</li>
                      <li>• Virus-free environment</li>
                      <li>• Continuous availability</li>
                      <li>• Complete security</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                Limitation of Liability
              </h2>
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <div className="bg-red-900/20 border border-red-400/30 p-4 rounded-lg mb-4">
                  <h4 className="text-red-300 font-semibold mb-2 flex items-center">
                    <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                    Important Notice
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Yusrai shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">💰</span>
                    </div>
                    <h5 className="text-purple-300 font-semibold mb-2">Financial Losses</h5>
                    <p className="text-gray-300 text-sm">Loss of profits or revenue</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                    <h5 className="text-indigo-300 font-semibold mb-2">Data Issues</h5>
                    <p className="text-gray-300 text-sm">Loss of data or use</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full mr-3"></div>
                Third-Party Content
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6 rounded-lg border border-indigo-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our services may contain links to external websites or content not owned by Yusrai. We assume no responsibility for third-party content, privacy policies, or practices.
                </p>
                <div className="bg-yellow-900/20 border border-yellow-400/30 p-4 rounded-lg">
                  <h5 className="text-yellow-300 font-semibold mb-2">⚠️ User Responsibility</h5>
                  <p className="text-gray-300 text-sm">
                    Please review terms and privacy policies of any third-party sites you visit through our platform.
                  </p>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                Professional Advice
              </h2>
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed">
                  Our content is not intended as professional advice. Always consult qualified professionals for legal, financial, medical, or technical matters specific to your situation.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 p-6 rounded-lg border border-purple-400/20 text-center">
              <h3 className="text-xl font-semibold text-purple-300 mb-2">Questions About This Disclaimer?</h3>
              <p className="text-gray-300 mb-2">Contact our legal team for clarifications</p>
              <a href="mailto:legal@yusrai.com" className="text-indigo-400 hover:text-indigo-300 transition-colors duration-300 underline">
                legal@yusrai.com
              </a>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Disclaimer;
