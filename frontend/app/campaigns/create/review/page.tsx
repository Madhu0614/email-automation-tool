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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Clock, Mail, Calendar, Settings, Timer, Send, Users, Globe, AlertCircle } from 'lucide-react';

type Step = {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
};

type CampaignSchedule = {
  startDate: string;
  startTime: string;
  timezone: string;
  sendDays: string[];
  sendTimeStart: string;
  sendTimeEnd: string;
  maxEmailsPerDay: number;
  pauseBetweenEmails: number; // minutes
  followUpDelay: number; // days
  enableSmartTiming: boolean;
  respectRecipientTimezone: boolean;
  pauseOnWeekends: boolean;
  autoResumeAfterPause: boolean;
  trackingEnabled: boolean;
  unsubscribeLink: string;
  replyHandling: string;
};

export default function ReviewPage() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState('');
  const [emailSteps, setEmailSteps] = useState<Step[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  
  const [campaignSchedule, setCampaignSchedule] = useState<CampaignSchedule>({
    startDate: '',
    startTime: '09:00',
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
    autoResumeAfterPause: true,
    trackingEnabled: true,
    unsubscribeLink: 'https://your-domain.com/unsubscribe',
    replyHandling: 'auto'
  });

  useEffect(() => {
    const name = localStorage.getItem('campaignName');
    const pitches = localStorage.getItem('generatedPitches');
    setCampaignName(name || '');
    
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
  }, []);

  const handleScheduleChange = (key: keyof CampaignSchedule, value: any) => {
    setCampaignSchedule(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLaunchCampaign = async () => {
    try {
      const payload = {
        campaignName,
        emailSteps,
        campaignSchedule,
        launchedAt: new Date().toISOString()
      };

      localStorage.setItem('launchedCampaign', JSON.stringify(payload));
      router.push('/campaigns/create/success');
    } catch (err) {
      console.error('Error submitting campaign:', err);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const totalSteps = emailSteps.length;
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Step 4: Schedule Campaign</h1>
            <p className="text-sm text-blue-600 font-medium mb-4">Configure your campaign scheduling and delivery settings</p>
            
            {/* Quick Overview */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Campaign:</span>
                <Badge variant="outline">{campaignName}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Sequence:</span>
                <Badge variant="outline">{totalSteps} steps</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Start:</span>
                <Badge variant="outline">
                  {campaignSchedule.startDate} at {campaignSchedule.startTime}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Schedule Settings */}
            <div className="space-y-6">
              {/* Campaign Start Settings */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Campaign Start
                  </h2>
                  <p className="text-sm text-gray-600">When should your campaign begin?</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Date</label>
                      <Input
                        type="date"
                        value={campaignSchedule.startDate}
                        onChange={(e) => handleScheduleChange('startDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Time</label>
                      <Input
                        type="time"
                        value={campaignSchedule.startTime}
                        onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Timezone</label>
                    <Select value={campaignSchedule.timezone} onValueChange={(value) => handleScheduleChange('timezone', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                        <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                        <SelectItem value="IST">IST (India Standard Time)</SelectItem>
                        <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                        <SelectItem value="CET">CET (Central European Time)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Sending Window */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Daily Sending Window
                  </h3>
                  <p className="text-sm text-gray-600">Define when emails can be sent each day</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Time</label>
                      <Input
                        type="time"
                        value={campaignSchedule.sendTimeStart}
                        onChange={(e) => handleScheduleChange('sendTimeStart', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">End Time</label>
                      <Input
                        type="time"
                        value={campaignSchedule.sendTimeEnd}
                        onChange={(e) => handleScheduleChange('sendTimeEnd', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Active Days</label>
                    <div className="grid grid-cols-4 gap-2">
                      {weekDays.map((day) => (
                        <label key={day} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={campaignSchedule.sendDays.includes(day)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...campaignSchedule.sendDays, day]
                                : campaignSchedule.sendDays.filter(d => d !== day);
                              handleScheduleChange('sendDays', newDays);
                            }}
                            className="rounded"
                          />
                          <span>{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Gaps & Timing */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Email Gaps & Timing
                  </h3>
                  <p className="text-sm text-gray-600">Control the pace of your email delivery</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Gap Between Individual Emails (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignSchedule.pauseBetweenEmails}
                      onChange={(e) => handleScheduleChange('pauseBetweenEmails', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 5-15 minutes to avoid spam filters</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Follow-up Email Delay (days)</label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignSchedule.followUpDelay}
                      onChange={(e) => handleScheduleChange('followUpDelay', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Days between sequence steps</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Maximum Emails Per Day</label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignSchedule.maxEmailsPerDay}
                      onChange={(e) => handleScheduleChange('maxEmailsPerDay', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Daily sending limit to maintain reputation</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Advanced Settings & Preview */}
            <div className="space-y-6">
              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Settings
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Smart Timing</label>
                      <p className="text-xs text-gray-500">Optimize send times based on recipient behavior</p>
                    </div>
                    <Switch
                      checked={campaignSchedule.enableSmartTiming}
                      onCheckedChange={(checked) => handleScheduleChange('enableSmartTiming', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Recipient Timezone</label>
                      <p className="text-xs text-gray-500">Send emails in recipient's local time</p>
                    </div>
                    <Switch
                      checked={campaignSchedule.respectRecipientTimezone}
                      onCheckedChange={(checked) => handleScheduleChange('respectRecipientTimezone', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pause on Weekends</label>
                      <p className="text-xs text-gray-500">Automatically pause sending on weekends</p>
                    </div>
                    <Switch
                      checked={campaignSchedule.pauseOnWeekends}
                      onCheckedChange={(checked) => handleScheduleChange('pauseOnWeekends', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Tracking</label>
                      <p className="text-xs text-gray-500">Track opens, clicks, and engagement</p>
                    </div>
                    <Switch
                      checked={campaignSchedule.trackingEnabled}
                      onCheckedChange={(checked) => handleScheduleChange('trackingEnabled', checked)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reply Handling</label>
                    <Select value={campaignSchedule.replyHandling} onValueChange={(value) => handleScheduleChange('replyHandling', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-respond with template</SelectItem>
                        <SelectItem value="forward">Forward to team</SelectItem>
                        <SelectItem value="pause">Pause sequence on reply</SelectItem>
                        <SelectItem value="ignore">No action</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Settings */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Compliance & Legal
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Unsubscribe Link</label>
                    <Input
                      type="url"
                      value={campaignSchedule.unsubscribeLink}
                      onChange={(e) => handleScheduleChange('unsubscribeLink', e.target.value)}
                      className="mt-1"
                      placeholder="https://your-domain.com/unsubscribe"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required by law - will be added to all emails</p>
                  </div>
                </CardContent>
              </Card>

              {/* Email Sequence Preview */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Sequence Timeline
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {emailSteps.map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {step.subject || `Step ${idx + 1}`}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {idx === 0 
                              ? 'Sends immediately when campaign starts'
                              : `Sends ${step.delayDays} day${step.delayDays !== 1 ? 's' : ''} after previous email`
                            }
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {step.body.length} chars
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 mt-8 border-t">
            <Button variant="outline" onClick={handleBack}>
              Back to Editor
            </Button>
            <Button
              onClick={handleLaunchCampaign}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Launch Campaign
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
