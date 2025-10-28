-- Script para adicionar a coluna 'activity' à tabela 'units'
-- Execute este script no seu banco de dados Supabase

-- Adicionar a coluna activity se ela não existir
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS activity TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN units.activity IS 'Atividade principal da unidade (ex: Terminal, Oficina, Garagem)';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'units' AND column_name = 'activity';