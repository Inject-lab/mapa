import { useState, useCallback, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Search, 
  Plus, 
  Building2, 
  X,
  Menu,
  BarChart3,
  AlertCircle,
  List
} from 'lucide-react'

import { LeafletMap } from '@/components/Map/LeafletMap'
import { CNPJSearch } from '@/components/CNPJ'
import { UnitForm, UnitList } from '@/components/Units'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppLoadingOverlay } from '@/components/LoadingStates'
import { ConnectionError, EmptyMap, NoUnits } from '@/components/EmptyStates'
import { useUnits, useDeleteUnit, useCreateUnit } from '@/hooks/useUnits'
import type { Unit, CNPJData } from '@/types'

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

type ViewMode = 'map' | 'search' | 'form' | 'stats' | 'list'
type CompanyFilter = 'all' | 'bello' | 'pluma' | 'plusval'

interface AppState {
  viewMode: ViewMode
  selectedUnit: Unit | null
  cnpjData: CNPJData | null
  companyFilter: CompanyFilter
  isMenuOpen: boolean
}

function AppContent() {
  const [state, setState] = useState<AppState>({
    viewMode: 'map',
    selectedUnit: null,
    cnpjData: null,
    companyFilter: 'all',
    isMenuOpen: false,
  })

  const { data: units = [], isLoading, error, refetch } = useUnits()
  const deleteUnit = useDeleteUnit()
  const createUnit = useCreateUnit()

  // Filtrar unidades por empresa
  const filteredUnits = useMemo(() => {
    if (state.companyFilter === 'all') return units
    return units.filter(unit => unit.companyType === state.companyFilter)
  }, [units, state.companyFilter])

  // Estatísticas das empresas
  const stats = useMemo(() => {
    const bello = units.filter(u => u.companyType === 'bello').length
    const pluma = units.filter(u => u.companyType === 'pluma').length
    const plusval = units.filter(u => u.companyType === 'plusval').length
    
    return { bello, pluma, plusval, total: units.length }
  }, [units])

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleViewChange = useCallback((viewMode: ViewMode) => {
    updateState({ viewMode, isMenuOpen: false })
  }, [updateState])

  const handleUnitSelect = useCallback((unit: Unit | null) => {
    updateState({ selectedUnit: unit })
  }, [updateState])

  const handleCNPJData = useCallback((data: CNPJData | null) => {
    updateState({ cnpjData: data })
    if (data) {
      handleViewChange('form')
    }
  }, [updateState, handleViewChange])

  const handleCompanyFilter = useCallback((filter: CompanyFilter) => {
    updateState({ companyFilter: filter })
  }, [updateState])

  const toggleMenu = useCallback(() => {
    updateState({ isMenuOpen: !state.isMenuOpen })
  }, [state.isMenuOpen, updateState])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleClearFilters = useCallback(() => {
    updateState({ companyFilter: 'all' })
  }, [updateState])

  const handleAddFirstUnit = useCallback(() => {
    handleViewChange('form')
  }, [handleViewChange])

  const handleUnitEdit = useCallback((unit: Unit) => {
    updateState({ selectedUnit: unit })
    handleViewChange('form')
  }, [updateState, handleViewChange])

  const handleUnitDelete = useCallback(async (unitId: string) => {
    await deleteUnit.mutateAsync(unitId)
  }, [deleteUnit])

  // Estados de loading
  if (isLoading) {
    return <AppLoadingOverlay message="Carregando unidades do Grupo Pluma..." />
  }

  // Estados de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <ConnectionError 
          type="database" 
          onRetry={handleRetry}
        />
      </div>
    )
  }

  // Verificar se há unidades
  const hasUnits = units.length > 0
  const hasFilteredUnits = filteredUnits.length > 0
  const hasActiveFilters = state.companyFilter !== 'all'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Grupo Pluma</h1>
                  <p className="text-xs text-muted-foreground">Mapa de Unidades</p>
                </div>
              </div>
            </div>

            {/* Estatísticas - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {hasUnits ? (
                <div className="flex items-center gap-2">
                  <Badge variant="bello" className="gap-1">
                    <div className="w-2 h-2 bg-current rounded-full" />
                    Bello: {stats.bello}
                  </Badge>
                  <Badge variant="pluma" className="gap-1">
                    <div className="w-2 h-2 bg-current rounded-full" />
                    Pluma: {stats.pluma}
                  </Badge>
                  <Badge variant="plusval" className="gap-1">
                      <div className="w-2 h-2 bg-current rounded-full" />
                      Plusval: {stats.plusval}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Total: {stats.total}
                  </Badge>
                </div>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Nenhuma unidade
                </Badge>
              )}
            </div>

            {/* Menu mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMenu}
            >
              {state.isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Menu mobile expandido */}
          <AnimatePresence>
            {state.isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pt-4 border-t"
              >
                {hasUnits ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="bello" className="gap-1">
                      <div className="w-2 h-2 bg-current rounded-full" />
                      Bello: {stats.bello}
                    </Badge>
                    <Badge variant="pluma" className="gap-1">
                      <div className="w-2 h-2 bg-current rounded-full" />
                      Pluma: {stats.pluma}
                    </Badge>
                    <Badge variant="plusval" className="gap-1">
                      <div className="w-2 h-2 bg-current rounded-full" />
                      Plusval: {stats.plusval}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Total: {stats.total}
                    </Badge>
                  </div>
                ) : (
                  <div className="mb-4">
                    <Badge variant="outline" className="gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Nenhuma unidade cadastrada
                    </Badge>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Navegação */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            <Button
              variant={state.viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('map')}
              className="gap-2 whitespace-nowrap"
            >
              <MapPin className="h-4 w-4" />
              Mapa
            </Button>
            <Button
              variant={state.viewMode === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('search')}
              className="gap-2 whitespace-nowrap"
            >
              <Search className="h-4 w-4" />
              Buscar CNPJ
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('list')}
              className="gap-2 whitespace-nowrap"
            >
              <List className="h-4 w-4" />
              Ver Todas
            </Button>
            <Button
              variant={state.viewMode === 'form' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('form')}
              className="gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Nova Unidade
            </Button>

            {/* Filtros de empresa - só mostrar se houver unidades */}
            {hasUnits && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant={state.companyFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCompanyFilter('all')}
                  className="text-xs"
                >
                  Todas
                </Button>
                {stats.bello > 0 && (
                  <Button
                    variant={state.companyFilter === 'bello' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCompanyFilter('bello')}
                    className="text-xs"
                  >
                    Bello
                  </Button>
                )}
                {stats.pluma > 0 && (
                  <Button
                    variant={state.companyFilter === 'pluma' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCompanyFilter('pluma')}
                    className="text-xs"
                  >
                    Pluma
                  </Button>
                )}
                {stats.plusval > 0 && (
                  <Button
                    variant={state.companyFilter === 'plusval' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCompanyFilter('plusval')}
                    className="text-xs"
                  >
                    Plusval
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {state.viewMode === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-120px)] relative"
            >
              {hasFilteredUnits ? (
                <LeafletMap
                  filters={{ companyType: state.companyFilter === 'all' ? undefined : [state.companyFilter] }}
                  selectedUnitId={state.selectedUnit?.id}
                  onUnitSelect={handleUnitSelect}
                  onUnitEdit={handleUnitEdit}
                />
              ) : (
                <EmptyMap
                  hasFilters={hasActiveFilters}
                  onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
                  onAddUnit={!hasUnits ? handleAddFirstUnit : undefined}
                />
              )}
            </motion.div>
          )}

          {state.viewMode === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-8 max-w-4xl"
            >
              <CNPJSearch onCNPJFound={handleCNPJData} />
            </motion.div>
          )}

          {state.viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-8 max-w-6xl"
            >
              {hasFilteredUnits ? (
                 <UnitList
                   units={filteredUnits}
                   onEdit={handleUnitEdit}
                   onDelete={handleUnitDelete}
                   companyFilter={state.companyFilter}
                   onCompanyFilter={handleCompanyFilter}
                 />
               ) : (
                <NoUnits
                  hasFilters={hasActiveFilters}
                  onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
                  onAddUnit={!hasUnits ? handleAddFirstUnit : undefined}
                />
              )}
            </motion.div>
          )}

          {state.viewMode === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-8 max-w-4xl"
            >
              <UnitForm
                unit={state.selectedUnit || undefined}
                onSubmit={async (unitData) => {
                  try {
                    await createUnit.mutateAsync(unitData)
                    handleViewChange('map')
                    updateState({ selectedUnit: null, cnpjData: null })
                  } catch (error) {
                    console.error('Erro ao criar unidade:', error)
                  }
                }}
                onCancel={() => {
                  handleViewChange('map')
                  updateState({ selectedUnit: null, cnpjData: null })
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}