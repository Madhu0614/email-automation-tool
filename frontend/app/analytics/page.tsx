'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Eye,
  MousePointer,
  Users,
  Filter,
  Download,
} from 'lucide-react';

const topCampaigns = [
  { name: 'Summer Sale 2024', opens: 2456, clicks: 567, rate: '29.8%' },
  { name: 'Product Launch', opens: 1834, clicks: 432, rate: '23.5%' },
  { name: 'Welcome Series', opens: 1567, clicks: 298, rate: '19.2%' },
  { name: 'Newsletter #47', opens: 1234, clicks: 234, rate: '18.9%' },
  { name: 'Black Friday', opens: 1098, clicks: 189, rate: '17.2%' },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                  <p className="text-gray-600 mt-2">
                    Detailed insights into your email campaign performance
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Select defaultValue="30days">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="1year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: 'Total Sent',
                  value: '94,000',
                  change: '+12% vs last month',
                  icon: <Mail className="w-6 h-6 text-white" />,
                  gradient: 'from-blue-500 to-blue-600',
                },
                {
                  title: 'Open Rate',
                  value: '32.4%',
                  change: '+2.1% vs last month',
                  icon: <Eye className="w-6 h-6 text-white" />,
                  gradient: 'from-green-500 to-green-600',
                },
                {
                  title: 'Click Rate',
                  value: '6.4%',
                  change: '+0.8% vs last month',
                  icon: <MousePointer className="w-6 h-6 text-white" />,
                  gradient: 'from-purple-500 to-purple-600',
                },
                {
                  title: 'Subscribers',
                  value: '24,567',
                  change: '+456 this month',
                  icon: <Users className="w-6 h-6 text-white" />,
                  gradient: 'from-orange-500 to-orange-600',
                },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                          <p className="text-sm text-green-600 mt-1">{metric.change}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.gradient}`}>
                          {metric.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Top Campaigns Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                  <CardDescription>Your best campaigns by open rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCampaigns.map((campaign, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{campaign.name}</p>
                            <p className="text-sm text-gray-500">
                              {campaign.opens.toLocaleString()} opens • {campaign.clicks.toLocaleString()} clicks
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{campaign.rate}</p>
                          <p className="text-xs text-gray-500">open rate</p>
                        </div>
                      </div>
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
