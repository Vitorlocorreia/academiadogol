import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getActiveFieldsForContract } from '../actions'
import { CreateContractForm } from './form-client'

export default async function NovoContratoPage() {
  const fields = await getActiveFieldsForContract()

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Voltar */}
      <Link
        href="/admin/contratos"
        className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Contratos
      </Link>

      {/* Header */}
      <div>
        <h1 
          className="text-3xl font-black uppercase tracking-wider leading-none"
          style={{
            fontFamily: "'Bebas Neue', Arial Black, sans-serif",
            color: 'var(--text-primary)',
          }}
        >
          Registrar Contrato Fixo
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Cadastre um mensalista. O sistema gerará bloqueios automáticos na agenda e a mensalidade do mês atual.
        </p>
      </div>

      {/* Form Card */}
      <div
        className="rounded-[4px] p-6 sm:p-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <CreateContractForm fields={fields} />
      </div>
    </div>
  )
}
