import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getContractById, getContractPayments } from '../actions'
import { ContractDetailsClient } from './details-client'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function ContratoDetalhesPage({ params }: Props) {
  const { id } = await params

  const contract = await getContractById(id)
  if (!contract) {
    notFound()
  }

  const payments = await getContractPayments(id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Voltar */}
      <Link
        href="/admin/contratos"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Contratos
      </Link>

      {/* Client Panel */}
      <ContractDetailsClient contract={contract} initialPayments={payments} />
    </div>
  )
}
