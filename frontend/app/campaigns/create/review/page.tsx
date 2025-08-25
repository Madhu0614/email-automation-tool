'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, Mail, Calendar, Settings, Timer, Send, Users, Globe, AlertCircle,
  CheckCircle, Zap, Shield, ChevronLeft, ChevronRight, User, AtSign, 
  ExternalLink, RefreshCw, Loader2, Server
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';

type Step = {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
};

type EmailConfig = {
  id: string;
  user_email: string;
  provider: string;
  from_name: string | null;
  is_active: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  access_token: string | null;
  created_at: string;
};

type CampaignSchedule = {
  startDate: string;
  startTime: string;
  startAmPm: 'AM' | 'PM'; 
  timezone: string;
  sendDays: string[];
  sendTimeStart: string;
  sendTimeEnd: string;
  maxEmailsPerDay: number;
  pauseBetweenEmails: number;
  followUpDelay: number;
  enableSmartTiming: boolean;
  respectRecipientTimezone: boolean;
  pauseOnWeekends: boolean;
  trackingEnabled: boolean;
  unsubscribeLink: string;
  replyHandling: string;
  selectedSender: string;
};

export default function ReviewPage() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState('');
  const [emailSteps, setEmailSteps] = useState<Step[]>([]);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<EmailConfig[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  const [recipientsCount, setRecipientsCount] = useState<number>(0);

  const [campaignSchedule, setCampaignSchedule] = useState<CampaignSchedule>({
    startDate: '',
    startTime: '09:00',
    startAmPm: 'AM',
    timezone: 'UTC',
    sendDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    sendTimeStart: '09:00',
    sendTimeEnd: '17:00',
    maxEmailsPerDay: 100,
    pauseBetweenEmails: 5,
    followUpDelay: 3,
    enableSmartTiming: true,
    respectRecipientTimezone: false,
    pauseOnWeekends: true,
    trackingEnabled: true,
    unsubscribeLink: 'https://your-domain.com/unsubscribe',
    replyHandling: 'auto',
    selectedSender: ''
  });

const fetchRecipientsCount = async (campaignId: string) => {
  if (!campaignId) return 0;

  // Step 1: Get email_list_id for the campaign
  const { data: campaignData, error: campaignError } = await supabase
    .from('campaigns')
    .select('email_list_id')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaignData) {
    console.error('Error fetching campaign email_list_id:', campaignError);
    return 0;
  }

  const emailListId = campaignData.email_list_id;
  if (!emailListId) return 0;

  // Step 2: Count email contacts referencing the email_list_id
  const { count, error: contactsError } = await supabase
    .from('email_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('email_list_id', emailListId);

  if (contactsError) {
    console.error('Error fetching email contacts count:', contactsError);
    return 0;
  }

  return count || 0;
};

  useEffect(() => {
    const initializePage = async () => {
      // Load campaign data
      const campaignId = localStorage.getItem('campaignId');
      const name = localStorage.getItem('campaignName');
      const pitches = localStorage.getItem(`campaign_content_${campaignId}`);

      setCampaignName(name || '');
      setCampaignData({ id: campaignId, name });

      if (pitches) {
        try {
          const parsed = JSON.parse(pitches);
          setEmailSteps(parsed);
        } catch (error) {
          console.error('Error parsing email steps:', error);
        }
      }

      // Set default start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCampaignSchedule(prev => ({
        ...prev,
        startDate: tomorrow.toISOString().split('T')[0]
      }));

      // Load email configs
      await loadEmailConfigs();

      // Fetch and set recipients count
      if (campaignId) {
        const count = await fetchRecipientsCount(campaignId);
        setRecipientsCount(count);
      }
    };

    initializePage();
  }, []);

  const loadEmailConfigs = async () => {
    try {
      setIsLoadingAccounts(true);

      // Fetch all active email configs without authentication check
      const { data, error } = await supabase
        .from('email_configs')
        .select('id, user_email, provider, from_name, is_active, smtp_host, smtp_port, access_token, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email configs:', error);
        setConnectedAccounts([]);
        return;
      }

      console.log('Fetched email configs:', data); // Debug log

      const configs: EmailConfig[] = data || [];
      setConnectedAccounts(configs);

      // Auto-select first config if available
      if (configs.length > 0 && !campaignSchedule.selectedSender) {
        setCampaignSchedule(prev => ({
          ...prev,
          selectedSender: configs[0].id
        }));
      }
    } catch (error) {
      console.error('Error loading email configs:', error);
      setConnectedAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleScheduleChange = (key: keyof CampaignSchedule, value: any) => {
    setCampaignSchedule(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Converts 12-hour format time and AM/PM to 24-hour time string "HH:mm"
function to24HourTime(time: string, ampm: 'AM' | 'PM'): string {
  let [hours, minutes] = time.split(':').map(Number);
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
  const handleLaunchCampaign = async () => {
    // ✅ Now using router from component scope
    if (!campaignSchedule.selectedSender) {
      alert('Please select an email sender account');
      return;
    }

    setIsLaunching(true);

    try {
      const time24h = to24HourTime(campaignSchedule.startTime, campaignSchedule.startAmPm);
      const scheduledAt = `${campaignSchedule.startDate}T${time24h}:00.000Z`;

      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'scheduled',
          sender_id: campaignSchedule.selectedSender,
          scheduled_at: scheduledAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', Number(campaignData.id));

      if (error) throw error;

      // Clear localStorage since campaign is complete
      localStorage.removeItem('campaignId');
      localStorage.removeItem('campaignName');
      localStorage.removeItem('selectedListId');

      // ✅ Success - redirect to success page
      router.push('/campaigns/create/success');
      
    } catch (error) {
      console.error('Error launching campaign:', error);
      alert('Failed to launch campaign. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };

    // ✅ Added handleNext function
  const handleNext = () => {
    // Save current schedule data to localStorage
    localStorage.setItem('campaignSchedule', JSON.stringify(campaignSchedule));
    
    // Navigate to the final review/launch step
    router.push('/campaigns/create/success');
  };

  const handleBack = () => {
    router.push('/campaigns/create/content');
  };

  // Helper functions for displaying accounts
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail_oauth':
        return '📧';
      case 'microsoft_oauth':
        return '📮';
      case 'smtp':
        return '📤';
      default:
        return '✉️';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'gmail_oauth':
        return 'from-red-500 to-red-600';
      case 'microsoft_oauth':
        return 'from-blue-500 to-blue-600';
      case 'smtp':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'gmail_oauth':
        return 'Gmail OAuth';
      case 'microsoft_oauth':
        return 'Microsoft OAuth';
      case 'smtp':
        return 'SMTP';
      default:
        return provider;
    }
  };

  const getAccountDisplayName = (account: EmailConfig) => {
    return account.from_name || account.user_email.split('@')[0];
  };

  const totalSteps = emailSteps.length;
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const selectedAccount = connectedAccounts.find(acc => acc.id === campaignSchedule.selectedSender);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Step 3 of 3
                </span>
                <Separator orientation="vertical" className="h-5" />
                <span className="text-sm font-semibold text-slate-700">Schedule & Launch</span>
              </div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
                Review & Schedule Campaign
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl">
                Configure your campaign delivery settings and choose which email account to send from.
              </p>
            </div>

            {/* Campaign Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="border-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Campaign</p>
                        <p className="text-base font-bold text-slate-900">{campaignName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <Send className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Email Sequence</p>
                        <p className="text-base font-bold text-slate-900">{totalSteps} steps</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Recipients</p>
                        <p className="text-base font-bold text-slate-900">{recipientsCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Launch Date</p>
                        <p className="text-base font-bold text-slate-900">
                          {campaignSchedule.startDate} at {campaignSchedule.startTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Email Sender Selection */}
              <div className="xl:col-span-1">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                        <AtSign className="h-4 w-4 text-white" />
                      </div>
                      Email Sender
                    </h3>
                    <p className="text-sm text-slate-600">Choose which email account to send from</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Loading State */}
                    {isLoadingAccounts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                        <span className="text-slate-600">Loading your email accounts...</span>
                      </div>
                    ) : connectedAccounts.length === 0 ? (
                      /* No Accounts State */
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <Mail className="h-6 w-6 text-slate-400" />
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">No Email Accounts Found</h4>
                        <p className="text-sm text-slate-500 mb-4">
                          No active email configurations found. Please set up your email accounts first.
                        </p>
                        <Button 
                          onClick={() => router.push('/settings/email-accounts')}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500"
                        >
                          Setup Email Account
                        </Button>
                      </div>
                    ) : (
                      /* Connected Accounts from your email_configs table */
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {connectedAccounts.map((account) => (
                          <motion.div
                            key={account.id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              campaignSchedule.selectedSender === account.id
                                ? 'border-blue-500 bg-blue-50/50 shadow-md'
                                : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-sm'
                            }`}
                            onClick={() => handleScheduleChange('selectedSender', account.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getProviderColor(account.provider)} flex items-center justify-center shadow-lg`}>
                                  <span className="text-lg">{getProviderIcon(account.provider)}</span>
                                </div>
                                {account.is_active && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                  {getAccountDisplayName(account)}
                                </p>
                                <p className="text-sm text-slate-600 truncate">{account.user_email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {getProviderDisplayName(account.provider)}
                                  </Badge>
                                  {account.smtp_host && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Server className="w-3 h-3 mr-1" />
                                      {account.smtp_host}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {campaignSchedule.selectedSender === account.id && (
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Selected Sender Preview */}
                    {selectedAccount && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Selected Sender</span>
                        </div>
                        <p className="text-sm text-green-600">
                          Emails will be sent from: <strong>{selectedAccount.user_email}</strong>
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          via {getProviderDisplayName(selectedAccount.provider)}
                        </p>
                      </motion.div>
                    )}

                    {/* Account Summary */}
                    {connectedAccounts.length > 0 && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-600 font-medium mb-2">Available Accounts:</p>
                        <div className="flex flex-wrap gap-1">
                          {['gmail_oauth', 'microsoft_oauth', 'smtp'].map(provider => {
                            const count = connectedAccounts.filter(acc => acc.provider === provider).length;
                            if (count === 0) return null;
                            return (
                              <Badge key={provider} variant="secondary" className="text-xs">
                                {getProviderDisplayName(provider)}: {count}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Middle & Right Columns - Schedule Settings (rest of your existing code) */}
              <div className="xl:col-span-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Campaign Start Settings */}
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        Campaign Start
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Start Date</label>
                          <Input
                            type="date"
                            value={campaignSchedule.startDate}
                            onChange={(e) => handleScheduleChange('startDate', e.target.value)}
                            className="mt-2 h-11"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Start Time</label>
                          <Input
                            type="time"
                            value={campaignSchedule.startTime}
                            onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                            className="mt-2 h-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Timezone</label>
                        <Select value={campaignSchedule.timezone} onValueChange={(value) => handleScheduleChange('timezone', value)}>
                          <SelectTrigger className="mt-2 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">🌍 UTC (Coordinated Universal Time)</SelectItem>
                            <SelectItem value="EST">🇺🇸 EST (Eastern Standard Time)</SelectItem>
                            <SelectItem value="PST">🇺🇸 PST (Pacific Standard Time)</SelectItem>
                            <SelectItem value="IST">🇮🇳 IST (India Standard Time)</SelectItem>
                            <SelectItem value="GMT">🇬🇧 GMT (Greenwich Mean Time)</SelectItem>
                            <SelectItem value="CET">🇪🇺 CET (Central European Time)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Settings */}
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <Settings className="h-4 w-4 text-white" />
                        </div>
                        Delivery Settings
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Max Emails/Day</label>
                          <Input
                            type="number"
                            min="1"
                            value={campaignSchedule.maxEmailsPerDay}
                            onChange={(e) => handleScheduleChange('maxEmailsPerDay', parseInt(e.target.value))}
                            className="mt-2 h-11"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Pause Between (min)</label>
                          <Input
                            type="number"
                            min="1"
                            value={campaignSchedule.pauseBetweenEmails}
                            onChange={(e) => handleScheduleChange('pauseBetweenEmails', parseInt(e.target.value))}
                            className="mt-2 h-11"
                          />
                        </div>
                      </div>

                      {/* Smart Features Toggles */}
                      <div className="space-y-3 pt-2">
                        {[
                          { key: 'trackingEnabled', title: 'Email Tracking', desc: 'Track opens and clicks' },
                          { key: 'pauseOnWeekends', title: 'Pause Weekends', desc: 'Skip Saturday & Sunday' },
                          { key: 'enableSmartTiming', title: 'Smart Timing', desc: 'Optimize send times' }
                        ].map((feature) => (
                          <div key={feature.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50/50">
                            <div>
                              <p className="text-sm font-medium text-slate-700">{feature.title}</p>
                              <p className="text-xs text-slate-500">{feature.desc}</p>
                            </div>
                            <Switch
                              checked={campaignSchedule[feature.key as keyof CampaignSchedule] as boolean}
                              onCheckedChange={(checked) => handleScheduleChange(feature.key as keyof CampaignSchedule, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-between items-center pt-8 mt-8 border-t border-slate-200"
            >
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Editor
              </Button>

              <div className="flex items-center space-x-4">
                {(!selectedAccount || connectedAccounts.length === 0) && (
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {connectedAccounts.length === 0 ? 'No email accounts configured' : 'Please select an email sender'}
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => { handleLaunchCampaign(); handleBack(); }}
                  disabled={!campaignSchedule.selectedSender || isLaunching || connectedAccounts.length === 0}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 h-12"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Launching Campaign...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
