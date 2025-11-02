-- Files, Folders and Shares tables (user-provided schema)
-- Note: this migration creates `files`, `folders` and `shares` tables

CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_folder_id uuid,
  owner_id uuid NOT NULL,
  is_starred boolean DEFAULT false,
  is_trashed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT folders_pkey PRIMARY KEY (id)
);

CREATE TABLE public.files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  folder_id uuid,
  owner_id uuid NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  mime_type text,
  is_starred boolean DEFAULT false,
  is_trashed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT files_pkey PRIMARY KEY (id),
  CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT files_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);

CREATE TABLE public.shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_id uuid,
  folder_id uuid,
  shared_with_user_id uuid NOT NULL,
  shared_by_user_id uuid NOT NULL,
  permission text NOT NULL CHECK (permission = ANY (ARRAY['view'::text, 'edit'::text])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT shares_pkey PRIMARY KEY (id),
  CONSTRAINT shares_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id),
  CONSTRAINT shares_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id),
  CONSTRAINT shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id)
);

