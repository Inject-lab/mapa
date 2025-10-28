-- =====================================================
-- GRUPO PLUMA - CONFIGURAÇÃO INICIAL DO BANCO DE DADOS
-- =====================================================

-- Limpar tabelas existentes (se necessário)
DROP TABLE IF EXISTS cnpj_cache;
DROP TABLE IF EXISTS units;

-- =====================================================
-- TABELA DE UNIDADES
-- =====================================================

CREATE TABLE units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    company_type VARCHAR(20) NOT NULL CHECK (company_type IN ('bello', 'pluma', 'plusval')),
    corporate_name TEXT NOT NULL,
    trade_name TEXT,
    activity TEXT,
    address JSONB NOT NULL,
    coordinates JSONB NOT NULL,
    contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE units IS 'Tabela principal para armazenar informações das unidades do Grupo Pluma';
COMMENT ON COLUMN units.cnpj IS 'CNPJ da unidade (apenas números, 14 dígitos)';
COMMENT ON COLUMN units.company_type IS 'Tipo da empresa: bello, pluma ou plusval';
COMMENT ON COLUMN units.corporate_name IS 'Razão social da empresa';
COMMENT ON COLUMN units.trade_name IS 'Nome fantasia da empresa';
COMMENT ON COLUMN units.activity IS 'Atividade principal da unidade (ex: Terminal, Oficina, Garagem)';
COMMENT ON COLUMN units.address IS 'Endereço completo em formato JSON';
COMMENT ON COLUMN units.coordinates IS 'Coordenadas geográficas (lat, lng) em formato JSON';
COMMENT ON COLUMN units.contact IS 'Informações de contato (telefone, email, website) em formato JSON';

-- =====================================================
-- TABELA DE CACHE CNPJ
-- =====================================================

CREATE TABLE cnpj_cache (
    cnpj VARCHAR(14) PRIMARY KEY,
    data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE cnpj_cache IS 'Cache para consultas CNPJ da Brasil API';
COMMENT ON COLUMN cnpj_cache.cnpj IS 'CNPJ consultado (apenas números, 14 dígitos)';
COMMENT ON COLUMN cnpj_cache.data IS 'Dados retornados pela Brasil API em formato JSON';
COMMENT ON COLUMN cnpj_cache.cached_at IS 'Timestamp do cache (expira em 24 horas)';

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices na tabela units
CREATE INDEX idx_units_company_type ON units(company_type);
CREATE INDEX idx_units_cnpj ON units(cnpj);
CREATE INDEX idx_units_created_at ON units(created_at);
CREATE INDEX idx_units_updated_at ON units(updated_at);

-- Índices na tabela cnpj_cache
CREATE INDEX idx_cnpj_cache_cached_at ON cnpj_cache(cached_at);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para a tabela units
CREATE TRIGGER update_units_updated_at 
    BEFORE UPDATE ON units 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnpj_cache ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todas as operações)
-- NOTA: Em produção, ajuste conforme suas necessidades de segurança

-- Política para tabela units
CREATE POLICY "Allow all operations on units" 
    ON units 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Política para tabela cnpj_cache
CREATE POLICY "Allow all operations on cnpj_cache" 
    ON cnpj_cache 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para limpar cache expirado (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_cnpj_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cnpj_cache 
    WHERE cached_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para validar CNPJ (básica)
CREATE OR REPLACE FUNCTION is_valid_cnpj(cnpj_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se tem exatamente 14 dígitos numéricos
    IF cnpj_input !~ '^[0-9]{14}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se não são todos os dígitos iguais
    IF cnpj_input ~ '^(.)\1{13}$' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir dados de exemplo - Focado no estado do Paraná
INSERT INTO units (cnpj, company_type, corporate_name, trade_name, address, coordinates, contact) VALUES
(
    '11222333000181',
    'bello',
    'Bello Construções Ltda',
    'Bello Curitiba',
    '{"street": "Rua XV de Novembro, 1000", "neighborhood": "Centro", "city": "Curitiba", "state": "PR", "zipCode": "80020-310"}',
    '{"lat": -25.4284, "lng": -49.2733}',
    '{"phone": "(41) 3000-1000", "email": "curitiba@bello.com.br", "website": "https://bello.com.br"}'
),
(
    '22333444000182',
    'pluma',
    'Pluma Incorporações S.A.',
    'Pluma Londrina',
    '{"street": "Av. Higienópolis, 500", "neighborhood": "Centro", "city": "Londrina", "state": "PR", "zipCode": "86020-071"}',
    '{"lat": -23.3045, "lng": -51.1696}',
    '{"phone": "(43) 4000-2000", "email": "londrina@pluma.com.br", "website": "https://pluma.com.br"}'
),
(
    '33444555000183',
    'plusval',
    'Plusval Investimentos Ltda',
    'Plusval Maringá',
    '{"street": "Av. Brasil, 2000", "neighborhood": "Centro", "city": "Maringá", "state": "PR", "zipCode": "87013-230"}',
    '{"lat": -23.4205, "lng": -51.9331}',
    '{"phone": "(44) 5000-3000", "email": "maringa@plusval.com.br", "website": "https://plusval.com.br"}'
);

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('units', 'cnpj_cache');

-- Verificar se os índices foram criados
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('units', 'cnpj_cache');

-- Verificar se as políticas RLS foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public';

-- Contar registros inseridos
SELECT 
    'units' as table_name,
    COUNT(*) as record_count
FROM units
UNION ALL
SELECT 
    'cnpj_cache' as table_name,
    COUNT(*) as record_count
FROM cnpj_cache;

-- =====================================================
-- COMANDOS ÚTEIS PARA MANUTENÇÃO
-- =====================================================

-- Limpar cache expirado manualmente:
-- SELECT clean_expired_cnpj_cache();

-- Verificar unidades por empresa:
-- SELECT company_type, COUNT(*) FROM units GROUP BY company_type;

-- Verificar cache CNPJ:
-- SELECT cnpj, cached_at FROM cnpj_cache ORDER BY cached_at DESC;

-- Backup das unidades:
-- COPY units TO '/path/to/backup/units.csv' DELIMITER ',' CSV HEADER;

-- Restaurar backup:
-- COPY units FROM '/path/to/backup/units.csv' DELIMITER ',' CSV HEADER;

COMMIT;