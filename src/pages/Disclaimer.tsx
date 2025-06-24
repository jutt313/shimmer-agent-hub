
import { Card, CardContent } from "@/components/ui/card";

const Disclaimer = () => {
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
            Disclaimer & Cookie Policy
          </h1>
          <p className="text-gray-600 text-lg">Important limitations, notices, and cookie usage</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-gray-800 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Disclaimer Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Disclaimer</h2>
              
              <section className="hover:transform hover:scale-[1.01] transition-all duration-300 mb-6">
                <h3 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
                  General Information Purpose
                </h3>
                <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-lg border border-indigo-200/50">
                  <p className="text-gray-700 leading-relaxed">
                    The entirety of the information, content, and materials presented or made available through our services is provided for general informational purposes only. While we endeavor to ensure that the information is current, accurate, and complete, Yusrai makes no representations or warranties of any kind, whether express, implied, statutory, or otherwise, regarding the completeness, accuracy, reliability, suitability, availability, or timeliness with respect to the services or the information, products, services, or related graphics contained within the services for any specific purpose. Any reliance you place on such information is, therefore, strictly at your own risk and discretion.
                  </p>
                </div>
              </section>

              <section className="hover:transform hover:scale-[1.01] transition-all duration-300 mb-6">
                <h3 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                  "As Is" and "As Available" Basis
                </h3>
                <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 p-6 rounded-lg border border-purple-200/50">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our services are provided to you on an "as is" and "as available" basis. Yusrai expressly disclaims all warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, freedom from interruption, freedom from computer virus, and warranties arising from a course of dealing or course of performance.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h5 className="text-yellow-700 font-semibold mb-2">Important Notice</h5>
                    <p className="text-gray-600 text-sm">
                      Yusrai shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
                    </p>
                  </div>
                </div>
              </section>

              <section className="hover:transform hover:scale-[1.01] transition-all duration-300 mb-6">
                <h3 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
                  External Links and Third-Party Content
                </h3>
                <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-lg border border-indigo-200/50">
                  <p className="text-gray-700 leading-relaxed">
                    Our services may contain links to external websites or content that are not owned, operated, or controlled by Yusrai. Please be aware that Yusrai has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party sites or services. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them. We strongly advise you to exercise caution and to review the terms and privacy policies of any third-party websites or services that you visit through links provided on our platform.
                  </p>
                </div>
              </section>
            </div>

            {/* Cookie Policy Section */}
            <div className="pt-8">
              <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Cookie Policy</h2>
              
              <section className="hover:transform hover:scale-[1.01] transition-all duration-300 mb-6">
                <h3 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                  Understanding Cookies
                </h3>
                <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 p-6 rounded-lg border border-purple-200/50">
                  <p className="text-gray-700 leading-relaxed">
                    Cookies are small data files that are placed on your computer, tablet, or mobile device when you visit a website. They contain information that can be read by the web server when you return to the site, allowing the website to recognize your browser and remember certain information. Cookies are a common and essential tool used across the internet to enable website functionality, enhance user experience, and gather valuable analytics.
                  </p>
                </div>
              </section>

              <section className="hover:transform hover:scale-[1.01] transition-all duration-300 mb-6">
                <h3 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
                  Categories of Cookies We Utilize
                </h3>
                <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 rounded-lg border border-indigo-200/50">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-white/60 p-4 rounded-lg border border-indigo-300/30">
                        <h4 className="text-indigo-700 font-semibold mb-2">Essential Cookies</h4>
                        <p className="text-gray-600 text-sm">Core functionality, login sessions, and security features</p>
                      </div>
                      <div className="bg-white/60 p-4 rounded-lg border border-purple-300/30">
                        <h4 className="text-purple-700 font-semibold mb-2">Performance Cookies</h4>
                        <p className="text-gray-600 text-sm">Analytics, performance monitoring, and site optimization</p>
                      </div>
                    </div>
                    <div className="space-y-3">
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
                <h3 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                  Managing Your Cookie Preferences
                </h3>
                <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 p-6 rounded-lg border border-purple-200/50">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have the power to control and manage your cookie preferences. Most web browsers are configured to accept cookies by default. However, you can typically modify your browser settings to refuse all cookies, alert you to cookies, or delete existing cookies. Please be aware that choosing to disable or remove cookies may impact your ability to fully utilize certain features and functionalities of our website and services.
                  </p>
                </div>
              </section>
            </div>

            <section className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 p-6 rounded-lg border border-indigo-300/30 text-center">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Questions About This Policy?</h3>
              <p className="text-gray-600 mb-2">Contact our legal team for clarifications</p>
              <a href="mailto:legal@yusrai.com" className="text-indigo-600 hover:text-purple-600 transition-colors duration-300 underline">
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
