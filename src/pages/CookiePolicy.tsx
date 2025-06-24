
import { Card, CardContent } from "@/components/ui/card";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Cookie Policy
          </h1>
          <p className="text-gray-600 text-lg">Understanding our cookie usage</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-gray-800 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
                Understanding Cookies
              </h2>
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-lg border border-indigo-200/50">
                <p className="text-gray-700 leading-relaxed">
                  This Cookie Policy provides comprehensive details about how Yusrai ("we," "us," or "our") uses cookies and similar tracking technologies when you engage with our website and utilize our powerful automation services. We believe in transparency and want you to be fully informed about our practices.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                How We Implement Cookies
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our use of cookies serves multiple purposes, all aimed at improving and personalizing your experience with Yusrai:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/60 p-4 rounded-lg border border-indigo-300/30">
                    <h4 className="text-indigo-700 font-semibold mb-2">Essential Site Functionality</h4>
                    <p className="text-gray-600 text-sm">Enable core operations, navigation, login sessions, and security features</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg border border-purple-300/30">
                    <h4 className="text-purple-700 font-semibold mb-2">Performance and Analytics</h4>
                    <p className="text-gray-600 text-sm">Collect data on interactions, performance monitoring, and site optimization</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
                Categories of Cookies We Utilize
              </h2>
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-lg border border-indigo-200/50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white/60 p-4 rounded-lg border border-indigo-300/30">
                      <h4 className="text-indigo-700 font-semibold mb-2">Essential Cookies</h4>
                      <p className="text-gray-600 text-sm">Core functionality, login sessions, and security features</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-purple-300/30">
                      <h4 className="text-purple-700 font-semibold mb-2">Performance Cookies</h4>
                      <p className="text-gray-600 text-sm">Analytics, performance monitoring, and site optimization</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/60 p-4 rounded-lg border border-blue-300/30">
                      <h4 className="text-blue-700 font-semibold mb-2">Functional Cookies</h4>
                      <p className="text-gray-600 text-sm">User preferences, language settings, and personalization</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-indigo-300/30">
                      <h4 className="text-indigo-700 font-semibold mb-2">Marketing Cookies</h4>
                      <p className="text-gray-600 text-sm">Targeted advertising and campaign effectiveness</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                Cookie Types
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 p-6 rounded-lg border border-purple-200/50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center bg-white/60 p-6 rounded-lg border border-indigo-300/30">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <h4 className="text-indigo-700 font-semibold mb-2">Session Cookies</h4>
                    <p className="text-gray-600 text-sm">Temporary cookies that expire when you close your browser</p>
                  </div>
                  <div className="text-center bg-white/60 p-6 rounded-lg border border-purple-300/30">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">P</span>
                    </div>
                    <h4 className="text-purple-700 font-semibold mb-2">Persistent Cookies</h4>
                    <p className="text-gray-600 text-sm">Remain on your device until manually deleted or expired</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
                Managing Your Preferences
              </h2>
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-lg border border-indigo-200/50">
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have control over cookie preferences through your browser settings:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/60 p-4 rounded-lg text-center border border-indigo-300/30">
                    <h5 className="text-indigo-700 font-semibold mb-2">Block All</h5>
                    <p className="text-gray-600 text-sm">Refuse all cookies automatically</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg text-center border border-purple-300/30">
                    <h5 className="text-purple-700 font-semibold mb-2">Alert Mode</h5>
                    <p className="text-gray-600 text-sm">Get notified before cookies are set</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg text-center border border-blue-300/30">
                    <h5 className="text-blue-700 font-semibold mb-2">Delete Existing</h5>
                    <p className="text-gray-600 text-sm">Remove previously stored cookies</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 p-6 rounded-lg border border-indigo-300/30 text-center">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-2">Questions about our cookie usage?</p>
              <a href="mailto:support@yusrai.com" className="text-indigo-600 hover:text-purple-600 transition-colors duration-300 underline">
                support@yusrai.com
              </a>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;
