# Configuração do Firestore Rules

## ⚠️ URGENTE - Problema de Permissão no iPhone

Se você está vendo **"Missing or insufficient permissions"** no iPhone, siga estes passos:

### Passo 1: Publique as Regras SIMPLIFICADAS

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **centraldoconcurseiro-3574b**
3. Vá em **Firestore Database** → Aba **Rules**
4. **COPIE EXATAMENTE** o conteúdo abaixo e cole no editor:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    
    match /concursos/{concursoId} {
      allow read, write: if request.auth != null;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Clique em **"Publicar"**
6. **AGUARDE 2 MINUTOS** para as regras propagarem

### Passo 2: Use a Página de Diagnóstico

1. **No Desktop**, acesse: `http://localhost:3000/diagnostico`
2. **No iPhone**, acesse: `http://192.168.4.48:3000/diagnostico`
3. A página testará automaticamente:
   - ✅ Autenticação
   - ✅ Token válido
   - ✅ Leitura de users
   - ✅ Leitura de chats

4. **Se todos os testes passarem (✅)**: As regras estão OK!
5. **Se aparecer erro de permissão (❌)**: Volte ao Passo 1

### Passo 3: Limpe Cache e Teste no iPhone

1. **iPhone**: Safari → Configurações → Limpar Histórico e Dados
2. Acesse: `http://192.168.4.48:3000`
3. Faça login
4. Teste o chat

### Passo 4: Se AINDA não funcionar

Execute no terminal do Mac/PC:

```bash
# Pare o servidor Next.js (Ctrl+C)
# Delete a pasta .next
rm -rf .next  # Mac/Linux
# ou
rmdir /s .next  # Windows

# Reinicie
npm run dev
```

Depois:
1. Feche TODOS os apps no iPhone
2. Reinicie o iPhone
3. Abra novamente

---

## 🔍 Usando a Página de Diagnóstico

A página `/diagnostico` mostra em tempo real:

```
🔄 Testando conexão...
✅ Usuário autenticado
   Email: seu@email.com
   UID: abc123...

🔄 Atualizando token...
✅ Token obtido
   Primeiros chars: eyJhbGciOiJSUzI1NiIsImtpZCI...

🔄 Testando leitura de users...
✅ Leitura de users OK: 5 docs

🔄 Testando leitura de chats...
✅ Leitura de chats OK: 1 docs

📊 Estado do Firebase Auth:
   Autenticado: true
   Email verificado: true
   Último sign-in: 2026-02-07...

✅ TODOS OS TESTES PASSARAM!
```

Se ver **qualquer ❌**, as regras não estão aplicadas corretamente.

---

## ⚠️ IMPORTANTE

As regras atuais são **SIMPLIFICADAS** para resolver o problema de permissão.  
Elas permitem qualquer usuário autenticado fazer qualquer operação.

**Após confirmar que tudo funciona**, você pode adicionar validações mais restritivas.

---

## 📊 Status Atual

- **firestore.rules**: Regras ULTRA simplificadas (apenas `request.auth != null`)
- **app/diagnostico/page.tsx**: Página de teste criada
