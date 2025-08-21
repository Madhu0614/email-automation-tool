export interface SupabaseFile {
  id: string;
  name: string;
  created_at: string;
  size: number;
  status: string;
  type: string;
  storage_path: string;
}

export interface UploadedFile {
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

export interface EmailList {
  id: string;
  name: string;
  description: string;
  count?: number;
  status?: string;
  tags?: string[];
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  created_at: string;
  updated_at: string;
}
