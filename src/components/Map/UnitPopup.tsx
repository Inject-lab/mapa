import { motion } from 'framer-motion'
import { X, MapPin, Phone, Mail, Globe, Building2, Hash, Calendar, Edit, Trash2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Unit } from '@/types'
import { formatCNPJ } from '@/lib/utils'
import { useDeleteUnit } from '@/hooks/useUnits'

interface UnitPopupProps {
  unit: Unit
  onClose: () => void
  onEdit?: (unit: Unit) => void
}

export function UnitPopup({ unit, onClose, onEdit }: UnitPopupProps) {
  const deleteUnit = useDeleteUnit()
  
  const companyConfig = {
    bello: { name: 'Bello', color: 'bello', icon: '🏢' },
    pluma: { name: 'Pluma', color: 'pluma', icon: '🪶' },
    plusval: { name: 'Plusval', color: 'plusval', icon: '📈' },
  }

  const config = companyConfig[unit.companyType] || { name: 'Desconhecido', color: 'default', icon: '🏢' }

  const handleEdit = () => {
    onEdit?.(unit)
    onClose()
  }

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a unidade "${unit.tradeName}"?`)) {
      try {
        await deleteUnit.mutateAsync(unit.id)
        onClose()
      } catch (error) {
        console.error('Erro ao excluir unidade:', error)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2 }}
      className="w-80 max-w-sm"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <CardTitle className="text-lg leading-tight">
                  {unit.tradeName}
                </CardTitle>
                <Badge variant={config.color as any} className="mt-1">
                  {config.name}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Informações básicas */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{unit.corporateName}</p>
                <p className="text-muted-foreground text-xs">Razão Social</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-mono">{formatCNPJ(unit.cnpj)}</p>
                <p className="text-muted-foreground text-xs">CNPJ</p>
              </div>
            </div>

            {/* Atividade */}
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium">{unit.activity || 'Não informado'}</p>
                <p className="text-muted-foreground text-xs">Atividade</p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="leading-relaxed">
                {unit.address?.street}, {unit.address?.number}
              </p>
              <p className="text-muted-foreground">
                {unit.address?.neighborhood} - {unit.address?.city}/{unit.address?.state}
              </p>
              <p className="text-muted-foreground font-mono text-xs">
                CEP: {unit.address?.zipCode}
              </p>
            </div>
          </div>

          {/* Contato */}
          {(unit.contact?.phone || unit.contact?.email || unit.contact?.website) && (
            <div className="space-y-2">
              {unit.contact?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${unit.contact.phone}`}
                    className="text-primary hover:underline"
                  >
                    {unit.contact.phone}
                  </a>
                </div>
              )}

              {unit.contact?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`mailto:${unit.contact.email}`}
                    className="text-primary hover:underline"
                  >
                    {unit.contact.email}
                  </a>
                </div>
              )}

              {unit.contact?.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={unit.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Coordenadas */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="font-mono">
                {unit.coordinates?.lat?.toFixed(6) || '0.000000'}, {unit.coordinates?.lng?.toFixed(6) || '0.000000'}
              </span>
            </div>
          </div>

          {/* Data de criação */}
          {unit.createdAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Cadastrado em {new Date(unit.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-1 gap-2"
              disabled={!onEdit}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex-1 gap-2"
              disabled={deleteUnit.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteUnit.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}