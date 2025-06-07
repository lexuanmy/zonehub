import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '../../hooks/use-toast';

interface BookingFormProps {}

const BookingForm: React.FC<BookingFormProps> = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [field, setField] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string; available: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchField = async () => {
      try {
        const response = await api.get(`/api/fields/${fieldId}`);
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
  }, [fieldId, toast]);
  
  useEffect(() => {
    if (date) {
      generateTimeSlots();
    }
  }, [date]);
  
  const generateTimeSlots = async () => {
    if (!date || !fieldId) return;
    
    // Generate time slots from 6:00 to 22:00
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      const startTime = `${hour}:00`;
      const endTime = `${hour + 1}:00`;
      
      slots.push({
        start: startTime,
        end: endTime,
        available: true, // Default to available
      });
    }
    
    try {
      // Format date for API
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Fetch bookings for this field on this date
      const response = await api.get(`/api/bookings/field/${fieldId}`, {
        params: { date: formattedDate }
      });
      
      const bookings = response.data.bookings || [];
      
      // Mark booked slots as unavailable
      bookings.forEach((booking: any) => {
        const startHour = new Date(booking.start_time).getHours();
        const endHour = new Date(booking.end_time).getHours();
        
        for (let hour = startHour; hour < endHour; hour++) {
          const index = hour - 6; // Adjust for our 6:00 start
          if (index >= 0 && index < slots.length) {
            slots[index].available = false;
          }
        }
      });
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin đặt sân',
        variant: 'destructive',
      });
    }
  };
  
  const handleBooking = async () => {
    if (!date || selectedSlot === null || !field) return;
    
    const selectedTimeSlot = timeSlots[selectedSlot];
    const [startHour] = selectedTimeSlot.start.split(':').map(Number);
    const [endHour] = selectedTimeSlot.end.split(':').map(Number);
    
    const startDate = new Date(date);
    startDate.setHours(startHour, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endHour, 0, 0, 0);
    
    try {
      const bookingData = {
        field_id: parseInt(fieldId as string),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        total_price: field.price_per_hour,
        notes: 'Đặt sân qua ZoneHub'
      };
      
      const response = await api.post('/api/bookings', bookingData);
      
      toast({
        title: 'Đặt sân thành công',
        description: 'Bạn đã đặt sân thành công',
      });
      
      // Redirect to payment or booking confirmation
      navigate(`/profile`);
    } catch (error) {
      console.error('Error booking field:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể đặt sân. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải...</div>;
  }
  
  if (!field) {
    return <div className="text-center">Không tìm thấy thông tin sân bóng</div>;
  }
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Đặt sân: {field.name}</CardTitle>
        <CardDescription>
          Địa chỉ: {field.address}, {field.city}
        </CardDescription>
        <CardDescription>
          Giá: {field.price_per_hour.toLocaleString('vi-VN')} VNĐ/giờ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Chọn ngày</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={vi}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Chọn giờ</h3>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={selectedSlot === index ? "default" : "outline"}
                  className={`${!slot.available ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(index)}
                >
                  {slot.start} - {slot.end}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/fields/${fieldId}`)}>
          Quay lại
        </Button>
        <Button 
          disabled={selectedSlot === null} 
          onClick={handleBooking}
        >
          Đặt sân
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingForm;
