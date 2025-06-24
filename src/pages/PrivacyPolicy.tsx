
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-lg">Your privacy is our commitment</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-gray-800 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                Your Privacy is Fundamental
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is a fundamental commitment at Yusrai. This Privacy Policy details how Yusrai ("we," "us," or "our") collects, utilizes, shares, and protects your personal information when you interact with and use our comprehensive services. We are dedicated to maintaining the trust you place in us by safeguarding your data.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Information We Collect
              </h2>
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-lg border border-blue-200/50">
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you engage with our services, we collect various types of information to ensure optimal performance and a tailored experience:
                </p>
                <div className="space-y-4">
                  <div className="bg-white/60 p-4 rounded-lg border border-blue-300/30">
                    <h4 className="text-blue-700 font-semibold mb-2">Account Information</h4>
                    <p className="text-gray-600 text-sm">Essential details required for your account setup and management, such as your full name, email address, and any necessary billing information for paid services.</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg border border-purple-300/30">
                    <h4 className="text-purple-700 font-semibold mb-2">Usage Data</h4>
                    <p className="text-gray-600 text-sm">Activity logs, actions taken within the service, features accessed, and interaction patterns, helping us understand user behavior and improve our offerings.</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg border border-blue-300/30">
                    <h4 className="text-blue-700 font-semibold mb-2">Communication Data</h4>
                    <p className="text-gray-600 text-sm">Content of communications through support channels, feedback forms, or survey responses to provide effective assistance and continually enhance our user support.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                How We Use Your Data
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The information we collect serves several crucial purposes aimed at delivering and enhancing your service experience:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/60 p-4 rounded-lg border border-purple-300/30">
                    <h4 className="text-purple-700 font-semibold mb-2">Service Provision and Improvement</h4>
                    <p className="text-gray-600 text-sm">Operate, maintain, and provide features while continuously analyzing and refining our offerings.</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg border border-blue-300/30">
                    <h4 className="text-blue-700 font-semibold mb-2">Personalization</h4>
                    <p className="text-gray-600 text-sm">Tailor content, features, and recommendations to your specific needs and preferences.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Data Security Measures
              </h2>
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-lg border border-blue-200/50">
                <p className="text-gray-700 leading-relaxed">
                  We are committed to protecting the security of your personal information. We implement a variety of industry-standard security measures, including encryption, access controls, and secure server environments, to help safeguard your data from unauthorized access, use, alteration, or disclosure. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                Your Data Rights
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed mb-4">
                  You maintain significant control over your personal data:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center bg-white/60 p-4 rounded-lg border border-blue-300/30">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <h4 className="text-blue-700 font-semibold mb-2">Access</h4>
                    <p className="text-gray-600 text-sm">Request access to your personal data</p>
                  </div>
                  <div className="text-center bg-white/60 p-4 rounded-lg border border-purple-300/30">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">C</span>
                    </div>
                    <h4 className="text-purple-700 font-semibold mb-2">Correction</h4>
                    <p className="text-gray-600 text-sm">Request corrections to inaccuracies</p>
                  </div>
                  <div className="text-center bg-white/60 p-4 rounded-lg border border-blue-300/30">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">D</span>
                    </div>
                    <h4 className="text-blue-700 font-semibold mb-2">Deletion</h4>
                    <p className="text-gray-600 text-sm">Request account and data deletion</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-purple-100/50 to-blue-100/50 p-6 rounded-lg border border-purple-300/30 text-center">
              <h3 className="text-xl font-semibold text-purple-700 mb-2">Contact Us</h3>
              <p className="text-gray-600 mb-2">Questions about this Privacy Policy?</p>
              <a href="mailto:privacy@yusrai.com" className="text-purple-600 hover:text-blue-600 transition-colors duration-300 underline">
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
