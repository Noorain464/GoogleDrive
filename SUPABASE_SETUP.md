# Supabase Backend Setup Guide

This guide explains how the Supabase backend is integrated into this Google Drive clone project and how to set it up for file upload functionality.

## Overview

The project uses Supabase for:
- **Authentication**: User sign-up and sign-in
- **Storage**: File storage in Supabase Storage buckets
- **Database**: Metadata storage for files, folders, and activities

## Current Implementation

### 1. Supabase Client Configuration

The Supabase client is configured in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2. File Upload Flow

The file upload functionality is implemented in `src/components/drive/UploadDialog.tsx`:

1. **Select Files**: User selects files via file input or drag-and-drop
2. **Upload to Storage**: Files are uploaded to the `drive-files` storage bucket
3. **Create Database Record**: Metadata is stored in the `files` table
4. **Log Activity**: Activity is logged in the `activities` table

Key upload code:
```typescript
// Upload to storage
const filePath = `${user.id}/${Date.now()}-${file.name}`;
await supabase.storage
  .from("drive-files")
  .upload(filePath, file);

// Create database record
await supabase.from("files").insert({
  name: file.name,
  folder_id: currentFolderId,
  owner_id: user.id,
  file_path: filePath,
  file_type: file.type.split('/')[0] || 'file',
  file_size: file.size,
  mime_type: file.type,
});
```

## Supabase Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note your project URL and anon key from Settings > API

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Never commit the `.env` file to version control. Add it to `.gitignore`.

### Step 3: Set Up Database Tables

Run these SQL commands in the Supabase SQL Editor:

#### 3.1 Create `files` table

```sql
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT, -- e.g., 'image', 'video', 'file'
  file_size BIGINT, -- size in bytes
  mime_type TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  is_trashed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_is_trashed ON files(is_trashed);
CREATE INDEX IF NOT EXISTS idx_files_is_starred ON files(is_starred);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.2 Create `folders` table

```sql
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  is_trashed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_folder_id ON folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_is_trashed ON folders(is_trashed);
CREATE INDEX IF NOT EXISTS idx_folders_is_starred ON folders(is_starred);

-- Create updated_at trigger
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.3 Create `activities` table (optional, for activity logging)

```sql
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'upload', 'create', 'delete', 'rename', etc.
  item_type TEXT NOT NULL, -- 'file' or 'folder'
  item_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
```
#### -- shares table

CREATE TABLE shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'edit')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure either file_id or folder_id is set, not both
  CONSTRAINT share_target CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR
    (file_id IS NULL AND folder_id IS NOT NULL)
  )
);

-- Add indexes for performance
CREATE INDEX idx_shares_file_id ON shares(file_id);
CREATE INDEX idx_shares_folder_id ON shares(folder_id);
CREATE INDEX idx_shares_shared_with ON shares(shared_with_user_id);

-- RLS Policies for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Users can see shares they created
CREATE POLICY "Users can view their shared items"
ON shares FOR SELECT
USING (shared_by_user_id = auth.uid());

-- Users can see shares with them
CREATE POLICY "Users can view items shared with them"
ON shares FOR SELECT
USING (shared_with_user_id = auth.uid());

-- Users can create shares for their own files
CREATE POLICY "Users can create shares"
ON shares FOR INSERT
WITH CHECK (shared_by_user_id = auth.uid());

-- Users can delete shares they created
CREATE POLICY "Users can delete their shares"
ON shares FOR DELETE
USING (shared_by_user_id = auth.uid());

#### -- Add policy so users can see files shared with them

  CREATE POLICY "Users can view shared files"
  ON files FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR 
    id IN (
      SELECT file_id FROM shares 
      WHERE shared_with_user_id = auth.uid()
    )
  );

  -- Users can update files they own OR have edit permission
  CREATE POLICY "Users can update shared files with edit permission"
  ON files FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR
    id IN (
      SELECT file_id FROM shares 
      WHERE shared_with_user_id = auth.uid() 
      AND permission = 'edit'
    )
  );

### Step 4: Set Up Row Level Security (RLS)

Enable RLS and create policies to ensure users can only access their own data:

#### 4.1 Enable RLS on tables

```sql
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
```

#### 4.2 Create RLS Policies for `files` table

```sql
-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert their own files
CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  USING (auth.uid() = owner_id);
```

#### 4.3 Create RLS Policies for `folders` table

```sql
-- Policy: Users can view their own folders
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert their own folders
CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own folders
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete their own folders
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = owner_id);
```

#### 4.4 Create RLS Policies for `activities` table

```sql
-- Policy: Users can view their own activities
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Step 5: Set Up Storage Bucket

#### 5.1 Create Storage Bucket

1. Go to Storage in your Supabase Dashboard
2. Click "New bucket"
3. Name it: `drive-files`
4. Make it **Private** (important for security)
5. Click "Create bucket"

#### 5.2 Set Up Storage Policies

Go to Storage > Policies for the `drive-files` bucket and create these policies:

**Policy 1: Users can upload to their own folder**
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'drive-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Users can view their own files**
```sql
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'drive-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3: Users can update their own files**
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'drive-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 4: Users can delete their own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'drive-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 6: Configure Authentication

The project already has authentication set up. Ensure in Supabase Dashboard:

1. Go to Authentication > Settings
2. Enable "Email" provider (it's enabled by default)
3. Configure site URL: `http://localhost:5173` (for development)
4. Add redirect URLs if needed

### Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign up a new user at `/auth`
3. Try uploading a file
4. Verify the file appears in the Supabase Storage bucket
5. Check the `files` table in the database to see the metadata

## File Upload Implementation Details

### Storage Path Structure

Files are stored with the following path structure:
```
{user_id}/{timestamp}-{filename}
```

Example: `550e8400-e29b-41d4-a716-446655440000/1704067200000-document.pdf`

### Database Schema Reference

**files table:**
- `id` (UUID): Primary key
- `name` (TEXT): Original filename
- `folder_id` (UUID, nullable): Parent folder ID
- `owner_id` (UUID): User who owns the file
- `file_path` (TEXT): Storage path in the bucket
- `file_type` (TEXT): Type category (image, video, file, etc.)
- `file_size` (BIGINT): File size in bytes
- `mime_type` (TEXT): MIME type (e.g., "image/png")
- `is_starred` (BOOLEAN): Whether file is starred
- `is_trashed` (BOOLEAN): Whether file is in trash
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**folders table:**
- `id` (UUID): Primary key
- `name` (TEXT): Folder name
- `parent_folder_id` (UUID, nullable): Parent folder ID
- `owner_id` (UUID): User who owns the folder
- `is_starred` (BOOLEAN): Whether folder is starred
- `is_trashed` (BOOLEAN): Whether folder is in trash
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## Troubleshooting

### Common Issues

1. **"new row violates row-level security policy"**
   - Check that RLS policies are correctly set up
   - Ensure the user is authenticated
   - Verify `auth.uid()` matches the `owner_id`

2. **Storage upload fails**
   - Verify the bucket exists and is named `drive-files`
   - Check storage policies are correctly configured
   - Ensure the file path follows the pattern `{user_id}/...`

3. **Environment variables not loading**
   - Ensure `.env` file is in the project root
   - Restart the development server after adding environment variables
   - Check variable names match exactly (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

4. **Files not appearing after upload**
   - Check browser console for errors
   - Verify database insert was successful
   - Check that the `onUploadComplete` callback is triggering a refresh

## Additional Features to Consider

- **File size limits**: Configure bucket policies to limit file sizes
- **File type restrictions**: Add validation for allowed file types
- **Virus scanning**: Integrate with a scanning service
- **Image thumbnails**: Generate thumbnails for image files
- **File versioning**: Keep multiple versions of files
- **Sharing**: Add file/folder sharing capabilities

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

