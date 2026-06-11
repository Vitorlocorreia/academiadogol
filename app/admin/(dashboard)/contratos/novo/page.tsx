import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getActiveFieldsForContract } from '../actions'
import { CreateContractForm } from './form-client'

export default async function NovoContratoPage() {
  const fields = await getActiveFieldsForContract()

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Voltar */}
      <Link
        href="/admin/contratos"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Contratos
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Registrar Contrato Fixo</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Cadastre um mensalista. O sistema gerará bloqueios automáticos na agenda e a mensalidade do mês atual.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <CreateContractForm fields={fields} />
      </div>
    </div>
  )
}
