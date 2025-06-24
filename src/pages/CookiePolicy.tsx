
import { Card, CardContent } from "@/components/ui/card";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Cookie Policy
          </h1>
          <p className="text-indigo-200 text-lg">Understanding our cookie usage</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/10 backdrop-blur-lg border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-white space-y-8">
            
            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full mr-3"></div>
                Understanding Cookies
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6 rounded-lg border border-indigo-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed">
                  Cookies are small data files placed on your device when you visit our website. They enable essential functionality, enhance user experience, and provide valuable analytics to improve our services.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                Cookie Categories
              </h2>
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-indigo-800/30 p-4 rounded-lg border border-indigo-400/20">
                      <h4 className="text-indigo-300 font-semibold mb-2 flex items-center">
                        <span className="w-3 h-3 bg-indigo-400 rounded-full mr-2"></span>
                        Essential Cookies
                      </h4>
                      <p className="text-gray-300 text-sm">Core functionality, login sessions, and security features</p>
                    </div>
                    <div className="bg-purple-800/30 p-4 rounded-lg border border-purple-400/20">
                      <h4 className="text-purple-300 font-semibold mb-2 flex items-center">
                        <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
                        Performance Cookies
                      </h4>
                      <p className="text-gray-300 text-sm">Analytics, performance monitoring, and site optimization</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-400/20">
                      <h4 className="text-blue-300 font-semibold mb-2 flex items-center">
                        <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                        Functional Cookies
                      </h4>
                      <p className="text-gray-300 text-sm">User preferences, language settings, and personalization</p>
                    </div>
                    <div className="bg-indigo-800/30 p-4 rounded-lg border border-indigo-400/20">
                      <h4 className="text-indigo-300 font-semibold mb-2 flex items-center">
                        <span className="w-3 h-3 bg-indigo-400 rounded-full mr-2"></span>
                        Marketing Cookies
                      </h4>
                      <p className="text-gray-300 text-sm">Targeted advertising and campaign effectiveness</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full mr-3"></div>
                Cookie Types
              </h2>
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6 rounded-lg border border-indigo-400/20 glow-effect">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <h4 className="text-indigo-300 font-semibold mb-2">Session Cookies</h4>
                    <p className="text-gray-300 text-sm">Temporary cookies that expire when you close your browser</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">P</span>
                    </div>
                    <h4 className="text-purple-300 font-semibold mb-2">Persistent Cookies</h4>
                    <p className="text-gray-300 text-sm">Remain on your device until manually deleted or expired</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                Managing Your Preferences
              </h2>
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-lg border border-purple-400/20 glow-effect">
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have control over cookie preferences through your browser settings:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-indigo-800/20 p-4 rounded-lg text-center">
                    <h5 className="text-indigo-300 font-semibold mb-2">Block All</h5>
                    <p className="text-gray-300 text-sm">Refuse all cookies automatically</p>
                  </div>
                  <div className="bg-purple-800/20 p-4 rounded-lg text-center">
                    <h5 className="text-purple-300 font-semibold mb-2">Alert Mode</h5>
                    <p className="text-gray-300 text-sm">Get notified before cookies are set</p>
                  </div>
                  <div className="bg-blue-800/20 p-4 rounded-lg text-center">
                    <h5 className="text-blue-300 font-semibold mb-2">Delete Existing</h5>
                    <p className="text-gray-300 text-sm">Remove previously stored cookies</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-indigo-800/30 to-purple-800/30 p-6 rounded-lg border border-indigo-400/20 text-center">
              <h3 className="text-xl font-semibold text-indigo-300 mb-2">Need Help?</h3>
              <p className="text-gray-300 mb-2">Questions about our cookie usage?</p>
              <a href="mailto:support@yusrai.com" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 underline">
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
