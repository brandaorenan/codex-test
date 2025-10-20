export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome: string | null
          email: string
          created_at: string
        }
        Insert: {
          id: string
          nome?: string | null
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string | null
          email?: string
          created_at?: string
        }
      }
      queries: {
        Row: {
          id: string
          user_id: string
          lista_texto: string | null
          ocr_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lista_texto?: string | null
          ocr_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lista_texto?: string | null
          ocr_image_url?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          nome: string
          preco: number
          mercado: string
          marca: string | null
          link: string | null
          query_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          preco: number
          mercado: string
          marca?: string | null
          link?: string | null
          query_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          preco?: number
          mercado?: string
          marca?: string | null
          link?: string | null
          query_id?: string
          created_at?: string
        }
      }
      comparisons: {
        Row: {
          id: string
          query_id: string
          item: string
          preco_atacadao: number | null
          preco_tenda: number | null
          melhor_opcao: string | null
          economia: number | null
          created_at: string
        }
        Insert: {
          id?: string
          query_id: string
          item: string
          preco_atacadao?: number | null
          preco_tenda?: number | null
          melhor_opcao?: string | null
          economia?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          query_id?: string
          item?: string
          preco_atacadao?: number | null
          preco_tenda?: number | null
          melhor_opcao?: string | null
          economia?: number | null
          created_at?: string
        }
      }
    }
  }
}

export interface ProductNormalized {
  nome: string
  preco: number
  marca: string | null
  link: string | null
}

export interface ComparisonResult {
  item: string
  quantidade: number
  atacadao: ProductNormalized | null
  tenda: ProductNormalized | null
  melhorOpcao: 'atacadao' | 'tenda' | null
  economia: number
  matchConfianca?: number
}

export interface ComparisonResponse {
  queryId: string
  resultados: ComparisonResult[]
  economiaTotal: number
}

export interface ItemEstruturado {
  termo_busca: string
  quantidade?: number
  marca?: string
  observacao?: string
}

export interface ProductMatch {
  atacadao_index: number
  tenda_index: number
  confianca: number
}

