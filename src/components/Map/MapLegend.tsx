import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Unit } from '@/types'

interface MapLegendProps {
  units: Unit[]
}

export function MapLegend({ units }: MapLegendProps) {
  // Contar unidades por empresa
  const counts = units.reduce((acc, unit) => {
    acc[unit.companyType] = (acc[unit.companyType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const companies = [
    {
      type: 'bello',
      name: 'Bello',
      icon: '🏢',
      color: 'bg-bello',
      count: counts.bello || 0,
    },
    {
      type: 'pluma',
      name: 'Pluma',
      icon: '🪶',
      color: 'bg-pluma',
      count: counts.pluma || 0,
    },
    {
      type: 'plusval',
      name: 'Plusval',
      icon: '📈',
      color: 'bg-plusval',
      count: counts.plusval || 0,
    },
  ]

  // Filtrar apenas empresas com unidades
  const activeCompanies = companies.filter(company => company.count > 0)

  if (activeCompanies.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-background/90 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Legenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeCompanies.map((company) => (
            <motion.div
              key={company.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs ${company.color}`}
                >
                  <span className="text-white text-[10px]">
                    {company.icon}
                  </span>
                </div>
                <span className="text-sm font-medium">{company.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {company.count}
              </Badge>
            </motion.div>
          ))}

          {/* Total */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
              <Badge variant="outline" className="text-xs">
                {units.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}