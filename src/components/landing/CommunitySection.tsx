
import React from 'react';
import { Users, MessageCircle, Book, Video } from 'lucide-react';

const CommunitySection = () => {
  return (
    <section id="community" className="py-20 px-6 bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Community & Support</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Join the
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Community
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Discord Community</h3>
            <p className="text-gray-600 mb-4">Connect with 25,000+ automation experts</p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-xl">Join Discord</button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <Book className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Knowledge Base</h3>
            <p className="text-gray-600 mb-4">500+ tutorials and guides</p>
            <button className="bg-green-500 text-white px-6 py-2 rounded-xl">Explore Docs</button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <Video className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
            <p className="text-gray-600 mb-4">Step-by-step video guides</p>
            <button className="bg-purple-500 text-white px-6 py-2 rounded-xl">Watch Now</button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
            <p className="text-gray-600 mb-4">24/7 human support team</p>
            <button className="bg-orange-500 text-white px-6 py-2 rounded-xl">Get Help</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
