import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FieldDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [field, setField] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchField = async () => {
      try {
        const response = await api.get(`/api/fields/${id}`);
        setField(response.data.field);
      } catch (error) {
        console.error('Error fetching field:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin sân bóng',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchField();
  }, [id, toast]);
  
  const handleBooking = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Yêu cầu đăng nhập',
        description: 'Vui lòng đăng nhập để đặt sân',
        variant: 'default',
      });
      navigate('/login');
      return;
    }
    
    navigate(`/booking/${id}`);
  };
  
  if (loading) {
    return <div className="container mx-auto py-10 flex justify-center">Đang tải...</div>;
  }
  
  if (!field) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Không tìm thấy sân bóng</h2>
              <p className="mt-2">Sân bóng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
              <Button className="mt-4" onClick={() => navigate('/search')}>
                Tìm sân khác
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{field.name}</CardTitle>
          <CardDescription>
            {field.address}, {field.city}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {field.image_url && (
            <div className="w-full h-64 overflow-hidden rounded-md">
              <img 
                src={field.image_url} 
                alt={field.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Thông tin sân</h3>
              <ul className="space-y-2">
                <li><strong>Giá:</strong> {field.price_per_hour.toLocaleString('vi-VN')} VNĐ/giờ</li>
                <li><strong>Địa chỉ:</strong> {field.address}</li>
                <li><strong>Thành phố:</strong> {field.city}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Mô tả</h3>
              <p>{field.description || 'Không có mô tả'}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button onClick={handleBooking}>
            Đặt sân
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FieldDetailPage;
