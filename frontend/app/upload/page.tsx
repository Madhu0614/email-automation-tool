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
<<<<<<< HEAD
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
=======
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
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
<<<<<<< HEAD
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
  Loader2,
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';

interface EmailList {
  id: number;
  name: string;
  description: string;
  count?: number;
  uploaded: string;
  status: 'active' | 'processing' | 'error' | 'archived';
  tags: string[];
  source: string;
  lastUsed?: string;
  openRate?: number;
  clickRate?: number;
  bounceRate?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  segments?: number;
  duplicates?: number;
  invalid?: number;
  file_name?: string;
  created_at: string;
  auto_clean: boolean;
  duplicate_check: boolean;
  gdpr_compliance: boolean;
}
=======
  BarChart3,
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { UploadedFile, EmailList } from '@/types/uploads';
import Papa from 'papaparse';
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41

interface EmailContact {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company?: string;
  phone?: string;
  location?: string;
  job_title?: string;
  status: string;
  created_at: string;
}

const templates = [
  {
    id: 1,
    name: 'Standard CSV',
    description: 'Email, Name, Company columns',
    columns: ['email', 'name', 'company'],
    icon: FileText,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    name: 'Extended Contact',
    description: 'Full contact information',
    columns: ['email', 'first_name', 'last_name', 'company', 'phone', 'location'],
    icon: User,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 3,
    name: 'E-commerce',
    description: 'Customer purchase data',
    columns: ['email', 'name', 'purchase_date', 'amount', 'category'],
    icon: Building,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 4,
    name: 'Event Attendees',
    description: 'Event registration data',
    columns: ['email', 'name', 'company', 'event', 'registration_date'],
    icon: Calendar,
    color: 'from-orange-500 to-orange-600',
  },
];

export default function UploadPage() {
<<<<<<< HEAD
  // Email Lists from Database
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<EmailContact[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContactsDialogOpen, setIsContactsDialogOpen] = useState(false);
  
  // Stats
  const [uploadStats, setUploadStats] = useState({
    totalLists: 0,
    totalContacts: 0,
    thisMonth: 0,
    avgQuality: 0,
  });
  
  // Form States
  const [listName, setListName] = useState('');
  const [listSource, setListSource] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [autoClean, setAutoClean] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState(false);
  const [gdprCompliance, setGdprCompliance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // CSV Processing function
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  };

  // Process uploaded file and extract contacts
  const processUploadedFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedData = parseCSV(text);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Load email lists from database
  const fetchEmailLists = async () => {
    try {
      setIsLoadingLists(true);
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email lists:', error);
        return;
      }

      const formattedLists: EmailList[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        count: item.count || 0,
        uploaded: formatTimeAgo(item.created_at),
        status: item.status || 'active',
        tags: item.tags || [],
        source: item.source || 'Unknown',
        lastUsed: item.last_used ? formatTimeAgo(item.last_used) : 'Never',
        openRate: item.open_rate || 0,
        clickRate: item.click_rate || 0,
        bounceRate: item.bounce_rate || 0,
        quality: item.quality || 'fair',
        segments: item.segments || 0,
        duplicates: item.duplicates || 0,
        invalid: item.invalid || 0,
        file_name: item.file_name,
        created_at: item.created_at,
        auto_clean: item.auto_clean || false,
        duplicate_check: item.duplicate_check || false,
        gdpr_compliance: item.gdpr_compliance || false,
      }));

      setEmailLists(formattedLists);
      calculateStats(formattedLists);
    } catch (err) {
      console.error('Error in fetchEmailLists:', err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  // Fetch contacts for a specific list
  const fetchEmailContacts = async (listId: number) => {
    try {
      const { data, error } = await supabase
        .from('email_contacts')
        .select('*')
        .eq('email_list_id', listId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }

      return data as EmailContact[];
    } catch (err) {
      console.error('Error in fetchEmailContacts:', err);
      return [];
    }
  };

  // View contacts for a list
  const handleViewContacts = async (listId: number) => {
    setSelectedListId(listId);
    const contacts = await fetchEmailContacts(listId);
    setPreviewData(contacts);
    setIsContactsDialogOpen(true);
  };

  // Calculate statistics
  const calculateStats = (lists: EmailList[]) => {
    const totalLists = lists.length;
    const totalContacts = lists.reduce((sum, list) => sum + (list.count || 0), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = lists.filter(list => {
      const listDate = new Date(list.created_at);
      return listDate.getMonth() === currentMonth && listDate.getFullYear() === currentYear;
    }).reduce((sum, list) => sum + (list.count || 0), 0);

    const qualityScores = lists.map(list => {
      switch (list.quality) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'fair': return 60;
        case 'poor': return 40;
        default: return 60;
      }
    });
    const avgQuality = qualityScores.length > 0 
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0;

    setUploadStats({
      totalLists,
      totalContacts,
      thisMonth,
      avgQuality,
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Load data on component mount
=======
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
  useEffect(() => {
    fetchEmailLists();
  }, []);

<<<<<<< HEAD
  // File validation
  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv'
    ];
    const allowedExtensions = ['csv', 'xls', 'xlsx'];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new Error('Please upload CSV or Excel files only');
    }

    return true;
  };

  // Handle file upload in form
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        validateFile(file);
        setUploadedFile(file);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Invalid file');
        event.target.value = '';
      }
    }
  };

  // Create email list with contact processing
  const handleCreateList = async () => {
    if (!listName.trim()) {
      alert('Please enter a list name');
      return;
    }

    setIsLoading(true);
    
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      // Create the email list first
      const insertData = {
        name: listName,
        source: listSource || 'manual',
        description: description,
        tags: tagsArray,
        auto_clean: autoClean,
        duplicate_check: duplicateCheck,
        gdpr_compliance: gdprCompliance,
        file_name: uploadedFile?.name || null,
        file_size: uploadedFile?.size || null,
        file_type: uploadedFile?.type || null,
        status: 'processing',
        created_at: new Date().toISOString(),
      };

      const { data: listData, error: listError } = await supabase
        .from('email_lists')
        .insert([insertData])
        .select()
        .single();

      if (listError) {
        throw new Error(`Database error: ${listError.message}`);
      }

      let contactCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;

      // Process uploaded file if exists
      if (uploadedFile) {
        try {
          const csvData = await processUploadedFile(uploadedFile);
          const validContacts = [];

          for (const row of csvData) {
            // Basic email validation
            const email = row.email || row.Email || row.EMAIL;
            if (!email || !email.includes('@')) {
              invalidCount++;
              continue;
            }

            // Check for duplicates if enabled
            if (duplicateCheck) {
              const { data: existingContact } = await supabase
                .from('email_contacts')
                .select('id')
                .eq('email_list_id', listData.id)
                .eq('email', email)
                .single();

              if (existingContact) {
                duplicateCount++;
                continue;
              }
            }

            // Prepare contact data
            const contactData = {
              email_list_id: listData.id,
              email: email.toLowerCase(),
              first_name: row.first_name || row.firstName || row['First Name'] || null,
              last_name: row.last_name || row.lastName || row['Last Name'] || null,
              full_name: row.name || row.Name || row.full_name || row.fullName || null,
              company: row.company || row.Company || null,
              phone: row.phone || row.Phone || null,
              location: row.location || row.Location || row.city || row.City || null,
              job_title: row.job_title || row.jobTitle || row['Job Title'] || null,
              status: 'active',
              opt_in: true,
              created_at: new Date().toISOString(),
            };

            validContacts.push(contactData);
          }

          // Insert all contacts at once
          if (validContacts.length > 0) {
            const { error: contactsError } = await supabase
              .from('email_contacts')
              .insert(validContacts);

            if (contactsError) {
              console.error('Error inserting contacts:', contactsError);
            } else {
              contactCount = validContacts.length;
            }
          }

        } catch (fileError) {
          console.error('Error processing file:', fileError);
        }
      }

      // Update the list with final counts and status
      const { error: updateError } = await supabase
        .from('email_lists')
        .update({
          count: contactCount,
          duplicates: duplicateCount,
          invalid: invalidCount,
          status: 'active',
          quality: contactCount > 1000 ? 'excellent' : contactCount > 500 ? 'good' : 'fair',
          updated_at: new Date().toISOString(),
        })
        .eq('id', listData.id);

      if (updateError) {
        console.error('Error updating list counts:', updateError);
      }

      alert(`Email list created successfully! Added ${contactCount} contacts.`);
      
      // Reset form
      setListName('');
      setListSource('');
      setDescription('');
      setTags('');
      setAutoClean(false);
      setDuplicateCheck(false);
      setGdprCompliance(false);
      setUploadedFile(null);
      setIsDialogOpen(false);
      
      // Refresh the lists
      fetchEmailLists();
      
    } catch (err) {
      console.error('Full error object:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      alert('Error creating list: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete email list
  const handleDeleteList = async (listId: number) => {
    if (!confirm('Are you sure you want to delete this email list? This will also delete all associated contacts.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_lists')
        .delete()
        .eq('id', listId);

      if (error) {
        throw error;
      }

      alert('Email list deleted successfully!');
      fetchEmailLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Error deleting list');
    }
  };
=======
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
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
<<<<<<< HEAD
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'archived':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
=======
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Get quality color
  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent':
<<<<<<< HEAD
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get quality icon
  const getQualityIcon = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return <Star className="w-4 h-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'fair':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Filter lists
  const filteredLists = emailLists.filter(list => {
    const matchesStatus = filterStatus === 'all' || list.status === filterStatus;
    const matchesSearch = list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         list.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         list.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Download template
  const downloadTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const csvContent = template.columns.join(',') + '\n' + 
      template.columns.map(col => `sample_${col}`).join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Export contacts as CSV
  const exportContacts = async (listId: number, listName: string) => {
    try {
      const contacts = await fetchEmailContacts(listId);
      if (contacts.length === 0) {
        alert('No contacts to export');
        return;
      }

      const headers = ['email', 'first_name', 'last_name', 'full_name', 'company', 'phone', 'location', 'job_title', 'status'];
      const csvContent = [
        headers.join(','),
        ...contacts.map(contact => 
          headers.map(header => contact[header as keyof EmailContact] || '').join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${listName.toLowerCase().replace(/\s+/g, '_')}_contacts.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting contacts:', error);
      alert('Error exporting contacts');
    }
  };

=======
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

>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
<<<<<<< HEAD
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Email List Management</h1>
                  <p className="text-gray-600 mt-2">
                    Upload, manage, and optimize your email subscriber lists for campaigns
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={() => fetchEmailLists()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  
                  {/* Create New List Dialog */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New List
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Email List</DialogTitle>
                        <DialogDescription>
                          Set up a new email list with custom settings and upload your contacts
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="list-name">List Name *</Label>
                            <Input 
                              id="list-name" 
                              placeholder="Enter list name"
                              value={listName}
                              onChange={(e) => setListName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="list-source">Source</Label>
                            <Select value={listSource} onValueChange={setListSource}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="website">Website Signup</SelectItem>
                                <SelectItem value="import">File Import</SelectItem>
                                <SelectItem value="api">API Integration</SelectItem>
                                <SelectItem value="manual">Manual Entry</SelectItem>
                                <SelectItem value="social">Social Media</SelectItem>
                                <SelectItem value="event">Event Registration</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="list-description">Description</Label>
                          <Textarea 
                            id="list-description" 
                            placeholder="Describe this email list..."
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>

                        {/* Upload Section */}
                        <div className="space-y-3">
                          <Label>Upload Contacts (CSV/Excel)</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <Label htmlFor="file-upload" className="cursor-pointer">
                                  <span className="mt-2 block text-sm font-medium text-gray-900">
                                    Drop your CSV file here or click to upload
                                  </span>
                                  <span className="mt-1 block text-xs text-gray-500">
                                    CSV, Excel files up to 10MB. Headers: email, name, company, etc.
                                  </span>
                                </Label>
                                <Input
                                  id="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept=".csv,.xlsx,.xls"
                                  onChange={handleFileUpload}
                                />
                              </div>
                            </div>
                            {uploadedFile && (
                              <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded">
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                  <span className="text-sm text-gray-900">{uploadedFile.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({(uploadedFile.size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUploadedFile(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="list-tags">Tags</Label>
                          <Input 
                            id="list-tags" 
                            placeholder="Enter tags separated by commas"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label>Processing Options</Label>
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
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          onClick={handleCreateList}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Create List'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
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
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                        <Database className="w-6 h-6 text-white" />
                      </div>
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
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                        <Users className="w-6 h-6 text-white" />
                      </div>
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
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
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
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                        <Star className="w-6 h-6 text-white" />
                      </div>
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
                        Templates & Resources
                      </CardTitle>
                      <CardDescription>
                        Download templates to format your email lists correctly
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="templates" className="w-full">
                        <TabsList className="grid w-full grid-cols-1">
                          <TabsTrigger value="templates">Download Templates</TabsTrigger>
                        </TabsList>
                        
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
                                  {template.columns.map((column) => (
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
                              onClick={downloadTemplate}
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
                    <CardTitle className="text-lg">Campaign Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Create Segments
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Clean Lists
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CSV Format Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p>Required column: <strong>email</strong></p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p>Optional: first_name, last_name, company</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p>Remove empty rows before uploading</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p>Use comma-separated values (CSV)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Filters and Search */}
=======
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
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
<<<<<<< HEAD
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
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
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
=======
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
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
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
<<<<<<< HEAD
              {isLoadingLists ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading email lists...</span>
                </div>
              ) : filteredLists.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Lists Found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'No lists match your current filters.' 
                        : 'Get started by creating your first email list with contacts.'}
                    </p>
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First List
                    </Button>
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
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
                                  <Badge
                                    variant="secondary"
                                    className={getStatusColor(list.status)}
                                  >
                                    {list.status}
                                  </Badge>
                                  {getQualityIcon(list.quality)}
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
                                  <p className="font-semibold">{(list.count || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Quality</p>
                                  <p className={`font-semibold capitalize ${getQualityColor(list.quality)}`}>
                                    {list.quality || 'Unknown'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Duplicates</p>
                                  <p className="font-semibold text-yellow-600">{list.duplicates || 0}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Invalid</p>
                                  <p className="font-semibold text-red-600">{list.invalid || 0}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {list.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-xs text-gray-500">
                                  <p>Uploaded {list.uploaded}</p>
                                  <p>Source: {list.source}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewContacts(list.id)}
                                    title="View Contacts"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => exportContacts(list.id, list.name)}
                                    title="Export Contacts"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteList(list.id)}
                                    title="Delete List"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
                      Manage your email lists and their contacts for campaigns
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
                                  <Badge
                                    variant="secondary"
                                    className={getStatusColor(list.status)}
                                  >
                                    {list.status}
                                  </Badge>
                                  {getQualityIcon(list.quality)}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{list.description}</p>
                                <div className="flex items-center space-x-6 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {(list.count || 0).toLocaleString()} contacts
                                  </div>
                                  <div className="flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    {list.duplicates || 0} duplicates
                                  </div>
                                  <div className="flex items-center">
                                    <X className="w-4 h-4 mr-1" />
                                    {list.invalid || 0} invalid
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {list.uploaded}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {list.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewContacts(list.id)}
                                title="View Contacts"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => exportContacts(list.id, list.name)}
                                title="Export Contacts"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Create Campaign">
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteList(list.id)}
                                title="Delete List"
                              >
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

            {/* Contacts Preview Dialog */}
{/* Contacts Preview Dialog - FIXED VERSION */}
<Dialog open={isContactsDialogOpen} onOpenChange={setIsContactsDialogOpen}>
  <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col">
    <DialogHeader className="flex-shrink-0">
      <DialogTitle className="flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Email Contacts
        {selectedListId && (
          <Badge variant="secondary" className="ml-2">
            {previewData.length} contacts
          </Badge>
        )}
      </DialogTitle>
      <DialogDescription>
        View and manage contacts in this email list
      </DialogDescription>
    </DialogHeader>
    
    {/* Scrollable Content Area */}
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {previewData.length > 0 ? (
        <div className="flex-1 overflow-auto border rounded-lg">
          {/* Table Header - Sticky */}
          <div className="bg-gray-50 border-b sticky top-0 z-10">
            <div className="grid grid-cols-5 gap-4 p-3 font-medium text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Email Address
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                Full Name
              </div>
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-1" />
                Company
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Phone
              </div>
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                Status
              </div>
            </div>
          </div>
          
          {/* Table Body - Scrollable */}
          <div className="divide-y divide-gray-200">
            {previewData.map((contact, index) => (
              <div key={contact.id} className="grid grid-cols-5 gap-4 p-3 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-blue-600 truncate" title={contact.email}>
                  {contact.email}
                </div>
                <div className="text-gray-900 truncate">
                  {contact.full_name || 
                   `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
                   <span className="text-gray-400 italic">No name</span>
                  }
                </div>
                <div className="text-gray-600 truncate">
                  {contact.company || <span className="text-gray-400 italic">No company</span>}
                </div>
                <div className="text-gray-600 truncate">
                  {contact.phone || <span className="text-gray-400 italic">No phone</span>}
                </div>
                <div>
                  <Badge 
                    variant="secondary" 
                    className={
                      contact.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : contact.status === 'unsubscribed'
                        ? 'bg-red-100 text-red-800'
                        : contact.status === 'bounced'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {contact.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contacts Found</h3>
            <p className="text-gray-500">This email list doesn't contain any contacts yet.</p>
          </div>
        </div>
      )}
    </div>
    
    {/* Summary Stats */}
    {previewData.length > 0 && (
      <div className="flex-shrink-0 mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
              {previewData.filter(c => c.status === 'active').length} Active
            </div>
            <div className="flex items-center">
              <X className="w-4 h-4 mr-1 text-red-500" />
              {previewData.filter(c => c.status === 'unsubscribed').length} Unsubscribed
            </div>
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
              {previewData.filter(c => c.status === 'bounced').length} Bounced
            </div>
          </div>
          <div className="text-gray-500">
            Total: {previewData.length} contacts
          </div>
        </div>
      </div>
    )}
    
    <DialogFooter className="flex-shrink-0 mt-4">
      <div className="flex justify-between w-full">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Start Campaign
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsContactsDialogOpen(false)}>
            Close
          </Button>
          {selectedListId && (
            <Button 
              onClick={() => {
                const list = emailLists.find(l => l.id === selectedListId);
                if (list) {
                  exportContacts(selectedListId, list.name);
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>

          </div>
        </main>
      </div>
=======
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
>>>>>>> 1f09b988e42051f3c77a1cfd4808e472c1eecc41
    </div>
  );
}
