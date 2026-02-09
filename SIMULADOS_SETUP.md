# Estrutura de Questões para Simulados

## Coleção: `questoes`

Cada documento representa uma questão individual. Estrutura base:

```json
{
  "enunciado": "Qual é a capital do Brasil?",
  "opcoes": {
    "a": "Salvador",
    "b": "Brasília",
    "c": "Rio de Janeiro",
    "d": "São Paulo",
    "e": "Belo Horizonte"
  },
  "resposta": "B",
  "explicacao": "Brasília é a capital do Brasil desde 1960...",
  "banca": "CESPE",
  "concurso": "INSS 2022",
  "disciplina": "Geografia",
  "ano": 2022,
  "dificuldade": "facil",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Campos obrigatórios:

- **enunciado** (string): O texto da questão
- **opcoes** (object): Objeto com as alternativas (a, b, c, d, e é opcional)
  - a, b, c, d: strings com o texto da opção
  - e: (opcional) string com a quinta opção
- **resposta** (string): Letra da resposta correta em MAIÚSCULA (A, B, C, D ou E)
- **explicacao** (string): Explicação detalhada da resposta
- **banca** (string): Nome da banca (CESPE, VUNESP, FCC, etc)
- **concurso** (string): Nome do concurso (INSS 2022, Polícia Federal 2023, etc)
- **disciplina** (string): Disciplina (Português, Matemática, Geografia, etc)
- **ano** (number): Ano de aplicação (2022, 2023, etc)
- **dificuldade** (string): Um de ["facil", "media", "dificil"]
- **createdAt** (timestamp): Data de criação (use serverTimestamp())
- **updatedAt** (timestamp): Data de atualização (use serverTimestamp())

## Sub-coleção: `comentarios` dentro de cada questão

Localização: `questoes/{questaoId}/comentarios/{comentarioId}`

Estrutura:

```json
{
  "uid": "userId",
  "nome": "Nome do Usuário",
  "photoUrl": "url-da-foto",
  "texto": "Não entendi a alternativa E...",
  "createdAt": "timestamp"
}
```

## Como adicionar questões (Opção 1: Manualmente no Console Firebase)

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Vá para Firestore Database
3. Crie uma coleção chamada `questoes`
4. Clique em "Adicionar documento"
5. Adicione os campos conforme estrutura acima

## Como adicionar questões (Opção 2: Por script/importação)

Use a Cloud Function ou um script Node.js:

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

const questoes = [
  {
    enunciado: "Qual é a capital do Brasil?",
    opcoes: {
      a: "Salvador",
      b: "Brasília",
      c: "Rio de Janeiro",
      d: "São Paulo"
    },
    resposta: "B",
    explicacao: "Brasília é a capital desde 1960...",
    banca: "CESPE",
    concurso: "INSS 2022",
    disciplina: "Geografia",
    ano: 2022,
    dificuldade: "facil"
  }
];

async function addQuestoes() {
  for (const questao of questoes) {
    await db.collection('questoes').add({
      ...questao,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log('Questões adicionadas com sucesso!');
}

addQuestoes().catch(console.error);
```

## Regras Firestore recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Questões - leitura pública
    match /questoes/{questeoId} {
      allow read: if true;
      allow create, update, delete: if request.auth.uid != null && resource.data.isAdmin == true;
      
      // Comentários - leitura pública, criação autenticada
      match /comentarios/{comentarioId} {
        allow read: if true;
        allow create: if request.auth.uid != null;
        allow delete: if request.auth.uid == resource.data.uid;
        allow update: if false;
      }
    }
  }
}
```

## Filtros disponíveis

Os filtros funcionam em tempo real:

- **Banca**: Todos os bancos únicos serão exibidos (ex: CESPE, VUNESP, FCC)
- **Concurso**: Todos os concursos únicos (ex: INSS 2022, Polícia Federal 2023)
- **Disciplina**: Todas as disciplinas únicas (ex: Português, Matemática)
- **Dificuldade**: facil, media, dificil

## Exemplo de adicionar via Firebase Console

```json
{
  "enunciado": "O Pedro tem 5 maçãs e Maria tem 3. Quantas maçãs eles têm no total?",
  "opcoes": {
    "a": "5",
    "b": "3",
    "c": "8",
    "d": "10"
  },
  "resposta": "C",
  "explicacao": "Se Pedro tem 5 maçãs e Maria tem 3, então 5 + 3 = 8 maçãs no total.",
  "banca": "OBM",
  "concurso": "Matemática 2023",
  "disciplina": "Matemática",
  "ano": 2023,
  "dificuldade": "facil"
}
```

## Dúvidas comuns

**P: Posso adicionar mais de 5 alternativas?**
R: Sim! Adicione quantos campos quiser em `opcoes` (a, b, c, d, e, f, ...). Ajuste apenas o campo `resposta`.

**P: Como adicionar várias questões de uma vez?**
R: Crie um arquivo CSV/JSON e importe via script, ou use a Cloud Function de importação.

**P: Os comentários são moderados?**
R: Atualmente não. Adicione validação de conteúdo conforme necessário.

**P: Como rastrear quem respondeu qual questão?**
R: Isso requer uma coleção adicional `respostas_usuarios` com padrão similar aos comentários.
