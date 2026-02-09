'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  getDocs,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { db, auth } from '../../lib/firebase'
import { useAuth } from '../context/AuthContext'
import {
  ChevronLeftIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'

type Chat = {
  id: string
  tipo: 'group' | 'private'
  nome: string
  photoUrl: string
  descricao?: string
  members: string[]
  admin: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  unreadCount?: number
}

type Message = {
  id: string
  uid: string
  nome: string
  photoUrl: string
  texto: string
  createdAt: Timestamp | null
  replyTo?: {
    id: string
    nome: string
    texto: string
  }
}

type MessageData = {
  uid: string
  nome: string
  photoUrl: string
  texto: string
  createdAt: ReturnType<typeof serverTimestamp>
  replyTo?: {
    id: string
    nome: string
    texto: string
  }
}

export default function Chat() {
  const { user, loading, profile } = useAuth()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showChatList, setShowChatList] = useState(true)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  )
  const [activatingMessageId, setActivatingMessageId] = useState<string | null>(
    null,
  )
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{
    uid: string
    name: string
  } | null>(null)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [allUsers, setAllUsers] = useState<
    Array<{ uid: string; name: string; photo: string }>
  >([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageMenuRef = useRef<HTMLDivElement>(null)

  // Memoizar getOtherUserInfo para evitar recálculos desnecessários
  const getOtherUserInfo = useMemo(() => {
    return (chat: Chat): { name: string; photo: string } => {
      if (chat.tipo !== 'private' || !user) {
        return { name: chat.nome, photo: chat.photoUrl }
      }

      const otherUserId = chat.members.find((m) => m !== user.uid)
      if (!otherUserId) {
        return { name: chat.nome, photo: chat.photoUrl }
      }

      const otherUser = allUsers.find((u) => u.uid === otherUserId)
      if (otherUser) {
        return { name: otherUser.name, photo: otherUser.photo }
      }

      return { name: chat.nome, photo: chat.photoUrl }
    }
  }, [user, allUsers])

  // Memoizar displayInfo do chat selecionado
  const selectedChatDisplayInfo = useMemo(() => {
    if (!selectedChat) return null
    return getOtherUserInfo(selectedChat)
  }, [selectedChat, getOtherUserInfo])

  // Carregar todos os usuários
  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return

      try {
        console.log('🔄 Carregando usuários...')
        const snapshot = await getDocs(collection(db, 'users'))
        console.log('✅ Usuários carregados:', snapshot.size)

        const users = snapshot.docs.map((doc) => ({
          uid: doc.id,
          name: doc.data().name || 'Usuário',
          photo: doc.data().photo || '',
        }))
        setAllUsers(users)
      } catch (error: unknown) {
        console.error('❌ Erro ao carregar usuários:', error)
        const errorCode = (error as { code?: string })?.code

        if (errorCode === 'permission-denied') {
          console.error('🔒 Regras do Firestore bloqueando leitura de usuários')
        }
      }
    }

    loadUsers()
  }, [user])

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      router.replace('/login')
      return
    }

    // Criar grupo geral se não existir e adicionar usuário
    const createGeneralGroup = async () => {
      try {
        const q = query(collection(db, 'chats'), where('nome', '==', 'Geral'))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          // Criar grupo Geral
          await addDoc(collection(db, 'chats'), {
            tipo: 'group',
            nome: 'Geral',
            photoUrl: '',
            descricao: 'Grupo geral para todos os usuários',
            members: [user!.uid],
            admin: user!.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } else {
          // Usar apenas o primeiro grupo Geral e adicionar usuário se necessário
          const generalChat = snapshot.docs[0]
          const members = generalChat.data().members || []
          if (!members.includes(user!.uid)) {
            await setDoc(
              doc(db, 'chats', generalChat.id),
              {
                members: [...members, user!.uid],
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            )
          }
        }
      } catch (error) {
        console.error('Erro ao criar/atualizar grupo Geral:', error)
      }
    }

    createGeneralGroup()

    // Carregar todos os chats (filtra no cliente para evitar índice composto)
    const q = collection(db, 'chats')

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📨 Chats recebidos:', snapshot.size)
        const allChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[]

        // Filtrar chats onde usuário é membro
        const userChats = allChats.filter((chat) =>
          chat.members.includes(user!.uid),
        )

        // Ordenar por updatedAt (mais recente primeiro)
        userChats.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis?.() || 0
          const timeB = b.updatedAt?.toMillis?.() || 0
          return timeB - timeA
        })

        setChats(userChats)

        // Selecionar primeiro chat automaticamente
        if (userChats.length > 0 && !selectedChat) {
          setSelectedChat(userChats[0])
        }
      },
      (error) => {
        console.error('❌ ERRO ao carregar chats:', error)
        if ((error as { code?: string })?.code === 'permission-denied') {
          console.error('🔒 Regras do Firestore bloqueando acesso aos chats')
        }
      },
    )

    // Cleanup
    return () => {
      unsubscribe()
    }
  }, [loading, user, router, selectedChat])

  // Carregar mensagens do chat selecionado
  useEffect(() => {
    if (!selectedChat) {
      return
    }

    // Limpar mensagens e estados anteriores imediatamente
    setMessages([])
    setReplyingTo(null)
    setSelectedMessageId(null)
    setActivatingMessageId(null)

    const q = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('createdAt', 'asc'),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[]

        setMessages(messagesData)
      },
      (error) => {
        console.error('❌ ERRO ao carregar mensagens:', error)
        if ((error as { code?: string })?.code === 'permission-denied') {
          console.error(
            '🔒 Regras do Firestore bloqueando leitura de mensagens',
          )
        }
      },
    )

    return () => unsubscribe()
  }, [selectedChat])

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(event.target as Node)
      ) {
        setSelectedMessageId(null)
        setActivatingMessageId(null)
      }
    }

    if (selectedMessageId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [selectedMessageId])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !user) {
      return
    }

    setIsSending(true)

    try {
      // Buscar dados do perfil do usuário
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      const userName = userData?.name || user.displayName || 'Usuário'
      const userPhoto = userData?.photo || user.photoURL || ''

      const messageData: MessageData = {
        uid: user.uid,
        nome: userName,
        photoUrl: userPhoto,
        texto: messageText.trim(),
        createdAt: serverTimestamp(),
      }

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          nome: replyingTo.nome,
          texto: replyingTo.texto,
        }
      }

      await addDoc(
        collection(db, 'chats', selectedChat.id, 'messages'),
        messageData,
      )

      setMessageText('')
      setReplyingTo(null)
    } catch {
      console.error('Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp || !timestamp.toDate) {
      return '--:--'
    }
    const date = timestamp.toDate()
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChat) {
      return
    }

    try {
      await deleteDoc(doc(db, 'chats', selectedChat.id, 'messages', messageId))
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error)
    }
  }

  const canDeleteMessage = (message: Message) => {
    if (!user || !selectedChat) return false
    // Admin global pode deletar qualquer mensagem
    if (profile?.isAdmin) return true
    // Admin do grupo pode deletar qualquer mensagem
    if (selectedChat.admin === user.uid) return true
    // Usuário pode deletar suas próprias mensagens
    return message.uid === user.uid
  }

  const toggleMessageMenu = (messageId: string) => {
    if (selectedMessageId === messageId) {
      // Fechar imediatamente
      setSelectedMessageId(null)
      setActivatingMessageId(null)
    } else {
      // Deslocar imediatamente
      setActivatingMessageId(messageId)
      // Mostrar botões com delay
      setTimeout(() => {
        setSelectedMessageId(messageId)
      }, 150)
    }
  }

  const openUserOptions = (uid: string, name: string) => {
    setSelectedUser({ uid, name })
    setShowUsersModal(true)
  }

  const handleStartPrivateChat = async () => {
    if (!user || !selectedUser || isCreatingChat) {
      return
    }

    if (selectedUser.uid === user.uid) {
      return
    }

    setIsCreatingChat(true)

    try {
      const snapshot = await getDocs(collection(db, 'chats'))
      const existingChat = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((chat) => {
          const chatData = chat as Chat
          return (
            chatData.tipo === 'private' &&
            chatData.members.includes(user.uid) &&
            chatData.members.includes(selectedUser.uid)
          )
        }) as Chat | undefined

      if (existingChat) {
        setSelectedChat(existingChat)
        setShowChatList(false)
        setShowUsersModal(false)
        setSelectedUser(null)
        setMessageText('')
        return
      }

      const selectedUserInfo = allUsers.find((u) => u.uid === selectedUser.uid)

      const newChatRef = await addDoc(collection(db, 'chats'), {
        tipo: 'private',
        nome: selectedUser.name,
        photoUrl: selectedUserInfo?.photo || '',
        descricao: '',
        members: [user.uid, selectedUser.uid],
        admin: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setSelectedChat({
        id: newChatRef.id,
        tipo: 'private',
        nome: selectedUser.name,
        photoUrl: selectedUserInfo?.photo || '',
        descricao: '',
        members: [user.uid, selectedUser.uid],
        admin: user.uid,
        createdAt: null,
        updatedAt: null,
      })
      setShowChatList(false)
      setShowUsersModal(false)
      setSelectedUser(null)
      setMessageText('')
    } catch (error) {
      console.error('Erro ao criar conversa privada:', error)
    } finally {
      setIsCreatingChat(false)
    }
  }

  return (
    <main className="fixed inset-0 z-50 flex md:pt-24 pt-0 m-0 md:m-2 gap-2">
      {/* Sidebar - Lista de chats */}
      <div
        className={`${
          showChatList ? 'flex' : 'hidden'
        } md:flex w-full md:w-80 flex-col rounded-none md:rounded-3xl backdrop-blur-xs bg-slate-800/60 border-r border-slate-700/50 z-50`}
      >
        <div className="p-3 pb-3 h-18 border-b border-slate-700/50 flex  items-center justify-between md:justify-start gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden -ml-2 p-2 text-cyan-300 hover:text-cyan-200 active:bg-slate-700/50 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-cyan-300">Conversas</h2>
        </div>

        <div className="flex-1 overflow-y-auto chat-scrollbar">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              Nenhum chat disponível
            </div>
          ) : (
            chats.map((chat) => {
              const displayInfo = getOtherUserInfo(chat)
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat)
                    setShowChatList(false)
                    setMessageText('')
                    setShowUsersModal(false)
                  }}
                  className={`w-full p-4 border-b border-slate-700/30 backdrop-blur-xs hover:bg-slate-700/50 active:bg-slate-700 transition-colors text-left ${
                    selectedChat?.id === chat.id ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      {displayInfo.photo ? (
                        <Image
                          src={displayInfo.photo}
                          alt={displayInfo.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-cyan-300">
                          {displayInfo.name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {displayInfo.name}
                      </p>
                      <p className="text-sm text-slate-400 truncate">
                        {chat.descricao ||
                          (chat.tipo === 'group' ? 'Grupo' : 'Chat privado')}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div
          className={`${
            showChatList ? 'hidden' : 'flex'
          } md:flex flex-1 flex-col z-50 relative`}
        >
          {/* Header */}
          <div className="p-3 h-18 md:p-4 border-b border-slate-700/50 backdrop-blur-xs bg-slate-800/60 rounded-t-none md:rounded-t-3xl flex items-center gap-3 z-50 w-full">
            <button
              onClick={() => setShowChatList(true)}
              className="md:hidden -ml-2 p-2 text-cyan-300 hover:text-cyan-200 active:bg-slate-700/50 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <div
              className="flex items-center gap-3  w-full flex-row-reverse md:flex-row cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => setShowUsersModal(true)}
            >
              {selectedChatDisplayInfo && (
                <>
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    {selectedChatDisplayInfo.photo ? (
                      <Image
                        src={selectedChatDisplayInfo.photo}
                        alt={selectedChatDisplayInfo.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-cyan-300">
                        {selectedChatDisplayInfo.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h1 className="font-bold text-white truncate">
                      {selectedChatDisplayInfo.name}
                    </h1>
                    <p className="text-xs text-slate-400">
                      {selectedChat.members.length}{' '}
                      {selectedChat.members.length === 1 ? 'membro' : 'membros'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messageMenuRef}
            className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 backdrop-blur-xs bg-slate-900/60 z-50 chat-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                Nenhuma mensagem ainda
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.uid === user?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.uid !== user?.uid && selectedChat?.tipo === 'group' && (
                    <div className="flex flex-col gap-1 items-center group">
                      <div
                        onClick={() => openUserOptions(msg.uid, msg.nome)}
                        className="w-8 h-8 rounded-full bg-cyan-500/20 shrink-0 flex items-center justify-center cursor-pointer hover:bg-cyan-500/30 transition-colors"
                        title="Ver opções"
                      >
                        {msg.photoUrl ? (
                          <Image
                            src={msg.photoUrl}
                            alt={msg.nome}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-cyan-300">
                            {msg.nome[0]}
                          </span>
                        )}
                      </div>
                      {/* Botões abaixo da foto para mensagens de outros */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-col gap-1 ${
                          selectedMessageId === msg.id ? 'flex' : 'hidden'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setReplyingTo(msg)
                            setSelectedMessageId(null)
                            setActivatingMessageId(null)
                          }}
                          className="p-1.5 button-cyan"
                          title="Responder"
                        >
                          <ArrowUturnLeftIcon className="h-4 w-4" />
                        </button>
                        {canDeleteMessage(msg) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMessage(msg.id)
                              setSelectedMessageId(null)
                              setActivatingMessageId(null)
                            }}
                            className="p-1.5 button-red-real"
                            title="Deletar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-xs lg:max-w-md ${
                      msg.uid === user?.uid ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    {msg.uid !== user?.uid &&
                      selectedChat?.tipo === 'group' && (
                        <p
                          onClick={() => openUserOptions(msg.uid, msg.nome)}
                          className="text-xs font-semibold text-cyan-300 ml-2 cursor-pointer hover:text-cyan-200 transition-colors"
                        >
                          {msg.nome}
                        </p>
                      )}
                    <div
                      className={`relative group transition-transform ${
                        activatingMessageId === msg.id
                          ? msg.uid === user?.uid
                            ? '-translate-x-8'
                            : selectedChat?.tipo === 'private'
                              ? 'translate-x-8'
                              : ''
                          : ''
                      }`}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMessageMenu(msg.id)
                        }}
                        className={`px-3 py-2 rounded-2xl cursor-pointer transition-all ${
                          msg.uid === user?.uid
                            ? 'bg-cyan-600 text-white rounded-br-none'
                            : 'bg-slate-700 text-slate-100 rounded-bl-none'
                        } ${
                          selectedMessageId === msg.id
                            ? 'ring-2 ring-cyan-400'
                            : ''
                        }`}
                      >
                        {msg.replyTo && (
                          <div className="mb-2 pb-2 border-b border-opacity-30 border-white bg-cyan-900 rounded-xl p-2 overflow-hidden max-w-80 md:max-w-200">
                            <p className="text-xs font-semibold opacity-75">
                              Resposta para {msg.replyTo.nome}
                            </p>
                            <p className="text-xs opacity-75 truncate">
                              {msg.replyTo.texto}
                            </p>
                          </div>
                        )}
                        <p className="text-sm whitespace-normal message-text">
                          {msg.texto}
                        </p>
                      </div>

                      {/* Menu de Ações - Ao lado direito para minhas mensagens */}
                      {msg.uid === user?.uid && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute left-full ml-2 top-0 flex-col gap-1 ${
                            selectedMessageId === msg.id ? 'flex' : 'hidden'
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setReplyingTo(msg)
                              setSelectedMessageId(null)
                              setActivatingMessageId(null)
                            }}
                            className="p-1.5 button-cyan"
                            title="Responder"
                          >
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                          </button>
                          {canDeleteMessage(msg) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMessage(msg.id)
                                setSelectedMessageId(null)
                                setActivatingMessageId(null)
                              }}
                              className="p-1.5 button-red-real"
                              title="Deletar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Menu de Ações - Ao lado esquerdo para mensagens de outros (private) */}
                      {msg.uid !== user?.uid &&
                        selectedChat?.tipo === 'private' && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-full mr-2 top-0 flex-col gap-1 ${
                              selectedMessageId === msg.id
                                ? 'flex'
                                : 'hidden group-hover:flex'
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setReplyingTo(msg)
                                setSelectedMessageId(null)
                              }}
                              className="p-1.5 button-cyan"
                              title="Responder"
                            >
                              <ArrowUturnLeftIcon className="h-4 w-4" />
                            </button>
                            {canDeleteMessage(msg) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteMessage(msg.id)
                                  setSelectedMessageId(null)
                                }}
                                className="p-1.5 button-red-real"
                                title="Deletar"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply UI */}
          {replyingTo && (
            <div className="px-3 py-2 md:p-4 border-t border-slate-700/50 bg-slate-700/40">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">
                    Respondendo para {replyingTo.nome}
                  </p>
                  <p className="text-sm text-slate-200 break-all max-h-20 overflow-y-auto">
                    {replyingTo.texto}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-white transition-colors p-1 shrink-0"
                  title="Cancelar resposta"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-2 px-4 md:p-4 border-t border-slate-700/50 bg-slate-800/60 flex gap-2 z-50 rounded-b-none md:rounded-b-3xl max-h-32 md:max-h-none">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Digite uma mensagem..."
              className="flex-1 input-style-1 text-sm md:text-base"
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !messageText.trim()}
              className="button-cyan w-fit p-2 px-3 rounded-full flex items-center justify-center"
              title="Enviar mensagem"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${
            showChatList ? 'hidden' : 'flex'
          } md:flex flex-1 items-center justify-center text-slate-400 z-50 flex-col gap-4 p-8`}
        >
          <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-center">Selecione uma conversa para começar</p>
        </div>
      )}

      {/* Modal de Usuários - Drawer */}
      {showUsersModal && (
        <>
          {/* Overlay - apenas para clicar fora e fechar */}
          <div
            className="absolute inset-0 bg-transparent"
            style={{ zIndex: 9998 }}
            onClick={() => {
              setShowUsersModal(false)
              setSelectedUser(null)
            }}
          />
          {/* Drawer */}
          <div
            className="absolute top-18 w-full md:top-42 right-0 max-h-min md:w-80 rounded-b-3xl overflow-y-auto md:rounded-bl-3xl md:rounded-b-none bg-slate-800/80 md:bg-slate-800/60 backdrop-blur-xs border-none flex flex-col shadow-2xl"
            style={{ zIndex: 9999 }}
          >
            {/* Header do Modal */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h1 className="text-lg font-bold text-white truncate">
                {selectedUser ? `Opções` : 'Usuários'}
              </h1>
              <button
                onClick={() => {
                  setShowUsersModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700/50 rounded-full shrink-0"
                title="Fechar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto">
              {selectedUser ? (
                <div className="p-4 flex flex-col gap-2">
                  <div className="p-3 border border-slate-700/50 rounded-lg mb-2">
                    <p className="text-sm text-slate-400">
                      Usuário selecionado:
                    </p>
                    <p className="font-semibold text-white">
                      {selectedUser.name}
                    </p>
                  </div>
                  <button
                    onClick={handleStartPrivateChat}
                    disabled={isCreatingChat}
                    className="w-full p-3 text-left font-semibold text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCreatingChat
                      ? '⏳ Criando conversa...'
                      : '👥 Ver Conversas'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                    }}
                    className="w-full p-3 text-left font-semibold text-slate-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    ← Voltar
                  </button>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="p-4 flex flex-col gap-3">
                  <div className="text-center text-slate-400 py-8">
                    <p className="mb-2">Nenhum usuário carregado</p>
                    <p className="text-xs">
                      Verifique o console do navegador (F12)
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      console.log('🔄 Recarregando usuários...')
                      try {
                        const snapshot = await getDocs(collection(db, 'users'))
                        const users = snapshot.docs.map((doc) => ({
                          uid: doc.id,
                          name: doc.data().name || 'Usuário',
                          photo: doc.data().photo || '',
                        }))
                        setAllUsers(users)
                        console.log('✅ Carregados:', users.length)
                      } catch (error) {
                        console.error('❌ Erro:', error)
                        alert('Erro: ' + (error as Error).message)
                      }
                    }}
                    className="w-full p-3 text-center font-semibold text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors border border-cyan-300/30"
                  >
                    🔄 Tentar Novamente
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔓 Fazendo logout e login novamente...')
                        await auth.signOut()
                        router.push('/login')
                      } catch (error) {
                        console.error('Erro ao fazer logout:', error)
                      }
                    }}
                    className="w-full p-3 text-center font-semibold text-orange-300 hover:bg-slate-700/50 rounded-lg transition-colors border border-orange-300/30"
                  >
                    🔓 Fazer Login Novamente
                  </button>
                  <div className="text-xs text-slate-500 p-3 bg-slate-900/50 rounded-lg">
                    <p className="font-semibold mb-1">Informações técnicas:</p>
                    <p>Auth: {user?.email || 'Não autenticado'}</p>
                    <p>UID: {user?.uid || 'N/A'}</p>
                    <p>Usuários: {allUsers.length}</p>
                    <p>Verificado: {user?.emailVerified ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              ) : (
                <div>
                  {allUsers.map((u) => (
                    <div
                      key={u.uid}
                      onClick={() =>
                        setSelectedUser({ uid: u.uid, name: u.name })
                      }
                      className="p-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/40 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                        {u.photo ? (
                          <Image
                            src={u.photo}
                            alt={u.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-cyan-300 font-semibold">
                            {u.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-white">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
