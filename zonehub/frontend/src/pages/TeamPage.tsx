import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { useParams, useNavigate } from 'react-router-dom';

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    fetchTeamData();
  }, [id]);
  
  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/teams/${id}`);
      setTeam(response.data.team);
      setMembers(response.data.members || []);
      setIsOwner(response.data.is_owner || false);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin đội bóng',
        variant: 'destructive',
      });
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveMember = async (memberId: number) => {
    try {
      await api.delete(`/api/teams/${id}/members/${memberId}`);
      
      // Update local state
      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
      
      toast({
        title: 'Thành công',
        description: 'Đã xóa thành viên khỏi đội',
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thành viên',
        variant: 'destructive',
      });
    }
  };
  
  const handleLeaveTeam = async () => {
    try {
      await api.delete(`/api/teams/${id}/leave`);
      
      toast({
        title: 'Thành công',
        description: 'Bạn đã rời khỏi đội bóng',
      });
      
      navigate('/profile');
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể rời khỏi đội bóng',
        variant: 'destructive',
      });
    }
  };
  
  if (loading) {
    return <div className="container mx-auto py-10 text-center">Đang tải...</div>;
  }
  
  if (!team) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Không tìm thấy đội bóng</h2>
              <p className="mt-2">Đội bóng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
              <Button className="mt-4" onClick={() => navigate('/profile')}>
                Quay lại trang cá nhân
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{team.name}</CardTitle>
              <CardDescription>Đội bóng được tạo ngày {new Date(team.created_at).toLocaleDateString('vi-VN')}</CardDescription>
            </div>
            {!isOwner && (
              <Button variant="destructive" onClick={handleLeaveTeam}>
                Rời đội
              </Button>
            )}
            {isOwner && (
              <Button onClick={() => navigate(`/teams/${id}/edit`)}>
                Chỉnh sửa đội
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Mô tả</h3>
              <p>{team.description || 'Không có mô tả'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Thông tin liên hệ</h3>
              <p><strong>Email:</strong> {team.contact_email || 'Không có'}</p>
              <p><strong>Số điện thoại:</strong> {team.contact_phone || 'Không có'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Thành viên đội bóng</CardTitle>
            {isOwner && (
              <Button onClick={() => navigate(`/teams/${id}/invite`)}>
                Mời thành viên
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                {isOwner && <TableHead>Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_owner ? 'default' : 'outline'}>
                      {member.is_owner ? 'Đội trưởng' : 'Thành viên'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.joined_at).toLocaleDateString('vi-VN')}</TableCell>
                  {isOwner && !member.is_owner && (
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  )}
                  {isOwner && member.is_owner && (
                    <TableCell>-</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;
