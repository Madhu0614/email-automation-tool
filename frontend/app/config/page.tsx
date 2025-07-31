'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { Settings, Mail, Plus, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';



type EmailAccount = {
  id: number;
  user_email: string;
  provider: string;
  status: string;
  daily_limit?: number;
  sent?: number;
  last_used?: string;
};

export default function ConfigPage() {
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gmail');

  useEffect(() => {
    const fetchEmailAccounts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/email/accounts`);
        const data = await res.json();
        setEmailAccounts(data);
      } catch (err) {
        console.error('Failed to fetch email accounts', err);
      }
    };

    fetchEmailAccounts();
    

    const url = new URL(window.location.href);
    if (url.searchParams.get('oauth')) {
      fetchEmailAccounts();
      url.searchParams.delete('oauth');
      window.history.replaceState({}, document.title, url.pathname);
    }
    
  }, []);

  const [smtpConfig, setSmtpConfig] = useState({
  smtp_host: '',
  smtp_port: '',
  smtp_email: '',
  smtp_password: '',
  imap_host: '',
  imap_port: '',
});

  const startGoogleOAuth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/oauth2/init/google`);
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err) {
      console.error('Failed to initiate Google OAuth', err);
      alert('Failed to start Gmail OAuth. Please try again.');
    }
  };

  const handleMicrosoftOAuth = async () => {
    try {
      const res = await fetch("http://localhost:8000/oauth2/login/microsoft", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("Microsoft OAuth failed", error);
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
                  <h1 className="text-3xl font-bold text-gray-900">Email Configuration</h1>
                  <p className="text-gray-600 mt-2">
                    Manage your email accounts and SMTP settings
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Email Account</DialogTitle>
                      <DialogDescription>
                        Configure a new email account for sending campaigns
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="gmail">Gmail</TabsTrigger>
                        <TabsTrigger value="outlook">Outlook</TabsTrigger>
                        <TabsTrigger value="smtp">SMTP/IMAP</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="gmail" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200">
                            <div className="flex items-center space-x-4">
                              <Image
                                src="/images/gmail-logo.png"
                                alt="Gmail Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                              <span className="text-gray-800 font-medium">Gmail / Google Workspace</span>
                            </div>
                            <Button
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={startGoogleOAuth}
                            >
                              Connect Gmail / GSuite
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="outlook" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200">
                            <div className="flex items-center space-x-4">
                              <Image
                                src="/images/outlook-logo.png"
                                alt="Outlook Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                              <span className="text-gray-800 font-medium">Outlook / Microsoft 365</span>
                            </div>
                            <Button
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={handleMicrosoftOAuth}
                            >
                              Connect Outlook
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      
                      <TabsContent value="smtp" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="smtp-host">SMTP Host</Label>
                              <Input
                                  id="smtp-host"
                                  placeholder="smtp.yourhost.com"
                                  value={smtpConfig.smtp_host}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                                />
                            </div>
                            <div>
                              <Label htmlFor="smtp-port">Port</Label>
                              <Input
                                  id="smtp-port"
                                  placeholder="587"
                                  type="number"
                                  value={smtpConfig.smtp_port}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_port: e.target.value })}
                                />

                            </div>
                          </div>
                          <div>
                            <Label htmlFor="smtp-email">Email Address</Label>
                            <Input
                                  id="smtp-email"
                                  placeholder="your-email@domain.com"
                                  type="email"
                                  value={smtpConfig.smtp_email}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_email: e.target.value })}
                                />
                          </div>
                          <div>
                            <Label htmlFor="smtp-password">Password</Label>
                            <Input
                                  id="smtp-password"
                                  type="password"
                                  placeholder="Enter password"
                                  value={smtpConfig.smtp_password}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_password: e.target.value })}
                                />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="imap-host">IMAP Host</Label>
                              <Input
                                id="imap-host"
                                placeholder="imap.yourhost.com"
                                value={smtpConfig.imap_host}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, imap_host: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="imap-port">IMAP Port</Label>
                              <Input
                                  id="imap-port"
                                  placeholder="993"
                                  type="number"
                                  value={smtpConfig.imap_port}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, imap_port: e.target.value })}
                                />

                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    {activeTab === 'smtp' && (
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>

                        <Button
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE_URL}/email/smtp/save-config`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  smtp_host: smtpConfig.smtp_host,
                                  smtp_port: smtpConfig.smtp_port,
                                  use_tls: true,
                                  username: smtpConfig.smtp_email,
                                  password: smtpConfig.smtp_password,
                                  from_email: smtpConfig.smtp_email,
                                  incoming_server: smtpConfig.imap_host,
                                  incoming_port: smtpConfig.imap_port,
                                }),
                              });

                              if (!res.ok) throw new Error('Failed to save SMTP config');
                              alert('SMTP configuration saved!');
                              setIsDialogOpen(false);
                            } catch (err) {
                              console.error(err);
                              alert('Error saving SMTP config');
                            }
                          }}
                        >
                          Add Account
                        </Button>
                      </DialogFooter>
                    )}

                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                        <CheckCircle className="w-6 h-6 text-white" />
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
                        <p className="text-sm font-medium text-gray-600">Daily Limit</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">800</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                        <Mail className="w-6 h-6 text-white" />
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
                        <p className="text-sm font-medium text-gray-600">Sent Today</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">334</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Email Accounts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Configured Email Accounts</CardTitle>
                  <CardDescription>
                    Manage your email accounts used for sending campaigns
                  </CardDescription>
                </CardHeader>


                  <CardContent>
                    <div className="space-y-4">
                      {emailAccounts.map((account) => {
                        const provider = account.provider?.toLowerCase();

                        const getLogo = () => {
                          if (provider === 'gmail_oauth') return '/images/gmail-logo.png';
                          if (provider === 'microsoft_oauth') return '/images/outlook-logo.png';
                          return '/images/smtp-logo.png'; // Default for SMTP or unknown
                        };

                        return (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-lg bg-white shadow flex items-center justify-center mr-4">
                                <Image
                                  src={getLogo()}
                                  alt={`${provider} logo`}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{account.user_email}</h4>
                                  <Badge
                                    variant={account.status === 'active' ? 'default' : 'secondary'}
                                    className={
                                      account.status === 'active'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : ''
                                    }
                                  >
                                    {account.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <span>{account.provider}</span>
                                  <span>•</span>
                                  <span>{account.sent ?? 0}/{account.daily_limit ?? 100} sent today</span>
                                  <span>•</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {account.status === 'active' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                              )}
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
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