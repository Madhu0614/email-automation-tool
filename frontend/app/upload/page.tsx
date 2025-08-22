'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Download,
  Trash2,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { UploadedFile, EmailList } from '@/types/uploads';
import Papa from 'papaparse';

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEmailLists();
  }, []);

  const fetchEmailLists = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: EmailList[] = data.map((item: any) => ({
        id: item.id,
        name: item.filename,
        description: `Uploaded ${new Date(item.created_at).toLocaleDateString()}`,
        count: 0,
        status: item.status,
        tags: [],
        quality: 'good' as const,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      }));

      setEmailLists(transformedData);
    } catch (error) {
      console.error('Error fetching email lists:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (fileList: File[]) => {
    const csvFiles = fileList.filter(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      alert('Please upload only CSV files.');
      return;
    }

    for (const file of csvFiles) {
      const newFile: UploadedFile = {
        id: Date.now() + Math.random(),
        name: file.name.replace('.csv', ''),
        originalName: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'text/csv',
        uploadedAt: new Date().toISOString(),
        progress: 0,
        status: 'uploading',
      };

      setFiles(prev => [...prev, newFile]);

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === newFile.id ? { ...f, progress } : f
          ));
        }

        // Process CSV file
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true });
        
        if (parsed.errors.length > 0) {
          throw new Error('CSV parsing failed');
        }

        const preview = Papa.parse(text, { preview: 5 }).data as string[][];

        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('uploads')
          .insert({
            filename: file.name,
            original_name: file.name,
            file_size: file.size,
            file_type: file.type || 'text/csv',
            storage_path: uploadData.path,
            status: 'completed',
          });

        if (dbError) throw dbError;

        setFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, status: 'completed', preview } 
            : f
        ));

        // Refresh the email lists
        fetchEmailLists();

      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, status: 'error' } 
            : f
        ));
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (id: number) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const previewFile = (file: UploadedFile) => {
    if (file.preview) {
      setCsvPreview(file.preview);
      setSelectedFile(file);
      setIsPreviewOpen(true);
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold text-gray-900">Upload Email Lists</h1>
              <p className="text-gray-600 mt-2">
                Upload CSV files containing your email lists for campaigns
              </p>
            </motion.div>

            {/* Upload Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Upload Files</CardTitle>
                  <CardDescription>
                    Drag and drop your CSV files here, or click to browse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".csv"
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your CSV files here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to browse from your computer
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      Choose Files
                    </Button>
                  </div>

                  {/* File Requirements */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">File Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• CSV format only</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• Required columns: email (other columns optional)</li>
                      <li>• UTF-8 encoding recommended</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upload Progress */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {files.map((file) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center flex-1">
                              {getStatusIcon(file.status)}
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {file.originalName}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    {file.status === 'completed' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => previewFile(file)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(file.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-gray-500">
                                    {file.size} • {file.status}
                                  </p>
                                  {file.status === 'uploading' && (
                                    <span className="text-xs text-blue-600">
                                      {file.progress}%
                                    </span>
                                  )}
                                </div>
                                {(file.status === 'uploading' || file.status === 'processing') && (
                                  <Progress value={file.progress} className="mt-2" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Lists */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Email Lists</CardTitle>
                      <CardDescription>
                        Manage your uploaded email lists and view their details
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {emailLists.length} lists
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {emailLists.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No email lists yet</p>
                      <p className="text-sm text-gray-500">
                        Upload your first CSV file to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {emailLists.map((list) => (
                        <motion.div
                          key={list.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-4">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h4 className="font-medium text-gray-900">{list.name}</h4>
                                <Badge
                                  variant="secondary"
                                  className={getStatusColor(list.status || 'completed')}
                                >
                                  {list.status || 'completed'}
                                </Badge>
                                {list.quality && (
                                  <Badge
                                    variant="outline"
                                    className={getQualityColor(list.quality)}
                                  >
                                    {list.quality}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{list.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {list.count || 0} contacts
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(list.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>

      {/* CSV Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>CSV Preview: {selectedFile?.originalName}</DialogTitle>
            <DialogDescription>
              Preview of the first 5 rows from your CSV file
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {csvPreview.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvPreview[0]?.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-2 text-left font-medium text-gray-900 border-b"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-gray-700 border-b"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}