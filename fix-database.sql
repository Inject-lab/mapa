-- Script para verificar e corrigir a estrutura do banco de dados
-- Execute este script no painel SQL do Supabase

-- 1. Verificar se a tabela 'units' existe e sua estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'units' 
ORDER BY ordinal_position;

-- 2. Verificar se a coluna 'activity' existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'units' 
    AND column_name = 'activity'
) as activity_column_exists;

-- 3. Adicionar a coluna 'activity' se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'units' 
        AND column_name = 'activity'
    ) THEN
        ALTER TABLE units ADD COLUMN activity TEXT;
        RAISE NOTICE 'Coluna activity adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna activity já existe!';
    END IF;
END $$;

-- 4. Verificar a estrutura final da tabela
\d units;

-- 5. Verificar dados existentes na tabela units
SELECT id, name, company, activity, created_at 
FROM units 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Atualizar o cache do schema (importante para resolver o erro PGRST204)
NOTIFY pgrst, 'reload schema';