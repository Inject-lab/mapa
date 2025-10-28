# 🗺️ Grupo Pluma - Mapa Interativo de Unidades do Paraná

Sistema profissional de mapeamento interativo para visualização e gerenciamento das unidades do Grupo Pluma (Bello, Pluma e Plusval) no estado do Paraná.

## ✨ Funcionalidades

### 🎯 Core Features
- **Mapa Interativo**: Visualização em tempo real com Mapbox GL JS
- **Marcadores Personalizados**: Ícones únicos para cada empresa (Bello 🏢, Pluma 🪶, Plusval 📈)
- **Consulta CNPJ**: Integração com Brasil API para busca automática de dados
- **Cache Inteligente**: Sistema de cache para otimizar consultas CNPJ
- **Filtros Dinâmicos**: Filtragem por tipo de empresa
- **Responsivo**: Interface adaptável para desktop e mobile

### 🛠️ Funcionalidades Técnicas
- **CRUD Completo**: Criar, visualizar, editar e excluir unidades
- **Validação Robusta**: Validação de CNPJ, coordenadas e dados obrigatórios
- **Estados de Loading**: Feedback visual durante operações assíncronas
- **Tratamento de Erros**: Mensagens claras e recuperação graceful
- **Performance**: Lazy loading, virtualização e otimizações

## 🚀 Stack Tecnológica

### Frontend
- **React 18.3+** com TypeScript 5+
- **Vite 5+** para build e desenvolvimento
- **Tailwind CSS 3.4+** para estilização
- **shadcn/ui** + **Radix UI** para componentes
- **Framer Motion** para animações

### Mapa & Geolocalização
- **Mapbox GL JS** para renderização do mapa
- **Mapbox Geocoding API** para conversão de endereços

### Estado & Dados
- **@tanstack/react-query** para gerenciamento de estado servidor
- **Zustand** para estado global (se necessário)
- **React Hook Form** + **Zod** para formulários e validação

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Row Level Security (RLS)** habilitado
- **Brasil API** para consulta de CNPJ

### UI/UX
- **sonner** para notificações toast
- **lucide-react** para ícones
- **next-themes** para modo escuro
- **tailwindcss-animate** para animações CSS

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Supabase
- Token Mapbox

### 1. Clone o repositório
```bash
git clone <repository-url>
cd mapa-grupo-pluma
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### 4. Configure o banco de dados
Execute os scripts SQL no Supabase:

```sql
-- Tabela de unidades
CREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  company_type VARCHAR(20) NOT NULL CHECK (company_type IN ('bello', 'pluma', 'plusval')),
  corporate_name TEXT NOT NULL,
  trade_name TEXT,
  address JSONB NOT NULL,
  coordinates JSONB NOT NULL,
  contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cache CNPJ
CREATE TABLE cnpj_cache (
  cnpj VARCHAR(14) PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnpj_cache ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessário)
CREATE POLICY "Allow all operations" ON units FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cnpj_cache FOR ALL USING (true);

-- Índices para performance
CREATE INDEX idx_units_company_type ON units(company_type);
CREATE INDEX idx_units_cnpj ON units(cnpj);
CREATE INDEX idx_cnpj_cache_cached_at ON cnpj_cache(cached_at);
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── Map/             # Componentes do mapa
│   │   ├── LeafletMap.tsx
│   │   ├── UnitPopup.tsx
│   │   ├── MapLegend.tsx
│   │   └── MapStyleSelector.tsx
│   ├── CNPJ/            # Componentes de consulta CNPJ
│   │   └── CNPJSearch.tsx
│   ├── Units/           # Componentes de unidades
│   │   ├── UnitForm.tsx
│   │   └── UnitList.tsx
│   ├── EmptyStates.tsx  # Estados vazios
│   ├── ErrorBoundary.tsx # Tratamento de erros
│   └── LoadingStates.tsx # Estados de carregamento
├── data/
│   ├── mockData.ts      # Dados de exemplo
│   └── parana-geojson.ts # Dados geográficos do Paraná
├── hooks/
│   ├── useUnits.ts      # Hooks para gerenciar unidades
│   └── useCNPJ.ts       # Hooks para consulta CNPJ
├── lib/
│   ├── supabase.ts      # Configuração Supabase
│   ├── mapbox.ts        # Configuração Mapbox
│   └── utils.ts         # Utilitários gerais
├── types/
│   └── index.ts         # Definições TypeScript
├── App.tsx              # Componente principal
└── main.tsx             # Entry point
```

## 🎨 Guia de Uso

### Visualizar Unidades
1. Acesse o mapa principal
2. Use os filtros para visualizar empresas específicas
3. Clique nos marcadores para ver detalhes
4. Use os controles do mapa para navegar

### Adicionar Nova Unidade
1. Clique em "Nova Unidade"
2. Preencha o CNPJ (dados serão buscados automaticamente)
3. Complete as informações necessárias
4. Salve para adicionar ao mapa

### Consultar CNPJ
1. Clique em "Consultar CNPJ"
2. Digite o CNPJ desejado
3. Visualize os dados encontrados
4. Opcionalmente, crie uma nova unidade com os dados

## 🔧 Configuração Avançada

### Estilos do Mapa
O sistema suporta múltiplos estilos Mapbox:
- Streets (padrão)
- Satellite
- Hybrid
- Terrain

### Personalização de Empresas
Edite `src/lib/mapbox.ts` para personalizar:
- Cores dos marcadores
- Ícones das empresas
- Configurações visuais

### Cache CNPJ
O cache expira automaticamente após 24 horas. Para limpar manualmente:
```typescript
import { useClearCNPJCache } from '@/hooks/useCNPJ'

const clearCache = useClearCNPJCache()
clearCache.mutate()
```

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Preview Local
```bash
npm run preview
```

### Deploy Sugerido
- **Vercel**: Configuração automática com Vite
- **Netlify**: Suporte nativo para SPAs
- **Supabase Hosting**: Integração completa

## 🔒 Segurança

- **RLS habilitado** em todas as tabelas
- **Validação client-side e server-side**
- **Sanitização de dados** em todas as entradas
- **HTTPS obrigatório** em produção
- **Tokens de API** via variáveis de ambiente

## 📊 Performance

### Otimizações Implementadas
- **Code splitting** automático com Vite
- **Lazy loading** de componentes pesados
- **Cache inteligente** para consultas CNPJ
- **Debounce** em campos de busca
- **Virtualização** para listas grandes (quando necessário)

### Métricas Alvo
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🧪 Testes

```bash
# Executar testes
npm run test

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte técnico:
1. Verifique a documentação
2. Consulte as issues existentes
3. Abra uma nova issue com detalhes do problema

## 🔄 Changelog

### v1.0.0 (Atual)
- ✅ Mapa interativo com Mapbox GL JS
- ✅ CRUD completo de unidades
- ✅ Consulta CNPJ com cache
- ✅ Interface responsiva
- ✅ Filtros por empresa
- ✅ Validação robusta
- ✅ Tratamento de erros

### Próximas Versões
- 🔄 Importação/exportação de dados
- 🔄 Relatórios e analytics
- 🔄 Notificações em tempo real
- 🔄 API pública
- 🔄 Integração com outros sistemas

---

**Desenvolvido com ❤️ para o Grupo Pluma - Focado no estado do Paraná**