# 🎓 Guia Rápido - Sistema de Simulados

## O que foi criado?

Um sistema completo de simulados com questões, comentários e filtros avançados.

## Componentes

### 1. **Página de Simulados** (`/app/simulados/page.tsx`)
- Grid responsivo de questões
- Filtros por: Banca, Concurso, Disciplina e Dificuldade
- Visualização detalhada de cada questão
- Sistema de comentários integrado
- Cards com contagem de comentários

### 2. **Modal Adicionar Questão** (`/components/ModalAdicionarQuestao.tsx`)
- Form completo para adicionar questões
- Validação de campos obrigatórios
- Suporte a opções A, B, C, D e E (E opcional)
- Integrado na página de Admin

### 3. **Página Admin Melhorada** (`/app/admin/page.tsx`)
- Botão para adicionar questões
- Modal integrado
- Acesso apenas para admins

## Como usar

### Para Admins - Adicionar Questões

1. Vá para `/admin`
2. Clique no botão **"+ Adicionar Questão"**
3. Preencha o formulário:
   - **Enunciado**: Texto da questão
   - **Opções A-E**: Digite cada alternativa (E é opcional)
   - **Resposta Correta**: Selecione A, B, C, D ou E
   - **Explicação**: Justificativa da resposta
   - **Banca**: CESPE, VUNESP, FCC, OBM, ENEM, etc
   - **Concurso**: INSS 2022, Polícia Federal 2023, etc
   - **Disciplina**: Português, Matemática, Geografia, etc
   - **Ano**: Ano de aplicação
   - **Dificuldade**: Fácil, Média ou Difícil
4. Clique em **"Adicionar Questão"**

### Para Usuários - Resolver Questões

1. Vá para `/simulados` (link no header)
2. Use os filtros para encontrar questões:
   - Selecione uma **Banca**
   - Selecione um **Concurso**
   - Selecione uma **Disciplina**
   - Selecione um **Nível de Dificuldade**
3. Clique em uma questão para ver os detalhes
4. Veja a **Explicação** da resposta correta
5. **Comente** suas dúvidas na seção de comentários

## Estrutura do Firestore

```
/questoes
  ├── {questaoId}
  │   ├── enunciado: string
  │   ├── opcoes: {a, b, c, d, e?}
  │   ├── resposta: string (A-E)
  │   ├── explicacao: string
  │   ├── banca: string
  │   ├── concurso: string
  │   ├── disciplina: string
  │   ├── ano: number
  │   ├── dificuldade: string (facil|media|dificil)
  │   ├── createdAt: timestamp
  │   ├── updatedAt: timestamp
  │   └── /comentarios
  │       └── {comentarioId}
  │           ├── uid: string
  │           ├── nome: string
  │           ├── photoUrl: string
  │           ├── texto: string
  │           └── createdAt: timestamp
```

## Recursos Principais

### ✅ Filtros Inteligentes
- Filtros em tempo real
- Opções geradas dinamicamente com base no banco de dados
- Pode combinar múltiplos filtros

### 💬 Sistema de Comentários
- Qualquer usuário autenticado pode comentar
- Comentários ordenados por mais recentes
- Usuário pode deletar seus próprios comentários
- Foto de perfil do comentarista exibida

### 🎨 Design Responsivo
- Totalmente mobile-friendly
- Grid que se adapta (1 coluna mobile, 2 desktop)
- Interface intuitiva com glassmorphism

### 📊 Informações Exibidas
- Banca e Concurso
- Disciplina
- Nível de dificuldade (com código de cor)
- Enunciado (resumido na lista)
- Contagem de comentários
- Resposta correta indicada em verde

## Filtros Disponíveis

| Filtro | Exemplos |
|--------|----------|
| **Banca** | CESPE, VUNESP, FCC, OBM, ENEM |
| **Concurso** | INSS 2022, Polícia Federal 2023, TRE 2023 |
| **Disciplina** | Português, Matemática, Geografia, História |
| **Dificuldade** | Fácil, Média, Difícil |

## Cores por Dificuldade

- 🟢 **Fácil**: Verde (bg-green-500/20)
- 🟡 **Média**: Amarelo (bg-yellow-500/20)
- 🔴 **Difícil**: Vermelho (bg-red-500/20)

## Funcionalidades Futuras (Ideias)

- [ ] Histórico de respostas do usuário
- [ ] Ranking de questões mais comentadas
- [ ] Filtro por ano
- [ ] Simulados agrupados (múltiplas questões)
- [ ] Sistema de favoritos
- [ ] Badges/Conquistas
- [ ] Estatísticas por disciplina
- [ ] Exportar simulado em PDF

## Permissões (Regras Firestore)

```javascript
// Questões
- Leitura: Público ✓
- Criar: Apenas Admin
- Atualizar: Apenas Admin
- Deletar: Apenas Admin

// Comentários
- Leitura: Público ✓
- Criar: Usuário Autenticado ✓
- Deletar: Próprio comentário ou Admin
- Atualizar: Não permitido
```

## Troubleshooting

### Problema: Filtros vazios
**Solução**: Adicione questões usando o modal de admin primeiro

### Problema: Não consegue comentar
**Solução**: Faça login na plataforma

### Problema: Não consegue adicionar questões
**Solução**: Você precisa ser admin (verificado no Firestore em `users/{uid}.isAdmin == true`)

### Problema: Comentários não aparecem
**Solução**: Recarregue a página ou aguarde (usa real-time listeners)

## Links Úteis

- 🎓 Página de Simulados: `/simulados`
- 🔧 Painel Admin: `/admin`
- 📖 Documentação Completa: `/SIMULADOS_SETUP.md`
