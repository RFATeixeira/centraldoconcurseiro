'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import * as XLSX from 'xlsx'
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ClassificacaoRow {
  nome: string
  inscricao?: string
  regiao?: string
  resultado_taf?: string
  posicao?: number
  score?: number
  cpf?: string
  [key: string]: string | number | undefined
}

export default function UploadClassificacoes() {
  const [concursoNome, setConcursoNome] = useState('')
  const [concursoAno, setConcursoAno] = useState(new Date().getFullYear())
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [preview, setPreview] = useState<ClassificacaoRow[]>([])

  const parseSpreadsheet = (workbook: XLSX.WorkBook): ClassificacaoRow[] => {
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) return []

    // Converte para JSON com as primeiras linhas como headers
    const data = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      sheet,
      {
        defval: '',
        blankrows: false,
      },
    )

    if (data.length === 0) return []

    // Detecta quais são as colunas baseado no header
    const headers = Object.keys(data[0])
    let nomeCol = ''
    let inscricaoCol = ''
    let posicaoCol = ''
    let scoreCol = ''
    let regiaoCol = ''
    let resultadoTafCol = ''

    // Busca pelas colunas específicas (mais rigorosa)
    headers.forEach((header) => {
      const lower = header.toLowerCase().trim()

      if ((!inscricaoCol && lower === 'inscrição') || lower === 'inscricao') {
        inscricaoCol = header
      }
      if (!nomeCol && lower.includes('nome') && lower.includes('candidato')) {
        nomeCol = header
      }
      if ((!regiaoCol && lower === 'região') || lower === 'regiao') {
        regiaoCol = header
      }
      if (
        !resultadoTafCol &&
        lower.includes('resultado') &&
        lower.includes('taf')
      ) {
        resultadoTafCol = header
      }
      if (
        !posicaoCol &&
        (lower.includes('classificação') ||
          lower.includes('classificacao') ||
          lower.includes('nova classificação') ||
          lower.includes('nova classificacao'))
      ) {
        posicaoCol = header
      }
      if (
        !scoreCol &&
        (lower.includes('nota final') ||
          (lower.includes('nota') && lower.includes('taf')))
      ) {
        scoreCol = header
      }
    })

    // Fallback: se não encontrou, tenta ser menos rigoroso
    if (!nomeCol) {
      nomeCol = headers.find((h) => h.toLowerCase().includes('nome')) || ''
    }
    if (!inscricaoCol) {
      inscricaoCol =
        headers.find((h) => h.toLowerCase().includes('inscri')) || ''
    }
    if (!regiaoCol) {
      regiaoCol =
        headers.find(
          (h) =>
            h.toLowerCase().includes('região') ||
            h.toLowerCase().includes('regiao'),
        ) || ''
    }
    if (!resultadoTafCol) {
      resultadoTafCol =
        headers.find((h) => h.toLowerCase().includes('resultado')) || ''
    }
    if (!posicaoCol) {
      posicaoCol =
        headers.find(
          (h) =>
            h.toLowerCase().includes('classifi') ||
            h.toLowerCase().includes('ranking'),
        ) || ''
    }
    if (!scoreCol) {
      scoreCol = headers.find((h) => h.toLowerCase().includes('nota')) || ''
    }

    // Log para debug
    console.log('Colunas detectadas:', {
      nomeCol,
      inscricaoCol,
      regiaoCol,
      resultadoTafCol,
      posicaoCol,
      scoreCol,
    })

    // Mapeia os dados usando as colunas detectadas
    return data
      .map((row) => {
        const normalized: ClassificacaoRow = {
          nome: nomeCol ? String(row[nomeCol] || '').trim() : '',
          inscricao: inscricaoCol
            ? String(row[inscricaoCol] || '').trim()
            : undefined,
          regiao: regiaoCol ? String(row[regiaoCol] || '').trim() : undefined,
          resultado_taf: resultadoTafCol
            ? String(row[resultadoTafCol] || '').trim()
            : undefined,
        }

        // Posição e score como números
        if (posicaoCol) {
          const val = row[posicaoCol]
          normalized.posicao =
            typeof val === 'number' ? val : parseInt(String(val))
        }

        if (scoreCol) {
          const val = row[scoreCol]
          normalized.score =
            typeof val === 'number' ? val : parseFloat(String(val))
        }

        return normalized
      })
      .filter((row) => row.nome && row.nome.trim()) // Remove linhas sem nome
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setMessage(null)
    setPreview([])

    // Faz preview do arquivo
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const parsed = parseSpreadsheet(workbook)

        if (parsed.length === 0) {
          setMessage({
            type: 'error',
            text: 'A planilha não contém dados válidos.',
          })
          setFile(null)
          return
        }

        setPreview(parsed.slice(0, 5)) // Mostra preview dos primeiros 5 registros
        setMessage({
          type: 'success',
          text: `✓ Planilha carregada com sucesso (${parsed.length} registros encontrados)`,
        })
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        })
        setFile(null)
      }
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!concursoNome.trim()) {
      setMessage({
        type: 'error',
        text: 'Informe o nome do concurso',
      })
      return
    }

    if (!file) {
      setMessage({
        type: 'error',
        text: 'Selecione um arquivo',
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // 1. Parse da planilha
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const parsed = parseSpreadsheet(workbook)

          if (parsed.length === 0) {
            setMessage({
              type: 'error',
              text: 'Nenhum dado válido encontrado na planilha',
            })
            setLoading(false)
            return
          }

          // Salva tudo em um único documento com array de classificações
          await addDoc(collection(db, 'concursos'), {
            nome: concursoNome.trim(),
            ano: concursoAno,
            totalCandidatos: parsed.length,
            classificacoes: parsed, // Array com todos os dados da planilha
            uploadedAt: serverTimestamp(),
          })

          setMessage({
            type: 'success',
            text: `✓ Concurso "${concursoNome}" salvo com sucesso! (${parsed.length} candidatos)`,
          })

          // Limpa o formulário
          setConcursoNome('')
          setFile(null)
          setPreview([])

          // Limpa mensagem após 3 segundos
          setTimeout(() => setMessage(null), 3000)
        } catch (error) {
          setMessage({
            type: 'error',
            text: `Erro ao salvar: ${error instanceof Error ? error.message : 'Desconhecido'}`,
          })
        } finally {
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do Concurso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome do Concurso *
            </label>
            <input
              type="text"
              value={concursoNome}
              onChange={(e) => setConcursoNome(e.target.value)}
              placeholder="Ex: Concurso TJ-SP - Escrevente"
              className="input-style-1 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ano
            </label>
            <input
              type="number"
              value={concursoAno}
              onChange={(e) => setConcursoAno(parseInt(e.target.value))}
              min="2000"
              max={new Date().getFullYear() + 1}
              className="input-style-1 w-full"
            />
          </div>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Arquivo de Classificação (.xlsx, .csv, .xls) *
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.csv,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="flex items-center justify-center w-full p-6 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-white/40 transition-colors"
            >
              <div className="flex flex-col items-center">
                <CloudArrowUpIcon className="h-12 w-12 text-cyan-300 mb-2" />
                <p className="text-white font-medium">
                  {file ? file.name : 'Clique ou arraste seu arquivo aqui'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Formatos suportados: Excel, CSV
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Mensagens */}
        {message && (
          <div
            className={`rounded-2xl p-4 flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-400/30'
                : 'bg-red-500/20 border border-red-400/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-300 shrink-0 mt-0.5" />
            ) : (
              <div className="h-5 w-5 text-red-300 shrink-0 mt-0.5">⚠️</div>
            )}
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-200' : 'text-red-200'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white mb-3">
              Preview dos dados (primeiros 5 registros)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-gray-300">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Inscrição</th>
                    <th className="px-4 py-2 text-left">Região</th>
                    <th className="px-4 py-2 text-left">Resultado TAF</th>
                    <th className="px-4 py-2 text-left">Posição</th>
                    <th className="px-4 py-2 text-left">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-4 py-2 text-white">{row.nome}</td>
                      <td className="px-4 py-2">{row.inscricao || '-'}</td>
                      <td className="px-4 py-2">{row.regiao || '-'}</td>
                      <td className="px-4 py-2">{row.resultado_taf || '-'}</td>
                      <td className="px-4 py-2">{row.posicao || '-'}</td>
                      <td className="px-4 py-2">{row.score || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || !concursoNome.trim() || loading}
          className="w-full py-3 px-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading
            ? 'Salvando... (Não feche a página)'
            : 'Enviar Classificações'}
        </button>
      </form>
    </div>
  )
}
