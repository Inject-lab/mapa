export type CompanyType = 'bello' | 'pluma' | 'plusval'

export interface Unit {
  id: string
  cnpj: string
  tradeName: string
  corporateName: string
  companyType: CompanyType
  activity?: string
  address: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  } | null
  coordinates: {
    lat?: number
    lng?: number
  } | null
  contact: {
    phone?: string
    email?: string
    website?: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface CNPJData {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  situacao: string
  situacao_cadastral: string
  tipo: string
  porte: string
  natureza_juridica: string
  atividade_principal: Array<{
    code: string
    text: string
  }>
  atividades_secundarias: Array<{
    code: string
    text: string
  }>
  // Propriedades de endereço também disponíveis no nível raiz para compatibilidade
  logradouro?: string
  numero?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  endereco: {
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    municipio: string
    uf: string
    cep: string
  }
  telefone: string
  email: string
  data_situacao: string
  data_abertura: string
  capital_social: string
}

export interface MapMarker {
  id: string
  coordinates: {
    lat: number
    lng: number
  }
  unit: Unit
}

export interface CompanyConfig {
  name: string
  color: string
  lightColor: string
  darkColor: string
  icon: string
}

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

export interface SearchFilters {
  companyType?: CompanyType[]
  isActive?: boolean
  searchTerm?: string
}