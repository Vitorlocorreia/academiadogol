import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getContractById, getContractPayments, getActiveFieldsForContract } from '../actions'
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

  const [payments, fields] = await Promise.all([
    getContractPayments(id),
    getActiveFieldsForContract(),
  ])

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Voltar */}
      <Link
        href={contract.field_id ? `/admin/contratos?campo=${contract.field_id}` : '/admin/contratos'}
        className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Contratos {contract.field?.name ? `(${contract.field.name})` : ''}
      </Link>

      {/* Client Panel */}
      <ContractDetailsClient contract={contract} initialPayments={payments} fields={fields} />
    </div>
  )
}
