"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, MotionValue, useInView, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Save, Sparkles, Plus, ChevronLeft, ChevronRight, Mail, 
  Type, MessageSquare, Timer, Trash2, Copy, Eye, Zap, FileText,
  Variable, CheckCircle, AlertCircle, Loader2, Wand2, Star
} from "lucide-react";
import Sidebar from '@/components/Sidebar';
import supabase from '@/lib/supabaseClient';

// Helper functions
const calculateWordCount = (text: string): number => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
};

const calculateReadingTime = (wordCount: number): number => {
  return Math.max(1, Math.ceil(wordCount / 200));
};

const generatePreview = (text: string): string => {
  if (!text || !text.trim()) return '';
  return text.slice(0, 100) + (text.length > 100 ? '...' : '');
};

const determineStatus = (subject: string, body: string): 'draft' | 'complete' | 'needs_review' => {
  if (!subject?.trim() || !body?.trim()) return 'draft';
  return 'complete';
};

type EmailStep = {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  preview?: string;
  status: 'draft' | 'complete' | 'needs_review';
  wordCount?: number;
  estimatedReadTime?: number;
};

type CampaignContent = {
  id: string;
  steps: EmailStep[];
  totalSteps: number;
  completionRate: number;
  lastModified: string;
  metadata: {
    totalWordCount: number;
    averageReadTime: number;
    hasPersonalization: boolean;
  };
};

const createStep = (
  subject = "", 
  body = "", 
  delayDays = 1, 
  order = 0
): EmailStep => {
  const now = new Date().toISOString();
  const wordCount = calculateWordCount(body);
  
  return {
    id: crypto.randomUUID(),
    subject,
    body,
    delayDays,
    order,
    createdAt: now,
    updatedAt: now,
    preview: generatePreview(body),
    status: determineStatus(subject, body),
    wordCount,
    estimatedReadTime: calculateReadingTime(wordCount)
  };
};

export default function CampaignContentPage() {
  const router = useRouter();
  
  const [steps, setSteps] = useState<EmailStep[]>([
    createStep("Welcome to our community! 👋", "Hi there!\n\nWelcome to our amazing community...", 0, 1),
    createStep("Don't miss out on these features", "Hi again!\n\nI wanted to follow up...", 3, 2),
  ]);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [campaignData, setCampaignData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ container: containerRef as any });
  const hue = useTransform(scrollYProgress, [0, 1], [220, 280]);

  const totalFields = steps.length * 2;
  const completedFields = steps.reduce(
    (acc, s) => acc + (s.subject.trim() ? 1 : 0) + (s.body.trim() ? 1 : 0),
    0
  );
  const progressPct = Math.round((completedFields / Math.max(1, totalFields)) * 100);

  useEffect(() => {
    const campaignId = localStorage.getItem('campaignId');
    const campaignName = localStorage.getItem('campaignName');
    const selectedListId = localStorage.getItem('selectedListId');
    
    if (!campaignId) {
      router.push('/campaigns/create');
      return;
    }

    setCampaignData({
      id: campaignId,
      name: campaignName,
      listId: selectedListId
    });

    // Enhanced loading with fallback
    const loadCampaignContent = async () => {
      try {
        // First try to load from database
        const { data, error } = await supabase
          .from('campaigns')
          .select('content, subject_line')
          .eq('id', campaignId)
          .single();

        if (!error && data?.content) {
          const parsedContent: CampaignContent = JSON.parse(data.content);
          if (parsedContent.steps && Array.isArray(parsedContent.steps)) {
            setSteps(parsedContent.steps);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not load from database, trying localStorage');
      }

      // Fallback to localStorage
      const savedContent = localStorage.getItem(`campaign_content_${campaignId}`);
      if (savedContent) {
        try {
          const parsed = JSON.parse(savedContent);
          const stepsData = parsed.steps || parsed; // Handle both old and new format
          
          if (Array.isArray(stepsData) && stepsData.length) {
            // Ensure all steps have required fields with proper type validation
            const enhancedSteps: EmailStep[] = stepsData.map((step: any): EmailStep => {
              const bodyText = typeof step.body === 'string' ? step.body : '';
              const subjectText = typeof step.subject === 'string' ? step.subject : '';
              const wordCount = step.wordCount || calculateWordCount(bodyText);
              
              return {
                id: step.id || crypto.randomUUID(),
                subject: subjectText,
                body: bodyText,
                delayDays: typeof step.delayDays === 'number' ? step.delayDays : 1,
                order: typeof step.order === 'number' ? step.order : 0,
                createdAt: step.createdAt || new Date().toISOString(),
                updatedAt: step.updatedAt || new Date().toISOString(),
                preview: step.preview || generatePreview(bodyText),
                status: step.status || determineStatus(subjectText, bodyText),
                wordCount: wordCount,
                estimatedReadTime: step.estimatedReadTime || calculateReadingTime(wordCount)
              };
            });
            
            setSteps(enhancedSteps);
          }
        } catch (error) {
          console.error('Error loading saved content:', error);
        }
      }
    };

    loadCampaignContent();
  }, [router]);

  useEffect(() => {
    if (!campaignData?.id || !steps.length) return;
    
    setSaving("saving");
    const timer = setTimeout(() => {
      const campaignContent: CampaignContent = {
        id: campaignData.id,
        steps: steps.map(step => ({
          ...step,
          updatedAt: new Date().toISOString()
        })),
        totalSteps: steps.length,
        completionRate: progressPct,
        lastModified: new Date().toISOString(),
        metadata: {
          totalWordCount: steps.reduce((acc, step) => acc + (step.wordCount || 0), 0),
          averageReadTime: Math.ceil(steps.reduce((acc, step) => acc + (step.wordCount || 0), 0) / 200),
          hasPersonalization: steps.some(step => 
            step.subject.includes('{{') || step.body.includes('{{')
          )
        }
      };

      localStorage.setItem(`campaign_content_${campaignData.id}`, JSON.stringify(campaignContent));
      setSaving("saved");
      setTimeout(() => setSaving("idle"), 1000);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [steps, campaignData?.id, progressPct]);

  const addStepAfter = (afterId?: string) => {
    const idx = afterId ? steps.findIndex((s) => s.id === afterId) : steps.length - 1;
    const insertAt = Math.max(0, idx + 1);
    const newOrder = insertAt + 1;
    
    const updatedSteps = steps.map(step => 
      step.order > insertAt ? { ...step, order: step.order + 1 } : step
    );
    
    const newStep = createStep("", "", 1, newOrder);
    const finalSteps = [
      ...updatedSteps.slice(0, insertAt), 
      newStep, 
      ...updatedSteps.slice(insertAt)
    ];
    
    setSteps(finalSteps);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    
    const stepToRemove = steps.find(s => s.id === id);
    if (!stepToRemove) return;
    
    const updatedSteps = steps
      .filter(s => s.id !== id)
      .map(step => 
        step.order > stepToRemove.order 
          ? { ...step, order: step.order - 1 } 
          : step
      );
    
    setSteps(updatedSteps);
  };

  const updateStep = (id: string, patch: Partial<EmailStep>) => {
    setSteps((prev) => prev.map((step) => {
      if (step.id === id) {
        const updatedStep = { 
          ...step, 
          ...patch,
          updatedAt: new Date().toISOString()
        };
        
        // Auto-update computed fields
        if (patch.body !== undefined) {
          const wordCount = calculateWordCount(patch.body);
          updatedStep.preview = generatePreview(patch.body);
          updatedStep.wordCount = wordCount;
          updatedStep.estimatedReadTime = calculateReadingTime(wordCount);
        }
        
        if (patch.subject !== undefined || patch.body !== undefined) {
          updatedStep.status = determineStatus(
            patch.subject !== undefined ? patch.subject : updatedStep.subject,
            patch.body !== undefined ? patch.body : updatedStep.body
          );
        }
        
        return updatedStep;
      }
      return step;
    }));
  };

  const duplicateStep = (id: string) => {
    const stepToDuplicate = steps.find(s => s.id === id);
    if (!stepToDuplicate) return;
    
    const newStep = createStep(
      stepToDuplicate.subject + " (Copy)",
      stepToDuplicate.body,
      stepToDuplicate.delayDays,
      stepToDuplicate.order + 1
    );
    
    const updatedSteps = steps.map(step => 
      step.order > stepToDuplicate.order 
        ? { ...step, order: step.order + 1 } 
        : step
    );
    
    const insertIndex = steps.findIndex(s => s.id === id) + 1;
    const finalSteps = [
      ...updatedSteps.slice(0, insertIndex),
      newStep,
      ...updatedSteps.slice(insertIndex)
    ];
    
    setSteps(finalSteps);
  };

const handleSave = async () => {
  if (!campaignData?.id) {
    console.error('No campaign ID available');
    alert('Campaign ID is missing. Please refresh and try again.');
    return;
  }
  
  setIsLoading(true);
  try {
    // Extract and clean email bodies
    const emailBodies = steps.map(step => step.body.trim()).filter(body => body.length > 0);

    // Create a single clean email content string (NOT a JSON array)
    const emailContent = emailBodies.join('\n\n') + '\n\nBest regards,\nmadhu.k@globopersona.com';

    // Prepare enhanced data structure for editing/analytics
    const campaignContent: CampaignContent = {
      id: campaignData.id,
      steps: steps.map(step => ({
        ...step,
        updatedAt: new Date().toISOString()
      })),
      totalSteps: steps.length,
      completionRate: progressPct,
      lastModified: new Date().toISOString(),
      metadata: {
        totalWordCount: steps.reduce((acc, step) => acc + (step.wordCount || 0), 0),
        averageReadTime: Math.ceil(steps.reduce((acc, step) => acc + (step.wordCount || 0), 0) / 200),
        hasPersonalization: steps.some(step => 
          step.subject.includes('{{') || step.body.includes('{{')
        )
      }
    };

    console.log('Attempting to save campaign:', {
      campaignId: campaignData.id,
      stepsCount: steps.length,
      emailContent: emailContent // Plain text content
    });

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        subject_line: steps[0]?.subject || '', // Subject stored separately
        content: JSON.stringify(campaignContent), // Full data for editing
        email_content: emailContent, // PLAIN TEXT - no JSON.stringify!
        completion_rate: campaignContent.completionRate,
        total_steps: campaignContent.totalSteps,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignData.id)
      .select();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Provide specific error messages based on error type
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your Row Level Security policies.');
      } else if (error.code === '23505') {
        throw new Error('Duplicate entry detected. Campaign ID may already exist.');
      } else if (error.code === '22001') {
        throw new Error('Data too long for database field. Please reduce content length.');
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    console.log('Save successful:', data);
    console.log('Clean email content stored:', emailContent);
    
    localStorage.setItem(
      `campaign_content_${campaignData.id}`, 
      JSON.stringify(campaignContent)
    );
    setSaving("saved");
    
  } catch (error) {
    console.error('Complete error details:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      alert(`Failed to save campaign: ${error.message}`);
    } else {
      alert('Failed to save campaign content. Please check the console for details.');
    }
  } finally {
    setIsLoading(false);
  }
};



  const handleNext = async () => {
    if (!campaignData?.id) return;
    
    const hasContent = steps.some(step => step.subject.trim() && step.body.trim());
    if (!hasContent) {
      alert('Please add at least one email with subject and body content');
      return;
    }
    
    setIsLoading(true);
    try {
      await handleSave();
      router.push('/campaigns/create/review');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/campaigns/create');
  };

  const backgroundGradient = useTransform(hue as MotionValue<number>, (h: number) => {
    return `linear-gradient(135deg, hsl(${h} 60% 98%) 0%, hsl(${h + 40} 70% 97%) 100%)`;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 overflow-hidden relative">
          {/* Enhanced animated background */}
          <motion.div
            className="fixed inset-0 -z-10"
            style={{
              background: "radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)",
            }}
          />
          <motion.div
            className="fixed inset-0 -z-10"
            style={{ background: backgroundGradient }}
          />

          {/* Floating particles effect */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-200/20 rounded-full"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                }}
                animate={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                }}
                transition={{
                  duration: Math.random() * 20 + 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>

          {/* Glassmorphism Header */}
          <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-black/5">
            <div className="max-w-7xl mx-auto px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={isLoading}
                    className="border-slate-200/50 backdrop-blur-sm bg-white/80 hover:bg-white/90 hover:border-slate-300/50 transition-all duration-200 shadow-sm"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  
                  <div className="hidden md:block">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Step 2 of 3
                        </span>
                      </div>
                      <Separator orientation="vertical" className="h-5 bg-slate-300/50" />
                      <span className="text-sm font-semibold text-slate-700">Campaign Content</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1 font-medium">
                      {campaignData?.name || 'Untitled Campaign'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Enhanced Progress Bar */}
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="relative w-28 h-3 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/50 via-indigo-400/50 to-purple-400/50 rounded-full"
                        animate={{ x: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <span className="text-sm font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                      {progressPct}%
                    </span>
                  </div>

                  {/* Enhanced Save Status */}
                  <div className="flex items-center space-x-3">
                    {saving === "saving" && (
                      <motion.div 
                        className="flex items-center space-x-2 text-xs bg-amber-50/80 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200/50 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="font-medium">Saving...</span>
                      </motion.div>
                    )}
                    {saving === "saved" && (
                      <motion.div 
                        className="flex items-center space-x-2 text-xs bg-emerald-50/80 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200/50 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="font-medium">Saved</span>
                      </motion.div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSave} 
                      disabled={isLoading}
                      className="border-slate-200/50 backdrop-blur-sm bg-white/80 hover:bg-white/90 hover:border-slate-300/50 shadow-sm"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>

                  <Button 
                    onClick={handleNext} 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Enhanced Content */}
          <div ref={containerRef} className="h-[calc(100vh-92px)] overflow-y-auto scroll-smooth">
            <div className="max-w-5xl mx-auto px-6 py-12">
              
              {/* Enhanced Title Section */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
              > 
                <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-6 leading-tight">
                  Create Your Email Content
                </h1>
                
                {/* Campaign metadata display */}
                <div className="flex items-center justify-center space-x-6 mt-8">
                  <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {steps.length} Email{steps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">
                      ~{steps.reduce((acc, step) => acc + (step.estimatedReadTime || 1), 0)} min total read
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {steps.reduce((acc, step) => acc + (step.wordCount || 0), 0)} words
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Email Steps with enhanced styling */}
              <div className="space-y-10">
                {steps.map((step, idx) => (
                  <EmailStepCard
                    key={step.id}
                    step={step}
                    index={idx}
                    total={steps.length}
                    onUpdate={updateStep}
                    onAddAfter={() => addStepAfter(step.id)}
                    onRemove={() => removeStep(step.id)}
                    onDuplicate={() => duplicateStep(step.id)}
                  />
                ))}

                {/* Enhanced Add Button */}
                <motion.div
                  className="flex justify-center pt-2"
                >
                  <Button 
                    variant="outline" 
                    onClick={() => addStepAfter(steps.at(-1)?.id)}
                    className="group border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-300 h-16 px-8 rounded-2xl backdrop-blur-sm bg-white/60"
                  >
                    <Plus className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-base font-semibold">Add Another Email</span>
                  </Button>
                </motion.div>
              </div>

              {/* Enhanced Footer */}
              <motion.div 
                className="mt-20 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="inline-flex items-center space-x-3 text-sm text-slate-500 bg-gradient-to-r from-white/60 to-blue-50/60 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3 shadow-lg">
                  <Star className="h-5 w-5 text-amber-500 animate-pulse" />
                  <span className="font-medium">Pro tip: Use AI tools to generate compelling content, then personalize it</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Email Step Card Component
function EmailStepCard({
  step,
  index,
  total,
  onUpdate,
  onAddAfter,
  onRemove,
  onDuplicate,
}: {
  step: EmailStep;
  index: number;
  total: number;
  onUpdate: (id: string, patch: Partial<EmailStep>) => void;
  onAddAfter: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.3, once: false });

  return (
    <div className="relative">
      {/* Enhanced Delay chip */}
      {index > 0 && (
        <DelaySettings
          days={step.delayDays}
          onChange={(days) => onUpdate(step.id, { delayDays: days })}
        />
      )}

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={
          inView
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0.8, y: 20, scale: 0.98 }
        }
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="group mb-10 rounded-3xl border-0 bg-white/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
      >
        {/* Enhanced Card header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100/50 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50">
          <div className="flex items-center space-x-5">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              {index + 1}
            </motion.div>
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {index === 0 ? '✨ Welcome Email' : `📧 Follow-up Email ${index}`}
                </h3>
                <Badge 
                  variant={step.status === 'complete' ? 'default' : 'secondary'}
                  className={step.status === 'complete' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                  }
                >
                  {step.status === 'complete' ? 'Complete' : 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-slate-600 font-medium">
                  {index === 0 ? 'Sent immediately' : `Sent ${step.delayDays} day${step.delayDays !== 1 ? 's' : ''} after previous email`}
                </p>
                {step.wordCount && step.wordCount > 0 && (
                  <span className="text-xs text-slate-500">
                    {step.wordCount} words • ~{step.estimatedReadTime} min read
                  </span>
                )}
              </div>
              {step.preview && step.preview.trim() && (
                <p className="text-sm text-slate-500 mt-1 italic line-clamp-1">
                  "{step.preview}"
                </p>
              )}
              <div className="text-xs text-slate-400 mt-1">
                Last updated: {new Date(step.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDuplicate}
              className="opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAddAfter}
              className="opacity-0 group-hover:opacity-100 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRemove} 
              disabled={total <= 1}
              className="opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Card content */}
        <div className="p-8 space-y-8">
          {/* Enhanced Subject line */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                <Type className="h-4 w-4 text-blue-600" />
              </div>
              <label className="text-base font-bold text-slate-900">Subject Line</label>
              <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 border-red-200">Required</Badge>
            </div>
            <Input
              placeholder={index === 0 ? "✨ Your compelling subject line..." : "📧 Follow-up subject line..."}
              value={step.subject}
              onChange={(e) => onUpdate(step.id, { subject: e.target.value })}
              className="h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl backdrop-blur-sm bg-white/80"
            />
          </div>

          {/* Enhanced Email body */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <label className="text-base font-bold text-slate-900">Email Content</label>
              <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">Rich text supported</Badge>
            </div>
            <Textarea
              placeholder="Write your email content here... Use personalization like {{first_name}} to make it more engaging. ✨"
              className="min-h-[240px] resize-y text-base leading-relaxed border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl backdrop-blur-sm bg-white/80"
              value={step.body}
              onChange={(e) => onUpdate(step.id, { body: e.target.value })}
            />
            
            {/* Enhanced Action buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 hover:border-purple-300 transition-all duration-200"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Templates
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-600 hover:border-emerald-300 transition-all duration-200"
                >
                  <Variable className="mr-2 h-4 w-4" />
                  Variables
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                  {step.body.length} characters
                </div>
                {step.wordCount && step.wordCount > 0 && (
                  <div className="text-xs font-medium text-slate-500 bg-blue-50 px-3 py-1 rounded-full">
                    {step.wordCount} words
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Enhanced Delay Settings Component
function DelaySettings({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  return (
    <div className="relative flex items-center justify-center mb-8 -mt-2">
      {/* Enhanced Connection line */}
      <div className="absolute left-1/2 top-1/2 w-px h-10 bg-gradient-to-b from-slate-300 via-slate-200 to-transparent -translate-x-1/2 -translate-y-full" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ margin: "-20px 0px -20px 0px", once: false }}
        className="inline-flex items-center space-x-4 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
          <Timer className="h-4 w-4 text-amber-600" />
        </div>
        <span className="text-sm font-bold text-slate-700">Wait</span>
        <input
          type="number"
          min={0}
          max={365}
          value={days}
          onChange={(e) => onChange(Math.max(0, Math.min(365, Number(e.target.value || 0))))}
          className="w-20 h-10 px-3 py-2 text-center text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
        />
        <span className="text-sm font-bold text-slate-700">day{days !== 1 ? 's' : ''}</span>
      </motion.div>
    </div>
  );
}
