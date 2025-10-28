import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Building2, Hash, Loader2, Navigation } from 'lucide-react'
import { type Unit, type CNPJData } from '@/types'
import { useCNPJMutation } from '@/hooks/useCNPJ'
import { formatCNPJ } from '@/lib/utils'
import { geocodeAddress } from '@/lib/mapbox'
import { toast } from 'sonner'

const unitSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  companyType: z.enum(['bello', 'pluma', 'plusval'], {
    required_error: 'Tipo de empresa é obrigatório',
  }),
  activity: z.string().optional(),
  coordinates: z.object({
    lat: z.number()
      .min(-90, 'Latitude deve estar entre -90 e 90')
      .max(90, 'Latitude deve estar entre -90 e 90'),
    lng: z.number()
      .min(-180, 'Longitude deve estar entre -180 e 180')
      .max(180, 'Longitude deve estar entre -180 e 180'),
  }),
})

type UnitFormData = z.infer<typeof unitSchema>

interface UnitFormProps {
  unit?: Unit
  onSubmit: (data: Unit) => void
  onCancel: () => void
}

export function UnitForm({ unit, onSubmit, onCancel }: UnitFormProps) {
  const [cnpjData, setCnpjData] = useState<CNPJData | null>(null)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false)
  const cnpjMutation = useCNPJMutation()

  const defaultValues = useMemo(() => {
    if (unit) {
      return {
        cnpj: unit.cnpj,
        companyType: unit.companyType,
        activity: unit.activity || '',
        coordinates: {
          lat: unit.coordinates?.lat || 0,
          lng: unit.coordinates?.lng || 0,
        },
      }
    }
    return {
      cnpj: '',
      companyType: 'bello' as const,
      activity: '',
      coordinates: {
        lat: 0,
        lng: 0,
      },
    }
  }, [unit])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues,
  })

  const cnpjValue = watch('cnpj')

  // Consultar CNPJ automaticamente quando o campo for preenchido
  useEffect(() => {
    const cleanCNPJ = cnpjValue?.replace(/\D/g, '') || ''
    
    if (cleanCNPJ.length === 14 && !unit && !cnpjMutation.isPending) {
      cnpjMutation.mutate(cleanCNPJ, {
        onSuccess: async (data) => {
          setCnpjData(data)
          console.log('Dados CNPJ recebidos:', data)
          console.log('Atividade principal:', data?.atividade_principal)
          
          // Preencher automaticamente o campo de atividade com a atividade principal
          if (data?.atividade_principal?.[0]?.text) {
            console.log('Preenchendo atividade:', data.atividade_principal[0].text)
            setValue('activity', data.atividade_principal[0].text)
          } else {
            console.log('Nenhuma atividade principal encontrada')
          }

          // Verificar se as coordenadas já foram preenchidas manualmente
          const currentLat = watch('coordinates.lat')
          const currentLng = watch('coordinates.lng')
          const hasManualCoordinates = currentLat !== 0 || currentLng !== 0

          // Só geocodificar se não houver coordenadas manuais
          if (data?.endereco && !hasManualCoordinates) {
            const fullAddress = `${data.endereco.logradouro}, ${data.endereco.numero}, ${data.endereco.bairro}, ${data.endereco.municipio}, ${data.endereco.uf}, Brasil`
            console.log('🔍 Iniciando geocodificação para:', fullAddress)
            
            setIsGeocodingAddress(true)
            try {
              const coordinates = await geocodeAddress(fullAddress)
              if (coordinates) {
                const [lng, lat] = coordinates
                console.log('✅ Coordenadas definidas:', { lat, lng })
                setValue('coordinates.lat', lat)
                setValue('coordinates.lng', lng)
                toast.success(`Coordenadas obtidas automaticamente! 🎯`)
              } else {
                console.log('❌ Geocodificação falhou para:', fullAddress)
                toast.warning('Não foi possível obter coordenadas automaticamente. Insira manualmente.')
              }
            } catch (error) {
              console.error('Erro ao geocodificar endereço:', error)
              toast.error('Erro ao obter coordenadas automaticamente')
            } finally {
              setIsGeocodingAddress(false)
            }
          } else if (hasManualCoordinates) {
            console.log('🎯 Coordenadas manuais detectadas, mantendo valores inseridos pelo usuário')
            toast.success('Coordenadas manuais mantidas! ✋')
          }
        },
        onError: (error) => {
          setCnpjData(null)
          toast.error(error.message || 'Erro ao consultar CNPJ')
        }
      })
    }
  }, [cnpjValue, unit, setValue]) // Adicionando setValue às dependências

  const handleFormSubmit = async (data: UnitFormData) => {
    try {
      if (!cnpjData && !unit) {
        toast.error('Dados do CNPJ não foram carregados')
        return
      }

      const unitData: Unit = {
        id: unit?.id || crypto.randomUUID(),
        cnpj: data.cnpj.replace(/\D/g, ''), // Remove formatação do CNPJ
        tradeName: unit?.tradeName || cnpjData?.nome_fantasia || cnpjData?.razao_social || '',
    corporateName: unit?.corporateName || cnpjData?.razao_social || '',
        companyType: data.companyType,
        activity: data.activity || unit?.activity || cnpjData?.atividade_principal?.[0]?.text || '',
        address: unit?.address || {
          street: cnpjData?.endereco?.logradouro || '',
          number: cnpjData?.endereco?.numero || '',
          neighborhood: cnpjData?.endereco?.bairro || '',
          city: cnpjData?.endereco?.municipio || '',
          state: cnpjData?.endereco?.uf || '',
          zipCode: cnpjData?.endereco?.cep?.replace(/\D/g, '') || '',
        },
        contact: unit?.contact || {
          phone: cnpjData?.telefone || '',
          email: cnpjData?.email || '',
          website: '',
        },
        coordinates: {
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
        },
        createdAt: unit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      onSubmit(unitData)
    } catch (error) {
      console.error('Erro ao salvar unidade:', error)
      toast.error('Erro ao salvar unidade')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {unit ? 'Editar Unidade' : 'Nova Unidade'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Tipo de Empresa */}
          <div className="space-y-2">
            <Label htmlFor="companyType" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </Label>
            <Select
              value={watch('companyType')}
              onValueChange={(value) => setValue('companyType', value as 'bello' | 'pluma' | 'plusval')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bello">Bello</SelectItem>
                <SelectItem value="pluma">Pluma</SelectItem>
                <SelectItem value="plusval">Plusval</SelectItem>
              </SelectContent>
            </Select>
            {errors.companyType && (
              <p className="text-sm text-red-500">{errors.companyType.message}</p>
            )}
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              CNPJ
            </Label>
            <Input
              id="cnpj"
              {...register('cnpj')}
              placeholder="00.000.000/0000-00"
              onChange={(e) => {
                const formatted = formatCNPJ(e.target.value)
                setValue('cnpj', formatted)
              }}
              disabled={!!unit}
            />
            {errors.cnpj && (
              <p className="text-sm text-red-500">{errors.cnpj.message}</p>
            )}
            {cnpjMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Consultando CNPJ...
              </div>
            )}
            {isGeocodingAddress && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Navigation className="h-4 w-4 animate-pulse" />
                Obtendo coordenadas precisas...
              </div>
            )}
            {cnpjData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  {cnpjData.nome_fantasia || cnpjData.razao_social}
                </p>
                <p className="text-xs text-green-600">
                  {cnpjData.endereco?.logradouro}, {cnpjData.endereco?.numero} - {cnpjData.endereco?.bairro}
                </p>
                <p className="text-xs text-green-600">
                  {cnpjData.endereco?.municipio}/{cnpjData.endereco?.uf}
                </p>
                {cnpjData.atividade_principal?.[0]?.text && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">Atividade:</span> {cnpjData.atividade_principal[0].text}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Atividade */}
          <div className="space-y-2">
            <Label htmlFor="activity" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Atividade Principal
            </Label>
            <Input
              id="activity"
              {...register('activity')}
              placeholder="Atividade da empresa"
              readOnly={!!cnpjData?.atividade_principal?.[0]?.text}
            />
            {errors.activity && (
              <p className="text-sm text-red-500">{errors.activity.message}</p>
            )}
          </div>



          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coordinates.lat" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Latitude
              </Label>
              <Input
                id="coordinates.lat"
                type="number"
                step="any"
                {...register('coordinates.lat', { 
                  valueAsNumber: true
                })}
                placeholder="-23.5505"
                disabled={isGeocodingAddress}
              />
              {errors.coordinates?.lat && (
                <p className="text-sm text-red-500">{errors.coordinates.lat.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinates.lng">Longitude *</Label>
              <Input
                id="coordinates.lng"
                type="number"
                step="any"
                {...register('coordinates.lng', { 
                  valueAsNumber: true
                })}
                placeholder="-46.6333"
                disabled={isGeocodingAddress}
              />
              {errors.coordinates?.lng && (
                <p className="text-sm text-red-500">{errors.coordinates.lng.message}</p>
              )}
            </div>
          </div>
          {isGeocodingAddress && (
            <div className="text-sm text-green-600 text-center">
              <Navigation className="h-4 w-4 animate-pulse inline mr-2" />
              Obtendo coordenadas precisas automaticamente...
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || cnpjMutation.isPending}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                unit ? 'Atualizar' : 'Criar Unidade'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}