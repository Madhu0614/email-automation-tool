'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  X,
  FileSpreadsheet,
  Database,
  Clock,
  TrendingUp,
  Sparkles,
  Zap,
  BarChart3,
  Shield,
  Layers
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileValidation, setFileValidation] = useState<{ valid: boolean; message: string; details?: any } | null>(null);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
      validateAndSetFile(files[0]);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileExtension = '.' + extension;

    if (file.size > maxSize) {
      setFileValidation({
        valid: false,
        message: 'File size exceeds 10MB limit',
        details: { size: file.size, maxSize }
      });
      return;
    }

    if (!allowedTypes.includes(fileExtension)) {
      setFileValidation({
        valid: false,
        message: 'Only CSV, XLSX, and XLS files are supported',
        details: { extension: fileExtension, allowed: allowedTypes }
      });
      return;
    }

    setFileValidation({
      valid: true,
      message: 'File is valid and ready to upload',
      details: {
        size: file.size,
        type: fileExtension,
        estimatedRecords: Math.floor(file.size / 100)
      }
    });
    setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const fetchUploadedFiles = async () => {
    setIsFetchingFiles(true);
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error.message);
      setUploadedFiles([]);
    } else {
      setUploadedFiles(data || []);
    }
    setIsFetchingFiles(false);
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

const simulateUpload = async () => {
  if (!selectedFile) return;

  setIsUploading(true);
  setUploadStatus('uploading');
  setUploadProgress(0);

  const progressSteps = [10, 25, 40, 60, 75, 85, 95, 100];
  for (const step of progressSteps) {
    await new Promise((r) => setTimeout(r, 300));
    setUploadProgress(step);
  }

  try {
    const filePath = `uploads/${Date.now()}_${selectedFile.name}`;
    console.log('Uploading to path:', filePath);

    // Step 1: Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('csv-uploads')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: selectedFile.type || 'application/octet-stream'
      });

    if (uploadError) throw uploadError;

    // Step 2: Insert metadata into uploads table (match your columns only)
    const { error: insertError } = await supabase.from('uploads').insert([
      {
        filename: selectedFile.name,
        storage_path: filePath,
        uploaded_at: new Date().toISOString(),
        user_id: null // or set this dynamically if your users are signed in
      }
    ]);

    if (insertError) throw insertError;

    await fetchUploadedFiles();
    setUploadStatus('success');
  } catch (err) {
    console.error('Upload failed:', err);
    setUploadStatus('error');
  }

  setTimeout(() => {
    setIsUploading(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setFileValidation(null);
  }, 1500);
};

  const parseCSV = (text: string): string[][] => {
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
    return result.data as string[][];
  };

  const parseXLSX = async (arrayBuffer: ArrayBuffer): Promise<string[][]> => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    return json as string[][];
  };

  const handleViewFile = async (filePath: string, fileName: string) => {
    setPreviewError(null);
    setViewingFileName(fileName);
    setPreviewData(null);
    try {
      const { data, error } = await supabase.storage.from('csv-uploads').download(filePath);
      if (error || !data) throw new Error(error?.message || 'Failed to download file');

      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (ext === 'csv') {
        const text = await data.text();
        const parsed = parseCSV(text);
        setPreviewData(parsed);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const arrayBuffer = await data.arrayBuffer();
        const parsed = await parseXLSX(arrayBuffer);
        setPreviewData(parsed);
      } else {
        throw new Error('Unsupported file type for preview');
      }
    } catch (err: any) {
      setPreviewData([]);
      setPreviewError(typeof err === 'string' ? err : err?.message || 'Error loading preview');
    }
  };

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'processed':
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 flex items-center gap-1.5 px-3 py-1 font-medium"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Processed
        </Badge>
      );
    case 'processing':
      return (
        <Badge
          variant="default"
          className="bg-yellow-100 text-yellow-700 flex items-center gap-1.5 px-3 py-1 font-medium"
        >
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Processing
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="px-3 py-1">Unknown</Badge>;
  }
};


  const totalRecords = uploadedFiles.reduce((sum, file) => sum + (file.records || 0), 0);
  const totalValidEmails = uploadedFiles.reduce((sum, file) => sum + (file.validEmails || 0), 0);
  const successRate = totalRecords > 0 ? ((totalValidEmails / totalRecords) * 100).toFixed(1) : '0';

  const handleDelete = async (fileId: number, filePath: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    await supabase.storage.from('csv-uploads').remove([filePath]);
  };



return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              {/* Left Side */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent leading-snug">
                    Email List Manager
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg font-medium mt-1">
                    Advanced upload and processing system
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Lists</p>
                      <p className="text-3xl font-bold">{uploadedFiles.length}</p>
                      <p className="text-blue-200 text-xs">+2 this week</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">Processed</p>
                      <p className="text-3xl font-bold">{uploadedFiles.filter(f => f.status === 'processed').length}</p>
                      <p className="text-emerald-200 text-xs">98.5% success</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Upload Section */}
              <div className="xl:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <CardHeader className="pb-6">
                        <CardTitle className="flex items-center text-2xl font-bold text-gray-900">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                          Upload New List
                        </CardTitle>
                        <CardDescription className="text-base text-gray-600 font-medium">
                          Advanced file processing with intelligent validation and data enrichment
                        </CardDescription>
                      </CardHeader>
                    </div>

                    <CardContent className="p-6 lg:p-8">
                      <motion.div
                        className={`relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-all duration-300 ${
                          isDragOver
                            ? 'border-blue-400 bg-blue-50 scale-[1.02] shadow-lg'
                            : selectedFile
                            ? 'border-emerald-400 bg-emerald-50 shadow-md'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                        }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        whileHover={{ scale: selectedFile ? 1 : 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <AnimatePresence mode="wait">
                          {selectedFile ? (
                            <motion.div
                              key="file-selected"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="space-y-6"
                            >
                              <div className="flex items-center justify-center">
                                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl">
                                  <FileText className="w-10 h-10 text-white" />
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                      <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <p className="font-semibold text-gray-900 text-lg truncate max-w-xs">
                                        {selectedFile.name}
                                      </p>
                                      <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                        <span className="font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                        {fileValidation?.details?.estimatedRecords && (
                                          <>
                                            <span>•</span>
                                            <span>~{fileValidation.details.estimatedRecords.toLocaleString()} records</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFile(null);
                                      setFileValidation(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                                  >
                                    <X className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>

                              {fileValidation && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex items-center justify-center space-x-3 text-sm font-medium px-4 py-3 rounded-xl ${
                                    fileValidation.valid
                                      ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                                      : 'text-red-700 bg-red-100 border border-red-200'
                                  }`}
                                >
                                  {fileValidation.valid ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5" />
                                  )}
                                  <span>{fileValidation.message}</span>
                                </motion.div>
                              )}

                              {isUploading && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                                      <span>Upload Progress</span>
                                      <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-3 bg-gray-200" />
                                  </div>
                                  <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    <span className="font-medium">
                                      {uploadStatus === 'uploading'
                                        ? 'Processing your file...'
                                        : uploadStatus === 'success'
                                        ? 'Upload completed successfully!'
                                        : 'Analyzing data...'}
                                    </span>
                                  </div>
                                </motion.div>
                              )}

                              <Button
                                onClick={simulateUpload}
                                disabled={isUploading || !fileValidation?.valid}
                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                size="lg"
                              >
                                {isUploading ? (
                                  <div className="flex items-center space-x-3">
                                    <Zap className="w-5 h-5 animate-pulse" />
                                    <span>Processing...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-3">
                                    <Upload className="w-5 h-5" />
                                    <span>Upload & Process File</span>
                                  </div>
                                )}
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="no-file"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="space-y-6"
                            >
                              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
                                <Upload className="w-12 h-12 text-white" />
                              </div>

                              <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-gray-900">Drop your files here</h3>
                                <p className="text-gray-600 text-lg max-w-md mx-auto">
                                  Advanced processing with validation, deduplication, and enrichment
                                </p>
                              </div>

                              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" id="file-upload" />
                              <Label htmlFor="file-upload">
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="cursor-pointer border-2 border-dashed border-gray-400 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 px-8 py-4 rounded-xl font-semibold"
                                  asChild
                                >
                                  <span className="flex items-center space-x-3">
                                    <FileText className="w-5 h-5" />
                                    <span>Choose Files</span>
                                  </span>
                                </Button>
                              </Label>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
              </motion.div>
            </div>

            {/* Uploaded Files List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 lg:mt-12"
            >
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl flex items-center font-bold text-gray-900">
                      <FileSpreadsheet className="w-7 h-7 mr-4 text-blue-500" />
                      Uploaded Files
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 font-medium">
                      Manage and analyze your uploaded email lists with detailed insights
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="p-6 lg:p-8">
                  <div className="space-y-4">
                    {uploadedFiles.length === 0 ? (
                      <div className="text-center py-16">
                        <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-gray-500 mb-2">No files uploaded yet</h3>
                        <p className="text-gray-400 text-lg">Upload your first email list to get started</p>
                      </div>
                    ) : (
                      uploadedFiles.map((file, index) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group relative p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                                <FileSpreadsheet className="w-7 h-7 text-white" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">
                                  {file.filename}
                                </h4>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Database className="w-4 h-4" />
                                    <span className="font-medium">{file.size}</span>
                                  </div>
                                    <div className="flex items-center space-x-1">
                                      <Database className="w-4 h-4" />
                                      <span className="font-medium">
                                        {Number(file.records ?? file.recordCount ?? 0).toLocaleString()} records
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">
                                        {file.created_at || file.createdAt
                                          ? new Date(file.created_at || file.createdAt).toLocaleDateString()
                                          : "No date"}
                                      </span>
                                    </div>

                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end gap-4">
                              {getStatusBadge(file.status)}

                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewFile(file.storage_path, file.filename)}
                                  className="hover:bg-blue-100 hover:text-blue-600 rounded-xl"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-emerald-100 hover:text-emerald-600 rounded-xl"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(file.id, file.file_path)}
                                  className="hover:bg-red-100 hover:text-red-600 rounded-xl"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview Modal */}
            <AnimatePresence>
              {previewData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                  onClick={() => {
                    setPreviewData(null);
                    setViewingFileName(null);
                    setPreviewError(null);
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900">File Preview</h3>
                        <p className="text-gray-600 font-medium">{viewingFileName}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{Math.max((previewData?.length || 1) - 1, 0)} records</span>
                          <span>•</span>
                          <span>{previewData?.[0]?.length || 0} columns</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setPreviewData(null);
                          setViewingFileName(null);
                          setPreviewError(null);
                        }}
                        className="hover:bg-gray-100 rounded-xl p-3"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </div>

                    <div className="p-8 overflow-auto max-h-96">
                      {previewError && (
                        <div className="mb-4 text-sm text-red-600 font-medium">
                          {previewError}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                              {previewData[0]?.map((header, idx) => (
                                <th
                                  key={idx}
                                  className="px-6 py-4 text-left font-bold text-gray-900 border-b-2 border-gray-200 whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.slice(1).map((row, rowIndex) => (
                              <motion.tr
                                key={rowIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: rowIndex * 0.03 }}
                                className="hover:bg-blue-50 transition-colors"
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-6 py-4 border-b border-gray-100 text-gray-700 font-medium whitespace-nowrap"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-8 border-t border-gray-200 bg-gray-50">
                      <p className="text-sm text-gray-600 font-medium">
                        Showing {Math.min((previewData?.length || 1) - 1, 10)} of {(previewData?.length || 1) - 1} records
                      </p>
                      <div className="flex items-center space-x-3">
                        <Button variant="outline" className="rounded-xl font-medium">
                          Export Sample
                        </Button>
                        <Button
                          onClick={() => {
                            setPreviewData(null);
                            setViewingFileName(null);
                            setPreviewError(null);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl font-medium"
                        >
                          Close Preview
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
