'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Plus,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Eye,
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';// adjust the path as per your project
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:3000'; // Update this if deployed

const campaigns = [
  {
    id: 1,
    name: 'Summer Sale 2024',
    subject: '🌞 Summer Sale: 50% Off Everything!',
    status: 'active',
    recipients: 12847,
    sent: 8234,
    opens: 2456,
    clicks: 567,
    created: '2 days ago',
    scheduled: 'Now',
  },
  {
    id: 2,
    name: 'Product Launch Announcement',
    subject: '🚀 Introducing Our Latest Innovation',
    status: 'completed',
    recipients: 5432,
    sent: 5432,
    opens: 1834,
    clicks: 432,
    created: '1 week ago',
    scheduled: '1 week ago',
  },
  {
    id: 3,
    name: 'Newsletter #47',
    subject: 'Weekly Newsletter - Industry Updates',
    status: 'scheduled',
    recipients: 15234,
    sent: 0,
    opens: 0,
    clicks: 0,
    created: '3 days ago',
    scheduled: 'Tomorrow 9 AM',
  },
  {
    id: 4,
    name: 'Welcome Series - Email 1',
    subject: 'Welcome to our community! 👋',
    status: 'draft',
    recipients: 0,
    sent: 0,
    opens: 0,
    clicks: 0,
    created: '5 days ago',
    scheduled: 'Not scheduled',
  },
];

type EmailAccount = {
  id: number;
  user_email: string;
  from_name: string;
  is_active: boolean;
  // Add others if needed
};
export default function CampaignsPage() {
  const [emailLists, setEmailLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmailList, setSelectedEmailList] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [selectedSender, setSelectedSender] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<EmailAccount[]>([]);
  const router = useRouter(); 


  useEffect(() => {
    const fetchEmailLists = async () => {
      const { data, error } = await supabase
        .from('uploads')
        .select('filename')
        .like('storage_path', 'uploads/%'); // Only files from uploads folder

      if (error) {
        console.error('Error fetching filenames:', error.message);
      } else {
        const csvFiles = data
          .filter((item) => item.filename.endsWith('.csv'))
          .map((item) => item.filename); // just the filename

        setEmailLists(csvFiles);
      }

      setLoading(false);
    };

    fetchEmailLists();
  }, []);

  const handleSelect = (value: string) => {
    setSelectedList(value);
    console.log('Selected file:', value);
    // You can add logic here to load CSV data or pass to next campaign step
  };


  const onSelect = (value: string) => {
    setSelectedEmailList(value);
    console.log('Selected email list:', value);
  };


  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from('email_configs')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Supabase fetch error:', error);
        return;
      }

      setEmailAccounts(data);
    };

    fetchAccounts();
  }, []);

    const toggleAccount = (account: EmailAccount) => {
    const isAlreadySelected = selectedAccounts.some(a => a.id === account.id);
    if (isAlreadySelected) {
      setSelectedAccounts(prev =>
        prev.filter(a => a.id !== account.id)
      );
    } else {
      setSelectedAccounts(prev => [...prev, account]);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'draft':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };



return (
  <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
    <Sidebar />

    <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">Email Campaigns</h1>
                <p className="text-gray-600 mt-2 text-sm">
                  Create and manage your email marketing campaigns
                </p>
              </div>
    <Button
      className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl transition"
      onClick={() => router.push('/campaigns/create')}
    >
      <Plus className="w-4 h-4 mr-2" />
      New Campaign
    </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[{
              title: 'Total Campaigns',
              value: '24',
              icon: <Target className="w-6 h-6 text-white" />,
              color: 'from-blue-500 to-blue-600'
            }, {
              title: 'Active Now',
              value: '3',
              icon: <Play className="w-6 h-6 text-white" />,
              color: 'from-green-500 to-green-600'
            }, {
              title: 'Scheduled',
              value: '5',
              icon: <Calendar className="w-6 h-6 text-white" />,
              color: 'from-yellow-500 to-yellow-600'
            }, {
              title: 'Avg. Open Rate',
              value: '32.4%',
              icon: <TrendingUp className="w-6 h-6 text-white" />,
              color: 'from-purple-500 to-purple-600'
            }].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
              >
                <Card className="hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                        {card.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Campaigns</CardTitle>
                <CardDescription>
                  Manage all your email campaigns in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign, index) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-4">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                            <Badge
                              variant="secondary"
                              className={getStatusColor(campaign.status)}
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                          <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {campaign.recipients.toLocaleString()} recipients
                            </div>
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {campaign.sent.toLocaleString()} sent
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {campaign.opens.toLocaleString()} opens
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              {campaign.clicks.toLocaleString()} clicks
                            </div>
                            <span>Created {campaign.created}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {campaign.status === 'active' && (
                          <Button variant="ghost" size="sm">
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {campaign.status === 'scheduled' && (
                          <Button variant="ghost" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  </div>
);

}