import Link from 'next/link'
import {
  Plus,
  User,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Ban,
  CheckCircle,
  Building2,
  Users,
  DollarSign,
  ImageOff,
  Layers,
} from 'lucide-react'
import { getContracts, getFieldsWithContractStats } from './actions'

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

interface Props {
  searchParams: Promise<{ campo?: string }>
}

export default async function ContratosPage({ searchParams }: Props) {
  const { campo: selectedFieldId } = await searchParams

  // Carrega campos com estatísticas consolidadas de contratos
  const fieldsWithStats = await getFieldsWithContractStats()

  // Se um campo foi selecionado (ou "todos"), carrega os contratos correspondentes
  const isViewingSpecificField = Boolean(selectedFieldId)
  const isViewingAll = selectedFieldId === 'todos'

  const selectedField = isViewingSpecificField && !isViewingAll
    ? fieldsWithStats.find((f) => f.id === selectedFieldId)
    : null

  const contracts = isViewingSpecificField
    ? await getContracts(selectedFieldId)
    : []

  // Métricas globais consolidadas
  const totalFields = fieldsWithStats.length
  const totalMensalistas = fieldsWithStats.reduce((acc, f) => acc + f.total_contracts, 0)
  const totalActiveMensalistas = fieldsWithStats.reduce((acc, f) => acc + f.active_contracts, 0)
  const totalMonthlyRevenue = fieldsWithStats.reduce((acc, f) => acc + f.total_monthly_amount, 0)

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // ───────────────────────────────────────────────────────────────────────────
  // VISTA 1: TELA INICIAL COM OS NOMES E CARDS DOS CAMPOS
  // (Exibida por padrão ao acessar /admin/contratos)
  // ───────────────────────────────────────────────────────────────────────────
  if (!isViewingSpecificField) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <h1
              className="text-3xl font-black uppercase tracking-wider leading-none"
              style={{
                fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              Contratos Fixos — Mensalistas
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Selecione o campo desejado abaixo para visualizar e gerenciar os contratos de mensalistas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/contratos?campo=todos"
              className="btn-admin-secondary text-xs uppercase tracking-wider font-bold py-2.5 px-3.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Ver Todos em Lista
            </Link>
            <Link
              href="/admin/contratos/novo"
              id="btn-novo-contrato"
              className="btn-admin-primary px-4 py-2.5 text-sm font-semibold rounded-[2px]"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato
            </Link>
          </div>
        </div>

        {/* Resumo Rápido (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-[4px] border flex items-center gap-3.5 shadow-xs"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div
              className="w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0 border"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--brand)' }}
            >
              <Building2 className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                Campos no Complexo
              </p>
              <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                {totalFields} campos
              </p>
            </div>
          </div>

          <div
            className="p-4 rounded-[4px] border flex items-center gap-3.5 shadow-xs"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div
              className="w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0 border"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--brand)' }}
            >
              <Users className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                Total de Mensalistas
              </p>
              <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                {totalMensalistas} contratados{' '}
                <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  ({totalActiveMensalistas} ativos)
                </span>
              </p>
            </div>
          </div>

          <div
            className="p-4 rounded-[4px] border flex items-center gap-3.5 shadow-xs"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div
              className="w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0 border"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--brand)' }}
            >
              <DollarSign className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                Receita Mensal Fixa
              </p>
              <p className="text-xl font-black font-mono" style={{ color: 'var(--brand)' }}>
                {fmtCurrency(totalMonthlyRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Título da Seção de Campos */}
        <div className="flex items-center justify-between pt-2">
          <h2
            className="text-lg font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>Campos Disponíveis</span>
            <span
              className="text-xs px-2 py-0.5 rounded-[2px] font-semibold border"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Clique para abrir os contratos
            </span>
          </h2>
        </div>

        {/* Grid de Cards dos Campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {fieldsWithStats.map((field) => {
            const foto = field.photo_urls?.[0]
            const hasContracts = field.total_contracts > 0

            return (
              <Link
                key={field.id}
                href={`/admin/contratos?campo=${field.id}`}
                className="group border rounded-[4px] overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  {/* Foto do Campo */}
                  <div
                    className="h-40 w-full relative overflow-hidden"
                    style={{ background: 'var(--bg-subtle)' }}
                  >
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto}
                        alt={field.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageOff className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}

                    {/* Badge de quantidade de contratos sobre a foto */}
                    <div className="absolute top-3 right-3">
                      {hasContracts ? (
                        <span className="px-2.5 py-1 rounded-[2px] text-xs font-black uppercase tracking-wider bg-[var(--brand)] text-white shadow-md">
                          {field.total_contracts}{' '}
                          {field.total_contracts === 1 ? 'Mensalista' : 'Mensalistas'}
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border backdrop-blur-xs"
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            color: '#ffffff',
                            borderColor: 'rgba(255,255,255,0.2)',
                          }}
                        >
                          Sem contratos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhes do Campo */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3
                        className="font-black text-xl uppercase tracking-wide group-hover:text-[var(--brand)] transition-colors leading-tight"
                        style={{
                          fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                          color: 'var(--text-primary)',
                        }}
                      >
                        {field.name}
                      </h3>
                      {field.description ? (
                        <p
                          className="text-xs mt-1 line-clamp-2 leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {field.description}
                        </p>
                      ) : (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>
                          Campo society do complexo
                        </p>
                      )}
                    </div>

                    {/* Receita mensal deste campo */}
                    <div
                      className="p-3 rounded-[2px] border flex items-center justify-between"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                    >
                      <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                        Mensalidades:
                      </span>
                      <span
                        className="text-sm font-bold font-mono"
                        style={{
                          color: hasContracts ? 'var(--brand)' : 'var(--text-muted)',
                        }}
                      >
                        {hasContracts ? fmtCurrency(field.total_monthly_amount) : 'R$ 0,00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com Ação */}
                <div
                  className="px-5 py-3 border-t flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-colors group-hover:bg-[var(--brand-subtle)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <span className="group-hover:text-[var(--brand)]">Ver Contratos</span>
                  <ArrowRight className="w-4 h-4 text-[var(--brand)] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VISTA 2: CONTRATOS DO CAMPO ESPECÍFICO (OU TODOS)
  // (Exibida após clicar no campo desejado)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Botão Voltar aos Campos */}
      <div>
        <Link
          href="/admin/contratos"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-1 px-2.5 rounded-[2px] border transition-all hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Escolher Outro Campo
        </Link>
      </div>

      {/* Header do Campo Selecionado */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between p-5 rounded-[4px] border shadow-xs"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-[4px] overflow-hidden shrink-0 border relative flex items-center justify-center"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
          >
            {selectedField?.photo_urls?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedField.photo_urls[0]}
                alt={selectedField.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-7 h-7 text-[var(--brand)]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl sm:text-3xl font-black uppercase tracking-wider leading-none"
                style={{
                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                  color: 'var(--text-primary)',
                }}
              >
                {isViewingAll ? 'Todos os Contratos' : `Contratos — ${selectedField?.name}`}
              </h1>
              <span
                className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]"
              >
                {contracts.length} {contracts.length === 1 ? 'Contrato' : 'Contratos'}
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isViewingAll
                ? 'Visualizando mensalistas de todos os campos combinados.'
                : `Gerencie os mensalistas e o controle de pagamentos do campo ${selectedField?.name}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-auto self-stretch">
          <Link
            href={`/admin/contratos/novo${selectedField?.id ? `?campo=${selectedField.id}` : ''}`}
            id="btn-novo-contrato-campo"
            className="btn-admin-primary px-4 py-2.5 text-xs uppercase tracking-wider font-bold rounded-[2px] w-full sm:w-auto text-center justify-center"
          >
            <Plus className="w-4 h-4" />
            Novo Contrato {selectedField ? `no ${selectedField.name}` : ''}
          </Link>
        </div>
      </div>

      {/* Barra Rápida de Alternância entre Campos (Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Link
          href="/admin/contratos"
          className="px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          ◂ Todos os Campos (Cards)
        </Link>
        <Link
          href="/admin/contratos?campo=todos"
          className={`px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
            isViewingAll
              ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
              : 'hover:opacity-80'
          }`}
          style={!isViewingAll ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
        >
          Lista Geral ({totalMensalistas})
        </Link>
        {fieldsWithStats.map((f) => {
          const isSelected = f.id === selectedFieldId
          return (
            <Link
              key={f.id}
              href={`/admin/contratos?campo=${f.id}`}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                isSelected
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                  : 'hover:opacity-80'
              }`}
              style={!isSelected ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
            >
              {f.name} ({f.total_contracts})
            </Link>
          )
        })}
      </div>

      {/* Lista / Tabela de Contratos */}
      <div
        className="rounded-[4px] overflow-hidden shadow-xs"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div
              className="w-16 h-16 rounded-[4px] flex items-center justify-center mb-4"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <Calendar className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Nenhum contrato fixo encontrado
            </p>
            <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--text-muted)' }}>
              {selectedField
                ? `Ainda não há mensalistas cadastrados para o campo ${selectedField.name}.`
                : 'Não há contratos cadastrados com o filtro atual.'}
            </p>
            <Link
              href={`/admin/contratos/novo${selectedField?.id ? `?campo=${selectedField.id}` : ''}`}
              className="btn-admin-primary mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Primeiro Mensalista
            </Link>
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
                    {isViewingAll && <th className="px-6 py-4">Campo</th>}
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
                    const formattedValue = fmtCurrency(contract.monthly_amount)

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
                              className="w-9 h-9 rounded-[2px] flex items-center justify-center shrink-0 border"
                              style={{
                                background: 'var(--bg-subtle)',
                                borderColor: 'var(--border)',
                                color: 'var(--brand)',
                              }}
                            >
                              {contract.secondary_organizer_name ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {contract.customer?.name}
                                </span>
                                {contract.secondary_organizer_name && (
                                  <span
                                    className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]"
                                    title={`2º Organizador: ${contract.secondary_organizer_name}`}
                                  >
                                    2 Org.
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                {contract.customer?.phone}
                              </div>
                              {contract.secondary_organizer_name && (
                                <div className="text-[11px] font-medium pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  <span className="text-[10px] uppercase font-bold text-[var(--brand)]">2º Org:</span> {contract.secondary_organizer_name}
                                  {contract.secondary_organizer_phone && (
                                    <span className="font-mono text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                                      ({contract.secondary_organizer_phone})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {isViewingAll && (
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border"
                              style={{
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)',
                              }}
                            >
                              {contract.field?.name}
                            </span>
                          </td>
                        )}

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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]"
                            >
                              <CheckCircle className="w-3 h-3 text-[var(--brand)]" />
                              Ativo
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border"
                              style={{
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-muted)',
                                borderColor: 'var(--border)',
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
                const formattedValue = fmtCurrency(contract.monthly_amount)

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
                          className="w-9 h-9 rounded-[2px] flex items-center justify-center shrink-0 border"
                          style={{
                            background: 'var(--bg-subtle)',
                            borderColor: 'var(--border)',
                            color: 'var(--brand)',
                          }}
                        >
                          {contract.secondary_organizer_name ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {contract.customer?.name}
                            </span>
                            {contract.secondary_organizer_name && (
                              <span
                                className="text-[8px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]"
                              >
                                2 Org.
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            {contract.customer?.phone}
                          </div>
                          {contract.secondary_organizer_name && (
                            <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-bold text-[var(--brand)]">2º:</span> {contract.secondary_organizer_name}
                              {contract.secondary_organizer_phone && ` (${contract.secondary_organizer_phone})`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {contract.is_active ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]"
                          >
                            Ativo
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border"
                            style={{
                              background: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                              borderColor: 'var(--border)',
                            }}
                          >
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Campo + Horário + Vigência */}
                    <div
                      className="grid grid-cols-2 gap-3 text-xs p-3 rounded-[2px] border"
                      style={{
                        background: 'var(--bg-subtle)',
                        borderColor: 'var(--border)',
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
                        className="col-span-2 pt-2 mt-1 border-t"
                        style={{ borderColor: 'var(--border)' }}
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
