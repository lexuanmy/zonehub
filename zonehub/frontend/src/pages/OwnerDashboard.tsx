import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

const OwnerDashboard: React.FC = () => {
  const { toast } = useToast();
  const [fields, setFields] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFields: 0,
    totalBookings: 0,
    pendingBookings: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      // Fetch fields owned by the current user
      const fieldsResponse = await api.get('/api/fields/owner');
      setFields(fieldsResponse.data.fields || []);
      
      // Fetch bookings for all fields owned by the current user
      const bookingsResponse = await api.get('/api/bookings/owner');
      setBookings(bookingsResponse.data.bookings || []);
      
      // Calculate stats
      const allBookings = bookingsResponse.data.bookings || [];
      const pendingBookings = allBookings.filter((booking: any) => booking.status === 'pending');
      const confirmedBookings = allBookings.filter((booking: any) => booking.status === 'confirmed' || booking.status === 'completed');
      const totalRevenue = confirmedBookings.reduce((sum: number, booking: any) => sum + booking.total_price, 0);
      
      setStats({
        totalFields: fieldsResponse.data.fields.length,
        totalBookings: allBookings.length,
        pendingBookings: pendingBookings.length,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching owner data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu quản lý',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}`, { status: newStatus });
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
      
      toast({
        title: 'Thành công',
        description: `Đã cập nhật trạng thái đặt sân thành ${newStatus === 'confirmed' ? 'đã xác nhận' : 'đã hủy'}`,
      });
      
      // Refresh data
      fetchOwnerData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái đặt sân',
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
      <h1 className="text-3xl font-bold mb-6">Quản lý sân bóng</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.totalFields}</div>
            <p className="text-muted-foreground">Tổng số sân</p>
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
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-muted-foreground">Đặt sân chờ xác nhận</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.revenue.toLocaleString('vi-VN')} VNĐ</div>
            <p className="text-muted-foreground">Tổng doanh thu</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings">Quản lý đặt sân</TabsTrigger>
          <TabsTrigger value="fields">Quản lý sân bóng</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách đặt sân</CardTitle>
              <CardDescription>Quản lý tất cả các đặt sân cho sân bóng của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-4">
                  <p>Chưa có đặt sân nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sân</TableHead>
                      <TableHead>Người đặt</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Giá tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
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
                        <TableCell>
                          {booking.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleBookingStatusChange(booking.id, 'confirmed')}
                              >
                                Xác nhận
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleBookingStatusChange(booking.id, 'cancelled')}
                              >
                                Hủy
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sân bóng</CardTitle>
              <CardDescription>Quản lý tất cả các sân bóng của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button>Thêm sân mới</Button>
              </div>
              
              {fields.length === 0 ? (
                <div className="text-center py-4">
                  <p>Bạn chưa có sân bóng nào</p>
                  <Button className="mt-2">Thêm sân mới</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên sân</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Giá/giờ</TableHead>
                      <TableHead>Số lượt đặt</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>{field.address}, {field.city}</TableCell>
                        <TableCell>{field.price_per_hour.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell>{field.booking_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">Chỉnh sửa</Button>
                            <Button size="sm" variant="destructive">Xóa</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard;
