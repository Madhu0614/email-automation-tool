'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import {
  Mail,
  Users,
  TrendingUp,
  Target,
  Activity,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const statsData = [
  {
    title: 'Total Campaigns',
    value: '24',
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: Target,
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
  },
  {
    title: 'Emails Sent',
    value: '45,231',
    change: '+8% from last month',
    changeType: 'positive' as const,
    icon: Mail,
    gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
  },
  {
    title: 'Open Rate',
    value: '32.4%',
    change: '+2.1% from last month',
    changeType: 'positive' as const,
    icon: TrendingUp,
    gradient: 'bg-gradient-to-r from-green-500 to-green-600',
  },
  {
    title: 'Active Subscribers',
    value: '12,847',
    change: '+156 new this week',
    changeType: 'positive' as const,
    icon: Users,
    gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
  },
];

const chartData = [
  { name: 'Jan', campaigns: 12, emails: 2400 },
  { name: 'Feb', campaigns: 19, emails: 3200 },
  { name: 'Mar', campaigns: 15, emails: 2800 },
  { name: 'Apr', campaigns: 22, emails: 4100 },
  { name: 'May', campaigns: 18, emails: 3600 },
  { name: 'Jun', campaigns: 24, emails: 4500 },
];

const recentCampaigns = [
  {
    name: 'Summer Sale 2024',
    status: 'Active',
    sent: '8,234',
    opens: '2,456',
    clicks: '567',
    time: '2 hours ago',
  },
  {
    name: 'Product Launch',
    status: 'Completed',
    sent: '5,123',
    opens: '1,834',
    clicks: '432',
    time: '1 day ago',
  },
  {
    name: 'Newsletter #47',
    status: 'Scheduled',
    sent: '-',
    opens: '-',
    clicks: '-',
    time: 'Tomorrow 9 AM',
  },
];

export default function Dashboard() {
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Overview of your email campaign performance
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatsCard {...stat} />
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Campaign Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="campaigns"
                      stroke="url(#gradient1)"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="gradient1" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Email Volume
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="emails" fill="url(#gradient2)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Recent Campaigns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opens
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentCampaigns.map((campaign, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              campaign.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : campaign.status === 'Completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campaign.sent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campaign.opens}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campaign.clicks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {campaign.time}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}