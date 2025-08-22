'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Loader2 } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

interface EmailList {
  id: number;
  name: string;
  count: number;
  description: string;
}

export default function CreateCampaignPage() {
  const router = useRouter();

  const [campaignName, setCampaignName] = useState('');
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  // Load saved form data on component mount
  useEffect(() => {
    const savedCampaignName = localStorage.getItem('campaignName');
    const savedSelectedList = localStorage.getItem('selectedListId');

    if (savedCampaignName) {
      setCampaignName(savedCampaignName);
    }
    if (savedSelectedList) {
      setSelectedList(savedSelectedList);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (campaignName) {
      localStorage.setItem('campaignName', campaignName);
    }
  }, [campaignName]);

  useEffect(() => {
    if (selectedList) {
      localStorage.setItem('selectedListId', selectedList);
    }
  }, [selectedList]);

  useEffect(() => {
    const fetchEmailLists = async () => {
      try {
        setIsLoadingLists(true);
        const { data, error } = await supabase
          .from('email_lists')
          .select('id, name, count, description')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching email lists:', error);
        } else {
          setEmailLists(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoadingLists(false);
      }
    };

    fetchEmailLists();
  }, []);

  const handleNext = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    if (!selectedList) {
      alert('Please select an email list');
      return;
    }

    setLoading(true);
    
    try {
      // Check if we're editing an existing campaign
      const existingCampaignId = localStorage.getItem('campaignId');
      
      let campaignId;
      
      if (existingCampaignId) {
        // Update existing campaign
        const { error } = await supabase
          .from('campaigns')
          .update({
            name: campaignName,
            email_list_id: Number(selectedList),
            updated_at: new Date().toISOString()
          })
          .eq('id', Number(existingCampaignId));

        if (error) {
          throw new Error(`Failed to update campaign: ${error.message}`);
        }
        
        campaignId = existingCampaignId;
      } else {
        // Create new campaign
        const { data, error } = await supabase
          .from('campaigns')
          .insert([
            {
              name: campaignName,
              email_list_id: Number(selectedList),
              status: 'draft',
              created_at: new Date().toISOString()
            }
          ])
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to create campaign: ${error.message}`);
        }
        
        campaignId = data.id;
      }

      // Store campaign data in localStorage for next steps
      localStorage.setItem('campaignId', campaignId);
      localStorage.setItem('campaignName', campaignName);
      localStorage.setItem('selectedListId', selectedList);
      
      // Navigate to step 2 (content creation)
      router.push('/campaigns/create/content');
      
    } catch (err) {
      console.error('Error with campaign:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/campaigns');
  };

  // Clear form data
  const clearFormData = () => {
    setCampaignName('');
    setSelectedList('');
    localStorage.removeItem('campaignName');
    localStorage.removeItem('selectedListId');
    localStorage.removeItem('campaignId');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-2xl"
        >
          <p className="text-blue-600 font-semibold text-sm mb-1">Step 1 of 3</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Campaign</h1>
          <p className="text-gray-600 mb-8">Choose your campaign settings and select an email list to get started.</p>

          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <Label htmlFor="campaignName" className="text-base font-medium">
                Campaign Name *
              </Label>
              <Input
                id="campaignName"
                placeholder="e.g. August Promo Blast, Newsletter #42, Black Friday Sale"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="mt-2 h-12"
                disabled={loading}
              />
            </div>

            {/* Email List Selection */}
            <div>
              <Label className="text-base font-medium">
                Select Email List *
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Choose which email list to send this campaign to
              </p>
              
              <Select 
                value={selectedList} 
                onValueChange={setSelectedList} 
                disabled={loading || isLoadingLists}
              >
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue 
                    placeholder={
                      isLoadingLists 
                        ? 'Loading email lists...' 
                        : emailLists.length === 0 
                        ? 'No email lists available' 
                        : 'Choose an email list'
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {emailLists.length > 0 ? (
                    emailLists.map((list) => (
                      <SelectItem key={list.id} value={String(list.id)}>
                        <div className="flex flex-col py-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {list.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {list.count?.toLocaleString() || 0} contacts
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : !isLoadingLists ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">No email lists found</p>
                      <p className="text-xs text-gray-400">
                        Create an email list first before starting a campaign
                      </p>
                    </div>
                  ) : null}
                </SelectContent>
              </Select>

              {/* No Lists Available Message */}
              {!isLoadingLists && emailLists.length === 0 && (
                <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700 mb-3">
                    You need to create an email list with contacts before you can start a campaign.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/upload')}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    Create Email List
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-8 border-t">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6"
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Campaigns
                </Button>
                
                {/* Clear form button (optional) */}
                {(campaignName || selectedList) && (
                  <Button
                    variant="ghost"
                    onClick={clearFormData}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    Clear Form
                  </Button>
                )}
              </div>
              
              <Button
                disabled={!campaignName.trim() || !selectedList || loading || isLoadingLists}
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {localStorage.getItem('campaignId') ? 'Updating...' : 'Creating Campaign...'}
                  </>
                ) : (
                  'Continue to Content →'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
