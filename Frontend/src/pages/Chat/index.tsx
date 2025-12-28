import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, CardBody, Input, Button, ListGroup, ListGroupItem } from 'reactstrap';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import apiClient from '../../lib/axios';
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
  otherUser: {
    _id: string;
    name: string;
    email: string;
  };
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
    const socket = getSocket();

    socket.on('chat:new_message', (message: Message) => {
      if (selectedThread && (message.senderId._id === selectedThread || message.receiverId._id === selectedThread)) {
        setMessages((prev) => [...prev, message]);
      }
      fetchThreads(); // Refresh threads to update unread count
    });

    return () => {
      socket.off('chat:new_message');
    };
  }, [selectedThread]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
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

  const fetchMessages = async (userId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/chat/conversation/${userId}`, {
        params: { limit: 50 },
      });
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;

    try {
      const response = await apiClient.post('/chat', {
        receiverId: selectedThread,
        text: newMessage,
      });
      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.data]);
        setNewMessage('');
        fetchThreads();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedThreadData = threads.find((t) => t.otherUser._id === selectedThread);

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
              <h5>Conversations</h5>
              <ListGroup>
                {threads.map((thread) => (
                  <ListGroupItem
                    key={thread.otherUser._id}
                    active={selectedThread === thread.otherUser._id}
                    onClick={() => setSelectedThread(thread.otherUser._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>{thread.otherUser.name}</strong>
                      {thread.unreadCount > 0 && (
                        <span className="badge bg-primary ms-2">{thread.unreadCount}</span>
                      )}
                    </div>
                    <small className="text-muted">{thread.lastMessage}</small>
                  </ListGroupItem>
                ))}
              </ListGroup>
            </CardBody>
          </Card>
        </Col>

        <Col md={8}>
          {selectedThread ? (
            <Card>
              <CardBody>
                <h5>{selectedThreadData?.otherUser.name}</h5>
                <div className={styles.messagesContainer}>
                  {loading ? (
                    <div>Loading messages...</div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId._id === user?.id;
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
                    placeholder="Type a message..."
                  />
                  <Button color="primary" onClick={sendMessage} className="ms-2">
                    Send
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <p>Select a conversation to start chatting</p>
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;

