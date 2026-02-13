'use client'
// Função para enviar questões para o backend (exemplo: salvar no Firestore)
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
  banca: string
  concurso: string
  disciplina: string
  ano: number
}

interface Gabarito {
  [numero: string]: string
}

export default function UploadQuestoes() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewQuestoes, setPreviewQuestoes] = useState<Questao[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [gabarito, setGabarito] = useState<Gabarito | null>(null)
  const [nomeLote, setNomeLote] = useState<string>('')

  // Função para enviar questões para o backend (exemplo: salvar no Firestore)
  async function handleEnviarQuestoes() {
    if (!nomeLote.trim()) {
      setError('O nome do lote é obrigatório.')
      return
    }
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
          banca: questao.banca,
          concurso: questao.concurso,
          disciplina: questao.disciplina,
          ano: questao.ano,
          conjunto: nomeLote.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        count++
      }
      setSuccess(`Questões enviadas com sucesso! (${count})`)
      setShowPreview(false)
      setPreviewQuestoes([])
      setFileName('')
      setGabarito(null)
      setNomeLote('')
    } catch (err) {
      setError('Erro ao enviar questões: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // CSV parser
  function parseCSV(csv: string): {
    questoes: Questao[]
    gabarito: Gabarito | null
  } {
    const lines = csv.trim().split('\n')
    const questoes: Questao[] = []
    let gabaritoObj: Gabarito | null = null
    let endIdx = lines.length
    // Detect gabarito row
    const lastLine = lines[lines.length - 1].trim().toLowerCase()
    if (lastLine.startsWith('gabarito')) {
      endIdx = lines.length - 1
      const parts = lines[lines.length - 1].split(',')
      parts.shift()
      gabaritoObj = {}
      parts.forEach((resp, idx) => {
        gabaritoObj![`${idx + 1}`] = resp.trim().toUpperCase()
      })
    }
    for (let i = 1; i < endIdx; i++) {
      if (!lines[i].trim()) continue
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
      if (current.length > 0) values.push(current.trim().replace(/^"|"$/g, ''))
      if (values.length < 8) continue
      questoes.push({
        enunciado: values[0],
        opcaoA: values[1],
        opcaoB: values[2],
        opcaoC: values[3],
        opcaoD: values[4],
        opcaoE: values[5] || undefined,
        resposta: values[6],
        banca: values[7],
        concurso: values[8] || '',
        disciplina: values[9] || '',
        ano: Number(values[10]) || 0,
      })
    }
    return { questoes, gabarito: gabaritoObj }
  }

  // File upload handler
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setSuccess(null)
    setShowPreview(false)
    setPreviewQuestoes([])
    setGabarito(null)
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setIsLoading(true)
    try {
      const text = await file.text()
      let questoes: Questao[] = []
      let gabaritoObj: Gabarito | null = null
      if (file.name.endsWith('.csv')) {
        const parsed = parseCSV(text)
        questoes = parsed.questoes
        gabaritoObj = parsed.gabarito
      } else if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text)
        questoes = Array.isArray(parsed) ? parsed : []
      }
      if (questoes.length === 0) {
        setError('Nenhuma questão encontrada no arquivo.')
        setIsLoading(false)
        return
      }
      setPreviewQuestoes(questoes)
      setShowPreview(true)
      setGabarito(gabaritoObj)
    } catch (err) {
      setError('Erro ao ler arquivo: ' + (err as Error).message)
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
      <div className="flex flex-col items-center gap-2 mt-4">
        <input
          type="text"
          className="input-style-1"
          placeholder="Nome do lote (obrigatório)"
          value={nomeLote}
          onChange={(e) => setNomeLote(e.target.value)}
          disabled={isLoading}
          required
        />
        <button
          onClick={handleEnviarQuestoes}
          className="button-cyan"
          disabled={isLoading || !nomeLote.trim()}
        >
          {isLoading ? 'Enviando... (Não feche a página!)' : 'Enviar questões'}
        </button>
      </div>
      {/* Instruções de formato CSV e JSON */}
      <div className="bg-slate-800/60 rounded-xl p-4 mb-2">
        <h4 className="text-white font-semibold mb-2">
          Instruções para importar questões:
        </h4>
        <ul className="text-slate-300 text-sm mb-2 list-disc pl-5">
          <li>
            <span className="font-bold text-cyan-300">CSV:</span> Cada linha
            representa uma questão, com os campos separados por vírgula.
          </li>
          <li>
            Campos: enunciado, opçãoA, opçãoB, opçãoC, opçãoD, opçãoE
            (opcional), resposta, banca, concurso, disciplina, ano.
          </li>
          <li>
            Ao final, adicione uma linha de gabarito começando com{' '}
            <span className="text-cyan-300 font-mono">gabarito</span> e as
            respostas das questões.
          </li>
          <li className="mt-2">
            <span className="font-bold text-cyan-300">JSON:</span> O arquivo
            deve conter um array de objetos, cada um representando uma questão
            com os mesmos campos do CSV.
          </li>
        </ul>
        <div className="bg-slate-900/80 rounded p-2 text-xs font-mono text-cyan-200 overflow-x-auto mb-2">
          <span className="text-cyan-400">Exemplo CSV:</span>
          <br />
          enunciado,opcaoA,opcaoB,opcaoC,opcaoD,opcaoE,resposta,banca,concurso,disciplina,ano
          <br />
          Qual a capital do Brasil?,Brasília,Rio de Janeiro,São Paulo,Belo
          Horizonte,,A,FGV,Concurso X,Geografia,2022
          <br />
          Quem descobriu o Brasil?,Pedro Álvares Cabral,Vasco da Gama,Cristóvão
          Colombo,Dom Pedro II,,A,CESPE,Concurso Y,História,2021
          <br />
          gabarito,A,A
        </div>
        <div className="bg-slate-900/80 rounded p-2 text-xs font-mono text-cyan-200 overflow-x-auto">
          <span className="text-cyan-400">Exemplo JSON:</span>
          <pre>
            {`[
          {
            "enunciado": "Qual a capital do Brasil?",
            "opcaoA": "Brasília",
            "opcaoB": "Rio de Janeiro",
            "opcaoC": "São Paulo",
            "opcaoD": "Belo Horizonte",
            "opcaoE": "",
            "resposta": "A",
            "banca": "FGV",
            "concurso": "Concurso X",
            "disciplina": "Geografia",
            "ano": 2022
          },
          {
            "enunciado": "Quem descobriu o Brasil?",
            "opcaoA": "Pedro Álvares Cabral",
            "opcaoB": "Vasco da Gama",
            "opcaoC": "Cristóvão Colombo",
            "opcaoD": "Dom Pedro II",
            "opcaoE": "",
            "resposta": "A",
            "banca": "CESPE",
            "concurso": "Concurso Y",
            "disciplina": "História",
            "ano": 2021
          }
        ]`}
          </pre>
        </div>
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
                setGabarito(null)
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Enunciado</th>
                  <th>Alternativas</th>
                  <th>Resposta</th>
                  <th>Banca</th>
                  <th>Concurso</th>
                  <th>Disciplina</th>
                  <th>Ano</th>
                </tr>
              </thead>
              <tbody>
                {previewQuestoes.map((q, idx) => (
                  <tr key={idx} className="border-b border-slate-700/30">
                    <td>{idx + 1}</td>
                    <td>{q.enunciado.slice(0, 60)}...</td>
                    <td>
                      {[q.opcaoA, q.opcaoB, q.opcaoC, q.opcaoD, q.opcaoE]
                        .filter(Boolean)
                        .map((alt, i) => (
                          <span key={i} className="mr-2">
                            {String.fromCharCode(65 + i)}: {alt}
                          </span>
                        ))}
                    </td>
                    <td>{q.resposta}</td>
                    <td>{q.banca}</td>
                    <td>{q.concurso}</td>
                    <td>{q.disciplina}</td>
                    <td>{q.ano}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {gabarito && (
            <div className="mt-4 bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2">
                Gabarito do arquivo:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(gabarito).map(([num, resp]) => (
                  <span
                    key={num}
                    className="bg-slate-800 px-2 py-1 rounded text-cyan-300"
                  >
                    {num}: {resp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
