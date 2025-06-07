import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area'; // Assuming ScrollArea component exists
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'; // Assuming Avatar component exists
import { format } from 'date-fns';
import { vi } from 'date-fns/locale'; // Vietnamese locale for date formatting

interface ChatMessageData {
  id: number;
  room_id: number;
  sender_id: number | null;
  sender_name: string; // Provided by backend
  message_type: 'user' | 'system';
  content: string;
  timestamp: string;
}

interface ChatComponentProps {
  roomId: number;
  matchId: number; // For context
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'; // Ensure this matches backend

const ChatComponent: React.FC<ChatComponentProps> = ({ roomId }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      // Use setTimeout to ensure scroll happens after render
      setTimeout(() => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!roomId || !token) return;

    // Initialize Socket.IO connection
    // Pass token for potential authentication on connect or join
    socketRef.current = io(SOCKET_URL, {
      // auth: { token } // Standard way to send token on connection
      // query: { token } // Alternative if backend expects it in query
      // Backend example uses token in join_room event, so we don't strictly need it here
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      // Join the specific match room after connecting
      socket.emit('join_room', { room_id: roomId, token: token });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('room_joined', (data) => {
      console.log('Joined room:', data);
      // Backend sends history upon joining
    });

    socket.on('chat_history', (data: { room_id: number; messages: ChatMessageData[] }) => {
      if (data.room_id === roomId) {
        console.log('Received chat history:', data.messages);
        setMessages(data.messages);
        scrollToBottom();
      }
    });

    socket.on('new_message', (message: ChatMessageData) => {
      console.log('New message received:', message);
      if (message.room_id === roomId) {
        setMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Handle specific errors, e.g., auth failure
    });

    // Cleanup on component unmount
    return () => {
      if (socket) {
        console.log('Disconnecting socket...');
        socket.emit('leave_room', { room_id: roomId });
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomId, token, scrollToBottom]); // Add scrollToBottom dependency

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current && isConnected && token) {
      const messageData = {
        room_id: roomId,
        content: newMessage,
        token: token, // Send token with each message for stateless auth on backend event
      };
      socketRef.current.emit('send_message', messageData);
      setNewMessage('');
    }
  };

  return (
    <Card className="flex flex-col h-[600px]"> {/* Fixed height or make it flexible */}
      <CardHeader>
        <CardTitle>Chat Trận Đấu</CardTitle>
        <CardDescription>Room ID: {roomId} - {isConnected ? <span className="text-green-500">Đã kết nối</span> : <span className="text-red-500">Đang kết nối...</span>}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for other users/system */}
                {msg.sender_id !== user?.id && (
                  <Avatar className="h-8 w-8">
                    {/* Add logic for system avatar or user avatar based on sender_id */}
                    <AvatarFallback>{msg.message_type === 'system' ? 'SYS' : msg.sender_name?.substring(0, 1) || 'U'}</AvatarFallback>
                  </Avatar>
                )}
                {/* Message Bubble */}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${ 
                    msg.message_type === 'system' 
                      ? 'bg-gray-200 text-gray-600 text-sm italic w-full text-center' 
                      : msg.sender_id === user?.id 
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Sender Name for non-user messages */}
                  {msg.message_type === 'user' && msg.sender_id !== user?.id && (
                    <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70 text-right">
                    {format(new Date(msg.timestamp), 'HH:mm, dd/MM/yy', { locale: vi })}
                  </p>
                </div>
                 {/* Avatar for current user */}
                 {msg.sender_id === user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.full_name?.substring(0, 1) || 'ME'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!isConnected}
            className="flex-grow"
          />
          <Button type="submit" disabled={!isConnected || !newMessage.trim()}>Gửi</Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatComponent;

