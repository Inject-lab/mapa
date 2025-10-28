import React from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Search, 
  Database, 
  Wifi, 
  AlertCircle,
  Building2,
  FileX,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 p-4 bg-muted rounded-full"
        >
          {icon}
        </motion.div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="gap-2"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Estado vazio para quando não há unidades
interface NoUnitsProps {
  onAddUnit?: () => void
  hasFilters?: boolean
  onClearFilters?: () => void
}

export function NoUnits({ onAddUnit, hasFilters, onClearFilters }: NoUnitsProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Filter className="h-8 w-8 text-muted-foreground" />}
        title="Nenhuma unidade encontrada"
        description="Não encontramos unidades que correspondam aos filtros aplicados. Tente ajustar os critérios de busca."
        action={onClearFilters ? {
          label: "Limpar Filtros",
          onClick: onClearFilters,
          variant: "outline"
        } : undefined}
      />
    )
  }

  return (
    <EmptyState
      icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
      title="Nenhuma unidade cadastrada"
      description="Comece adicionando a primeira unidade do Grupo Pluma ao sistema. Você pode cadastrar manualmente ou importar via CNPJ."
      action={onAddUnit ? {
        label: "Adicionar Primeira Unidade",
        onClick: onAddUnit
      } : undefined}
    />
  )
}

// Estado vazio para busca CNPJ
interface NoCNPJResultsProps {
  cnpj?: string
  onTryAgain?: () => void
}

export function NoCNPJResults({ cnpj, onTryAgain }: NoCNPJResultsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <EmptyState
          icon={<Search className="h-8 w-8 text-muted-foreground" />}
          title="CNPJ não encontrado"
          description={
            cnpj 
              ? `Não foi possível encontrar informações para o CNPJ ${cnpj}. Verifique se o número está correto.`
              : "Digite um CNPJ válido para buscar as informações da empresa."
          }
          action={onTryAgain ? {
            label: "Tentar Novamente",
            onClick: onTryAgain,
            variant: "outline"
          } : undefined}
        />
      </CardContent>
    </Card>
  )
}

// Estado para erro de conexão
interface ConnectionErrorProps {
  onRetry?: () => void
  type?: 'database' | 'api' | 'network'
}

export function ConnectionError({ onRetry, type = 'network' }: ConnectionErrorProps) {
  const configs = {
    database: {
      icon: <Database className="h-8 w-8 text-destructive" />,
      title: "Erro de conexão com o banco",
      description: "Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente."
    },
    api: {
      icon: <AlertCircle className="h-8 w-8 text-destructive" />,
      title: "Erro na API",
      description: "Ocorreu um erro ao comunicar com os serviços externos. Tente novamente em alguns instantes."
    },
    network: {
      icon: <Wifi className="h-8 w-8 text-destructive" />,
      title: "Sem conexão",
      description: "Verifique sua conexão com a internet e tente novamente."
    }
  }

  const config = configs[type]

  return (
    <Card className="border-destructive/20">
      <CardContent className="p-6">
        <EmptyState
          icon={config.icon}
          title={config.title}
          description={config.description}
          action={onRetry ? {
            label: "Tentar Novamente",
            onClick: onRetry,
            variant: "outline"
          } : undefined}
        />
      </CardContent>
    </Card>
  )
}

// Estado para mapa sem dados
interface EmptyMapProps {
  onAddUnit?: () => void
  hasFilters?: boolean
  onClearFilters?: () => void
}

export function EmptyMap({ onAddUnit, hasFilters, onClearFilters }: EmptyMapProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="max-w-md mx-4">
        <CardContent className="p-6">
          {hasFilters ? (
            <EmptyState
              icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
              title="Nenhuma unidade no mapa"
              description="Os filtros aplicados não retornaram resultados. Ajuste os critérios para visualizar as unidades."
              action={onClearFilters ? {
                label: "Limpar Filtros",
                onClick: onClearFilters,
                variant: "outline"
              } : undefined}
            />
          ) : (
            <EmptyState
              icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
              title="Mapa vazio"
              description="Adicione unidades ao sistema para visualizá-las no mapa interativo."
              action={onAddUnit ? {
                label: "Adicionar Unidade",
                onClick: onAddUnit
              } : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Estado para formulário sem dados CNPJ
export function NoCNPJData() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20"
    >
      <div className="text-center">
        <FileX className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Nenhum dado CNPJ carregado</p>
        <p className="text-xs text-muted-foreground">
          Use a busca CNPJ para preencher automaticamente os campos
        </p>
      </div>
    </motion.div>
  )
}

// Estado genérico para "não encontrado"
interface NotFoundProps {
  title?: string
  description?: string
  onGoBack?: () => void
}

export function NotFound({ 
  title = "Página não encontrada",
  description = "A página que você está procurando não existe ou foi movida.",
  onGoBack
}: NotFoundProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <EmptyState
        icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
        title={title}
        description={description}
        action={onGoBack ? {
          label: "Voltar",
          onClick: onGoBack,
          variant: "outline"
        } : undefined}
        className="max-w-md"
      />
    </div>
  )
}

// Estado para manutenção
export function MaintenanceMode() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md mx-4">
        <CardHeader className="text-center">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
          >
            <AlertCircle className="h-8 w-8 text-primary" />
          </motion.div>
          <CardTitle>Sistema em manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Estamos realizando melhorias no sistema. Voltaremos em breve com novidades!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}