import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { Bell } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

const NotificationCenter: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.notifications.filter((n: any) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/count');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu tất cả thông báo là đã đọc',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể đánh dấu tất cả thông báo',
        variant: 'destructive',
      });
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '🏟️';
      case 'team':
        return '⚽';
      case 'payment':
        return '💰';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 md:w-96 z-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Thông báo</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                Đánh dấu tất cả đã đọc
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4">Không có thông báo nào</div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-md ${
                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="font-medium">{notification.title}</div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDateTime(notification.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenter;
