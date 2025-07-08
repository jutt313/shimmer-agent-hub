
import React from 'react';
import { Book, Code, Play, FileText } from 'lucide-react';

const DocumentationSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Book className="w-4 h-4" />
            <span className="text-sm font-medium">Documentation</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Everything You Need
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              to Get Started
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Code className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">API Documentation</h3>
            <p className="text-gray-600 mb-4">Complete API reference with examples</p>
            <button className="text-blue-500 font-medium">View API Docs →</button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Play className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quick Start Guide</h3>
            <p className="text-gray-600 mb-4">Get up and running in 5 minutes</p>
            <button className="text-green-500 font-medium">Start Tutorial →</button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <FileText className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Best Practices</h3>
            <p className="text-gray-600 mb-4">Learn from automation experts</p>
            <button className="text-purple-500 font-medium">Read Guides →</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentationSection;
