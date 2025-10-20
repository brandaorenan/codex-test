import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoricoClient from './historico-client'

export default async function HistoricoPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar queries do usuário
  const { data: queries, error } = await supabase
    .from('queries')
    .select(`
      id,
      lista_texto,
      ocr_image_url,
      created_at,
      comparisons (
        id,
        item,
        preco_atacadao,
        preco_tenda,
        melhor_opcao,
        economia
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Erro ao buscar histórico:', error)
  }

  return <HistoricoClient queries={queries || []} />
}

