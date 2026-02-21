import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    // Busca concursos de todos os estados em paralelo
    const results = await Promise.all(
      UFS.map(async (uf) => {
        const res = await fetch(`https://concursos-api.deno.dev/${uf}`)
        if (!res.ok) return null
        const data = await res.json()
        // Adiciona o campo uf em cada concurso
        const concursos_abertos = (data.concursos_abertos || []).map(
          (c: any) => ({ ...c, uf }),
        )
        const concursos_previstos = (data.concursos_previstos || []).map(
          (c: any) => ({ ...c, uf }),
        )
        return {
          concursos_abertos,
          concursos_previstos,
        }
      }),
    )
    // Junta todos os concursos em arrays únicos
    // eslint-disable-next-line camelcase
    const concursos_abertos = results.flatMap((r) => r?.concursos_abertos || [])
    // eslint-disable-next-line camelcase
    const concursos_previstos = results.flatMap(
      (r) => r?.concursos_previstos || [],
    )
    // eslint-disable-next-line camelcase
    return NextResponse.json({ concursos_abertos, concursos_previstos })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar concursos', details: String(error) },
      { status: 500 },
    )
  }
}
