export async function fetchConcursosPorUF(uf: string): Promise<ConcursosApiResponse> {
  try {
    const res = await fetch(`https://concursos-api.deno.dev/${uf}`);
    if (!res.ok) throw new Error('Erro ao buscar concursos por UF');
    const data = await res.json();
    return {
      concursos_abertos: data.concursos_abertos || [],
      concursos_previstos: data.concursos_previstos || [],
    };
  } catch (error) {
    console.warn('Erro ao buscar concursos da API por UF:', error);
    return {
      concursos_abertos: [],
      concursos_previstos: [],
    };
  }
}
// Funções para consumir a API concursos-api.deno.dev
// https://concursos-api.deno.dev/

export interface Concurso {
  Órgão: string;
  Situação: string;
  [key: string]: any;
}

export interface ConcursosApiResponse {
  concursos_abertos: Concurso[];
  concursos_previstos: Concurso[];
  [key: string]: any;
}


const BASE_URL = 'https://concursos-api.deno.dev';
const UFS = [
  'ac','al','ap','am','ba','ce','df','es','go','ma','mt','ms','mg','pa','pb','pr','pe','pi','rj','rn','rs','ro','rr','sc','sp','se','to'
];


export async function fetchConcursosTodosEstados(): Promise<ConcursosApiResponse> {
  try {
    const res = await fetch('/api/concursos');
    if (!res.ok) throw new Error('Erro ao buscar concursos do proxy local');
    return await res.json();
  } catch (error) {
    // Fallback mock para ambiente local/desenvolvimento
    console.warn('Erro ao buscar concursos da API, usando mock:', error);
    return {
      concursos_abertos: [
        {
          "Órgão": "Prefeitura de Exemplo",
          "Situação": "Inscrições Abertas",
        },
      ],
      concursos_previstos: [
        {
          "Órgão": "Tribunal de Exemplo (previsto)",
          "Situação": "Autorizado",
        },
      ],
    };
  }
}


// As funções abaixo não são mais necessárias pois fetchConcursosPorUF foi removida.
