'use client';

import { useState } from 'react';
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

export default function CampaignsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
                  <p className="text-gray-600 mt-2">
                    Create and manage your email marketing campaigns
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Campaign</DialogTitle>
                      <DialogDescription>
                        Set up a new email campaign with your content and settings
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="campaign-name">Campaign Name</Label>
                          <Input
                            id="campaign-name"
                            placeholder="Enter campaign name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email-list">Email List</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select email list" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newsletter">Newsletter Subscribers</SelectItem>
                              <SelectItem value="customers">Black Friday Customers</SelectItem>
                              <SelectItem value="webinar">Webinar Attendees</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Enter email subject line"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="sender">Sender Email</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sender email" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="marketing">marketing@company.com</SelectItem>
                            <SelectItem value="support">support@company.com</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="content">Email Content</Label>
                        <Textarea
                          id="content"
                          placeholder="Enter your email content here..."
                          rows={6}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="schedule">Schedule</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Send immediately" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="now">Send Now</SelectItem>
                              <SelectItem value="later">Schedule for Later</SelectItem>
                              <SelectItem value="draft">Save as Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tracking">Tracking</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Enable tracking" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full">Opens & Clicks</SelectItem>
                              <SelectItem value="opens">Opens Only</SelectItem>
                              <SelectItem value="none">No Tracking</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Create Campaign
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">24</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Now</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Scheduled</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">32.4%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Campaigns List */}
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
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
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
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