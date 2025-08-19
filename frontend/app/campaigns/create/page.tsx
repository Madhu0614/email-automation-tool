'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

export default function CreateCampaignPage() {
  const router = useRouter();

  const [campaignName, setCampaignName] = useState('');
  const [emailLists, setEmailLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmailLists = async () => {
      const { data, error } = await supabase
        .from('uploads')
        .select('filename')
        .like('storage_path', 'uploads/%');

      if (error) {
        console.error('Error fetching files:', error.message);
      } else {
        const csvs = data
          .filter((item) => item.filename.endsWith('.csv'))
          .map((item) => item.filename);
        setEmailLists(csvs);
      }
      setLoading(false);
    };

    fetchEmailLists();
  }, []);

  const handleNext = () => {
    if (!campaignName.trim() || !selectedList) return;
    localStorage.setItem('campaignName', campaignName);
    localStorage.setItem('selectedFile', selectedList);
    router.push('/campaigns/create/content');
  };

  const handleBack = () => {
    router.push('/campaigns');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-xl"
        >
          <p className="text-blue-600 font-semibold text-sm mb-1">Step 1 of 3</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Your Campaign</h1>

          <div className="space-y-6">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                placeholder="e.g. August Promo Blast"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Select Email List (CSV)</Label>
              <Select onValueChange={setSelectedList}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={loading ? 'Loading...' : 'Choose a CSV file'} />
                </SelectTrigger>
                <SelectContent>
                  {emailLists.length > 0 ? (
                    emailLists.map((file) => (
                      <SelectItem key={file} value={file}>
                        {file}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-muted text-sm">No CSV files found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Button
                disabled={!campaignName.trim() || !selectedList}
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
              >
                Next
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
