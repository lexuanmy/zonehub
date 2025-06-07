import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;
      
      await register(registerData);
      toast({
        title: 'Đăng ký thành công',
        description: 'Chào mừng bạn đến với ZoneHub',
      });
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Đăng ký thất bại',
        description: error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đăng ký tài khoản</CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản mới để sử dụng ZoneHub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập <span className="text-red-500">*</span></Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Nhập họ và tên"
                value={formData.full_name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="text-red-500">*</span></Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            Đã có tài khoản?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
