'use client'
import { useState } from 'react'

type Concurso = {
  id?: string | number
  nome?: string
  [key: string]: unknown
}

export default function MeusConcursosPage() {
  const [meusConcursos, setMeusConcursos] = useState<Concurso[]>(() => {
    const salvos =
      typeof window !== 'undefined'
        ? localStorage.getItem('meusConcursos')
        : null
    return salvos ? JSON.parse(salvos) : []
  })

  function removerConcurso(concurso: Concurso) {
    const novaLista = meusConcursos.filter(
      (c) => !(c['Órgão'] === concurso['Órgão'] && c.uf === concurso.uf),
    )
    setMeusConcursos(novaLista)
    localStorage.setItem('meusConcursos', JSON.stringify(novaLista))
  }

  // Remover o useEffect, pois não é mais necessário

  return (
    <main className="w-full min-h-full flex flex-col p-4 pb-24 md:pb-4 ">
      <h1 className="text-4xl font-bold text-white mb-4">Meus Concursos</h1>
      {meusConcursos.length === 0 ? (
        <p className="text-gray-400">Nenhum concurso adicionado ao perfil.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meusConcursos.map((concurso: Concurso, idx: number) => (
            <div
              key={concurso.id || idx}
              className="glassmorphism-pill rounded-3xl w-full p-4 flex flex-col gap-2 min-h-55 max-w-full "
              style={{ minHeight: 100, height: '100%' }}
            >
              <h3 className="text-lg font-semibold text-white mb-1 truncate">
                {typeof concurso['Órgão'] === 'string'
                  ? concurso['Órgão']
                  : typeof concurso.nome === 'string'
                    ? concurso.nome
                    : 'Órgão não informado'}
              </h3>
              <div className="text-sm font-bold text-cyan-400 mb-2">
                Situação:{' '}
                {typeof concurso['Situação'] === 'string'
                  ? concurso['Situação']
                  : typeof concurso['Órgão'] === 'string' &&
                      concurso['Órgão'].toLowerCase().includes('previsto')
                    ? 'Previsto'
                    : 'Aberto'}
              </div>
              <div className="mt-1 text-xs text-gray-300 flex flex-col gap-1 flex-1">
                {Object.entries(concurso)
                  .filter(([key]) => key !== 'Situação')
                  .map(([key, value]) => (
                    <div key={key} className="truncate">
                      <span className="font-bold">{key}:</span> {String(value)}
                    </div>
                  ))}
              </div>
              <button
                className="button-red-real w-fit mt-1"
                onClick={() => removerConcurso(concurso)}
              >
                Remover concurso
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
