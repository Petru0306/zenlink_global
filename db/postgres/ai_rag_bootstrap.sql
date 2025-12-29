-- AI RAG bootstrap (patient files -> text/pages/chunks embeddings)
-- Run as a DB admin (e.g. postgres) against zenlink_db.
--
-- This creates:
--  - patient_file_index: indexing status per file
--  - patient_file_pages: extracted per-page text
--  - patient_file_chunks: chunks + embeddings (pgvector)
--
-- Requires pgvector:
--   CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS patient_file_index (
  file_id UUID PRIMARY KEY REFERENCES patient_files(id) ON DELETE CASCADE,
  patient_id BIGINT NOT NULL,
  status TEXT NOT NULL, -- NEW|INDEXING|READY|ERROR
  error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_file_index_patient_id ON patient_file_index(patient_id);

CREATE TABLE IF NOT EXISTS patient_file_pages (
  id BIGSERIAL PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES patient_files(id) ON DELETE CASCADE,
  patient_id BIGINT NOT NULL,
  page_number INT NOT NULL,
  page_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_patient_file_pages_patient_id ON patient_file_pages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_file_pages_file_id ON patient_file_pages(file_id);

CREATE TABLE IF NOT EXISTS patient_file_chunks (
  id BIGSERIAL PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES patient_files(id) ON DELETE CASCADE,
  patient_id BIGINT NOT NULL,
  page_number INT NOT NULL,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, page_number, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_patient_file_chunks_patient_id ON patient_file_chunks(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_file_chunks_file_id ON patient_file_chunks(file_id);

-- Optional (later, when you have enough rows): create a vector index for speed.
-- CREATE INDEX IF NOT EXISTS idx_patient_file_chunks_embedding
--   ON patient_file_chunks USING hnsw (embedding vector_l2_ops);


