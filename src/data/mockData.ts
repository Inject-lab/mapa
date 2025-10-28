import { type Unit } from '@/types'

// Dados de exemplo para teste da aplicação - Focado no estado do Paraná
export const MOCK_UNITS: Unit[] = [
  {
    id: '1',
    cnpj: '11.222.333/0001-81',
    corporateName: 'Bello Transportes Ltda',
    tradeName: 'Bello Curitiba',
    companyType: 'bello',
    activity: 'Transporte rodoviário de carga',
    coordinates: {
      lat: -25.4284,
      lng: -49.2733
    },
    address: {
      street: 'Rua XV de Novembro',
      number: '1000',
      city: 'Curitiba',
      state: 'PR',
      zipCode: '80020-310'
    },
    contact: {
      phone: '(41) 3000-1000',
      email: 'curitiba@bello.com.br'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    cnpj: '22.333.444/0001-92',
    corporateName: 'Pluma Conforto e Turismo S.A.',
    tradeName: 'Pluma Londrina',
    companyType: 'pluma',
    activity: 'Transporte rodoviário coletivo de passageiros',
    coordinates: {
      lat: -23.3045,
      lng: -51.1696
    },
    address: {
      street: 'Av. Higienópolis',
      number: '500',
      city: 'Londrina',
      state: 'PR',
      zipCode: '86020-071'
    },
    contact: {
      phone: '(43) 4000-2000',
      email: 'londrina@pluma.com.br'
    },
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '3',
    cnpj: '33.444.555/0001-03',
    corporateName: 'Plusval Logística e Transporte Ltda',
    tradeName: 'Plusval Maringá',
    companyType: 'plusval',
    activity: 'Atividades de logística e transporte',
    coordinates: {
      lat: -23.4205,
      lng: -51.9331
    },
    address: {
      street: 'Av. Brasil',
      number: '2000',
      city: 'Maringá',
      state: 'PR',
      zipCode: '87013-230'
    },
    contact: {
      phone: '(44) 5000-3000',
      email: 'maringa@plusval.com.br'
    },
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '4',
    cnpj: '44.555.666/0001-14',
    corporateName: 'Bello Ponta Grossa Transportes',
    tradeName: 'Bello PG',
    companyType: 'bello',
    activity: 'Transporte rodoviário de carga',
    coordinates: {
      lat: -25.0916,
      lng: -50.1668
    },
    address: {
      street: 'Rua Coronel Dulcídio',
      number: '1500',
      city: 'Ponta Grossa',
      state: 'PR',
      zipCode: '84010-050'
    },
    contact: {
      phone: '(42) 2000-4000',
      email: 'pontagrossa@bello.com.br'
    },
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '5',
    cnpj: '55.666.777/0001-25',
    corporateName: 'Pluma Cascavel',
    tradeName: 'Pluma Oeste',
    companyType: 'pluma',
    activity: 'Transporte rodoviário coletivo de passageiros',
    coordinates: {
      lat: -24.9555,
      lng: -53.4552
    },
    address: {
      street: 'Av. Brasil',
      number: '3000',
      city: 'Cascavel',
      state: 'PR',
      zipCode: '85801-002'
    },
    contact: {
      phone: '(45) 3000-5000',
      email: 'cascavel@pluma.com.br'
    },
    createdAt: '2024-01-19T11:20:00Z',
    updatedAt: '2024-01-19T11:20:00Z'
  },
  {
    id: '6',
    cnpj: '66.777.888/0001-36',
    corporateName: 'Plusval Foz Transportes',
    tradeName: 'Plusval Foz',
    companyType: 'plusval',
    activity: 'Atividades de logística e transporte',
    coordinates: {
      lat: -25.5478,
      lng: -54.5882
    },
    address: {
      street: 'Av. das Cataratas',
      number: '800',
      city: 'Foz do Iguaçu',
      state: 'PR',
      zipCode: '85853-000'
    },
    contact: {
      phone: '(45) 4000-6000',
      email: 'foz@plusval.com.br'
    },
    createdAt: '2024-01-20T13:10:00Z',
    updatedAt: '2024-01-20T13:10:00Z'
  }
]

// Dados de exemplo para consulta CNPJ - Focado no Paraná
export const MOCK_CNPJ_DATA = {
  '11222333000181': {
    cnpj: '11.222.333/0001-81',
    razao_social: 'Bello Transportes Ltda',
    nome_fantasia: 'Bello Curitiba',
    logradouro: 'Rua XV de Novembro',
    numero: '1000',
    bairro: 'Centro',
    municipio: 'Curitiba',
    uf: 'PR',
    cep: '80020-310'
  }
}