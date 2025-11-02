-- Create files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('file', 'folder')),
  mime_type VARCHAR,
  size BIGINT,
  parent_id UUID REFERENCES files(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own files
CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy to allow users to insert their own files
CREATE POLICY "Users can insert their own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy to allow users to update their own files
CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (auth.uid() = owner_id);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (auth.uid() = owner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();