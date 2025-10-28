import json

# Carregar dados do IBGE
with open('parana-ibge.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

coords = data['features'][0]['geometry']['coordinates'][0][0]

# Criar o conteúdo do arquivo TypeScript
content = '''// GeoJSON simplificado do estado do Paraná
export const paranaGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Paraná",
        state: "PR"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-54.6167, -22.5167], // Noroeste
          [-48.0333, -22.5167], // Nordeste
          [-48.0333, -26.7167], // Sudeste
          [-54.6167, -26.7167], // Sudoeste
          [-54.6167, -22.5167]  // Fechando o polígono
        ]]
      }
    }
  ]
} as const

// GeoJSON preciso do estado do Paraná baseado em dados oficiais do IBGE
export const paranaDetailedGeoJSON = {
  type: "Feature" as const,
  properties: {
    name: "Paraná",
    state: "PR"
  },
  geometry: {
    type: "Polygon" as const,
    coordinates: [[
      // Coordenadas reais do contorno do Paraná - dados oficiais do IBGE (''' + str(len(coords)) + ''' pontos)
'''

# Adicionar todas as coordenadas
for i, coord in enumerate(coords):
    if i == len(coords) - 1:  # Última coordenada sem vírgula
        content += f'      [{coord[0]}, {coord[1]}]\n'
    else:
        content += f'      [{coord[0]}, {coord[1]}],\n'

content += '''    ]]
  }
}'''

# Escrever o arquivo
with open('src/data/parana-geojson.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Arquivo atualizado com {len(coords)} coordenadas reais do IBGE')