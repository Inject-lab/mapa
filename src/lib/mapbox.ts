import mapboxgl from 'mapbox-gl'
import { type CompanyType, type MapViewState } from '@/types'

// Token do Mapbox (deve ser configurado nas variáveis de ambiente)
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.your-mapbox-token'

// Estado inicial da visualização do mapa - Focado no Paraná
export const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -51.1694, // Curitiba, PR
  latitude: -25.4284,
  zoom: 5.5, // Zoom inicial ajustado para melhor visualização
}

// Bounds do estado do Paraná para restringir a visualização - Expandido significativamente
export const PARANA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-55.2, -27.1], // Southwest (oeste e sul do Paraná) - muito mais expandido
  [-47.5, -22.0], // Northeast (leste e norte do Paraná) - muito mais expandido
]

// Configurações das empresas
export const COMPANY_CONFIGS = {
  bello: {
    name: 'Bello',
    color: '#3b82f6', // Azul
    lightColor: '#60a5fa',
    darkColor: '#2563eb',
    icon: 'building-2',
  },
  pluma: {
    name: 'Pluma',
    color: '#10b981', // Verde
    lightColor: '#34d399',
    darkColor: '#059669',
    icon: 'feather',
  },
  plusval: {
    name: 'Plusval',
    color: '#8b5cf6', // Roxo
    lightColor: '#a78bfa',
    darkColor: '#7c3aed',
    icon: 'trending-up',
  },
} as const

// Estilos de mapa disponíveis
export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  // Estilo padrão com cores como Google Maps
  parana: 'mapbox://styles/mapbox/satellite-streets-v12', // Estilo satélite com ruas para cores vibrantes
} as const

export type MapStyle = keyof typeof MAP_STYLES

// Função para criar marcador customizado
export function createCustomMarker(companyType: CompanyType): HTMLElement {
  const config = COMPANY_CONFIGS[companyType]
  
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: ${config.color};
    border: 3px solid white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
  `
  
  // Adicionar ícone
  const icon = document.createElement('div')
  icon.innerHTML = getCompanyIcon(companyType)
  icon.style.cssText = `
    color: white;
    font-size: 16px;
    font-weight: bold;
  `
  
  // Verificação de segurança
  if (el && icon) {
    el.appendChild(icon)
  }
  
  // Efeitos de hover
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.1)'
    el.style.backgroundColor = config.lightColor
  })
  
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
    el.style.backgroundColor = config.color
  })
  
  return el
}

// Função para obter ícone da empresa
function getCompanyIcon(companyType: CompanyType): string {
  switch (companyType) {
    case 'bello':
      return '🏢'
    case 'pluma':
      return '🪶'
    case 'plusval':
      return '📈'
    default:
      return '📍'
  }
}

// Função para calcular bounds de múltiplos pontos
export function calculateBounds(coordinates: Array<[number, number]>): mapboxgl.LngLatBoundsLike {
  if (coordinates.length === 0) {
    return [
      [-46.8, -23.7], // Southwest
      [-46.4, -23.4], // Northeast
    ]
  }
  
  if (coordinates.length === 1) {
    const [lng, lat] = coordinates[0]
    const offset = 0.01
    return [
      [lng - offset, lat - offset],
      [lng + offset, lat + offset],
    ]
  }
  
  const lngs = coordinates.map(coord => coord[0])
  const lats = coordinates.map(coord => coord[1])
  
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  
  // Adicionar padding
  const lngPadding = (maxLng - minLng) * 0.1
  const latPadding = (maxLat - minLat) * 0.1
  
  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding],
  ]
}

// Função para geocodificar endereço
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1&types=address,place&language=pt`
    )
    
    if (!response.ok) {
      throw new Error('Erro na geocodificação')
    }
    
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center
      
      // Log para debug da precisão
      console.log('🎯 Geocoding result:', {
        query: address,
        result: feature.place_name,
        coordinates: [lng, lat],
        relevance: feature.relevance,
        accuracy: feature.properties?.accuracy
      })
      
      return [lng, lat]
    }
    
    return null
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error)
    return null
  }
}

// Função para reverse geocoding
export async function reverseGeocode(lng: number, lat: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    )
    
    if (!response.ok) {
      throw new Error('Erro no reverse geocoding')
    }
    
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name
    }
    
    return null
  } catch (error) {
    console.error('Erro no reverse geocoding:', error)
    return null
  }
}

// Configurar token do Mapbox
if (MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.your-mapbox-token') {
  mapboxgl.accessToken = MAPBOX_TOKEN
} else {
  console.warn('Token do Mapbox não configurado. Defina VITE_MAPBOX_ACCESS_TOKEN no arquivo .env')
}