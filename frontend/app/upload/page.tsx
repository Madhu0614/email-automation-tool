'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import supabase from '@/lib/supabaseClient';
import { Switch } from '@/components/ui/switch';
import Papa from 'papaparse';
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Edit,
  Filter,
  Search,
  Plus,
  X,
  FileSpreadsheet,
  Database,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  Share2,
  Star,
  Bookmark,
  Tag,
  Calendar,
  Globe,
  Mail,
  Phone,
  Building,
  User,
  MapPin,
  Activity,
  Target,
  Layers,
  Archive,
  Copy,
  MoreHorizontal,
  FileCheck,
  AlertTriangle,
  Info,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface UploadedFile {
  id: number;
  name: string;
  originalName: string;
  size: string;
  type: string;
  uploadedAt: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  preview?: string[];
  
}

interface EmailList {
  id: number;
  name: string;
  description: string;
  count: number;
  uploaded_at: string;
  file_path?: string;
  contacts: number;
}

export default function UploadPage() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  // Updated preview state for CSV data
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]); // Changed to 2D array
  const [previewListName, setPreviewListName] = useState(''); // Add this
  const [isLoadingPreview, setIsLoadingPreview] = useState(false); // Add this
  
  const [selectedList, setSelectedList] = useState<EmailList | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStats, setUploadStats] = useState({ totalLists: 0, totalContacts: 0, thisMonth: 0, avgQuality: 0 });

  // New list state
  const [newListName, setNewListName] = useState('');
  const [newListSource, setNewListSource] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListTags, setNewListTags] = useState('');
  const [autoClean, setAutoClean] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState(false);
  const [gdprCompliance, setGdprCompliance] = useState(false);

  // For file uploads
  const [selectedListForUpload, setSelectedListForUpload] = useState<number | null>(null);


  const templates = [
    { id: 1, name: 'Standard CSV', description: 'Email, Name, Company columns', columns: ['email', 'name', 'company'], icon: FileText, color: 'from-blue-500 to-blue-600' },
    { id: 2, name: 'Extended Contact', description: 'Full contact information', columns: ['email','first_name','last_name','company','phone','location'], icon: User, color: 'from-green-500 to-green-600' },
    { id: 3, name: 'E-commerce', description: 'Customer purchase data', columns: ['email','name','purchase_date','amount','category'], icon: Building, color: 'from-purple-500 to-purple-600' },
    { id: 4, name: 'Event Attendees', description: 'Event registration data', columns: ['email','name','company','event','registration_date'], icon: Calendar, color: 'from-orange-500 to-orange-600' },
  ];

  // Add the preview function here
  // Add the preview function here
  const previewCSVData = async (list: EmailList) => {
    if (!list.file_path) {
      alert('No file uploaded for this list');
      return;
    }

    setIsLoadingPreview(true);
    setPreviewListName(list.name);
    
    try {
      const { data: fileData } = supabase.storage
        .from('csv-uploads')
        .getPublicUrl(list.file_path);

      if (!fileData?.publicUrl) {
        alert('Unable to get file URL');
        return;
      }

      const response = await fetch(fileData.publicUrl);
      const csvText = await response.text();
      
      console.log('Raw CSV (first 300 chars):', csvText.substring(0, 300));
      
      // Use Papa Parse with proper configuration
      const results = Papa.parse(csvText, {
        skipEmptyLines: true,
        header: false,
        delimiter: ',',
      });
      
      console.log('Papa Parse results:', results);
      console.log('First row (headers):', results.data[0]);
      console.log('Second row:', results.data[1]);

      let csvRows = results.data as string[][];
      
      // Check if first row has only 1 column, not if csvRows has 1 row
      if (csvRows.length > 0 && csvRows[0].length === 1) {
        console.log('Forcing header split...');
        // Get the first string from first row
        const headerString = csvRows[0][0]; // Get the first element (string)
        csvRows = [headerString.split(',').map(h => h.trim())];
      }
      
      // Alternative: If CSV doesn't have commas, try manual parsing
      if (csvRows.length > 0 && csvRows[0].length === 1) {
        console.log('CSV appears to be concatenated without commas');
        
        // Define expected headers for your CSV structure
        const expectedHeaders = [
          'Sno', 'Company Name', 'First Name', 'Last Name', 'Email Address', 
          'Job Title', 'Address Line', 'City', 'State Or Province', 'Country', 
          'Postal Code', 'yy', 'Website URL', 'Contact Linkedin Profile Link', 
          'Total Employees', 'Revenue ($M)', 'Industry Type', 'Technology Used'
        ];
        
        // For now, show the concatenated data with expected headers
        csvRows[0] = expectedHeaders;
        
        // Show alert about format issue
        alert('CSV file appears to be missing comma delimiters. Headers have been manually set.');
      }
      
      console.log('Final header row:', csvRows[0]);
      console.log('Total rows:', csvRows.length);
      
      setPreviewData(csvRows);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error fetching CSV:', error);
      alert('Failed to load CSV preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  // ===== Fetch lists from Supabase =====
  const fetchLists = async () => {
    const { data, error } = await supabase.from('lists').select('*');
    if (error) {
      console.error(error);
    } else {
      setLists(data || []);
    }
  };

  // ===== Create new list =====
  const createNewList = async () => {
    if (!newListName) {
      alert('List name is required');
      return;
    }

    const { data, error } = await supabase.from('lists').insert([{
      name: newListName,
      description: newListDescription || '',
      file_path: '',
      uploaded_at: new Date().toISOString(),
      user_id: '12345678-1234-5678-9abc-123456789012',
      contacts: 0 // Initialize with 0 contacts
    }]).select();

    if (error) {
      console.error(error);
      alert('Failed to create list: ' + error.message);
    } else {
      setIsDialogOpen(false);
      setNewListName('');
      setNewListDescription('');
      if (data) {
        setLists(prev => [...prev, data[0] as EmailList]);
        alert('List created successfully!');
      }
    }
  };

  // ===== Drag & Drop =====
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, []);

  const handleFileSelection = async (files: File[], selectedListId?: number) => {
    for (const file of files) {
      const filePath = `${Date.now()}-${file.name}`;
      
      try {
        // Read file content to count rows
        const fileText = await file.text();
        console.log('File content preview:', fileText.substring(0, 200));
        
        const lines = fileText.split('\n');
        
        // Better contact counting - handle different CSV formats
        let contactCount = 0;
        const firstLine = lines[0] || '';
        
        if (firstLine.includes(',')) {
          // Proper CSV with commas
          contactCount = lines.slice(1).filter(line => line.trim() !== '').length;
        } else {
          // CSV without proper delimiters - count lines
          contactCount = lines.slice(1).filter(line => line.trim() !== '').length;
          console.log('Warning: CSV appears to be missing comma delimiters');
        }
        
        console.log(`Counted ${contactCount} contacts`);
        
        // Upload file to storage
        const { error: storageError } = await supabase.storage
          .from("csv-uploads")
          .upload(filePath, file);
        
        if (storageError) { 
          console.error('Storage error:', storageError);
          alert(`Failed to upload ${file.name}: ${storageError.message}`);
          continue; 
        }

        if (selectedListId) {
          // Update existing list
          const { error: updateError } = await supabase
            .from("lists")
            .update({ 
              file_path: filePath,
              contacts: contactCount 
            })
            .eq('id', selectedListId);
            
          if (updateError) {
            console.error('Update error:', updateError);
            alert(`Failed to update list: ${updateError.message}`);
            continue;
          }
          
          fetchLists();
          alert(`File uploaded successfully! Found ${contactCount} contacts.`);
        } else {
          // Create new list
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            alert('You must be logged in to create a list');
            continue;
          }

          const { data, error: dbError } = await supabase.from("lists").insert([{
            name: file.name.split(".")[0],
            description: "Uploaded CSV file",
            file_path: filePath,
            uploaded_at: new Date().toISOString(),
            user_id: user.id,
            contacts: contactCount
          }]).select();

          if (dbError) { 
            console.error('Database error:', dbError);
            alert(`Failed to create list: ${dbError.message}`);
            continue; 
          }

          if (data && data.length) {
            setLists(prev => [...prev, data[0]]);
            alert(`List created successfully! Found ${contactCount} contacts.`);
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`Failed to process ${file.name}`);
      }
    }
  };

  const filteredLists = lists.filter(list => {
    // Filter by file status if needed
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      if (filterStatus === 'with-file') {
        matchesStatus = !!list.file_path;
      } else if (filterStatus === 'no-file') {
        matchesStatus = !list.file_path;
      }
    }
    
    const matchesSearch = list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          list.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Remove unused functions and variables
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'processing': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'error': return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'archived': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Star className="w-4 h-4 text-green-500" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'fair': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              {/* Left Section */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Email List Management</h1>
                <p className="text-gray-600 mt-2">
                  Upload, manage, and optimize your email subscriber lists
                </p>
              </div>

              {/* Right Actions */}
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Templates
                </Button>

                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync
                </Button>

                {/* Create New List Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      New List
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Email List</DialogTitle>
                      <DialogDescription>
                        Set up a new email list with custom settings and segmentation
                      </DialogDescription>
                    </DialogHeader>

                    {/* Form Content */}
                    <div className="space-y-6">
                      {/* List Name + Source */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="list-name">List Name</Label>
                          <Input 
                            id="list-name" 
                            placeholder="Enter list name"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="list-source">Source</Label>
                          <Select value={newListSource} onValueChange={setNewListSource}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="website">Website Signup</SelectItem>
                              <SelectItem value="import">File Import</SelectItem>
                              <SelectItem value="api">API Integration</SelectItem>
                              <SelectItem value="manual">Manual Entry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <Label htmlFor="list-description">Description</Label>
                        <Textarea 
                          id="list-description" 
                          placeholder="Describe this email list..."
                          rows={3}
                          value={newListDescription}
                          onChange={(e) => setNewListDescription(e.target.value)}
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <Label htmlFor="list-tags">Tags</Label>
                        <Input 
                          id="list-tags" 
                          placeholder="Enter tags separated by commas"
                          value={newListTags}
                          onChange={(e) => setNewListTags(e.target.value)}
                        />
                      </div>

                      {/* Advanced Settings */}
                      <div className="space-y-3">
                        <Label>Advanced Settings</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="auto-clean" 
                              checked={autoClean}
                              onCheckedChange={setAutoClean}
                            />
                            <Label htmlFor="auto-clean">Auto-clean invalid emails</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="duplicate-check"
                              checked={duplicateCheck}
                              onCheckedChange={setDuplicateCheck}
                            />
                            <Label htmlFor="duplicate-check">Remove duplicates</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="gdpr-compliance"
                              checked={gdprCompliance}
                              onCheckedChange={setGdprCompliance}
                            />
                            <Label htmlFor="gdpr-compliance">GDPR compliance mode</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        onClick={createNewList}
                      >
                        Create List
                      </Button>
                    </DialogFooter>
                  </DialogContent>

                </Dialog>
              </div>
            </div>
          </motion.div>


            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Lists</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{uploadStats.totalLists}</p>
                        <p className="text-sm text-green-600 mt-1">+2 this month</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 group-hover:scale-110 transition-transform">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={75} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{uploadStats.totalContacts.toLocaleString()}</p>
                        <p className="text-sm text-green-600 mt-1">+1,234 this week</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={85} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">+{uploadStats.thisMonth.toLocaleString()}</p>
                        <p className="text-sm text-blue-600 mt-1">New subscribers</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={65} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Quality</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{uploadStats.avgQuality}%</p>
                        <p className="text-sm text-green-600 mt-1">Excellent rating</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 group-hover:scale-110 transition-transform">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={uploadStats.avgQuality} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Section */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-blue-500" />
                        Upload Email Lists
                      </CardTitle>
                      <CardDescription>
                        Drag and drop your CSV or Excel files, or choose from templates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="upload">File Upload</TabsTrigger>
                          <TabsTrigger value="templates">Templates</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="upload" className="space-y-4">
                          {/* File Requirements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-start">
                                <FileCheck className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900 mb-1">
                                    File Requirements
                                  </p>
                                  <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Email column is required</li>
                                    <li>• Maximum file size: 50MB</li>
                                    <li>• Supported: CSV, XLSX, XLS</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-green-50 rounded-lg">
                              <div className="flex items-start">
                                <Sparkles className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-green-900 mb-1">
                                    Smart Features
                                  </p>
                                  <ul className="text-sm text-green-800 space-y-1">
                                    <li>• Auto-detect duplicates</li>
                                    <li>• Email validation</li>
                                    <li>• Smart column mapping</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="templates" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template) => (
                              <motion.div
                                key={template.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  selectedTemplate === template.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedTemplate(template.id)}
                              >
                                <div className="flex items-center mb-3">
                                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center mr-3`}>
                                    <template.icon className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                                    <p className="text-sm text-gray-500">{template.description}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {template.columns.map((column: string) => (
                                    <Badge key={column} variant="outline" className="text-xs">
                                      {column}
                                    </Badge>
                                  ))}
                                </div>

                              </motion.div>
                            ))}
                          </div>
                          
                          <div className="flex justify-center">
                            <Button
                              disabled={!selectedTemplate}
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Template
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Actions Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Smart Cleanup
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Create Segments
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze Quality
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Share2 className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Filters and Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 mb-6"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search lists, tags, or descriptions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-80"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Lists</SelectItem>
                          <SelectItem value="with-file">With File</SelectItem>
                          <SelectItem value="no-file">No File</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        Grid
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Email Lists Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredLists.map((list, index) => (
                    <motion.div
                      key={list.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="group"
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                              </div>
                              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                {list.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {list.description}
                              </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Contacts</p>
                                 <p className="font-semibold">{list.contacts || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Uploaded Date</p>
                                <p className="font-semibold">{new Date(list.uploaded_at).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="text-xs text-gray-500">
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (list.file_path) {
                                      const { data } = supabase.storage
                                        .from('csv-uploads')
                                        .getPublicUrl(list.file_path);

                                      if (data?.publicUrl) {
                                        window.open(data.publicUrl);
                                      } else {
                                        alert("Unable to get file URL.");
                                      }
                                    } else {
                                      alert("No CSV file uploaded for this list.");
                                    }
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>

                              </div>
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Your Email Lists</CardTitle>
                  <CardDescription>
                    Manage all your email lists and their performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredLists.map((list, index) => (
                        <motion.div
                          key={list.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {list.name}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{list.description}</p>
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  <span className="font-semibold">{list.contacts || 0}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(list.uploaded_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View"
                              onClick={() => previewCSVData(list)}
                              disabled={isLoadingPreview}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Download">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Upload File"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.csv,.xlsx,.xls';
                                input.onchange = (e) => {
                                  const target = e.target as HTMLInputElement;
                                  if (target.files) {
                                    handleFileSelection(Array.from(target.files), list.id);
                                  }
                                };
                                input.click();
                              }}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* CSV Preview Dialog - UNIVERSAL VERSION */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="sm:max-w-[95vw] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Complete CSV File - {previewListName}</DialogTitle>
                <DialogDescription>
                  Showing all{" "}
                  {previewData.length > 0 ? previewData.length - 1 : 0} rows from the
                  uploaded CSV file
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-auto max-h-[70vh] border rounded">
                {isLoadingPreview ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Loading complete file...</span>
                  </div>
                ) : previewData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          {Array.isArray(previewData[0])
                            ? // case 1: CSV parsed as array of arrays
                              previewData[0].map((header, index) => (
                                <th
                                  key={`header-${index}`}
                                  className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900 text-sm"
                                >
                                  {header}
                                </th>
                              ))
                            : // case 2: CSV parsed as array of objects
                              Object.keys(previewData[0] || {}).map((header, index) => (
                                <th
                                  key={`header-${index}`}
                                  className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900 text-sm"
                                >
                                  {header}
                                </th>
                              ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(previewData[0])
                          ? // array-of-arrays → skip first row (headers)
                            previewData.slice(1).map((row, rowIndex) => (
                              <tr
                                key={`row-${rowIndex}`}
                                className="hover:bg-gray-50"
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className="border border-gray-300 px-4 py-2 text-sm text-gray-700"
                                  >
                                    {cell || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))
                          : // array-of-objects
                            previewData.map((row, rowIndex) => (
                              <tr
                                key={`row-${rowIndex}`}
                                className="hover:bg-gray-50"
                              >
                                {Object.values(row).map((cell, cellIndex) => (
                                  <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className="border border-gray-300 px-4 py-2 text-sm text-gray-700"
                                  >
                                    {cell || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FileText className="w-16 h-16" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No File Available
                    </h3>
                    <p className="text-gray-500 text-center max-w-sm">
                      This list doesn&apos;t have an uploaded CSV file to preview. Upload a
                      file first to see the data.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {previewData.length > 0 && (
                    <span>
                      Showing{" "}
                      {Array.isArray(previewData[0])
                        ? previewData.length - 1
                        : previewData.length}{" "}
                      rows ×{" "}
                      {Array.isArray(previewData[0])
                        ? previewData[0]?.length || 0
                        : Object.keys(previewData[0] || {}).length}
                      {" "}columns
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                    Close
                  </Button>
                  {previewData.length > 0 && (
                    <Button
                      onClick={() => {
                        const list = lists.find((l) => l.name === previewListName);
                        if (list?.file_path) {
                          const { data } = supabase.storage
                            .from("csv-uploads")
                            .getPublicUrl(list.file_path);
                          if (data?.publicUrl) {
                            window.open(data.publicUrl);
                          }
                        }
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Full File
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </div>
    </div>
  );
}