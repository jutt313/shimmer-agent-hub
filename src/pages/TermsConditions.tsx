
import { Card, CardContent } from "@/components/ui/card";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-16 h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Terms & Conditions
          </h1>
          <p className="text-gray-600 text-lg">Legal framework for our services</p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-scale-in">
          <CardContent className="p-8 text-gray-800 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Welcome to Yusrai
              </h2>
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-lg border border-blue-200/50">
                <p className="text-gray-700 leading-relaxed">
                  These comprehensive Terms and Conditions, alongside our Privacy Policy, constitute a legally binding agreement that governs your access to and your utilization of all services, products, software, and our website (collectively referred to as the "Services") provided by Yusrai ("we," "us," or "our"). It is critically important that you thoroughly review these Terms before you begin accessing or using any part of our Services. Your decision to access or use our Services signifies your full and unreserved agreement to comply with and be bound by these Terms in their entirety. Should you find yourself unable to agree with any part of these Terms, you are expressly prohibited from accessing or continuing to use our Services.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                Acceptance of These Terms
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed">
                  By creating an account with Yusrai, logging in, or by accessing, Browse, or otherwise utilizing any aspect or feature of the Services, you unequivocally acknowledge that you have read, understood, and hereby accept and agree to be legally bound by these Terms and our Privacy Policy, which is incorporated herein by reference. If you are accepting these Terms on behalf of a company, organization, or any other legal entity, you explicitly represent and warrant that you possess the full legal authority to bind such entity to these Terms. In such a case, the terms "you" and "your" will refer to that entity. You confirm that you are of legal age to form a binding contract with Yusrai, or that you have obtained parental or guardian consent if you are a minor where such consent is required.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Modifications and Revisions to Our Terms
              </h2>
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-lg border border-blue-200/50">
                <p className="text-gray-700 leading-relaxed">
                  Yusrai reserves the sole and exclusive right, at any time and in our absolute discretion, to modify, update, or replace any part of these Terms. We may or may not provide explicit prior notice of such changes. Any revisions or amendments to these Terms will become immediately effective upon their posting on this page of our website. While we may endeavor to provide reasonable notice of significant changes, particularly those that may materially alter your rights or obligations, it remains your personal and ongoing responsibility to periodically review these Terms to stay informed of any and all updates. Your continued access to or use of the Services subsequent to the posting of any revised or updated Terms will be unequivocally deemed as your explicit and unconditional acceptance of those new, modified Terms. Should you disagree with any new modifications, your sole recourse is to discontinue your use of the Services.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                Detailed Description of Our Services
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed">
                  Yusrai is dedicated to empowering individuals and businesses through advanced automation. We offer a sophisticated and dynamic suite of intelligent workflow automation tools. Our Services are designed to dramatically streamline operations, enhance efficiency, and foster innovation for a diverse range of users, including businesses of all sizes and individual developers. Our comprehensive Services encompass a wide array of functionalities, including but not limited to, robust and intuitive user management capabilities, advanced and insightful analytics dashboards engineered to monitor and provide critical insights into performance metrics, and seamless, powerful integrations with various third-party applications and platforms via sophisticated programming interfaces. We strive to provide a versatile and scalable solution for your automation needs.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Account Registration, Security, and Access
              </h2>
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-lg border border-blue-200/50">
                <p className="text-gray-700 leading-relaxed">
                  To access and fully utilize many of the features and functionalities within our Services, you may be required to complete an account registration process. You commit to providing accurate, complete, and current information as requested during registration and to promptly update such information to maintain its accuracy throughout your ongoing use of the Services. The confidentiality and security of your account credentials (such as your username and password) are your strict responsibility. You are solely and exclusively accountable for all activities, actions, and transactions that occur under your account, regardless of whether such activities were authorized by you or not. You must notify Yusrai immediately upon becoming aware of any unauthorized access to or use of your account, any breach of your account's security, or any suspicious activity related to your credentials. Yusrai cannot and will not be liable for any loss or damage arising from your failure to comply with this section.
                </p>
              </div>
            </section>

            <section className="hover:transform hover:scale-[1.01] transition-all duration-300">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                Intellectual Property Rights
              </h2>
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <p className="text-gray-700 leading-relaxed">
                  All intellectual property rights associated with the Services, including but not limited to all copyrights, trademarks, patents, trade secrets, algorithms, designs, graphics, text, software, platform architecture, visual interfaces, logos, and all other proprietary rights, whether registered or unregistered, are and shall remain the exclusive property of Yusrai or its respective licensors. Nothing in these Terms grants you any right, title, or interest in or to the intellectual property rights of Yusrai, except for the limited license granted herein. You are expressly prohibited from using our trademarks, service marks, logos, or any other branding elements, whether registered or unregistered, without our explicit prior written permission. Unauthorized reproduction, distribution, modification, or public display of any part of the Services or their content is strictly forbidden.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 p-6 rounded-lg border border-blue-300/30 text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Questions About These Terms?</h3>
              <p className="text-gray-600 mb-2">Contact us regarding these Terms & Conditions</p>
              <a href="mailto:terms@yusrai.com" className="text-blue-600 hover:text-purple-600 transition-colors duration-300 underline">
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
