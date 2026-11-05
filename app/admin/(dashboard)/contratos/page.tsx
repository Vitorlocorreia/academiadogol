import Link from 'next/link'
import { Plus, User, Calendar, Clock, ArrowRight, Ban, CheckCircle } from 'lucide-react'
import { getContracts } from './actions'

// Função auxiliar para traduzir o dia da semana
const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export default async function ContratosPage() {
  const contracts = await getContracts()

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-black uppercase tracking-wider leading-none"
            style={{
              fontFamily: "'Bebas Neue', Arial Black, sans-serif",
              color: 'var(--text-primary)',
            }}
          >
            Contratos Fixos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gerencie os clientes mensalistas, seus horários fixos e controle o pagamento das mensalidades.
          </p>
        </div>
        <Link
          href="/admin/contratos/novo"
          id="btn-novo-contrato"
          className="btn-admin-primary px-4 py-2.5 text-sm font-semibold rounded-[2px] w-full sm:w-auto text-center justify-center"
        >
          <Plus className="w-4 h-4" />
          Novo Contrato
        </Link>
      </div>

      {/* Lista de Contratos */}
      <div
        className="rounded-[4px] overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-[4px] flex items-center justify-center mb-4"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <Calendar className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              Nenhum contrato fixo registrado
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Clique em &quot;Novo Contrato&quot; para registrar o primeiro mensalista.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Campo</th>
                    <th className="px-6 py-4">Horário Fixo</th>
                    <th className="px-6 py-4">Valor Mensal</th>
                    <th className="px-6 py-4">Vigência</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {contracts.map((contract) => {
                    const dayName = DAYS_OF_WEEK[contract.day_of_week]
                    const formattedValue = new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(contract.monthly_amount)

                    const startsAtFormatted = new Date(contract.starts_at + 'T12:00:00')
                      .toLocaleDateString('pt-BR')
                    
                    const endsAtFormatted = contract.ends_at
                      ? new Date(contract.ends_at + 'T12:00:00').toLocaleDateString('pt-BR')
                      : 'Indeterminado'

                    return (
                      <tr
                        key={contract.id}
                        className="transition-colors hover:bg-[var(--bg-subtle)]"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-[2px] flex items-center justify-center shrink-0"
                              style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                color: 'var(--brand)',
                              }}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {contract.customer?.name}
                              </div>
                              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                {contract.customer?.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase"
                            style={{
                              background: 'var(--bg-subtle)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {contract.field?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {dayName}
                            </div>
                            <div className="text-xs flex items-center gap-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                              <Clock className="w-3 h-3" />
                              {contract.start_time.substring(0, 5)} às {contract.end_time.substring(0, 5)} ({contract.duration_minutes} min)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold font-mono" style={{ color: 'var(--brand)' }}>
                            {formattedValue}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                            De: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startsAtFormatted}</span>
                          </div>
                          <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            Até: <span className="font-semibold">{endsAtFormatted}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {contract.is_active ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase"
                              style={{
                                background: 'var(--brand-subtle)',
                                color: 'var(--brand)',
                                border: '1px solid var(--brand-ring)',
                              }}
                            >
                              <CheckCircle className="w-3 h-3 text-[var(--brand)]" />
                              Ativo
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase"
                              style={{
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <Ban className="w-3 h-3" />
                              Finalizado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/contratos/${contract.id}`}
                            id={`btn-gerenciar-${contract.id}`}
                            className="btn-admin-secondary px-3 py-1.5 text-xs font-bold rounded-[2px]"
                          >
                            Mensalidades
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div
              className="md:hidden divide-y"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
              }}
            >
              {contracts.map((contract) => {
                const dayName = DAYS_OF_WEEK[contract.day_of_week]
                const formattedValue = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(contract.monthly_amount)

                const startsAtFormatted = new Date(contract.starts_at + 'T12:00:00')
                  .toLocaleDateString('pt-BR')
                
                const endsAtFormatted = contract.ends_at
                  ? new Date(contract.ends_at + 'T12:00:00').toLocaleDateString('pt-BR')
                  : 'Indeterminado'

                return (
                  <div key={contract.id} className="p-4 space-y-4">
                    {/* Top: Cliente + Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-[2px] flex items-center justify-center shrink-0"
                          style={{
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            color: 'var(--brand)',
                          }}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {contract.customer?.name}
                          </div>
                          <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            {contract.customer?.phone}
                          </div>
                        </div>
                      </div>
                      <div>
                        {contract.is_active ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase"
                            style={{
                              background: 'var(--brand-subtle)',
                              color: 'var(--brand)',
                              border: '1px solid var(--brand-ring)',
                            }}
                          >
                            Ativo
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase"
                            style={{
                              background: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Campo + Horário + Vigência */}
                    <div
                      className="grid grid-cols-2 gap-3 text-xs p-3 rounded-[2px]"
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>
                          Campo
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {contract.field?.name}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>
                          Horário Fixo
                        </span>
                        <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>
                          {dayName}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {contract.start_time.substring(0, 5)} - {contract.end_time.substring(0, 5)}
                        </span>
                      </div>
                      <div
                        className="col-span-2 pt-2 mt-1"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>
                          Vigência
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {startsAtFormatted} até {endsAtFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Valor + Ações */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] block uppercase font-bold tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Valor Mensal
                        </span>
                        <span className="text-base font-bold font-mono" style={{ color: 'var(--brand)' }}>
                          {formattedValue}
                        </span>
                      </div>
                      <Link
                        href={`/admin/contratos/${contract.id}`}
                        id={`btn-gerenciar-${contract.id}`}
                        className="btn-admin-secondary px-3 py-2 text-xs font-bold rounded-[2px] flex items-center gap-1.5"
                      >
                        Mensalidades
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
