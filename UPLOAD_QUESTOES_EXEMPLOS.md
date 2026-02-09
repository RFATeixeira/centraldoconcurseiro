# Exemplos de Upload de Questões

## ✅ Formato CSV

```csv
enunciado,opcaoA,opcaoB,opcaoC,opcaoD,opcaoE,resposta,explicacao,banca,concurso,disciplina,ano,dificuldade
"Qual é a capital do Brasil?","Salvador","Brasília","Rio de Janeiro","São Paulo","Manaus","B","Brasília é a capital federal desde 1960, sendo construída entre 1956 e 1960.","CESPE","INSS 2022","Geografia",2022,facil
"2 + 2 é igual a?","3","4","5","6","","B","A soma de 2 + 2 é igual a 4, baseado na aritmética básica.","OBM","Matemática 2023","Matemática",2023,facil
"Qual é a maior potência mundial evoluída?","França","Rússia","Estados Unidos","China","","C","Os EUA são considerados a maior potência mundial atual.","ENEM","ENEM 2023","História",2023,media
```

## ✅ Formato JSON

```json
[
  {
    "enunciado": "Qual é a capital do Brasil?",
    "opcaoA": "Salvador",
    "opcaoB": "Brasília",
    "opcaoC": "Rio de Janeiro",
    "opcaoD": "São Paulo",
    "opcaoE": "Manaus",
    "resposta": "B",
    "explicacao": "Brasília é a capital federal desde 1960, sendo construída entre 1956 e 1960.",
    "banca": "CESPE",
    "concurso": "INSS 2022",
    "disciplina": "Geografia",
    "ano": 2022,
    "dificuldade": "facil"
  },
  {
    "enunciado": "2 + 2 é igual a?",
    "opcaoA": "3",
    "opcaoB": "4",
    "opcaoC": "5",
    "opcaoD": "6",
    "resposta": "B",
    "explicacao": "A soma de 2 + 2 é igual a 4, baseado na aritmética básica.",
    "banca": "OBM",
    "concurso": "Matemática 2023",
    "disciplina": "Matemática",
    "ano": 2023,
    "dificuldade": "facil"
  },
  {
    "enunciado": "Qual é a maior potência mundial atual?",
    "opcaoA": "França",
    "opcaoB": "Rússia",
    "opcaoC": "Estados Unidos",
    "opcaoD": "China",
    "resposta": "C",
    "explicacao": "Os EUA são considerados a maior potência mundial atual.",
    "banca": "ENEM",
    "concurso": "ENEM 2023",
    "disciplina": "História",
    "ano": 2023,
    "dificuldade": "media"
  }
]
```

## 🎯 Variações de nomes aceitadas

O sistema é **flexível** com os nomes das colunas/campos. Exemplos:

### Enunciado
- `enunciado`
- `questão`
- `pergunta`

### Opções
- `opcaoA`, `opcao_a`, `a`
- `opcaoB`, `opcao_b`, `b`
- `opcaoC`, `opcao_c`, `c`
- `opcaoD`, `opcao_d`, `d`
- `opcaoE`, `opcao_e`, `e`

### Resposta
- `resposta`
- `gabarito`

### Explicação
- `explicacao`
- `explicação`

### Disciplina
- `disciplina`
- `matéria`

### Campos normalizados
- `ano` → número (padrão: 2024 se não informado)
- `dificuldade` → `facil`, `media` ou `dificil`
- `dificuldade` (com acento) também funciona

## 📋 Campos Obrigatórios

Todos esses campos DEVEM estar preenchidos para uma questão ser válida:

1. **enunciado** - Texto da questão
2. **opcaoA** - Alternativa A
3. **opcaoB** - Alternativa B
4. **opcaoC** - Alternativa C
5. **opcaoD** - Alternativa D
6. **resposta** - Letra da resposta (A, B, C, D ou E)
7. **explicacao** - Justificativa da resposta
8. **banca** - Nome da banca (CESPE, VUNESP, FCC, OBM, ENEM, etc)
9. **concurso** - Nome do concurso/prova
10. **disciplina** - Disciplina da questão
11. **ano** - Ano (padrão: 2024)
12. **dificuldade** - Nível de dificuldade

## 💡 Dicas

- **opcaoE é OPCIONAL** - Deixe em branco ou omita se não houver quinta opção
- **Use aspas em CSV** - Especialmente se o texto contém vírgulas: `"São Paulo, Brasil"`
- **Resposta em maiúscula** - A resposta será convertida automaticamente para maiúscula
- **Dificuldade sem acento** - Use `facil`, `media`, `dificil` (sem acento)
- **Máximo de questões por upload** - Teste com pequenos lotes primeiro (100 questões)

## ✨ Exemplo Completo CSV (Pronto para copiar)

```csv
enunciado,opcaoA,opcaoB,opcaoC,opcaoD,resposta,explicacao,banca,concurso,disciplina,ano,dificuldade
"O que é a Lei de Ohm?","V = I x R","I = V / R","V = R / I","P = V x I","A","A Lei de Ohm estabelece que V = I x R, onde V é tensão, I é corrente e R é resistência.","CESPE","Eletricidade 2023","Física",2023,facil
"Qual filósofo escreveu o Leviatã?","Rene Descartes","Thomas Hobbes","John Locke","Jean-Paul Sartre","B","Thomas Hobbes escreveu o Leviatã em 1651, uma obra sobre a formação do Estado.","ENEM","Filosofia 2023","História",2023,media
"Em qual processo ocorre a transformação de energia solar em química?","Respiração celular","Fotossíntese","Fermentação","Digestão","B","A fotossíntese transforma energia solar em energia química através da clorofila.","VUNESP","Biologia 2024","Biologia",2024,media
```

## 🔄 Processo de Upload

1. Prepare seu arquivo (CSV ou JSON)
2. Vá para `/admin`
3. Clique na aba **"📤 Upload em Lote"**
4. Clique na área de upload ou arraste o arquivo
5. Verifique o **preview** das questões encontradas
6. Clique em **"Confirmar e Adicionar"**
7. Aguarde a confirmação de sucesso

## ❌ Erros Comuns

| Erro | Solução |
|------|---------|
| "Nenhuma questão válida encontrada" | Verifique se todos os campos obrigatórios existem |
| "Formato não suportado" | Use apenas .csv ou .json |
| "Erro ao processar arquivo" | Verifique encoding UTF-8 e caracteres especiais |
| Coluna não reconhecida | Use nomes variados aceitos (veja acima) |

## 🎓 Melhores Práticas

1. **Organize por disciplina** - Crie arquivos separados por matéria
2. **Valide antes** - Faça um preview manual de algumas linhas
3. **Use templates** - Copie o formato acima e adapte
4. **Adicione explicações detalhadas** - Quanto melhor a explicação, melhor o aprendizado
5. **Indique dificuldade corretamente** - Ajuda alunos a escolher questões apropriadas

## 📊 Estatísticas de Sucesso

Após upload bem-sucedido, você verá:
- ✅ Total de questões adicionadas
- 📈 Custo de leitura do Firestore
- ⏱️ Tempo de processamento
