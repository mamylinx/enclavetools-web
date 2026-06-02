CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO categories (slug, title, sort_order) VALUES
('all', 'All Tools', 1),
('llm-inference', 'LLM Inference Engines', 2),
('llm-models', 'LLM Models', 3),
('vector-databases', 'Vector Databases', 4),
('agent-frameworks', 'Agent Frameworks', 5),
('chat-interfaces', 'Chat Interfaces', 6),
('rag-document', 'RAG & Document Processing', 7),
('speech-to-text', 'Speech to Text', 8),
('text-to-speech', 'Text to Speech', 9),
('image-generation', 'Image Generation', 10),
('fine-tuning-training', 'Fine-tuning & Training', 11),
('monitoring-observability', 'Monitoring & Observability', 12),
('privacy-security', 'Privacy & Security', 13),
('embedding-models', 'Embedding Models', 14),
('deployment', 'Deployment', 15),
('workflow-automation', 'Agent & Workflow Automation', 16),
('video-generation', 'Video Generation', 17),
('vision-multimodal', 'Vision & Multimodal', 18),
('code-assistants', 'Code Assistants', 19),
('data-utilities', 'Data Utilities', 20);
