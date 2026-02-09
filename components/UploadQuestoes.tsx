'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Questao {
  enunciado: string
  opcaoA: string
  opcaoB: string
  opcaoC: string
  opcaoD: string
  opcaoE?: string
  resposta: string
  explicacao: string
  banca: string
  concurso: string
  disciplina: string
  ano: number
  dificuldade: 'facil' | 'media' | 'dificil'
}

export default function UploadQuestoes() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewQuestoes, setPreviewQuestoes] = useState<Questao[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [fileName, setFileName] = useState<string>('')

  const parseCSV = (csv: string): Questao[] => {
    const lines = csv.trim().split('\n')
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

    const questoes: Questao[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      // Parse mais robusto para CSV com valores entre aspas
      const values: string[] = []
      let current = ''
      let insideQuotes = false

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''))
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''))

      const obj: Record<string, string> = {}
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || ''
      })

      try {
        const questao: Questao = {
          enunciado: obj.enunciado || obj['questão'] || obj.pergunta || '',
          opcaoA: obj['opção a'] || obj.opcao_a || obj.a || '',
          opcaoB: obj['opção b'] || obj.opcao_b || obj.b || '',
          opcaoC: obj['opção c'] || obj.opcao_c || obj.c || '',
          opcaoD: obj['opção d'] || obj.opcao_d || obj.d || '',
          opcaoE: obj['opção e'] || obj.opcao_e || obj.e || undefined,
          resposta: (obj.resposta || obj.gabarito || '').toUpperCase(),
          explicacao: obj['explicação'] || obj.explicacao || '',
          banca: obj.banca || '',
          concurso: obj.concurso || '',
          disciplina: obj.disciplina || obj['matéria'] || '',
          ano: parseInt(obj.ano || '2024') || 2024,
          dificuldade: (obj.dificuldade || 'media').toLowerCase() as
            | 'facil'
            | 'media'
            | 'dificil',
        }

        if (
          questao.enunciado &&
          questao.opcaoA &&
          questao.opcaoB &&
          questao.opcaoC &&
          questao.opcaoD &&
          questao.resposta &&
          questao.explicacao &&
          questao.banca &&
          questao.concurso &&
          questao.disciplina
        ) {
          questoes.push(questao)
        }
      } catch (e) {
        console.error(`Erro ao processar linha ${i}:`, e)
      }
    }

    return questoes
  }

  const parseJSON = (json: string): Questao[] => {
    const data = JSON.parse(json)
    const array = Array.isArray(data) ? data : [data]

    return array
      .map(
        (item: Record<string, unknown>): Questao => ({
          enunciado: (item.enunciado ||
            item.questão ||
            item.pergunta ||
            '') as string,
          opcaoA: (item.opcaoA || item.opcao_a || item.a || '') as string,
          opcaoB: (item.opcaoB || item.opcao_b || item.b || '') as string,
          opcaoC: (item.opcaoC || item.opcao_c || item.c || '') as string,
          opcaoD: (item.opcaoD || item.opcao_d || item.d || '') as string,
          opcaoE: (item.opcaoE || item.opcao_e || item.e) as string | undefined,
          resposta: (
            (item.resposta || item.gabarito || '') as string
          ).toUpperCase(),
          explicacao: (item.explicacao || item.explicação || '') as string,
          banca: (item.banca || '') as string,
          concurso: (item.concurso || '') as string,
          disciplina: (item.disciplina || item.matéria || '') as string,
          ano: parseInt(item.ano as string) || 2024,
          dificuldade: (
            (item.dificuldade || 'media') as string
          ).toLowerCase() as 'facil' | 'media' | 'dificil',
        }),
      )
      .filter(
        (q): q is Questao =>
          !!q.enunciado &&
          !!q.opcaoA &&
          !!q.opcaoB &&
          !!q.opcaoC &&
          !!q.opcaoD &&
          !!q.resposta &&
          !!q.explicacao &&
          !!q.banca &&
          !!q.concurso &&
          !!q.disciplina,
      )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    setSuccess(null)
    setPreviewQuestoes([])

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        let questoes: Questao[] = []

        if (file.name.endsWith('.csv')) {
          questoes = parseCSV(content)
        } else if (file.name.endsWith('.json')) {
          questoes = parseJSON(content)
        } else {
          setError('Formato não suportado. Use CSV ou JSON.')
          return
        }

        if (questoes.length === 0) {
          setError(
            'Nenhuma questão válida encontrada. Verifique o formato do arquivo.',
          )
          return
        }

        setPreviewQuestoes(questoes)
        setShowPreview(true)
      } catch (err) {
        console.error('Erro ao processar arquivo:', err)
        setError(`Erro ao processar arquivo: ${(err as Error).message}`)
      }
    }

    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (previewQuestoes.length === 0) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const questoesRef = collection(db, 'questoes')
      let count = 0

      for (const questao of previewQuestoes) {
        const opcoes: Record<string, string> = {
          a: questao.opcaoA,
          b: questao.opcaoB,
          c: questao.opcaoC,
          d: questao.opcaoD,
        }

        if (questao.opcaoE) {
          opcoes.e = questao.opcaoE
        }

        await addDoc(questoesRef, {
          enunciado: questao.enunciado,
          opcoes,
          resposta: questao.resposta,
          explicacao: questao.explicacao,
          banca: questao.banca,
          concurso: questao.concurso,
          disciplina: questao.disciplina,
          ano: questao.ano,
          dificuldade: questao.dificuldade,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        count++

        // Firestore tem limite de 500 operações por batch
        if (count % 100 === 0) {
          console.log(`✓ ${count} questões adicionadas...`)
        }
      }

      setSuccess(
        `✓ ${previewQuestoes.length} questões adicionadas com sucesso!`,
      )
      setPreviewQuestoes([])
      setShowPreview(false)
      setFileName('')

      // Reset input
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement
      if (input) input.value = ''

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error('Erro ao enviar questões:', err)
      setError(`Erro ao enviar questões: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-600/50 rounded-2xl p-8 text-center hover:border-cyan-500/50 transition-colors">
        <label className="flex flex-col items-center gap-3 cursor-pointer">
          <ArrowUpTrayIcon className="h-8 w-8 text-cyan-400" />
          <div>
            <p className="font-semibold text-white">
              {fileName || 'Clique ou arraste um arquivo'}
            </p>
            <p className="text-sm text-slate-400">
              CSV ou JSON com múltiplas questões
            </p>
          </div>
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
        </label>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="rounded-lg backdrop-blur-sm bg-red-500/20 border border-red-400/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg backdrop-blur-sm bg-green-500/20 border border-green-400/30 p-4">
          <p className="text-sm text-green-200">{success}</p>
        </div>
      )}

      {/* Preview */}
      {showPreview && previewQuestoes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Preview: {previewQuestoes.length} questões encontradas
            </h3>
            <button
              onClick={() => {
                setShowPreview(false)
                setPreviewQuestoes([])
                setFileName('')
                const input = document.querySelector(
                  'input[type="file"]',
                ) as HTMLInputElement
                if (input) input.value = ''
              }}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Lista de Preview */}
          <div className="bg-slate-700/20 rounded-lg border border-slate-600/30 max-h-64 overflow-y-auto chat-scrollbar">
            {previewQuestoes.map((q, idx) => (
              <div
                key={idx}
                className="p-3 border-b border-slate-600/20 last:border-b-0"
              >
                <p className="text-sm font-semibold text-cyan-300 mb-1">
                  #{idx + 1} - {q.banca} ({q.ano})
                </p>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {q.enunciado}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-slate-600/30 px-2 py-1 rounded">
                    {q.disciplina}
                  </span>
                  <span className="text-xs bg-slate-600/30 px-2 py-1 rounded">
                    {q.concurso}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      q.dificuldade === 'facil'
                        ? 'bg-green-500/20 text-green-200'
                        : q.dificuldade === 'media'
                          ? 'bg-yellow-500/20 text-yellow-200'
                          : 'bg-red-500/20 text-red-200'
                    }`}
                  >
                    {q.dificuldade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Upload */}
          <button
            onClick={handleUpload}
            disabled={isLoading || previewQuestoes.length === 0}
            className="button-cyan w-full"
          >
            {isLoading
              ? `Adicionando ${previewQuestoes.length} questões...`
              : `Confirmar e Adicionar ${previewQuestoes.length} Questões`}
          </button>
        </div>
      )}

      {/* Template Download */}
      <div className="mt-8 pt-6 border-t border-slate-600/30">
        <p className="text-sm font-semibold text-white mb-3">
          📋 Formato do arquivo:
        </p>

        <div className="space-y-3 text-xs">
          {/* CSV Template */}
          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/30">
            <p className="font-semibold text-cyan-300 mb-2">CSV Exemplo:</p>
            <pre className="text-slate-300 overflow-x-auto text-xs">
              {`enunciado,opcaoA,opcaoB,opcaoC,opcaoD,opcaoE,resposta,explicacao,banca,concurso,disciplina,ano,dificuldade
"Qual é a capital do Brasil?","Salvador","Brasília","Rio de Janeiro","São Paulo","Manaus","B","Brasília é a capital desde 1960...","CESPE","INSS 2022","Geografia",2022,facil`}
            </pre>
          </div>

          {/* JSON Template */}
          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/30">
            <p className="font-semibold text-cyan-300 mb-2">JSON Exemplo:</p>
            <pre className="text-slate-300 overflow-x-auto text-xs">
              {`[
  {
    "enunciado": "Qual é a capital do Brasil?",
    "opcaoA": "Salvador",
    "opcaoB": "Brasília",
    "opcaoC": "Rio de Janeiro",
    "opcaoD": "São Paulo",
    "opcaoE": "Manaus",
    "resposta": "B",
    "explicacao": "Brasília é a capital desde 1960...",
    "banca": "CESPE",
    "concurso": "INSS 2022",
    "disciplina": "Geografia",
    "ano": 2022,
    "dificuldade": "facil"
  }
]`}
            </pre>
          </div>

          {/* Campos obrigatórios */}
          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/30">
            <p className="font-semibold text-cyan-300 mb-2">
              ✓ Campos obrigatórios:
            </p>
            <ul className="text-slate-300 space-y-1">
              <li>• enunciado / questão / pergunta</li>
              <li>• opcaoA / opcao_a / a (e B, C, D também)</li>
              <li>• resposta / gabarito (A, B, C, D ou E)</li>
              <li>• explicacao / explicação</li>
              <li>• banca</li>
              <li>• concurso</li>
              <li>• disciplina / matéria</li>
              <li>• dificuldade (facil, media, dificil)</li>
              <li>• ano (padrão: 2024)</li>
            </ul>
          </div>

          {/* Nomes de coluna aceitos */}
          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/30">
            <p className="font-semibold text-cyan-300 mb-2">
              💡 Nomes flexíveis:
            </p>
            <p className="text-slate-300">
              O sistema aceita várias variações de nomes de colunas. Exemplo:
              &quot;opção a&quot;, &quot;opcao_a&quot;, &quot;opcaoA&quot; são
              todos aceitos!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
