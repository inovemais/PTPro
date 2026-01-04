import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, CardBody, Input, Button, ListGroup, ListGroupItem, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import apiClient from '../../lib/axios';
import scopes from '../../data/users/scopes';
import styles from './styles.module.scss';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
  };
  receiverId: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string;
  read: boolean;
}

interface Thread {
  userId?: string;
  userName?: string;
  userEmail?: string;
  otherUser?: {
    _id: string;
    name: string;
    email: string;
  };
  lastMessage?: string | {
    text?: string;
    createdAt?: string;
    senderId?: string;
  } | null;
  lastMessageDate?: string;
  unreadCount: number;
}

interface AvailableUser {
  _id: string;
  name: string;
  email: string;
}

const Chat: React.FC = () => {
  const { user, scopes: userScopes } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isTrainer = userScopes?.includes(scopes.PersonalTrainer) || userScopes?.includes('PersonalTrainer');
  const isAdmin = userScopes?.includes(scopes.Admin) || userScopes?.includes('admin') || userScopes?.includes('Admin');
  const canStartNewConversation = isTrainer || isAdmin;

  // Initial fetch and URL param handling
  useEffect(() => {
    fetchThreads();
  }, []);

  // Check for userId in URL params after threads are loaded
  useEffect(() => {
    const userIdParam = searchParams.get('userId');
    if (userIdParam && threads.length > 0 && !selectedThread) {
      // Check if the userId exists in the threads
      const threadExists = threads.some(
        (t: Thread) => (t.userId || t.otherUser?._id) === userIdParam
      );
      if (threadExists) {
        setSelectedThread(userIdParam);
        // Remove param from URL after setting
        setSearchParams({}, { replace: true });
      }
    }
  }, [threads, searchParams, selectedThread, setSearchParams]);

  useEffect(() => {
    const socket = getSocket();

    // Ensure user joins socket room when user changes
    if (user?.id) {
      socket.emit('join', user.id);
      console.log('Joined socket room for user:', user.id);
    }

    const handleNewMessage = (message: Message) => {
      console.log('[Chat] Received new message via socket:', message);
      
      // Normalize IDs to strings for comparison
      const senderId = String(message.senderId?._id || message.senderId || '');
      const receiverId = String(message.receiverId?._id || message.receiverId || '');
      const currentUserId = String(user?.id || '');
      const currentThread = selectedThread ? String(selectedThread) : null;
      
      console.log('[Chat] Message details:', {
        senderId,
        receiverId,
        currentUserId,
        currentThread,
        isForCurrentUser: receiverId === currentUserId,
        isFromSelectedThread: currentThread === senderId,
        isToSelectedThread: currentThread === receiverId
      });
      
      // Check if message is for current user
      const isForCurrentUser = receiverId === currentUserId;
      
      // Add message if:
      // 1. It's for the current user AND the sender's conversation is selected (receiver sees sender's messages)
      // 2. OR it's from the current user AND the receiver's conversation is selected (sender sees their own messages)
      const shouldAddToMessages = currentThread && (
        (isForCurrentUser && currentThread === senderId) || // Receiver viewing sender's conversation
        (senderId === currentUserId && currentThread === receiverId) // Sender viewing receiver's conversation
      );
      
      if (shouldAddToMessages) {
        console.log('[Chat] Adding message to current conversation');
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => String(m._id) === String(message._id));
          if (exists) {
            console.log('[Chat] Message already exists, skipping');
            return prev;
          }
          console.log('[Chat] Adding new message to state, total messages will be:', prev.length + 1);
          // Add message and sort by createdAt to maintain chronological order
          const updatedMessages = [...prev, message];
          return updatedMessages.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
          });
        });
      } else if (isForCurrentUser) {
        // Message is for current user but not in current thread
        // Refresh threads to show unread count
        console.log('[Chat] Message for current user but different thread, refreshing threads only');
      }
      
      // Always refresh threads to update unread count
      fetchThreads();
    };

    socket.on('chat:new_message', handleNewMessage);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
    };
  }, [selectedThread, user]);

  useEffect(() => {
    if (selectedThread) {
      console.log('[Chat] Thread selected, fetching messages:', selectedThread);
      fetchMessages(selectedThread);
    } else {
      // Clear messages when no thread is selected
      setMessages([]);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const response = await apiClient.get('/chat/threads');
      if (response.data.success) {
        setThreads(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!canStartNewConversation) return;
    
    setLoadingUsers(true);
    try {
      if (isAdmin) {
        // Admin can see all users (clients, trainers, and other admins)
        const response = await apiClient.get('/users', {
          params: { limit: 200 },
        });
        if (response.data) {
          // Handle both standardized format and legacy format
          const usersList = response.data.success && response.data.data 
            ? response.data.data 
            : (response.data.users || []);
          // Filter out current user
          const users = usersList
            .filter((u: any) => u._id !== user?.id)
            .map((u: any) => ({
              _id: u._id,
              name: u.name || 'Unknown',
              email: u.email || '',
            }));
          setAvailableUsers(users);
        }
      } else if (isTrainer) {
        // Trainer can see their clients
        const response = await apiClient.get('/clients', {
          params: { limit: 100 },
        });
        if (response.data.success) {
          // Map clients to users for chat
          const users = (response.data.data || []).map((client: any) => ({
            _id: client.userId?._id || client.userId,
            name: client.userId?.name || 'Unknown',
            email: client.userId?.email || '',
          }));
          setAvailableUsers(users);
        }
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleStartNewConversation = (userId: string) => {
    setSelectedThread(userId);
    setShowNewConversationModal(false);
    setSearchTerm('');
  };

  useEffect(() => {
    if (showNewConversationModal && canStartNewConversation) {
      fetchAvailableUsers();
    }
  }, [showNewConversationModal, canStartNewConversation]);

  const fetchMessages = async (userId: string) => {
    setLoading(true);
    try {
      console.log('[Chat] Fetching messages for user:', userId);
      // Fetch a larger limit to get more history, or implement pagination
      const response = await apiClient.get(`/chat/conversation/${userId}`, {
        params: { limit: 200, skip: 0 }, // Increased limit to show more history
      });
      if (response.data.success) {
        const fetchedMessages = response.data.data || [];
        console.log('[Chat] Fetched', fetchedMessages.length, 'messages');
        // Ensure messages are sorted by createdAt ascending (oldest first)
        const sortedMessages = fetchedMessages.sort((a: Message, b: Message) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        setMessages(sortedMessages);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setMessages([]); // Set empty array on error
      toast.error('Erro ao carregar mensagens', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('Sending message to:', selectedThread);
      const response = await apiClient.post('/chat', {
        receiverId: selectedThread,
        text: messageText,
      });
      
      console.log('Message sent response:', response.data);
      
      if (response.data.success) {
        const newMsg = response.data.data;
        console.log('[Chat] Message sent successfully, adding to state:', newMsg);
        // Add message to current conversation if it matches
        if (selectedThread) {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some((m) => String(m._id) === String(newMsg._id));
            if (exists) {
              console.log('[Chat] Sent message already exists in state, skipping');
              return prev;
            }
            // Add message and sort by createdAt to maintain chronological order
            const updatedMessages = [...prev, newMsg];
            return updatedMessages.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateA - dateB;
            });
          });
        }
        fetchThreads();
      } else {
        // Restore message if send failed
        setNewMessage(messageText);
        console.error('Message send failed:', response.data);
        toast.error('Erro ao enviar mensagem', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Restore message if send failed
      setNewMessage(messageText);
      // Show error toast
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao enviar mensagem';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedThreadData = threads.find((t) => (t.userId || t.otherUser?._id) === selectedThread);

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Chat</h2>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={4}>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h5 style={{ margin: 0 }}>Conversas</h5>
                {canStartNewConversation && (
                  <Button 
                    color="primary" 
                    size="sm"
                    onClick={() => setShowNewConversationModal(true)}
                  >
                    + Nova Conversa
                  </Button>
                )}
              </div>
              {threads.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  <p>Nenhuma conversa disponível.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Suas conversas aparecerão aqui quando você enviar ou receber mensagens.
                  </p>
                </div>
              ) : (
                <ListGroup>
                  {threads.map((thread, index) => {
                    const rawUserId = thread.userId || thread.otherUser?._id;
                    const userId = rawUserId ? String(rawUserId) : null;
                    const userName = thread.userName || thread.otherUser?.name || 'Unknown';
                    // Handle lastMessage which can be an object with text property or a string
                    let lastMessageText = '';
                    if (thread.lastMessage) {
                      if (typeof thread.lastMessage === 'string') {
                        lastMessageText = thread.lastMessage;
                      } else if (thread.lastMessage.text) {
                        lastMessageText = thread.lastMessage.text;
                      } else if (thread.lastMessage === null) {
                        lastMessageText = 'Nenhuma mensagem ainda';
                      }
                    } else if (thread.lastMessage === null) {
                      lastMessageText = 'Nenhuma mensagem ainda';
                    }
                    
                    if (!userId) {
                      return null;
                    }
                    
                    return (
                      <ListGroupItem
                        key={userId}
                        active={selectedThread === userId}
                        onClick={() => setSelectedThread(userId || null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <strong>{userName}</strong>
                          {thread.unreadCount > 0 && (
                            <span className="badge bg-primary ms-2">{thread.unreadCount}</span>
                          )}
                        </div>
                        {lastMessageText && (
                          <small className="text-muted">{lastMessageText}</small>
                        )}
                      </ListGroupItem>
                    );
                  })}
                </ListGroup>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <CardBody>
              {selectedThread ? (
                <>
                  <h5>{selectedThreadData?.userName || selectedThreadData?.otherUser?.name || 'Conversa'}</h5>
                  <div className={styles.messagesContainer}>
                    {loading ? (
                      <div>Carregando mensagens...</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <p>Nenhuma mensagem ainda.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Comece a conversa enviando uma mensagem abaixo.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        // Normalize IDs for comparison
                        const messageSenderId = String(message.senderId?._id || message.senderId || '');
                        const currentUserId = String(user?.id || '');
                        const isOwn = messageSenderId === currentUserId;
                        
                        return (
                          <div
                            key={message._id}
                            className={`${styles.message} ${isOwn ? styles.ownMessage : styles.otherMessage}`}
                          >
                            <div className={styles.messageText}>{message.text}</div>
                            <small className={styles.messageTime}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </small>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Selecione uma conversa para começar a conversar</p>
                </div>
              )}
              <div className={styles.inputContainer}>
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  disabled={!selectedThread}
                />
                <Button 
                  color="primary" 
                  onClick={sendMessage} 
                  className="ms-2"
                  disabled={!selectedThread || !newMessage.trim()}
                >
                  Enviar
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal para Nova Conversa */}
      <Modal isOpen={showNewConversationModal} toggle={() => setShowNewConversationModal(false)} size="lg">
        <ModalHeader toggle={() => setShowNewConversationModal(false)}>
          Iniciar Nova Conversa
        </ModalHeader>
        <ModalBody>
          <Input
            type="text"
            placeholder={isAdmin ? "Pesquisar utilizadores..." : "Pesquisar clientes..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
          ) : (
            <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {availableUsers
                .filter((user) => 
                  !searchTerm || 
                  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((user) => (
                  <ListGroupItem
                    key={user._id}
                    onClick={() => handleStartNewConversation(user._id)}
                    style={{ cursor: 'pointer' }}
                    action
                  >
                    <div>
                      <strong>{user.name}</strong>
                      {user.email && (
                        <div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      )}
                    </div>
                  </ListGroupItem>
                ))}
              {availableUsers.filter((user) => 
                !searchTerm || 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
              ).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>{isAdmin ? 'Nenhum utilizador encontrado.' : 'Nenhum cliente encontrado.'}</p>
                  {searchTerm && (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Tente pesquisar com outro termo.
                    </p>
                  )}
                </div>
              )}
            </ListGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowNewConversationModal(false)}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default Chat;

