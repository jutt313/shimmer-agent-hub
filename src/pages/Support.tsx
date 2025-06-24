import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const Support = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    category: "",
    automationId: "",
    description: "",
    files: null as File[] | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Support request submitted:", formData);
    // Handle form submission here
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, files: Array.from(e.target.files!) }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
            alt="Yusrai Logo" 
            className="w-20 h-20 mx-auto mb-6 hover:scale-110 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to Yusrai Support
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            We are committed to ensuring you have a seamless and productive experience with our automation services. For any questions, technical issues, or personalized assistance, please reach out to our dedicated support team using the form below.
          </p>
        </div>

        {/* Support Request Form */}
        <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-scale-in mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">Support Request Form</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Your Full Name *</label>
                  <Input
                    type="text"
                    placeholder="Please provide your complete name"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                    className="bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <p className="text-sm text-gray-500 mt-1">Please provide your full name as registered with your Yusrai account</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Your Email Address *</label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <p className="text-sm text-gray-500 mt-1">This email will be used for all communication regarding your support request</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Subject of Your Inquiry *</label>
                  <Input
                    type="text"
                    placeholder="e.g., Login Issue, Automation Failure, Billing Question"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    className="bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category of Inquiry *</label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select the category that best describes your issue" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="general">General Question</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing & Subscription</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="account">Account Management</SelectItem>
                      <SelectItem value="automation">Automation Issues</SelectItem>
                      <SelectItem value="agent">AI Agent Problems</SelectItem>
                      <SelectItem value="notifications">Notifications</SelectItem>
                      <SelectItem value="errors">Error Reports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Related Automation ID (Optional)</label>
                <Input
                  type="text"
                  placeholder="If your inquiry pertains to a specific automation, please provide its ID"
                  value={formData.automationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, automationId: e.target.value }))}
                  className="bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <p className="text-sm text-gray-500 mt-1">Providing the automation ID helps us investigate faster</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Describe Your Issue or Question *</label>
                <Textarea
                  placeholder="Please provide a detailed description of your issue or question. Include any steps you took before encountering the problem, exact error messages, the expected outcome versus what happened, and any solutions you've already tried."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={6}
                  className="bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Attach Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white/80 border border-gray-300 rounded-lg p-2"
                  accept=".jpg,.jpeg,.png,.pdf,.txt,.log"
                />
                <p className="text-sm text-gray-500 mt-1">You can upload screenshots, relevant logs, or any documents that might help us understand your issue better</p>
              </div>

              <div className="text-center">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Submit Support Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Other Ways to Get Help */}
        <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-6 text-center">Other Ways to Get Help</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-lg border border-blue-200/50">
                <h3 className="text-xl font-semibold text-blue-700 mb-3">Email Us Directly</h3>
                <p className="text-gray-600 mb-4">For less urgent matters or general questions, you can always email our team at:</p>
                <a href="mailto:support@yusrai.com" className="text-blue-600 hover:text-purple-600 transition-colors duration-300 underline font-semibold">
                  support@yusrai.com
                </a>
                <p className="text-sm text-gray-500 mt-2">We aim to respond to all email inquiries within 24-48 business hours</p>
              </div>
              
              <div className="text-center bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-6 rounded-lg border border-purple-200/50">
                <h3 className="text-xl font-semibold text-purple-700 mb-3">Documentation & Guides</h3>
                <p className="text-gray-600 mb-4">Dive deeper into Yusrai's capabilities with our detailed guides:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-600">• Frequently Asked Questions (FAQs)</div>
                  <div className="text-gray-600">• User manuals and tutorials</div>
                  <div className="text-gray-600">• Automation best practices</div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Response Time Commitment</h3>
              <p className="text-gray-600 mb-4">We respond to all inquiries within 24-48 business hours</p>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">24h</div>
                  <div className="text-sm text-gray-500">Email Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">99%</div>
                  <div className="text-sm text-gray-500">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
