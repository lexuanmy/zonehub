import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  team_id?: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface ChatRoomProps {
  receiverId?: number;
  teamId?: number;
  receiverName?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ receiverId, teamId, receiverName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);
    
    // Join personal room
    if (user?.id) {
      socketRef.current.emit('join', { user_id: user.id });
    }
    
    // Join team room if applicable
    if (teamId) {
      socketRef.current.emit('join', { room_id: teamId });
    }
    
    // Listen for new messages
    socketRef.current.on('new_message', (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });
    
    // Fetch initial messages
    fetchMessages();
    
    return () => {
      // Clean up socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [receiverId, teamId, user?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let response;
      if (receiverId) {
        response = await api.get('/api/chat/messages', {
          params: { receiver_id: receiverId }
        });
      } else if (teamId) {
        response = await api.get('/api/chat/messages', {
          params: { team_id: teamId }
        });
      } else {
        throw new Error('Either receiverId or teamId must be provided');
      }
      
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải tin nhắn',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const messageData: any = {
        message: newMessage
      };
      
      if (receiverId) {
        messageData.receiver_id = receiverId;
      } else if (teamId) {
        messageData.team_id = teamId;
      }
      
      await api.post('/api/chat/messages', messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi tin nhắn',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>
          {teamId ? 'Nhóm chat đội bóng' : `Chat với ${receiverName}`}
        </CardTitle>
        <CardDescription>
          {teamId ? 'Trò chuyện với các thành viên trong đội' : 'Trò chuyện trực tiếp'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow mb-4">
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4">Chưa có tin nhắn nào</div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[80%]">
                    {message.sender_id !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatar-placeholder.png" alt={message.sender_name} />
                        <AvatarFallback>
                          {message.sender_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {teamId && message.sender_id !== user?.id && (
                        <div className="text-xs font-medium mb-1">
                          {message.sender_name || 'Người dùng'}
                        </div>
                      )}
                      <p>{message.message}</p>
                      <div className="text-xs mt-1 opacity-70">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}>Gửi</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatRoom;
