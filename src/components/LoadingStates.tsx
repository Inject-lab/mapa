import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Search, Database } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Loading genérico
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(sizeClasses[size], className)}
    >
      <Loader2 className="h-full w-full" />
    </motion.div>
  )
}

// Loading para o mapa
export function MapLoading() {
  return (
    <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <MapPin className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <h3 className="font-semibold">Carregando mapa...</h3>
            <p className="text-sm text-muted-foreground">Preparando visualização das unidades</p>
          </div>
        </motion.div>
      </div>

      {/* Skeleton do mapa */}
      <div className="absolute inset-0 opacity-30">
        <div className="grid grid-cols-4 gap-2 p-4 h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: i * 0.1
              }}
              className="bg-muted-foreground/20 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Loading para busca CNPJ
export function CNPJSearchLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-5 h-5"
      >
        <Search className="h-full w-full text-primary" />
      </motion.div>
      <div>
        <p className="font-medium">Consultando CNPJ...</p>
        <p className="text-sm text-muted-foreground">Buscando dados na Receita Federal</p>
      </div>
    </motion.div>
  )
}

// Loading para dados do banco
export function DatabaseLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-4"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-5 h-5"
      >
        <Database className="h-full w-full text-primary" />
      </motion.div>
      <div>
        <p className="font-medium">Carregando dados...</p>
        <p className="text-sm text-muted-foreground">Sincronizando com o banco de dados</p>
      </div>
    </motion.div>
  )
}

// Skeleton para lista de unidades
export function UnitsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Skeleton para formulário
export function FormSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

// Loading overlay para toda a aplicação
interface AppLoadingOverlayProps {
  message?: string
  description?: string
}

export function AppLoadingOverlay({ 
  message = "Carregando...", 
  description = "Preparando a aplicação" 
}: AppLoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Card className="p-6 min-w-[300px]">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
          <div className="text-center">
            <h3 className="font-semibold">{message}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Loading para botões
interface ButtonLoadingProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
}

export function ButtonLoading({ loading, children, className }: ButtonLoadingProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </span>
  )
}