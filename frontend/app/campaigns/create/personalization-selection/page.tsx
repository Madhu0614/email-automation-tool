'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, Mail, Sparkles, Target, BarChart3 } from 'lucide-react';

export default function PersonalizationSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'content' | 'personalization' | null>(null);
  const [campaignName, setCampaignName] = useState<string>('Your Campaign'); // ✅ state for campaignName

  // Check if we have campaign data
  useEffect(() => {
    const campaignId = localStorage.getItem('campaignId');
    const storedCampaignName = localStorage.getItem('campaignName');
    
    if (!campaignId || !storedCampaignName) {
      router.push('/campaigns/create');
      return;
    }

    setCampaignName(storedCampaignName); // ✅ safely set name here
  }, [router]);

  const handleOptionSelect = (option: 'content' | 'personalization') => {
    setSelectedOption(option);
  };

  const handleContinue = async () => {
    if (!selectedOption) {
      alert('Please select a personalization option');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('personalizationType', selectedOption);
      router.push(
        selectedOption === 'content'
          ? '/campaigns/create/content'
          : '/campaigns/create/personalization'
      );
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/campaigns/create');
  };


  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-4xl"
        >
          <p className="text-blue-600 font-semibold text-sm mb-1">Step 2 of 3</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Approach</h1>
          <p className="text-gray-600 mb-2">
            How would you like to create content for <span className="font-semibold text-gray-900">"{campaignName}"</span>?
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Select between standard content creation or AI-powered personalization for better engagement.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Standard Content Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedOption === 'content' 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleOptionSelect('content')}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  selectedOption === 'content' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Mail className={`h-8 w-8 ${
                    selectedOption === 'content' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <CardTitle className="text-xl">Standard Content</CardTitle>
                <CardDescription className="text-sm">
                  Create a single email template that will be sent to all recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Quick and easy setup</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Consistent message to all recipients</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Perfect for announcements and promotions</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Full control over content and design</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Best for:</p>
                  <p className="text-xs text-gray-500">
                    Newsletters, announcements, product launches, event invitations
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Personalization Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                selectedOption === 'personalization' 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleOptionSelect('personalization')}
            >
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                AI POWERED
              </div>
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  selectedOption === 'personalization' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Sparkles className={`h-8 w-8 ${
                    selectedOption === 'personalization' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <CardTitle className="text-xl">AI Personalization</CardTitle>
                <CardDescription className="text-sm">
                  Create personalized emails tailored to each recipient using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Personalized subject lines and content</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Higher engagement and open rates</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Smart content recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-600">Automated A/B testing insights</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700 font-medium mb-1">Best for:</p>
                  <p className="text-xs text-purple-600">
                    Sales outreach, customer retention, product recommendations
                  </p>
                </div>

                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>Better targeting</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>Higher ROI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Option Preview */}
          {selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 ${
                selectedOption === 'content' ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedOption === 'content' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {selectedOption === 'content' ? (
                    <Mail className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className={`font-medium text-sm ${
                    selectedOption === 'content' ? 'text-blue-700' : 'text-purple-700'
                  }`}>
                    {selectedOption === 'content' ? 'Standard Content Selected' : 'AI Personalization Selected'}
                  </p>
                  <p className={`text-xs ${
                    selectedOption === 'content' ? 'text-blue-600' : 'text-purple-600'
                  }`}>
                    {selectedOption === 'content' 
                      ? 'You\'ll create one email template for all recipients'
                      : 'AI will help personalize content for each recipient'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2 px-6"
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Setup
            </Button>
            
            <Button
              disabled={!selectedOption || loading}
              onClick={handleContinue}
              className={`px-8 ${
                selectedOption === 'content'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  : selectedOption === 'personalization'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                  : 'bg-gray-400'
              } text-white`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Continue to {selectedOption === 'content' ? 'Content' : 'Personalization'} →
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-8 h-1 bg-blue-500 rounded"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
