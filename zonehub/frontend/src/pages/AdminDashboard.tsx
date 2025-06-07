import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFields: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersResponse = await api.get('/api/users/all');
      setUsers(usersResponse.data.users || []);
      
      // Fetch all fields
      const fieldsResponse = await api.get('/api/fields');
      setFields(fieldsResponse.data.fields || []);
      
      // Fetch all bookings
      const bookingsResponse = await api.get('/api/bookings/all');
      setBookings(bookingsResponse.data.bookings || []);
      
      // Calculate stats
      const confirmedBookings = bookingsResponse.data.bookings.filter(
        (booking: any) => booking.status === 'confirmed' || booking.status === 'completed'
      );
      const totalRevenue = confirmedBookings.reduce(
        (sum: number, booking: any) => sum + booking.total_price, 0
      );
      
      setStats({
        totalUsers: usersResponse.data.users.length,
        totalFields: fieldsResponse.data.fields.length,
        totalBookings: bookingsResponse.data.bookings.length,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu quản trị',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      toast({
        title: 'Thành công',
        description: `Đã cập nhật quyền người dùng thành ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật quyền người dùng',
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

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Quản trị hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-muted-foreground">Tổng số người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.totalFields}</div>
            <p className="text-muted-foreground">Tổng số sân bóng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-muted-foreground">Tổng số đặt sân</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('vi-VN')} VNĐ</div>
            <p className="text-muted-foreground">Tổng doanh thu</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Quản lý người dùng</TabsTrigger>
          <TabsTrigger value="fields">Quản lý sân bóng</TabsTrigger>
          <TabsTrigger value="bookings">Quản lý đặt sân</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>Quản lý tất cả người dùng trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'admin' ? 'default' :
                            user.role === 'owner' ? 'secondary' : 'outline'
                          }
                        >
                          {user.role === 'admin' ? 'Admin' : 
                           user.role === 'owner' ? 'Chủ sân' : 'Người dùng'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user.role !== 'owner' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserRoleChange(user.id, 'owner')}
                            >
                              Đặt làm chủ sân
                            </Button>
                          )}
                          {user.role !== 'admin' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserRoleChange(user.id, 'admin')}
                            >
                              Đặt làm admin
                            </Button>
                          )}
                          {user.role !== 'user' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUserRoleChange(user.id, 'user')}
                            >
                              Đặt làm người dùng
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sân bóng</CardTitle>
              <CardDescription>Quản lý tất cả sân bóng trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tên sân</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Chủ sân</TableHead>
                    <TableHead>Giá/giờ</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.id}</TableCell>
                      <TableCell className="font-medium">{field.name}</TableCell>
                      <TableCell>{field.address}, {field.city}</TableCell>
                      <TableCell>{field.owner_name}</TableCell>
                      <TableCell>{field.price_per_hour.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell>{formatDateTime(field.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">Xem chi tiết</Button>
                          <Button size="sm" variant="destructive">Xóa</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách đặt sân</CardTitle>
              <CardDescription>Quản lý tất cả đặt sân trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Sân</TableHead>
                    <TableHead>Người đặt</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Giá tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.id}</TableCell>
                      <TableCell>{booking.field_name}</TableCell>
                      <TableCell>{booking.user_name}</TableCell>
                      <TableCell>
                        {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                      </TableCell>
                      <TableCell>{booking.total_price.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === 'pending' ? 'outline' :
                            booking.status === 'confirmed' ? 'default' :
                            booking.status === 'cancelled' ? 'destructive' : 'secondary'
                          }
                        >
                          {booking.status === 'pending' ? 'Chờ xác nhận' : 
                           booking.status === 'confirmed' ? 'Đã xác nhận' :
                           booking.status === 'cancelled' ? 'Đã hủy' : 'Hoàn thành'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
