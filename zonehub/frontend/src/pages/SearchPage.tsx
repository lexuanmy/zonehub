import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"; // Assuming Select component exists
import { useToast } from "../hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // For date formatting

// Define Field type (adjust based on actual API response)
interface Field {
  id: number;
  name: string;
  address: string;
  city: string; // Keep city or use area based on backend
  field_type: string; // e.g., 'Bóng đá 7 người', 'Cầu lông'
  cluster_name?: string; // e.g., 'Cụm sân ABC'
  price_per_hour: number;
  image_url?: string;
  description?: string;
}

const SearchPage: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fieldType: '', // Changed from city
    area: '',      // New field for Khu vực
    date: format(new Date(), 'yyyy-MM-dd'), // Default to today
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Placeholder data - replace with API calls if needed
  const fieldTypes = ['Tất cả loại sân', 'Bóng đá 5 người', 'Bóng đá 7 người', 'Cầu lông', 'Tennis'];
  const areas = ['Tất cả khu vực', 'Quận 1', 'Quận 2', 'Quận 3', 'Quận Bình Thạnh', 'Quận Gò Vấp'];

  useEffect(() => {
    fetchFields(); // Fetch initial fields
  }, []);

  const fetchFields = async (params = {}) => {
    setLoading(true);
    try {
      // Adjust API endpoint and params based on backend implementation
      const response = await api.get('/api/fields/search', { params }); 
      setFields(response.data.fields || []); // Ensure fields is always an array
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sân',
        variant: 'destructive',
      });
      setFields([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, date: e.target.value }));
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (filters.fieldType && filters.fieldType !== 'Tất cả loại sân') {
      params.field_type = filters.fieldType; // Adjust param name based on backend
    }
    if (filters.area && filters.area !== 'Tất cả khu vực') {
      params.area = filters.area; // Adjust param name based on backend
    }
    if (filters.date) {
      params.date = filters.date;
    }
    
    fetchFields(params);
  };

  const handleFieldClick = (fieldId: number) => {
    navigate(`/fields/${fieldId}`);
  };

  return (
    <div className="container mx-auto py-10">
      {/* Hero Section with Search Box - Mimicking the image */}
      <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-10 rounded-lg mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2">Đặt sân thể thao dễ dàng với ZoneHub</h1>
        <p className="text-lg mb-6">Tìm và đặt sân bóng đá, cầu lông, tennis nhanh chóng và tiện lợi</p>
        
        <Card className="max-w-3xl mx-auto text-left text-gray-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="fieldType" className="block text-sm font-medium mb-1">Loại sân</label>
                <Select 
                  name="fieldType"
                  value={filters.fieldType}
                  onValueChange={(value) => handleFilterChange('fieldType', value)}
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue placeholder="Chọn loại sân" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-medium mb-1">Khu vực</label>
                <Select 
                  name="area"
                  value={filters.area}
                  onValueChange={(value) => handleFilterChange('area', value)}
                >
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">Ngày</label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={filters.date}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            <Button 
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3" 
              onClick={handleSearch}
            >
              Tìm sân ngay
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured Fields Section */}
      <h2 className="text-2xl font-semibold mb-6 text-center">Sân nổi bật</h2>
      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : fields.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">Không tìm thấy sân nào phù hợp</h3>
          <p className="text-gray-500 mt-2">Vui lòng thử lại với tiêu chí khác hoặc xem tất cả sân.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <Card 
              key={field.id} 
              className="overflow-hidden flex flex-col"
            >
              {/* Image Placeholder - Match image style */}
              <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                {field.image_url ? (
                  <img
                    src={field.image_url}
                    alt={field.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>Hình ảnh sân</span> // Placeholder text like in the image
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{field.name}</CardTitle> 
                {field.cluster_name && (
                  <CardDescription>Cụm sân {field.cluster_name}</CardDescription>
                )}
                <CardDescription>{field.field_type}</CardDescription> 
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="font-semibold text-lg text-green-600">
                  {field.price_per_hour.toLocaleString('vi-VN')} VNĐ/giờ
                </p>
              </CardContent>
              <CardFooter>
                 {/* Button style matching the image */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleFieldClick(field.id)}
                >
                  Xem chi tiết
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;

