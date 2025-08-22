'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target, Plus, Mail, Calendar, Users, TrendingUp, Play, Pause,
  Edit, Copy, Trash2, Eye, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';

interface EmailList {
  id: number;
  name: string;
  count: number;
  description?: string;
}

interface Campaign {
  id: number;
  name: string;
  subject_line?: string;
  status: 'active' | 'completed' | 'scheduled' | 'draft';
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  created_at: string;
  email_list_id: number;
  email_lists?: EmailList | null;
  content?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        setCampaigns(data as Campaign[] || []);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const getStatusColor = (status: Campaign['status']): string => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (dateStr: string): string => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    avgOpenRate: campaigns.length > 0 
      ? ((campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0) / 
         Math.max(1, campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0))) * 100).toFixed(1)
      : '0.0'
  };

  // Enhanced function to handle campaign viewing/editing based on status and saved progress
  const handleViewCampaign = (campaign: Campaign) => {
    // Store campaign data for next pages
    localStorage.setItem('campaignId', campaign.id.toString());
    localStorage.setItem('campaignName', campaign.name);
    localStorage.setItem('selectedListId', campaign.email_list_id.toString());

    if (campaign.status === 'draft') {
      // For draft campaigns, check where they left off
      const savedContent = localStorage.getItem(`campaign_content_${campaign.id}`);
      const hasSubjectOrContent = campaign.subject_line || campaign.content;
      
      if (savedContent || hasSubjectOrContent) {
        // User has worked on content, redirect to content editor
        router.push('/campaigns/create/content');
      } else {
        // No content created yet, start from step 1 (campaign setup)
        router.push('/campaigns/create');
      }
    } else {
      // For active/completed/scheduled campaigns, show campaign details/review
      router.push(`/campaigns/${campaign.id}/review`);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    // Store campaign data
    localStorage.setItem('campaignId', campaign.id.toString());
    localStorage.setItem('campaignName', campaign.name);
    localStorage.setItem('selectedListId', campaign.email_list_id.toString());
    
    // Always start editing from content page
    router.push('/campaigns/create/content');
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: `${campaign.name} (Copy)`,
          subject_line: campaign.subject_line,
          content: campaign.content,
          status: 'draft',
          email_list_id: campaign.email_list_id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setCampaigns(prev => [data as Campaign, ...prev]);
      
      // Show success message
      alert('Campaign duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating campaign:', err);
      alert('Failed to duplicate campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
      if (error) throw error;
      
      // Remove from local state
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      // Clean up localStorage
      localStorage.removeItem(`campaign_content_${campaignId}`);
      
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900">Email Campaigns</h1>
                  <p className="text-gray-600 mt-2">
                    Create and manage your email marketing campaigns
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => router.push('/campaigns/create')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Total Campaigns', value: stats.total.toString(), icon: <Target className="w-6 h-6 text-white" />, color: 'from-blue-500 to-blue-600' },
                { title: 'Active Now', value: stats.active.toString(), icon: <Play className="w-6 h-6 text-white" />, color: 'from-green-500 to-green-600' },
                { title: 'Scheduled', value: stats.scheduled.toString(), icon: <Calendar className="w-6 h-6 text-white" />, color: 'from-yellow-500 to-yellow-600' },
                { title: 'Avg. Open Rate', value: `${stats.avgOpenRate}%`, icon: <TrendingUp className="w-6 h-6 text-white" />, color: 'from-purple-500 to-purple-600' }
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color} shadow-lg`}>
                          {card.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Campaigns List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {campaigns.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Campaigns Yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Get started by creating your first email campaign. You can choose from templates or build from scratch.
                    </p>
                    <Button
                      onClick={() => router.push('/campaigns/create')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-600" />
                      Your Campaigns
                    </CardTitle>
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
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center justify-between p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform">
                              <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {campaign.name || 'Untitled Campaign'}
                                </h4>
                                <Badge variant="secondary" className={`${getStatusColor(campaign.status)} font-medium`}>
                                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {campaign.subject_line || 'No subject line'}
                              </p>
                              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  <span>0 recipients</span>
                                </div>
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2" />
                                  <span>{(campaign.sent_count || 0).toLocaleString()} sent</span>
                                </div>
                                <div className="flex items-center">
                                  <Eye className="w-4 h-4 mr-2" />
                                  <span>{(campaign.open_count || 0).toLocaleString()} opens</span>
                                </div>
                                <span className="text-gray-400">
                                  Created {formatTimeAgo(campaign.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title={campaign.status === 'draft' ? 'Continue Editing' : 'View Campaign'}
                              onClick={() => handleViewCampaign(campaign)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Edit Campaign"
                              onClick={() => handleEditCampaign(campaign)}
                              className="hover:bg-green-50 hover:text-green-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Duplicate Campaign"
                              onClick={() => handleDuplicateCampaign(campaign)}
                              className="hover:bg-purple-50 hover:text-purple-600"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Delete Campaign"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
