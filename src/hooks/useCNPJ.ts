import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type CNPJData } from '@/types'
import { validateCNPJ } from '@/lib/utils'
import { toast } from 'sonner'

const CNPJ_API_URL = 'https://brasilapi.com.br/api/cnpj/v1'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas em millisegundos

async function fetchCNPJFromAPI(cnpj: string): Promise<CNPJData> {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  console.log('🔍 Consultando CNPJ na API Brasil:', cleanCNPJ)
  const response = await fetch(`${CNPJ_API_URL}/${cleanCNPJ}`)
  
  if (!response.ok) {
    console.error('❌ Erro na resposta da API:', response.status, response.statusText)
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado')
    }
    throw new Error('Erro ao consultar CNPJ')
  }
  
  const data = await response.json()
  console.log('📋 Dados brutos da API Brasil:', data)
  console.log('🏢 CNAE Fiscal recebido:', data.cnae_fiscal)
  console.log('📝 Descrição CNAE recebida:', data.cnae_fiscal_descricao)
  
  // Usar a descrição que já vem da API Brasil
  const cnaeDescricao = data.cnae_fiscal_descricao || `CNAE ${data.cnae_fiscal}`
  
  // Mapear dados da API para nosso formato
  const mappedData = {
    cnpj: data.cnpj,
    razao_social: data.razao_social || data.nome_empresarial,
    nome_fantasia: data.nome_fantasia || data.razao_social,
    situacao: data.descricao_situacao_cadastral,
    situacao_cadastral: data.descricao_situacao_cadastral,
    tipo: data.descricao_tipo_logradouro,
    porte: data.porte,
    natureza_juridica: data.natureza_juridica,
    atividade_principal: data.cnae_fiscal ? [{
      code: data.cnae_fiscal.toString(),
      text: cnaeDescricao
    }] : [],
    atividades_secundarias: data.cnaes_secundarios || [],
    // Propriedades de endereço no nível raiz para compatibilidade
    logradouro: data.logradouro,
    numero: data.numero,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep,
    endereco: {
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      cep: data.cep,
    },
    telefone: data.ddd_telefone_1 || '',
    email: data.email || '',
    data_situacao: data.data_situacao_cadastral,
    data_abertura: data.data_inicio_atividade,
    capital_social: data.capital_social?.toString() || '0',
  }
  
  console.log('✅ Dados mapeados:', mappedData)
  console.log('🎯 Atividade principal mapeada:', mappedData.atividade_principal)
  
  return mappedData
}

async function getCachedCNPJ(cnpj: string): Promise<CNPJData | null> {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  const { data, error } = await supabase
    .from('cnpj_cache')
    .select('*')
    .eq('cnpj', cleanCNPJ)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null
  }

  return data.data as CNPJData
}

async function setCachedCNPJ(cnpj: string, data: CNPJData): Promise<void> {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  const expiresAt = new Date(Date.now() + CACHE_DURATION).toISOString()

  const { error } = await supabase
    .from('cnpj_cache')
    .upsert({
      cnpj: cleanCNPJ,
      data,
      expires_at: expiresAt,
    })

  if (error) {
    console.warn('Erro ao salvar cache do CNPJ:', error)
  }
}

export function useCNPJQuery(cnpj: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['cnpj', cnpj],
    queryFn: async () => {
      const cleanCNPJ = cnpj.replace(/\D/g, '')
      
      if (!validateCNPJ(cleanCNPJ)) {
        throw new Error('CNPJ inválido')
      }

      // Tentar buscar no cache primeiro
      const cached = await getCachedCNPJ(cleanCNPJ)
      if (cached) {
        return cached
      }

      // Se não estiver no cache, buscar na API
      const data = await fetchCNPJFromAPI(cleanCNPJ)
      
      // Salvar no cache
      await setCachedCNPJ(cleanCNPJ, data)
      
      return data
    },
    enabled: options?.enabled !== undefined ? options.enabled && !!cnpj && cnpj.replace(/\D/g, '').length === 14 : !!cnpj && cnpj.replace(/\D/g, '').length === 14,
    staleTime: CACHE_DURATION,
    retry: (failureCount, error) => {
      // Não tentar novamente se for CNPJ inválido ou não encontrado
      if (error.message.includes('inválido') || error.message.includes('não encontrado')) {
        return false
      }
      return failureCount < 2
    },
  })
}

export function useCNPJMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cnpj: string) => {
      const cleanCNPJ = cnpj.replace(/\D/g, '')
      
      if (!validateCNPJ(cleanCNPJ)) {
        throw new Error('CNPJ inválido')
      }

      // Buscar dados do CNPJ
      const cached = await getCachedCNPJ(cleanCNPJ)
      if (cached) {
        return cached
      }

      const data = await fetchCNPJFromAPI(cleanCNPJ)
      await setCachedCNPJ(cleanCNPJ, data)
      
      return data
    },
    onSuccess: (data, cnpj) => {
      // Atualizar cache do React Query
      queryClient.setQueryData(['cnpj', cnpj], data)
      toast.success('Dados do CNPJ carregados com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao consultar CNPJ')
    },
  })
}

export function useClearCNPJCache() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cnpj?: string) => {
      if (cnpj) {
        const cleanCNPJ = cnpj.replace(/\D/g, '')
        const { error } = await supabase
          .from('cnpj_cache')
          .delete()
          .eq('cnpj', cleanCNPJ)

        if (error) {
          throw new Error('Erro ao limpar cache do CNPJ')
        }
      } else {
        // Limpar todo o cache
        const { error } = await supabase
          .from('cnpj_cache')
          .delete()
          .neq('id', '')

        if (error) {
          throw new Error('Erro ao limpar cache')
        }
      }
    },
    onSuccess: (_, cnpj) => {
      if (cnpj) {
        queryClient.removeQueries({ queryKey: ['cnpj', cnpj] })
        toast.success('Cache do CNPJ limpo!')
      } else {
        queryClient.removeQueries({ queryKey: ['cnpj'] })
        toast.success('Cache limpo com sucesso!')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao limpar cache')
    },
  })
}