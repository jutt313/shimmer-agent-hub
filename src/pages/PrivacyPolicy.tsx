
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Privacy Policy
          </h1>
          <p className="text-blue-200 text-lg">Your privacy is our commitment</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/10 backdrop-blur-lg border border-purple-500/30 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-white space-y-8">
            
            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                Information We Collect
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you engage with our services, we collect various types of information to ensure optimal performance and a tailored experience:
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong className="text-blue-300">Account Information:</strong> Essential details for account setup including name, email, and billing information.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong className="text-purple-300">Usage Data:</strong> Activity logs, interactions, and feature usage patterns.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong className="text-blue-300">Communication Data:</strong> Support communications and feedback content.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-3"></div>
                How We Use Your Data
              </h2>
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-blue-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Your data serves several crucial purposes aimed at delivering and enhancing your service experience:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-800/20 p-4 rounded-lg border border-purple-400/20">
                    <h4 className="text-purple-300 font-semibold mb-2">Service Enhancement</h4>
                    <p className="text-gray-300 text-sm">Operate, maintain, and improve our platform features and performance.</p>
                  </div>
                  <div className="bg-blue-800/20 p-4 rounded-lg border border-blue-400/20">
                    <h4 className="text-blue-300 font-semibold mb-2">Personalization</h4>
                    <p className="text-gray-300 text-sm">Tailor content and recommendations to your preferences.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                Data Security
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed">
                  We implement industry-standard security measures including encryption, access controls, and secure server environments to protect your data from unauthorized access, use, or disclosure.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-3"></div>
                Your Rights
              </h2>
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-blue-400/20 glow-effect">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <h4 className="text-blue-300 font-semibold mb-2">Access</h4>
                    <p className="text-gray-300 text-sm">Request access to your personal data</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">C</span>
                    </div>
                    <h4 className="text-purple-300 font-semibold mb-2">Correction</h4>
                    <p className="text-gray-300 text-sm">Request corrections to inaccuracies</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">D</span>
                    </div>
                    <h4 className="text-blue-300 font-semibold mb-2">Deletion</h4>
                    <p className="text-gray-300 text-sm">Request account and data deletion</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 p-6 rounded-lg border border-purple-400/20 text-center">
              <h3 className="text-xl font-semibold text-purple-300 mb-2">Contact Us</h3>
              <p className="text-gray-300 mb-2">Questions about this Privacy Policy?</p>
              <a href="mailto:privacy@yusrai.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 underline">
                privacy@yusrai.com
              </a>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
