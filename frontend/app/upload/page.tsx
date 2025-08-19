'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
} from 'lucide-react';

const uploadedLists = [
  {
    id: 1,
    name: 'Newsletter Subscribers',
    count: 12847,
    uploaded: '2 days ago',
    status: 'active',
  },
  {
    id: 2,
    name: 'Black Friday Customers',
    count: 5432,
    uploaded: '1 week ago',
    status: 'active',
  },
  {
    id: 3,
    name: 'Webinar Attendees',
    count: 2156,
    uploaded: '2 weeks ago',
    status: 'processing',
  },
];

export default function UploadPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsUploading(false);
    setSelectedFile(null);
    setUploadProgress(0);
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
              <h1 className="text-3xl font-bold text-gray-900">Upload Email Lists</h1>
              <p className="text-gray-600 mt-2">
                Upload CSV or Excel files containing your email subscribers
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Section */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-blue-500" />
                        Upload New List
                      </CardTitle>
                      <CardDescription>
                        Drag and drop your CSV or Excel file, or click to browse
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragOver
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                          
                          {selectedFile ? (
                            <div className="mb-4">
                              <div className="flex items-center bg-gray-50 rounded-lg p-3 mb-3">
                                <FileText className="w-5 h-5 text-blue-500 mr-2" />
                                <span className="text-sm font-medium">{selectedFile.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedFile(null)}
                                  className="ml-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {isUploading && (
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              )}
                              
                              <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                              >
                                {isUploading ? 'Uploading...' : 'Upload File'}
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Drop your file here
                              </h3>
                              <p className="text-gray-500 mb-4">
                                Supports CSV, XLSX files up to 10MB
                              </p>
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                              />
                              <Label htmlFor="file-upload">
                                <Button
                                  variant="outline"
                                  className="cursor-pointer border-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent"
                                  asChild
                                >
                                  <span>Choose File</span>
                                </Button>
                              </Label>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">File Requirements:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• First column should contain email addresses</li>
                          <li>• Optional columns: name, company, phone</li>
                          <li>• Maximum file size: 10MB</li>
                          <li>• Supported formats: CSV, XLSX, XLS</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Upload Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Lists</span>
                        <span className="font-semibold">3</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Contacts</span>
                        <span className="font-semibold">20,435</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-semibold text-green-600">+2,156</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sample Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Download our sample CSV template to ensure proper formatting
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Uploaded Lists */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Your Email Lists</CardTitle>
                  <CardDescription>
                    Manage your uploaded email lists and track their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uploadedLists.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center mr-4">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{list.name}</h4>
                            <p className="text-sm text-gray-500">
                              {list.count.toLocaleString()} contacts • {list.uploaded}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {list.status === 'active' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
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