import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAPBOX_TOKEN } from '@/lib/mapbox';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Unit, SearchFilters } from '../../types';
import { paranaDetailedGeoJSON } from '../../data/parana-geojson';
import { useUnits } from '../../hooks/useUnits';

// Fix para ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapProps {
  className?: string;
  filters?: SearchFilters;
  selectedUnitId?: string;
  onUnitSelect?: (unit: Unit | null) => void;
  onUnitEdit?: (unit: Unit) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  filters,
  selectedUnitId,
  onUnitSelect,
  onUnitEdit
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const paranaLayerRef = useRef<L.GeoJSON | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  // Buscar unidades usando o hook
  const { data: units = [] } = useUnits(filters);
  
  // Encontrar unidade selecionada
  const selectedUnit = selectedUnitId ? units.find(unit => unit.id === selectedUnitId) || null : null;

  // Função para carregar dados GeoJSON
  const loadGeoJSONData = async (url: string) => {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load ${url}:`, error);
      return null;
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Criar mapa centrado no Paraná
    const map = L.map(mapRef.current, {
      center: [-24.9, -51.5],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: true,
      // Usar SVG renderer padrão para evitar erros de Canvas (_ctx undefined)
      zoomAnimation: true,
      fadeAnimation: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelDebounceTime: 80, // suaviza rolagem e evita spam de zoom
      // Limita navegação ao PR com margem para evitar 'corte' nas bordas em zoom alto
      maxBounds: L.latLngBounds([-27.2, -55.6], [-21.8, -47.2]),
      maxBoundsViscosity: 0.6,
    });

    // Base raster colorida e vibrante (Carto Voyager)
    const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CARTO',
      subdomains: 'abcd',
      opacity: 1.0,
      updateWhenIdle: true,
            updateInterval: 150,
            keepBuffer: 2,
    });
    baseLayer.addTo(map);
    baseLayerRef.current = baseLayer;

    // Camada satélite (Mapbox Satellite Streets) - melhor qualidade e estabilidade
    const satelliteProvider = (import.meta as any).env?.VITE_SATELLITE_PROVIDER || 'esri';
    const mapTilerKey = (import.meta as any).env?.VITE_MAPTILER_KEY;
    const bingKey = (import.meta as any).env?.VITE_BING_MAPS_KEY;

    class BingTileLayer extends L.TileLayer {
      private apiKey: string;
      constructor(apiKey: string, options: L.TileLayerOptions) {
        super('', options);
        this.apiKey = apiKey;
      }
      private quadKey(x: number, y: number, z: number): string {
        let quad = '';
        for (let i = z; i > 0; i--) {
          let digit = 0;
          const mask = 1 << (i - 1);
          if ((x & mask) !== 0) digit++;
          if ((y & mask) !== 0) digit += 2;
          quad += digit.toString();
        }
        return quad;
      }
      // coords has x, y, z
      getTileUrl(coords: any): string {
        const qk = this.quadKey(coords.x, coords.y, coords.z);
        // Use subdomínio t0 para simplicidade; pode alternar entre t0..t3
        return `https://ecn.t0.tiles.virtualearth.net/tiles/a${qk}.jpeg?g=129&mkt=pt-BR&key=${this.apiKey}`;
      }
    }

    const satelliteLayer =
      satelliteProvider === 'bing' && bingKey
        ? new BingTileLayer(bingKey, {
            attribution: '© Bing, © Microsoft',
            opacity: 1.0,
            tileSize: 256,
            maxZoom: 19,
            detectRetina: false,
            updateWhenIdle: true,
            updateInterval: 200,
            keepBuffer: 2,
            maxNativeZoom: 18,
            crossOrigin: true,
            noWrap: true,
          })
        : satelliteProvider === 'esri'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution:
                'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
              opacity: 1.0,
              tileSize: 256,
              maxZoom: 19,
              detectRetina: false,
              updateWhenIdle: true,
              updateInterval: 200,
              keepBuffer: 2,
              maxNativeZoom: 18,
              crossOrigin: true,
              noWrap: true,
            }
          )
        : L.tileLayer(
            mapTilerKey
              ? `https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=${mapTilerKey}`
              : `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
            {
              attribution: mapTilerKey
                ? '© MapTiler © OpenStreetMap'
                : '© Mapbox © OpenStreetMap | Imagens: Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
              opacity: 1.0,
              tileSize: 256,
              maxZoom: 19,
              detectRetina: false, // reduz requisições em dispositivos retina
              updateWhenIdle: true,
              updateInterval: 200,
              keepBuffer: 2,
              maxNativeZoom: 18,
              crossOrigin: true,
              noWrap: true,
            }
          );
    satelliteLayerRef.current = satelliteLayer;

    // Adicionar contorno do Paraná com fronteiras reais (não retangular)
    console.log('=== DEBUG PARANÁ ===');
    console.log('Tipo do paranaDetailedGeoJSON:', typeof paranaDetailedGeoJSON);
    console.log('Estrutura do paranaDetailedGeoJSON:', paranaDetailedGeoJSON);
    console.log('Coordenadas (primeiras 5):', paranaDetailedGeoJSON.geometry.coordinates[0].slice(0, 5));
    console.log('Total de coordenadas:', paranaDetailedGeoJSON.geometry.coordinates[0].length);
    
    const paranaLayer = L.geoJSON(paranaDetailedGeoJSON, {
      style: {
        color: '#ff0000',  // Vermelho para destacar
        weight: 3,
        fillOpacity: 0,    // Sem preenchimento
        fill: false,       // Desabilitar preenchimento
        dashArray: '5, 5'  // Linha tracejada mais sutil
      }
    }).addTo(map);
    
    console.log('Bounds do paranaLayer:', paranaLayer.getBounds());

    // Ajustar bounds para o Paraná
    map.fitBounds(paranaLayer.getBounds());
    map.setMaxBounds(paranaLayer.getBounds().pad(0.2));

    // Controles do mapa
    L.control.scale({ position: 'bottomleft' }).addTo(map);

    // Carregar e adicionar camadas sempre visíveis
    const initializeLayers = async () => {
      // 1. Municípios do Paraná (sempre visível)
      const municipiosData = await loadGeoJSONData('/data/parana-municipios.geojson');
      if (municipiosData) {
        const municipiosLayer = L.geoJSON(municipiosData, {
          style: {
            color: '#475569',
            weight: 1.2,
            fillOpacity: 0.15,
            fillColor: '#e2e8f0',
            opacity: 0.8,
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties?.nome) {
              layer.bindTooltip(feature.properties.nome, {
                permanent: false,
                direction: 'center',
                className: 'municipality-tooltip',
              });
            }
          },
        });
        municipiosLayer.addTo(map);
      }

      // 2. Cidades do Paraná (apenas popups, sem nomes visíveis)
      const cidadesData = await loadGeoJSONData('/data/parana-cidades.geojson');
      if (cidadesData) {
        const cityMarkersGroup = L.layerGroup();
        
        cidadesData.features.forEach((feature: any) => {
          const nome = feature.properties?.nome || 'Cidade';
          const populacao = feature.properties?.populacao || 0;
          const tipo = feature.properties?.tipo || 'Sede Municipal';
          const coords = feature.geometry.coordinates;
          const latlng = L.latLng(coords[1], coords[0]);
          
          // Criar marcador invisível apenas para popup
          const cityMarker = L.marker(latlng, { 
            opacity: 0,
            icon: L.divIcon({
              className: 'invisible-marker',
              html: '',
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            })
          });
          // Criação preguiçosa do popup somente ao clicar (reduz DOM inicial)
          cityMarker.on('click', () => {
            const popupDiv = document.createElement('div');
            popupDiv.className = 'city-popup';
            popupDiv.style.cssText = `
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              min-width: 200px;
            `;
            popupDiv.innerHTML = `
              <div style="
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 12px;
                margin: -12px -12px 12px -12px;
                border-radius: 8px 8px 0 0;
              ">
                <h3 style="
                  margin: 0; 
                  font-size: 16px; 
                  font-weight: 700;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                ">${nome}</h3>
              </div>
              
              <div style="padding: 4px;">
                <div style="margin-bottom: 8px; padding: 6px; background: #f8fafc; border-radius: 6px;">
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">TIPO</span><br>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${tipo}</span>
                </div>
                
                <div style="margin-bottom: 8px; padding: 6px; background: #f8fafc; border-radius: 6px;">
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">POPULAÇÃO</span><br>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${populacao.toLocaleString()} habitantes</span>
                </div>
                
                <div style="padding: 6px; background: #f8fafc; border-radius: 6px;">
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">CÓDIGO IBGE</span><br>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${feature.properties?.codigo_ibge || 'N/A'}</span>
                </div>
              </div>
            `;
            cityMarker.bindPopup(popupDiv).openPopup();
          });
          cityMarkersGroup.addLayer(cityMarker);
        });
        // Mostrar cidade apenas em zoom alto para reduzir custo
        const updateCityLayerVisibility = () => {
          const z = map.getZoom();
          if (z >= 9) {
            if (!map.hasLayer(cityMarkersGroup)) map.addLayer(cityMarkersGroup);
          } else {
            if (map.hasLayer(cityMarkersGroup)) map.removeLayer(cityMarkersGroup);
          }
        };
        updateCityLayerVisibility();
        map.on('zoomend', updateCityLayerVisibility);
      }
    };

    // Overlay de zoom para sinalizar carregamento e evitar travamentos visuais
    map.on('zoomstart', () => {
      const container = map.getContainer();
      container.classList.add('zooming');
    });
    map.on('zoomend', () => {
      const container = map.getContainer();
      // pequeno delay para permitir carregamento dos tiles
      setTimeout(() => container.classList.remove('zooming'), 220);
    });

    initializeLayers();

    mapInstanceRef.current = map;
    paranaLayerRef.current = paranaLayer;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Alternar base entre padrão e satélite
  useEffect(() => {
    if (!mapInstanceRef.current || !baseLayerRef.current || !satelliteLayerRef.current) return;

    const map = mapInstanceRef.current;
    const base = baseLayerRef.current;
    const sat = satelliteLayerRef.current;

    if (isSatellite) {
      if (map.hasLayer(base)) map.removeLayer(base);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (!map.hasLayer(base)) base.addTo(map);
    }
  }, [isSatellite]);

  // Atualizar marcadores das unidades
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Remover marcadores existentes
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Adicionar novos marcadores
    units.forEach(unit => {
      if (unit.coordinates?.lat && unit.coordinates?.lng && unit.companyType) {
        // Criar ícone customizado baseado no tipo da empresa - Melhorado
        const iconColor = getCompanyColor(unit.companyType);
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, ${iconColor}, ${iconColor}dd);
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              font-weight: bold;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              transition: all 0.2s ease;
            ">
              ${unit.companyType.charAt(0).toUpperCase()}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([unit.coordinates.lat, unit.coordinates.lng], {
          icon: customIcon
        });

        // Popup com informações da unidade - Melhorado
        const companyColor = getCompanyColor(unit.companyType);
        const popupDiv = document.createElement('div');
        popupDiv.style.cssText = `
          min-width: 220px; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          border-radius: 8px;
          overflow: hidden;
        `;
        
        popupDiv.innerHTML = `
          <div style="
            background: linear-gradient(135deg, ${companyColor}, ${companyColor}dd);
            color: white;
            padding: 12px;
            margin: -12px -12px 12px -12px;
          ">
            <h3 style="
              margin: 0; 
              font-size: 16px; 
              font-weight: 700;
              text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            ">
              ${unit.tradeName || 'Unidade sem nome'}
            </h3>
          </div>
          
          <div style="padding: 0 4px;">
            <div style="
              display: flex; 
              align-items: center; 
              margin-bottom: 8px;
              padding: 6px 8px;
              background: #f8fafc;
              border-radius: 6px;
            ">
              <span style="margin-right: 8px; font-size: 14px;">🏢</span>
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 500;">RAZÃO SOCIAL</span><br>
                <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${unit.corporateName || 'Não informado'}</span>
              </div>
            </div>
            
            <div style="
              display: flex; 
              align-items: center; 
              margin-bottom: 8px;
              padding: 6px 8px;
              background: #f8fafc;
              border-radius: 6px;
            ">
              <span style="margin-right: 8px; font-size: 14px;">🏷️</span>
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 500;">TIPO DE EMPRESA</span><br>
                <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${unit.companyType?.charAt(0).toUpperCase() + unit.companyType?.slice(1) || 'Não informado'}</span>
              </div>
            </div>
            
            <div style="
              display: flex; 
              align-items: center; 
              margin-bottom: 8px;
              padding: 6px 8px;
              background: #f8fafc;
              border-radius: 6px;
            ">
              <span style="margin-right: 8px; font-size: 14px;">📍</span>
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 500;">CIDADE</span><br>
                <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${unit.address?.city || 'Não informado'}</span>
              </div>
            </div>
            
            ${unit.activity ? `
              <div style="
                display: flex; 
                align-items: center; 
                margin-bottom: 8px;
                padding: 6px 8px;
                background: #f8fafc;
                border-radius: 6px;
              ">
                <span style="margin-right: 8px; font-size: 14px;">💼</span>
                <div>
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">ATIVIDADE</span><br>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${unit.activity}</span>
                </div>
              </div>
            ` : ''}
            
            ${unit.cnpj ? `
              <div style="
                display: flex; 
                align-items: center;
                margin-bottom: 12px;
                padding: 6px 8px;
                background: #f8fafc;
                border-radius: 6px;
              ">
                <span style="margin-right: 8px; font-size: 14px;">📄</span>
                <div>
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">CNPJ</span><br>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${unit.cnpj}</span>
                </div>
              </div>
            ` : ''}
            
            <div style="
              display: flex;
              gap: 8px;
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
            ">
              <button 
                onclick="window.editUnit('${unit.id}')"
                style="
                  flex: 1;
                  background: ${companyColor};
                  color: white;
                  border: none;
                  padding: 8px 12px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupDiv);

        // Eventos do marcador
        marker.on('click', () => {
          // Abrir popup ao clicar no marcador
          marker.openPopup();
        });

        marker.on('popupopen', () => {
          if (onUnitSelect) {
            onUnitSelect(unit);
          }
        });

        marker.on('popupclose', () => {
          if (onUnitSelect) {
            onUnitSelect(null);
          }
        });

        marker.addTo(mapInstanceRef.current!);
        markersRef.current.push(marker);
      }
    });
  }, [units, mapReady, onUnitEdit, onUnitSelect]);

  // Destacar unidade selecionada
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedUnit) return;

    const selectedMarker = markersRef.current.find((_, index) => {
      const unit = units[index];
      return unit && unit.id === selectedUnit.id;
    });

    if (selectedMarker) {
      selectedMarker.openPopup();
      mapInstanceRef.current.setView(selectedMarker.getLatLng(), 10);
    }
  }, [selectedUnit, units]);

  // Adicionar estilos CSS globais
  useEffect(() => {
    // Verificar se estamos no ambiente do navegador
    if (typeof document === 'undefined' || !document.head) {
      return;
    }

    // Função global para editar unidade
    (window as any).editUnit = (unitId: string) => {
      const unit = units.find(u => u.id === unitId);
      if (unit && onUnitEdit) {
        onUnitEdit(unit);
      }
    };

    const style = document.createElement('style');
    style.textContent = `
      .invisible-marker {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      .municipality-tooltip {
        background: rgba(30, 41, 59, 0.98) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        padding: 8px 12px !important;
        font-weight: 600 !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25) !important;
        backdrop-filter: blur(8px) !important;
      }
      .municipality-tooltip::before {
        border-top-color: rgba(30, 41, 59, 0.98) !important;
      }
      .city-popup {
        font-family: 'Inter', Arial, sans-serif;
        font-size: 12px;
        border-radius: 12px;
        overflow: hidden;
      }
      .city-popup h3 {
        margin: 0 0 8px 0;
        font-size: 15px;
        color: #1e293b;
        font-weight: 700;
      }
      .city-popup p {
        margin: 4px 0;
      }
      .custom-marker {
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.25));
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .custom-marker:hover {
        transform: scale(1.15);
        filter: drop-shadow(0 6px 16px rgba(0,0,0,0.35));
      }
    `;
    
    try {
      document.head.appendChild(style);
    } catch (error) {
      console.warn('Erro ao adicionar estilos CSS:', error);
    }

    return () => {
      try {
        if (document.head && document.head.contains(style)) {
          document.head.removeChild(style);
        }
        // Limpar função global
        delete (window as any).editUnit;
      } catch (error) {
        console.warn('Erro ao remover estilos CSS:', error);
      }
    };
  }, [units, onUnitEdit]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Botão de alternância de camada */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSatellite((v) => !v)}
          className="gap-2 bg-white/75 dark:bg-black/40 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60 border border-gray-200/70 shadow-md rounded-full"
          title={isSatellite ? 'Exibir mapa padrão' : 'Exibir mapa satélite'}
        >
          <Layers className="h-4 w-4" />
          {isSatellite ? 'Satélite' : 'Padrão'}
        </Button>
      </div>

      {/* Contador de unidades - Redesenhado */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <span className="text-sm font-semibold text-gray-800">
            {units.length} unidade{units.length !== 1 ? 's' : ''} no Paraná
          </span>
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para cores das empresas - Cores ainda mais vibrantes
function getCompanyColor(company: string | undefined): string {
  if (!company) return '#6b7280';
  
  const colors: Record<string, string> = {
    'bello': '#3b82f6',      // Azul
    'pluma': '#10b981',      // Verde
    'plusval': '#8b5cf6',    // Roxo
    'default': '#64748b'     // Cinza mais escuro
  };
  
  return colors[company.toLowerCase()] || colors.default;
}