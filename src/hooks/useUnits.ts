import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Unit, type SearchFilters } from '@/types'
import { toast } from 'sonner'
import { MOCK_UNITS } from '@/data/mockData'

// Flag para usar dados mock (útil para desenvolvimento/demo)
const USE_MOCK_DATA = false

// Função para converter dados do banco para o formato da aplicação
function mapDBUnitToUnit(dbUnit: any): Unit {
  return {
    id: dbUnit.id,
    cnpj: dbUnit.cnpj,
    tradeName: dbUnit.trade_name,
    corporateName: dbUnit.corporate_name,
    companyType: dbUnit.company_type,
    activity: dbUnit.activity,
    address: dbUnit.address,
    coordinates: dbUnit.coordinates,
    contact: dbUnit.contact,
    createdAt: dbUnit.created_at,
    updatedAt: dbUnit.updated_at,
  }
}

// Função para converter dados da aplicação para o formato do banco
function mapUnitToDBUnit(unit: Partial<Unit>): any {
  return {
    cnpj: unit.cnpj,
    trade_name: unit.tradeName,
    corporate_name: unit.corporateName,
    company_type: unit.companyType,
    activity: unit.activity,
    address: unit.address,
    coordinates: unit.coordinates,
    contact: unit.contact,
  }
}

export function useUnits(filters?: SearchFilters) {
  return useQuery({
    queryKey: ['units', filters],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000))
        return MOCK_UNITS
      }

      let query = supabase
        .from('units')
        .select('*')
        .order('trade_name')

      // Aplicar filtros
      if (filters?.companyType && filters.companyType.length > 0) {
        query = query.in('company_type', filters.companyType)
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }

      if (filters?.searchTerm) {
        query = query.or(`trade_name.ilike.%${filters.searchTerm}%,corporate_name.ilike.%${filters.searchTerm}%,cnpj.ilike.%${filters.searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar unidades:', error)
        throw new Error('Falha ao carregar unidades')
      }

      return data.map(mapDBUnitToUnit)
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: ['unit', id],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const unit = MOCK_UNITS.find(u => u.id === id)
        if (!unit) {
          throw new Error('Unidade não encontrada')
        }
        return unit
      }

      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar unidade:', error)
        throw new Error('Unidade não encontrada')
      }

      return mapDBUnitToUnit(data)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUnitByCNPJ(cnpj: string) {
  return useQuery({
    queryKey: ['unit', 'cnpj', cnpj],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('cnpj', cnpj.replace(/\D/g, ''))
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        console.error('Erro ao buscar unidade por CNPJ:', error)
        throw new Error('Falha ao buscar unidade')
      }

      return mapDBUnitToUnit(data)
    },
    enabled: !!cnpj && cnpj.replace(/\D/g, '').length === 14,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (USE_MOCK_DATA) {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Criar nova unidade mock
        const newUnit: Unit = {
          ...unit,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Adicionar aos dados mock (simulação)
        MOCK_UNITS.push(newUnit)
        
        return newUnit
      }

      const dbUnit = mapUnitToDBUnit(unit)
      
      const { data, error } = await supabase
        .from('units')
        .insert(dbUnit)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar unidade:', error)
        throw new Error('Falha ao criar unidade')
      }

      return mapDBUnitToUnit(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast.success('Unidade criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar unidade')
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...unit }: Partial<Unit> & { id: string }) => {
      if (USE_MOCK_DATA) {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Encontra a unidade no mock data
        const unitIndex = MOCK_UNITS.findIndex(u => u.id === id)
        if (unitIndex === -1) {
          throw new Error('Unidade não encontrada')
        }
        
        // Atualiza a unidade
        const updatedUnit = {
          ...MOCK_UNITS[unitIndex],
          ...unit,
          updatedAt: new Date().toISOString(),
        }
        
        MOCK_UNITS[unitIndex] = updatedUnit
        return updatedUnit
      }
      
      const dbUnit = mapUnitToDBUnit(unit)
      
      const { data, error } = await supabase
        .from('units')
        .update({ ...dbUnit, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar unidade:', error)
        throw new Error('Falha ao atualizar unidade')
      }

      return mapDBUnitToUnit(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['unit', data.id] })
      toast.success('Unidade atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar unidade')
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK_DATA) {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Encontra a unidade no mock data
        const unitIndex = MOCK_UNITS.findIndex(u => u.id === id)
        if (unitIndex === -1) {
          throw new Error('Unidade não encontrada')
        }
        
        // Remove a unidade do array
        MOCK_UNITS.splice(unitIndex, 1)
        return
      }
      
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar unidade:', error)
        throw new Error('Falha ao deletar unidade')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast.success('Unidade removida com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover unidade')
    },
  })
}