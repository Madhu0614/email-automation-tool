'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { API_BASE_URL } from '@/lib/api';
import { 
  ChevronLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Users, 
  Sparkles, 
  Database, 
  Target,
  ArrowLeft,
  Filter,
  Search,
  Settings,
  X,
  Building2,
  Briefcase,
  Mail,
  Copy,
  Eye
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';

// Updated interfaces to match backend
interface PitchRequest {
  my_company: string;          // Your company name
  my_desc: string;             // Your company description
  my_services: string;         // Your company services/offerings (ADDED)
  target_url: string;          // Target company website URL
  sample_pitch?: string;       // Optional sample pitch
  first_name?: string;         // Target contact's first name
}
interface PitchResponse {
  pitch: string;
  target_company_name: string;
  my_company: string;
  success: boolean;
}

interface Contact {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  location?: string;
  job_title?: string;
  website?: string;
  notes?: string;
  [key: string]: any;
}

interface PersonalizationColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}

export default function PersonalizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [personalizationColumns, setPersonalizationColumns] = useState<PersonalizationColumn[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState('');
  
  // AI Generation states
  const [generatedPitches, setGeneratedPitches] = useState<{[contactId: number]: string}>({});
  const [generatingPitch, setGeneratingPitch] = useState(false);
  
  // New column form
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'select',
    options: '',
    placeholder: ''
  });

  // Updated company details form - YOUR company information
  const [companyDetails, setCompanyDetails] = useState({
    companyName: '',
    services: '',
    industry: '',
    targetAudience: '',
    specialOffers: '',
    samplePitch: ''  // Added sample pitch field
  });

  // Campaign data
  const [campaignData, setCampaignData] = useState({
    name: '',
    listId: '',
    listName: '',
    contactCount: 0
  });

  useEffect(() => {
    const campaignId = localStorage.getItem('campaignId');
    const campaignName = localStorage.getItem('campaignName');
    const selectedListId = localStorage.getItem('selectedListId');
    const personalizationType = localStorage.getItem('personalizationType');
    
    if (!campaignId || !campaignName || !selectedListId || personalizationType !== 'personalization') {
      router.push('/campaigns/create/personalization-selection');
      return;
    }

    setCampaignData(prev => ({
      ...prev,
      name: campaignName,
      listId: selectedListId
    }));

    fetchContacts(selectedListId);

    // Load saved company details if they exist
    const savedCompanyData = localStorage.getItem('companyPersonalizationData');
    if (savedCompanyData) {
      try {
        setCompanyDetails(JSON.parse(savedCompanyData));
      } catch (e) {
        console.error('Error parsing saved company data:', e);
      }
    }
  }, [router]);

  const fetchContacts = async (listId: string) => {
    try {
      setIsLoadingContacts(true);
      
      const { data: listData, error: listError } = await supabase
        .from('email_lists')
        .select('name, count')
        .eq('id', Number(listId))
        .single();

      if (listError) {
        console.error('Error fetching list details:', listError);
      } else {
        setCampaignData(prev => ({
          ...prev,
          listName: listData.name || 'Unknown List',
          contactCount: listData.count || 0
        }));
      }

      const { data: contactsData, error: contactsError } = await supabase
        .from('email_contacts')
        .select('*')
        .eq('email_list_id', Number(listId))
        .limit(100);

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        setContacts([]);
      } else {
        const formattedContacts = (contactsData || []).map(contact => ({
          id: contact.id,
          email: contact.email,
          name: contact.full_name || 
                (contact.first_name && contact.last_name 
                  ? `${contact.first_name} ${contact.last_name}`.trim()
                  : contact.first_name || contact.last_name || ''),
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          phone: contact.phone,
          location: contact.location,
          job_title: contact.job_title,
          website: contact.website,
          notes: contact.notes
        }));
        
        setContacts(formattedContacts);
      }
    } catch (err) {
      console.error('Error:', err);
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Updated API call function to match new backend structure
  const generatePersonalizedPitch = async (payload: PitchRequest): Promise<PitchResponse> => {
    const response = await fetch(`${API_BASE_URL}/ai/generate-pitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  };

  // Updated pitch generation function
  const handleGenerateAIPitches = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact to generate pitches for');
      return;
    }

    if (!companyDetails.companyName || !companyDetails.services) {
      alert('Please fill out your company details first using the AI Setup button');
      return;
    }

    setGeneratingPitch(true);

    try {
      const newPitches: {[contactId: number]: string} = {};

      for (const contactId of selectedContacts) {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) continue;

        // Skip contacts without website
        if (!contact.website || contact.website.trim() === '') {
          newPitches[contactId] = 'Error: No website URL found for this contact';
          continue;
        }

        // Updated payload structure to match backend
        const payload: PitchRequest = {
          my_company: companyDetails.companyName,           // YOUR company name
          my_desc: companyDetails.services,                   // YOUR company description
          my_services: companyDetails.services,               // YOUR company services/offerings
          target_url: contact.website,                        // TARGET company website URL
          sample_pitch: companyDetails.samplePitch || undefined,  // Optional sample pitch
          first_name: contact.first_name || undefined      // Target contact's first name
        };

        try {
          const response = await generatePersonalizedPitch(payload);
          newPitches[contactId] = response.pitch;
        } catch (error) {
          console.error(`Error generating pitch for contact ${contactId}:`, error);
          newPitches[contactId] = `Error generating pitch: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }

      setGeneratedPitches(prev => ({ ...prev, ...newPitches }));
      alert(`Generated ${Object.keys(newPitches).length} personalized pitches!`);
    } catch (error) {
      console.error('Error generating pitches:', error);
      alert('Failed to generate pitches. Please check your FastAPI server and try again.');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleCompanyDetailsSubmit = () => {
    if (!companyDetails.companyName.trim() || !companyDetails.services.trim()) {
      alert('Please fill in at least company name and services');
      return;
    }

    // Create multiple personalization columns based on company details
    const newColumns = [
      {
        id: `company_${Date.now()}`,
        name: 'Company Size',
        type: 'select' as const,
        options: ['Startup', 'Small Business', 'Mid-size', 'Enterprise'],
        placeholder: 'Select company size'
      },
      {
        id: `industry_${Date.now() + 1}`,
        name: 'Industry',
        type: 'text' as const,
        placeholder: companyDetails.industry || 'Enter industry'
      },
      {
        id: `pain_point_${Date.now() + 2}`,
        name: 'Pain Point',
        type: 'select' as const,
        options: ['Cost Reduction', 'Efficiency', 'Growth', 'Compliance', 'Technology'],
        placeholder: 'Select main pain point'
      },
      {
        id: `budget_${Date.now() + 3}`,
        name: 'Budget Range',
        type: 'select' as const,
        options: ['<$1K', '$1K-$5K', '$5K-$25K', '$25K+'],
        placeholder: 'Select budget range'
      }
    ];

    // Add all new columns
    setPersonalizationColumns(prev => [...prev, ...newColumns]);
    
    // Add empty values to all contacts for new columns
    setContacts(prev => prev.map(contact => {
      const updatedContact = { ...contact };
      newColumns.forEach(column => {
        updatedContact[column.id] = column.type === 'select' ? (column.options?.[0] || '') : '';
      });
      return updatedContact;
    }));

    // Save company details for later use in email generation
    localStorage.setItem('companyPersonalizationData', JSON.stringify(companyDetails));
    
    setShowCompanyModal(false);
  };

  // Rest of your existing functions remain the same
  const addPersonalizationColumn = () => {
    if (!newColumn.name.trim()) {
      alert('Please enter a column name');
      return;
    }

    const columnId = `custom_${Date.now()}`;
    const column: PersonalizationColumn = {
      id: columnId,
      name: newColumn.name.trim(),
      type: newColumn.type,
      options: newColumn.type === 'select' && newColumn.options 
        ? newColumn.options.split(',').map(opt => opt.trim()) 
        : undefined,
      placeholder: newColumn.placeholder || `Enter ${newColumn.name.toLowerCase()}`
    };

    setPersonalizationColumns(prev => [...prev, column]);
    
    setContacts(prev => prev.map(contact => ({
      ...contact,
      [columnId]: column.type === 'select' ? (column.options?.[0] || '') : ''
    })));

    setNewColumn({ name: '', type: 'text', options: '', placeholder: '' });
    setShowAddColumn(false);
  };

  const removePersonalizationColumn = (columnId: string) => {
    setPersonalizationColumns(prev => prev.filter(col => col.id !== columnId));
    
    setContacts(prev => prev.map(contact => {
      const updatedContact: Contact = {
        id: contact.id,
        email: contact.email,
        name: contact.name
      };
      
      Object.keys(contact).forEach(key => {
        if (key !== columnId && key !== 'id' && key !== 'email' && key !== 'name') {
          updatedContact[key] = contact[key];
        }
      });
      
      return updatedContact;
    }));
  };

  const updateContactValue = (contactId: number, columnId: string, value: any) => {
    setContacts(prev => prev.map(contact => {
      if (contact.id === contactId) {
        return {
          ...contact,
          [columnId]: value
        } as Contact;
      }
      return contact;
    }));
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectContact = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const filteredContacts = contacts.filter(contact => 
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const viewPitch = (pitch: string) => {
    setSelectedPitch(pitch);
    setShowPitchModal(true);
  };

  const handleContinue = async () => {
    setLoading(true);
    
    try {
      const personalizationData = {
        columns: personalizationColumns,
        contactData: contacts.map(contact => {
          const customData: any = {};
          personalizationColumns.forEach(col => {
            customData[col.id] = contact[col.id] || '';
          });
          return {
            id: contact.id,
            email: contact.email,
            name: contact.name,
            first_name: contact.first_name,
            last_name: contact.last_name,
            company: contact.company,
            website: contact.website,
            customData,
            generatedPitch: generatedPitches[contact.id] || ''
          };
        }),
        companyDetails,
        generatedPitches
      };

      localStorage.setItem('personalizationData', JSON.stringify(personalizationData));
      router.push('/campaigns/create/content');
      
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/campaigns/create/personalization-selection');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{campaignData.name}</h1>
                  <p className="text-sm text-gray-500">Personalization Setup</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Users className="h-3 w-3 mr-1" />
                {filteredContacts.length} Contacts
              </Badge>
              
              <Button
                disabled={loading}
                onClick={handleContinue}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to Content →'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowCompanyModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Building2 className="h-4 w-4 mr-2" />
                AI Setup
              </Button>
              
              <Button
                onClick={handleGenerateAIPitches}
                disabled={generatingPitch || selectedContacts.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                size="sm"
              >
                {generatingPitch ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Generate AI Pitches ({selectedContacts.length})
              </Button>
              
              <Button
                onClick={() => setShowAddColumn(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>
          </div>
        </div>

        {/* Updated Company Details Modal */}
        {showCompanyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Your Company AI Setup</h2>
                      <p className="text-sm text-gray-600">Tell us about YOUR business to create personalized pitches for target companies</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompanyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="companyName" className="text-base font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Your Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={companyDetails.companyName}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, companyName: e.target.value }))}
                      className="mt-2 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="services" className="text-base font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      Your Services & Products *
                    </Label>
                    <Textarea
                      id="services"
                      placeholder="Describe YOUR main services, products, or solutions. Be specific about what problems YOU solve for customers..."
                      value={companyDetails.services}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, services: e.target.value }))}
                      className="mt-2 min-h-[120px] resize-none"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "We provide email marketing automation and lead generation services for businesses, including campaign management and analytics."
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="industry" className="text-base font-medium">
                      Your Industry/Sector
                    </Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Digital Marketing, SaaS, Consulting, E-commerce..."
                      value={companyDetails.industry}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, industry: e.target.value }))}
                      className="mt-2 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetAudience" className="text-base font-medium">
                      Your Target Audience
                    </Label>
                    <Textarea
                      id="targetAudience"
                      placeholder="Describe YOUR ideal customers (what types of businesses you serve, their challenges, etc.)"
                      value={companyDetails.targetAudience}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="mt-2 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialOffers" className="text-base font-medium">
                      Current Offers or Promotions
                    </Label>
                    <Textarea
                      id="specialOffers"
                      placeholder="Any special pricing, free trials, discounts, or limited-time offers YOU provide..."
                      value={companyDetails.specialOffers}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, specialOffers: e.target.value }))}
                      className="mt-2 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="samplePitch" className="text-base font-medium">
                      Sample Pitch Template (Optional)
                    </Label>
                    <Textarea
                      id="samplePitch"
                      placeholder="Paste a sample email pitch to maintain the same structure and tone..."
                      value={companyDetails.samplePitch}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, samplePitch: e.target.value }))}
                      className="mt-2 min-h-[120px] resize-none"
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If provided, the AI will follow the same structure while personalizing the content for each target company.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompanyModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompanyDetailsSubmit}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save Company Details
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rest of your existing modals and components... */}
        {/* Pitch Preview Modal */}
        {showPitchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Generated Pitch Preview</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPitchModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-300 rounded-md mb-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {selectedPitch}
                  </pre>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => copyToClipboard(selectedPitch)}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPitchModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Column Modal/Panel */}
        {showAddColumn && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <Label className="text-sm font-medium">Column Name</Label>
                    <Input
                      placeholder="e.g., Industry, Company Size"
                      value={newColumn.name}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <Select 
                      value={newColumn.type} 
                      onValueChange={(value: 'text' | 'number' | 'select') => 
                        setNewColumn(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newColumn.type === 'select' && (
                    <div>
                      <Label className="text-sm font-medium">Options</Label>
                      <Input
                        placeholder="Small, Medium, Large"
                        value={newColumn.options}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, options: e.target.value }))}
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Placeholder</Label>
                    <Input
                      placeholder="Enter placeholder text"
                      value={newColumn.placeholder}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, placeholder: e.target.value }))}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={addPersonalizationColumn} size="sm" className="bg-green-600 hover:bg-green-700">
                      Add
                    </Button>
                    <Button onClick={() => setShowAddColumn(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table with your existing structure... */}
        <div className="flex-1 overflow-auto">
          {isLoadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Loading contacts...</span>
            </div>
          ) : (
            <div className="bg-white">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Last Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Job Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Website
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Notes
                    </th>
                    {personalizationColumns.map((column) => (
                      <th key={column.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px] relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4 text-purple-600" />
                            <span className="text-purple-700">{column.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {column.type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePersonalizationColumn(column.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">AI Generated Pitch</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContacts.map((contact, index) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleSelectContact(contact.id)}
                        />
                      </td>
                      <td className="px-2 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-blue-700">
                              {contact.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{contact.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.first_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.last_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.company || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.location || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.job_title || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.website ? (
                          <span className="text-blue-600 underline">{contact.website}</span>
                        ) : (
                          <span className="text-red-500">No website</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="max-w-[150px] truncate" title={contact.notes || ''}>
                          {contact.notes || '-'}
                        </div>
                      </td>
                      {personalizationColumns.map((column) => (
                        <td key={column.id} className="px-4 py-3">
                          {column.type === 'select' ? (
                            <Select
                              value={contact[column.id] || ''}
                              onValueChange={(value) => updateContactValue(contact.id, column.id, value)}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder={column.placeholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {column.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={column.type === 'number' ? 'number' : 'text'}
                              value={contact[column.id] || ''}
                              onChange={(e) => updateContactValue(contact.id, column.id, e.target.value)}
                              placeholder={column.placeholder}
                              className="h-9 text-sm"
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {generatedPitches[contact.id] ? (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => viewPitch(generatedPitches[contact.id])}
                              size="sm"
                              className="bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => copyToClipboard(generatedPitches[contact.id])}
                              size="sm"
                              variant="outline"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No pitch generated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
