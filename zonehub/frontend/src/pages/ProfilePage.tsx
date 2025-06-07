import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    fetchBookings();
    fetchTeams();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử đặt sân',
        variant: 'destructive',
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/users/teams');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin đội bóng',
        variant: 'destructive',
      });
    } finally {
      setLoadingTeams(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Thông tin tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Tên đăng nhập</p>
              <p className="text-lg">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Họ và tên</p>
              <p className="text-lg">{user?.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Số điện thoại</p>
              <p className="text-lg">{user?.phone || 'Chưa cập nhật'}</p>
            </div>
          </div>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/profile/edit')}>
            Chỉnh sửa thông tin
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings">Lịch sử đặt sân</TabsTrigger>
          <TabsTrigger value="teams">Đội bóng của tôi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử đặt sân</CardTitle>
              <CardDescription>Danh sách các lần đặt sân của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="text-center py-4">Đang tải...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-4">
                  <p>Bạn chưa có lịch sử đặt sân nào</p>
                  <Button className="mt-2" onClick={() => navigate('/search')}>
                    Tìm sân ngay
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-4 flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{booking.field_name}</h3>
                              <p className="text-sm text-gray-500">
                                {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status === 'pending' ? 'Chờ xác nhận' : 
                               booking.status === 'confirmed' ? 'Đã xác nhận' :
                               booking.status === 'cancelled' ? 'Đã hủy' : 'Hoàn thành'}
                            </span>
                          </div>
                          <p className="mt-2 font-bold">{booking.total_price.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                        <div className="p-4 flex flex-row md:flex-col justify-end space-x-2 md:space-x-0 md:space-y-2 bg-gray-50">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/booking/${booking.id}/detail`)}
                          >
                            Chi tiết
                          </Button>
                          {booking.status === 'pending' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {/* Handle cancel */}}
                            >
                              Hủy đặt sân
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Đội bóng của tôi</CardTitle>
              <CardDescription>Danh sách các đội bóng bạn tham gia</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeams ? (
                <div className="text-center py-4">Đang tải...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-4">
                  <p>Bạn chưa tham gia đội bóng nào</p>
                  <div className="flex justify-center space-x-2 mt-2">
                    <Button onClick={() => navigate('/teams/new')}>
                      Tạo đội mới
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/teams/find')}>
                      Tìm đội
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team) => (
                    <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/teams/${team.id}`)}>
                      <CardContent className="p-4 flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{team.name}</h3>
                          <p className="text-sm text-gray-500">
                            {team.is_owner ? 'Chủ đội' : 'Thành viên'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={() => navigate('/teams/new')}>
                    <CardContent className="p-4 flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mx-auto">
                          +
                        </div>
                        <p className="mt-2 font-medium">Tạo đội mới</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
