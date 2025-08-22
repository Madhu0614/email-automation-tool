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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { API_BASE_URL } from '@/lib/api';
import { Settings, Mail, Plus, CheckCircle, AlertCircle, Edit, Trash2, Loader2 } from 'lucide-react';
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
  
  // Error and loading states
  const [smtpError, setSmtpError] = useState('');
  const [oauthError, setOauthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    use_ssl: false,
    use_tls: true,
    username: '',
    password: '',
    from_email: '',
    incoming_server: '',
    incoming_port: '',
    protocol: 'imap',
    save_to_db: true,
  });

  // Reset form helper
  const resetSmtpConfig = () => {
    setSmtpConfig({
      smtp_host: '',
      smtp_port: '',
      use_ssl: false,
      use_tls: true,
      username: '',
      password: '',
      from_email: '',
      incoming_server: '',
      incoming_port: '',
      protocol: 'imap',
      save_to_db: true,
    });
  };

  const startGoogleOAuth = async () => {
    try {
      setOauthError('');
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/oauth2/init/google`);
      
      if (!res.ok) {
        throw new Error(`Failed to initiate OAuth: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setOauthError('Failed to get authorization URL from server');
      }
    } catch (err) {
      console.error('Failed to initiate Google OAuth', err);
      setOauthError('Failed to start Gmail OAuth. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftOAuth = async () => {
    try {
      setOauthError('');
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/oauth2/login/microsoft", {
        method: "GET",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to initiate OAuth: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setOauthError('Failed to get authorization URL from server');
      }
    } catch (error) {
      console.error("Microsoft OAuth failed", error);
      setOauthError('Failed to start Outlook OAuth. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced SMTP save with improved error handling
  const handleSMTPSave = async () => {
    try {
      setSmtpError('');
      setSuccessMessage('');
      setIsLoading(true);

      // Client-side validation
      if (!smtpConfig.smtp_host || !smtpConfig.smtp_port || !smtpConfig.from_email || !smtpConfig.password) {
        throw new Error('Please fill in all required fields: SMTP Host, Port, Email Address, and Password');
      }

      if (!smtpConfig.incoming_server || !smtpConfig.incoming_port) {
        throw new Error('Please fill in incoming server details: Server and Port');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(smtpConfig.from_email)) {
        throw new Error('Please enter a valid email address');
      }

      const payload = {
        smtp_host: smtpConfig.smtp_host.trim(),
        smtp_port: parseInt(smtpConfig.smtp_port),
        use_tls: smtpConfig.use_tls,
        use_ssl: smtpConfig.use_ssl,
        username: smtpConfig.username || smtpConfig.from_email,
        password: smtpConfig.password,
        from_email: smtpConfig.from_email.trim(),
        incoming_server: smtpConfig.incoming_server.trim(),
        incoming_port: parseInt(smtpConfig.incoming_port),
        protocol: smtpConfig.protocol,
        save_to_db: true
      };

      const res = await fetch(`${API_BASE_URL}/email/smtp/save-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        // Handle different types of errors with better messaging
        let errorMessage = 'Failed to save SMTP configuration';
        
        if (responseData.detail) {
          if (responseData.detail.includes('SMTP validation failed:')) {
            errorMessage = `❌ SMTP Authentication Failed: ${responseData.detail.replace('SMTP validation failed: ', '')}`;
          } else if (responseData.detail.includes('Incoming server validation failed:')) {
            errorMessage = `❌ Incoming Server Failed: ${responseData.detail.replace('Incoming server validation failed: ', '')}`;
          } else if (responseData.detail.includes('Failed to save config:')) {
            errorMessage = `❌ Database Error: ${responseData.detail.replace('Failed to save config: ', '')}`;
          } else {
            errorMessage = `❌ ${responseData.detail}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Success
      setSuccessMessage(responseData.message || '✅ SMTP configuration saved and validated successfully!');
      setIsDialogOpen(false);
      resetSmtpConfig();
      
      // Refresh accounts list
      const accountsRes = await fetch(`${API_BASE_URL}/email/accounts`);
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        setEmailAccounts(accounts);
      }

    } catch (err) {
      console.error('SMTP configuration error:', err);
      setSmtpError(err instanceof Error ? err.message : '❌ Failed to save SMTP configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced test connection with better error handling
  const handleTestConnection = async () => {
    try {
      setSmtpError('');
      setSuccessMessage('');
      setIsLoading(true);

      // Client-side validation first
      if (!smtpConfig.smtp_host || !smtpConfig.smtp_port || !smtpConfig.from_email || !smtpConfig.password) {
        throw new Error('Please fill in all required fields: SMTP Host, Port, Email Address, and Password');
      }

      if (!smtpConfig.incoming_server || !smtpConfig.incoming_port) {
        throw new Error('Please fill in incoming server details: Server and Port');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(smtpConfig.from_email)) {
        throw new Error('Please enter a valid email address');
      }

      const payload = {
        smtp_host: smtpConfig.smtp_host.trim(),
        smtp_port: parseInt(smtpConfig.smtp_port),
        use_tls: smtpConfig.use_tls,
        use_ssl: smtpConfig.use_ssl,
        username: smtpConfig.username || smtpConfig.from_email,
        password: smtpConfig.password,
        from_email: smtpConfig.from_email.trim(),
        incoming_server: smtpConfig.incoming_server.trim(),
        incoming_port: parseInt(smtpConfig.incoming_port),
        protocol: smtpConfig.protocol,
        save_to_db: false // Test only, don't save
      };

      const res = await fetch(`${API_BASE_URL}/email/smtp/save-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Extract and format error messages from backend
        let errorMessage = 'Connection test failed';
        
        if (data.detail) {
          if (data.detail.includes('SMTP validation failed:')) {
            errorMessage = `❌ SMTP Connection Failed: ${data.detail.replace('SMTP validation failed: ', '')}`;
          } else if (data.detail.includes('Incoming server validation failed:')) {
            errorMessage = `❌ Incoming Server Failed: ${data.detail.replace('Incoming server validation failed: ', '')}`;
          } else {
            errorMessage = `❌ ${data.detail}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      setSuccessMessage(data.message || '✅ Connection test successful! Both SMTP and incoming server are working.');
      
    } catch (err) {
      console.error('Connection test error:', err);
      setSmtpError(err instanceof Error ? err.message : '❌ Connection test failed');
    } finally {
      setIsLoading(false);
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
                  <DialogContent className="sm:max-w-[600px]">
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
                        {oauthError && (
                          <div className="text-red-600 text-sm mb-2 p-3 bg-red-50 border border-red-200 rounded flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium">OAuth Error</div>
                              <div className="mt-1 text-xs text-red-500">{oauthError}</div>
                            </div>
                          </div>
                        )}
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
                              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              onClick={startGoogleOAuth}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              {isLoading ? 'Connecting...' : 'Connect Gmail / GSuite'}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="outlook" className="space-y-4 mt-4">
                        {oauthError && (
                          <div className="text-red-600 text-sm mb-2 p-3 bg-red-50 border border-red-200 rounded flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium">OAuth Error</div>
                              <div className="mt-1 text-xs text-red-500">{oauthError}</div>
                            </div>
                          </div>
                        )}
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
                              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              onClick={handleMicrosoftOAuth}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              {isLoading ? 'Connecting...' : 'Connect Outlook'}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="smtp" className="space-y-4 mt-4">
                        {/* Enhanced Error Display */}
                        {smtpError && (
                          <div className="text-red-600 text-sm mb-2 p-3 bg-red-50 border border-red-200 rounded flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium">Connection Failed</div>
                              <div className="mt-1 text-xs text-red-500">{smtpError}</div>
                              {smtpError.includes('Incorrect authentication data') && (
                                <div className="mt-2 text-xs text-red-400">
                                  💡 Try using an App Password instead of your regular password
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Success Display */}
                        {successMessage && (
                          <div className="text-green-600 text-sm mb-2 p-3 bg-green-50 border border-green-200 rounded flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium">Success</div>
                              <div className="mt-1 text-xs text-green-500">{successMessage}</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          {/* SMTP Settings */}
                          <div className="border-b pb-4">
                            <h4 className="font-medium text-gray-900 mb-3">SMTP Settings (Outgoing)</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="smtp-host">SMTP Host *</Label>
                                <Input
                                  id="smtp-host"
                                  placeholder="smtp.gmail.com"
                                  value={smtpConfig.smtp_host}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="smtp-port">Port *</Label>
                                <Input
                                  id="smtp-port"
                                  placeholder="587"
                                  type="number"
                                  value={smtpConfig.smtp_port}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_port: e.target.value })}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="use-tls"
                                  checked={smtpConfig.use_tls}
                                  onCheckedChange={(checked) => setSmtpConfig({ ...smtpConfig, use_tls: !!checked })}
                                />
                                <Label htmlFor="use-tls">Use TLS</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="use-ssl"
                                  checked={smtpConfig.use_ssl}
                                  onCheckedChange={(checked) => setSmtpConfig({ ...smtpConfig, use_ssl: !!checked })}
                                />
                                <Label htmlFor="use-ssl">Use SSL</Label>
                              </div>
                            </div>
                          </div>

                          {/* Authentication */}
                          <div className="border-b pb-4">
                            <h4 className="font-medium text-gray-900 mb-3">Authentication</h4>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="smtp-email">Email Address *</Label>
                                <Input
                                  id="smtp-email"
                                  placeholder="your-email@domain.com"
                                  type="email"
                                  value={smtpConfig.from_email}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, from_email: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="smtp-username">Username (optional)</Label>
                                <Input
                                  id="smtp-username"
                                  placeholder="Leave empty to use email address"
                                  value={smtpConfig.username}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="smtp-password">Password *</Label>
                                <Input
                                  id="smtp-password"
                                  type="password"
                                  placeholder="Enter password or app password"
                                  value={smtpConfig.password}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Incoming Settings */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Incoming Mail Settings</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="protocol">Protocol *</Label>
                                <Select value={smtpConfig.protocol} onValueChange={(value) => setSmtpConfig({ ...smtpConfig, protocol: value })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="imap">IMAP</SelectItem>
                                    <SelectItem value="pop3">POP3</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="imap-host">Incoming Server *</Label>
                                <Input
                                  id="imap-host"
                                  placeholder="imap.gmail.com"
                                  value={smtpConfig.incoming_server}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, incoming_server: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="imap-port">Incoming Port *</Label>
                                <Input
                                  id="imap-port"
                                  placeholder="993"
                                  type="number"
                                  value={smtpConfig.incoming_port}
                                  onChange={(e) => setSmtpConfig({ ...smtpConfig, incoming_port: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    {activeTab === 'smtp' && (
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDialogOpen(false);
                            setSmtpError('');
                            setSuccessMessage('');
                            resetSmtpConfig();
                          }}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Test Connection
                        </Button>

                        <Button
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                          onClick={handleSMTPSave}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {isLoading ? 'Saving...' : 'Save Account'}
                        </Button>
                      </DialogFooter>
                    )}

                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            {/* Global Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                {successMessage}
                <button 
                  onClick={() => setSuccessMessage('')}
                  className="float-right text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            )}

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
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {emailAccounts.filter(acc => acc.status === 'active').length}
                        </p>
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
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {emailAccounts.reduce((sum, acc) => sum + (acc.daily_limit || 0), 0)}
                        </p>
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
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {emailAccounts.reduce((sum, acc) => sum + (acc.sent || 0), 0)}
                        </p>
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
                    {emailAccounts.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No email accounts configured yet</p>
                        <p className="text-sm text-gray-400 mt-2">Add your first email account to get started</p>
                      </div>
                    ) : (
                      emailAccounts.map((account) => {
                        const provider = account.provider?.toLowerCase();

                        const getLogo = () => {
                          if (provider === 'gmail_oauth') return '/images/gmail-logo.png';
                          if (provider === 'microsoft_oauth') return '/images/outlook-logo.png';
                          return '/images/smtp-logo.png';
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
                                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                                    }
                                  >
                                    {account.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <span className="capitalize">{account.provider.replace('_', ' ')}</span>
                                  <span>•</span>
                                  <span>{account.sent ?? 0}/{account.daily_limit ?? 100} sent today</span>
                                  {account.last_used && (
                                    <>
                                      <span>•</span>
                                      <span>Last used: {new Date(account.last_used).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {account.status === 'active' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
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
                      })
                    )}
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
