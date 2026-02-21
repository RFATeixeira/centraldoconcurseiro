'use client'

import { useEffect, useState } from 'react'
import { fetchConcursosTodosEstados, Concurso } from '../../lib/concursosApi'
import SelectCustom from '@/components/SelectCustom'

const UFS = [
  'ac',
  'al',
  'ap',
  'am',
  'ba',
  'ce',
  'df',
  'es',
  'go',
  'ma',
  'mt',
  'ms',
  'mg',
  'pa',
  'pb',
  'pr',
  'pe',
  'pi',
  'rj',
  'rn',
  'rs',
  'ro',
  'rr',
  'sc',
  'sp',
  'se',
  'to',
]

export default function ConcursosPage() {
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [loading, setLoading] = useState(true)
  const [uf, setUf] = useState('')
  const [situacao, setSituacao] = useState('')
  const [busca, setBusca] = useState('')
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set())

  // Buscar concursos por UF e situação
  useEffect(() => {
    const loadConcursos = async () => {
      setLoading(true)
      try {
        const data = await fetchConcursosTodosEstados()
        console.log('Dados recebidos da API:', data)
        const abertos = Array.isArray(data.concursos_abertos)
          ? data.concursos_abertos
          : []
        const previstos = Array.isArray(data.concursos_previstos)
          ? data.concursos_previstos
          : []
        // Eliminar duplicados pelo Órgão e UF
        const todosConcursos = [...abertos, ...previstos]
        const concursosUnicos = todosConcursos.filter((concurso, idx, arr) => {
          return (
            arr.findIndex(
              (c) => c['Órgão'] === concurso['Órgão'] && c.uf === concurso.uf,
            ) === idx
          )
        })
        // Marcar concursos nacionais
        const orgaosUFs: { [key: string]: Set<string> } = {}
        concursosUnicos.forEach((c) => {
          if (!orgaosUFs[c['Órgão']]) orgaosUFs[c['Órgão']] = new Set()
          orgaosUFs[c['Órgão']].add(c.uf)
        })
        const concursosMarcados = concursosUnicos.map((c) => {
          if (orgaosUFs[c['Órgão']] && orgaosUFs[c['Órgão']].size > 1) {
            return { ...c, uf: 'nacional' }
          }
          return c
        })
        setConcursos(concursosMarcados)
        // Eliminar duplicatas nacionais: só exibir uma vez
        const concursosFinal = concursosMarcados.filter(
          (concurso, idx, arr) => {
            if (concurso.uf === 'nacional') {
              return (
                arr.findIndex(
                  (c) =>
                    c['Órgão'] === concurso['Órgão'] && c.uf === 'nacional',
                ) === idx
              )
            }
            return true
          },
        )
        setConcursos(concursosFinal)
      } catch (error) {
        console.error('Erro ao buscar concursos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConcursos()
  }, [])

  // Filtros
  const concursosFiltrados = concursos.filter((c) => {
    const matchUf =
      uf === '' ? true : c.uf && c.uf.toLowerCase() === uf.toLowerCase()
    let matchSituacao = true
    if (situacao === 'previsto') {
      matchSituacao =
        !!c['Órgão'] &&
        typeof c['Órgão'] === 'string' &&
        c['Órgão'].toLowerCase().includes('previsto')
    }
    // Aberto: todos menos os previstos
    if (situacao === '') {
      matchSituacao = !(
        c['Órgão'] &&
        typeof c['Órgão'] === 'string' &&
        c['Órgão'].toLowerCase().includes('previsto')
      )
    }
    const matchBusca = busca
      ? Object.values(c).some((v) =>
          String(v).toLowerCase().includes(busca.toLowerCase()),
        )
      : true
    return matchUf && matchSituacao && matchBusca
  })

  // Coletar situações únicas para filtro
  // Coletar situações únicas para filtro, normalizando e incluindo todas

  return (
    <main className="w-full min-h-full flex flex-col p-4 pb-24 md:pb-4 ">
      <div className="max-w-6xl w-full mx-auto z-150 flex-nowrap">
        <h1 className="text-4xl font-bold text-white mb-4">Concursos</h1>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Filtros */}
          <div className="flex w-full gap-4 mb-8">
            <SelectCustom
              value={uf}
              onChange={setUf}
              options={[
                { value: '', label: 'UF (todos)' },
                { value: 'nacional', label: 'Nacional' },
                ...UFS.map((ufOpt) => ({
                  value: ufOpt,
                  label: ufOpt.toUpperCase(),
                })),
              ]}
            />

            <button
              className={`input-style-1 w-fit ${situacao === '' ? ' text-white' : ' text-white'}`}
              onClick={() => setSituacao('')}
            >
              <span>Aberto</span>
            </button>
            <button
              className={`input-style-1 w-fit${situacao === 'previsto' ? ' text-white' : ' text-white'}`}
              onClick={() => setSituacao('previsto')}
            >
              <span>Previsto</span>
            </button>
            <input
              type="text"
              placeholder="Buscar por texto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-style-1 w-full"
            />
            <button
              className="button-cyan w-fit text-nowrap"
              onClick={() => (window.location.href = '/meus-concursos')}
            >
              Meus Concursos
            </button>
          </div>
        </div>

        {/* Grid de Concursos */}
        {loading ? (
          <p className="text-gray-400">Carregando concursos...</p>
        ) : concursosFiltrados.length === 0 ? (
          <p className="text-gray-400">Nenhum concurso encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursosFiltrados.map((concurso, idx) => (
              <div
                key={concurso.id || idx}
                className="glassmorphism-pill rounded-3xl w-full p-4 flex flex-col gap-2 min-h-55 max-w-full "
                style={{ minHeight: 100, height: '100%' }}
              >
                <div className="w-full mx-2 flex items-center justify-center">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {concurso['Órgão'] ||
                      concurso.nome ||
                      'Órgão não informado'}
                  </h3>
                </div>
                {/* Situação destacada com fallback para 'Órgão' */}
                <div className="text-sm font-bold text-cyan-400 mb-2">
                  Situação:{' '}
                  {concurso['Situação']
                    ? concurso['Situação']
                    : concurso['Órgão'] &&
                        typeof concurso['Órgão'] === 'string' &&
                        concurso['Órgão'].toLowerCase().includes('previsto')
                      ? 'Previsto'
                      : 'Aberto'}
                </div>
                <div className="mt-1 text-xs text-gray-300 flex flex-col gap-1 flex-1">
                  {Object.entries(concurso)
                    .filter(([key]) => key !== 'Situação')
                    .map(([key, value]) => (
                      <div key={key} className="truncate">
                        <span className="font-bold">{key}:</span>{' '}
                        {String(value)}
                      </div>
                    ))}
                </div>
                {/* Botão adicionar ao perfil */}
                <button
                  className={`button-cyan w-fit ${
                    concurso['Órgão'] &&
                    typeof concurso['Órgão'] === 'string' &&
                    concurso['Órgão'].toLowerCase().includes('previsto')
                      ? 'button-gray'
                      : ' button-cyan'
                  }`}
                  disabled={
                    (concurso['Órgão'] &&
                      typeof concurso['Órgão'] === 'string' &&
                      concurso['Órgão'].toLowerCase().includes('previsto')) ||
                    adicionados.has(
                      (concurso['Órgão'] || '') + '-' + (concurso.uf || ''),
                    )
                  }
                  onClick={() => {
                    const key =
                      (concurso['Órgão'] || '') + '-' + (concurso.uf || '')
                    if (
                      !(
                        concurso['Órgão'] &&
                        typeof concurso['Órgão'] === 'string' &&
                        concurso['Órgão'].toLowerCase().includes('previsto')
                      ) &&
                      !adicionados.has(key)
                    ) {
                      // Salvar no localStorage
                      const salvos = localStorage.getItem('meusConcursos')
                      const lista = salvos ? JSON.parse(salvos) : []
                      // Evitar duplicidade
                      if (
                        !lista.some(
                          (c: Concurso) =>
                            c['Órgão'] === concurso['Órgão'] &&
                            c.uf === concurso.uf,
                        )
                      ) {
                        lista.push(concurso)
                        localStorage.setItem(
                          'meusConcursos',
                          JSON.stringify(lista),
                        )
                      }
                      setAdicionados(new Set([...adicionados, key]))
                    }
                  }}
                >
                  {adicionados.has(
                    (concurso['Órgão'] || '') + '-' + (concurso.uf || ''),
                  )
                    ? 'Adicionado'
                    : 'Adicionar ao perfil'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
