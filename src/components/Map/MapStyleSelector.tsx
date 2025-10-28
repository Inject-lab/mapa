import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type MapStyle } from '@/lib/mapbox'
import { cn } from '@/lib/utils'

interface MapStyleSelectorProps {
  currentStyle: MapStyle
  onStyleChange: (style: MapStyle) => void
}

const mapStyles: Array<{ key: MapStyle; name: string; description: string }> = [
  {
    key: 'parana',
    name: 'Paraná Focus',
    description: 'Visualização otimizada para o estado do Paraná',
  },
  {
    key: 'streets',
    name: 'Ruas',
    description: 'Visualização padrão com ruas e detalhes',
  },
  {
    key: 'satellite',
    name: 'Satélite',
    description: 'Imagem de satélite em alta resolução',
  },
  {
    key: 'light',
    name: 'Claro',
    description: 'Estilo claro e minimalista',
  },
  {
    key: 'dark',
    name: 'Escuro',
    description: 'Estilo escuro para visualização noturna',
  },
]

export function MapStyleSelector({ currentStyle, onStyleChange }: MapStyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentStyleInfo = mapStyles.find(style => style.key === currentStyle)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background/80 backdrop-blur-sm hover:bg-background gap-2"
        title="Alterar estilo do mapa"
      >
        <Layers className="h-4 w-4" />
        <span className="hidden sm:inline">{currentStyleInfo?.name}</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu de estilos */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 z-50"
            >
              <Card className="w-64 shadow-lg border">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {mapStyles.map((style) => (
                      <button
                        key={style.key}
                        onClick={() => {
                          onStyleChange(style.key)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-md transition-colors hover:bg-muted",
                          "flex items-center justify-between group",
                          currentStyle === style.key && "bg-muted"
                        )}
                      >
                        <div>
                          <div className="font-medium text-sm">{style.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {style.description}
                          </div>
                        </div>
                        {currentStyle === style.key && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}