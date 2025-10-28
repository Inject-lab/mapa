import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import type { Unit } from '@/types'

interface UnitListProps {
  units: Unit[]
  onEdit: (unit: Unit) => void
  onDelete: (unitId: string) => void
  companyFilter: 'all' | 'bello' | 'pluma' | 'plusval'
  onCompanyFilter: (filter: 'all' | 'bello' | 'pluma' | 'plusval') => void
}

export function UnitList({ 
  units, 
  onEdit, 
  onDelete, 
  companyFilter, 
  onCompanyFilter 
}: UnitListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  // Filtrar unidades por termo de busca
  const filteredUnits = units.filter(unit => {
    const searchLower = searchTerm.toLowerCase()
    return (
      unit.tradeName?.toLowerCase().includes(searchLower) ||
    unit.corporateName?.toLowerCase().includes(searchLower) ||
      unit.address?.city?.toLowerCase().includes(searchLower) ||
      unit.address?.state?.toLowerCase().includes(searchLower) ||
      unit.cnpj.includes(searchTerm)
    )
  })

  const handleDelete = async (unit: Unit) => {
    try {
      await onDelete(unit.id)
      toast({
        title: "Unidade excluída",
        description: `A unidade ${unit.tradeName} foi excluída com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a unidade. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getCompanyBadgeVariant = (company: string | undefined) => {
    if (!company) return 'outline'
    switch (company) {
      case 'bello': return 'bello'
      case 'pluma': return 'pluma'
      case 'plusval': return 'plusval'
      default: return 'outline'
    }
  }

  const stats = {
    bello: units.filter(u => u.companyType === 'bello').length,
    pluma: units.filter(u => u.companyType === 'pluma').length,
    plusval: units.filter(u => u.companyType === 'plusval').length,
    total: units.length
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Todas as Unidades</h1>
              <p className="text-muted-foreground">
                Gerencie todas as unidades do Grupo Pluma
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Building2 className="w-3 h-3" />
                {filteredUnits.length} de {units.length} unidades
              </Badge>
            </div>
          </div>

          {/* Filtros e busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, cidade, estado ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={companyFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCompanyFilter('all')}
              >
                Todas ({stats.total})
              </Button>
              {stats.bello > 0 && (
                <Button
                  variant={companyFilter === 'bello' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCompanyFilter('bello')}
                >
                  Bello ({stats.bello})
                </Button>
              )}
              {stats.pluma > 0 && (
                <Button
                  variant={companyFilter === 'pluma' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCompanyFilter('pluma')}
                >
                  Pluma ({stats.pluma})
                </Button>
              )}
              {stats.plusval > 0 && (
                <Button
                  variant={companyFilter === 'plusval' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCompanyFilter('plusval')}
                >
                  Plusval ({stats.plusval})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de unidades */}
        {filteredUnits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? 'Tente ajustar os filtros ou termo de busca.'
                  : 'Comece adicionando uma nova unidade ao sistema.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUnits.map((unit, index) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{unit.tradeName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getCompanyBadgeVariant(unit.companyType)}>
                            {unit.companyType?.charAt(0).toUpperCase() + unit.companyType?.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            CNPJ: {unit.cnpj}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(unit)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => {}}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a unidade <strong>{unit.tradeName}</strong>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(unit)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{unit.address?.street} {unit.address?.number}, {unit.address?.city} - {unit.address?.state}</span>
                      </div>
                      {unit.contact?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{unit.contact.phone}</span>
                        </div>
                      )}
                      {unit.contact?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{unit.contact.email}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}