import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCNPJQuery } from '@/hooks/useCNPJ'
import { validateCNPJ, formatCNPJ } from '@/lib/utils'
import { type CNPJData } from '@/types'
import { cn } from '@/lib/utils'

interface CNPJSearchProps {
  onCNPJFound?: (data: CNPJData) => void
  className?: string
}

export function CNPJSearch({ onCNPJFound, className }: CNPJSearchProps) {
  const [cnpj, setCnpj] = useState('')
  const [searchCnpj, setSearchCnpj] = useState('')

  const { data, isLoading, error, refetch } = useCNPJQuery(searchCnpj, {
    enabled: false,
  })

  const handleInputChange = useCallback((value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '')
    
    // Limita a 14 dígitos
    if (numericValue.length <= 14) {
      setCnpj(numericValue)
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!validateCNPJ(cnpj)) {
      return
    }

    setSearchCnpj(cnpj)
    const result = await refetch()
    
    if (result.data && onCNPJFound) {
      onCNPJFound(result.data)
    }
  }, [cnpj, refetch, onCNPJFound])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const isValidCNPJ = cnpj.length === 14 && validateCNPJ(cnpj)
  const canSearch = isValidCNPJ && !isLoading

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Consultar CNPJ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input de CNPJ */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={formatCNPJ(cnpj)}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="00.000.000/0000-00"
              className={cn(
                "w-full px-3 py-2 pr-10 border rounded-md text-sm font-mono",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "placeholder:text-muted-foreground",
                error && "border-destructive focus:ring-destructive",
                data && "border-green-500 focus:ring-green-500"
              )}
              maxLength={18} // Formato: 00.000.000/0000-00
            />
            
            {/* Ícone de status */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!isLoading && error && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {!isLoading && data && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Validação */}
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "transition-colors",
              cnpj.length === 0 ? "text-muted-foreground" :
              isValidCNPJ ? "text-green-600" : "text-destructive"
            )}>
              {cnpj.length === 0 ? "Digite um CNPJ válido" :
               isValidCNPJ ? "CNPJ válido" : "CNPJ inválido"}
            </span>
            <span className="text-muted-foreground">
              {cnpj.length}/14
            </span>
          </div>
        </div>

        {/* Botão de busca */}
        <Button
          onClick={handleSearch}
          disabled={!canSearch}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Consultando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Consultar
            </>
          )}
        </Button>

        {/* Resultado */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error.message || 'Erro ao consultar CNPJ'}</span>
              </div>
            </motion.div>
          )}

          {data && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-sm text-green-800">
                      {data.nome_fantasia || data.razao_social}
                    </p>
                    {data.nome_fantasia && data.nome_fantasia !== data.razao_social && (
                      <p className="text-xs text-green-600">
                        {data.razao_social}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {data.situacao_cadastral}
                    </Badge>
                    {data.porte && (
                      <Badge variant="outline" className="text-xs">
                        {data.porte}
                      </Badge>
                    )}
                  </div>

                  {data.logradouro && (
                    <p className="text-xs text-green-600">
                      {data.logradouro}, {data.numero} - {data.bairro}
                      <br />
                      {data.municipio}/{data.uf} - {data.cep}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}