import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Define types (adjust based on actual API response)
interface FindTeamRequest {
  id: number;
  user_id: number;
  user_name?: string;
  position?: string;
  skill_level?: string;
  availability?: string;
  notes?: string;
  created_at: string;
}

interface FindOpponentRequest {
  id: number;
  team_id: number;
  team_name?: string;
  preferred_location?: string;
  preferred_date?: string;
  skill_level?: string;
  notes?: string;
  created_at: string;
}

interface Team {
  id: number;
  name: string;
}

const TeamFinderPage: React.FC = () => {
  const { user, token } = useAuth(); // Get token for Socket.IO auth
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize navigate
  const [findTeamRequests, setFindTeamRequests] = useState<FindTeamRequest[]>([]);
  const [findOpponentRequests, setFindOpponentRequests] = useState<FindOpponentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("findOpponent"); // Default to find opponent as per new logic

  // State for forms
  const [findTeamFormData, setFindTeamFormData] = useState({ position: '', skill_level: '', availability: '', notes: '' });
  const [findOpponentFormData, setFindOpponentFormData] = useState({ team_id: '', preferred_location: '', preferred_date: '', skill_level: '', notes: '' });
  const [userTeams, setUserTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchRequests();
    if (user) {
      fetchUserTeams();
    }
  }, [user]); // Re-fetch if user changes

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [teamRes, opponentRes] = await Promise.all([
        api.get('/api/team_finder/find-team'),
        api.get('/api/team_finder/find-opponent')
      ]);
      setFindTeamRequests(teamRes.data.requests || []);
      setFindOpponentRequests(opponentRes.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách yêu cầu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTeams = async () => {
    try {
      const response = await api.get('/api/users/me/teams'); 
      setUserTeams(response.data.teams || []);
    } catch (error) {
      console.error('Error fetching user teams:', error);
    }
  };

  const handleFindTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/team_finder/find-team', findTeamFormData);
      toast({ title: 'Thành công', description: 'Đã tạo yêu cầu tìm đội' });
      setFindTeamFormData({ position: '', skill_level: '', availability: '', notes: '' });
      fetchRequests();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.error || 'Không thể tạo yêu cầu', variant: 'destructive' });
    }
  };

  const handleFindOpponentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findOpponentFormData.team_id) {
        toast({ title: 'Lỗi', description: 'Vui lòng chọn đội của bạn', variant: 'destructive' });
        return;
    }
    try {
      await api.post('/api/team_finder/find-opponent', { 
        ...findOpponentFormData, 
        team_id: parseInt(findOpponentFormData.team_id)
      });
      toast({ title: 'Thành công', description: 'Đã tạo yêu cầu tìm đối thủ' });
      setFindOpponentFormData({ team_id: '', preferred_location: '', preferred_date: '', skill_level: '', notes: '' });
      fetchRequests();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.error || 'Không thể tạo yêu cầu', variant: 'destructive' });
    }
  };

  // --- New Matchmaking Actions ---
  const handleChallengeTeam = async (invitedTeamId: number) => {
    if (!findOpponentFormData.team_id) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn đội của bạn ở form trên trước khi thách đấu.', variant: 'destructive' });
      return;
    }
    const initiatingTeamId = parseInt(findOpponentFormData.team_id);
    if (initiatingTeamId === invitedTeamId) {
        toast({ title: 'Lỗi', description: 'Bạn không thể tự thách đấu đội của mình.', variant: 'destructive' });
        return;
    }

    try {
      const response = await api.post('/api/matchmaking/challenge', { 
        initiating_team_id: initiatingTeamId,
        invited_team_id: invitedTeamId,
        // Optionally add proposed date/location from the form or specific challenge context
      });
      toast({ title: 'Thành công', description: `Đã gửi lời thách đấu đến đội ID ${invitedTeamId}` });
      // Optionally navigate to a match status page or update UI
      console.log('Challenge response:', response.data);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.error || 'Không thể gửi lời thách đấu', variant: 'destructive' });
    }
  };

  // --- End New Matchmaking Actions ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formType: 'findTeam' | 'findOpponent') => {
    const { name, value } = e.target;
    if (formType === 'findTeam') {
      setFindTeamFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFindOpponentFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (value: string, name: string, formType: 'findTeam' | 'findOpponent') => {
     if (formType === 'findTeam') {
      setFindTeamFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFindOpponentFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const skillLevels = ["Mới chơi", "Trung bình", "Khá", "Giỏi"];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Tìm đội & Đối thủ</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="findOpponent">Tìm đối thủ</TabsTrigger>
          <TabsTrigger value="findTeam">Tìm đội chơi</TabsTrigger>
        </TabsList>
        
        {/* Find Opponent Tab */}
        <TabsContent value="findOpponent">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tạo yêu cầu tìm đối thủ</CardTitle>
              <CardDescription>Đội của bạn cần tìm đối thủ giao hữu? Đăng tin tại đây hoặc xem các đội đang tìm kèo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFindOpponentSubmit} className="space-y-4">
                 <div>
                  <Label htmlFor="team_id">Đội của bạn <span className="text-red-500">*</span></Label>
                   <Select name="team_id" value={findOpponentFormData.team_id} onValueChange={(value) => handleSelectChange(value, 'team_id', 'findOpponent')} required>
                    <SelectTrigger id="team_id">
                      <SelectValue placeholder="Chọn đội của bạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTeams.length === 0 && <SelectItem value="" disabled>Bạn chưa tham gia đội nào</SelectItem>}
                      {userTeams.map(team => <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="preferred_location">Khu vực mong muốn</Label>
                  <Input id="preferred_location" name="preferred_location" value={findOpponentFormData.preferred_location} onChange={(e) => handleInputChange(e, 'findOpponent')} placeholder="Quận 1, Gò Vấp,..." />
                </div>
                 <div>
                  <Label htmlFor="preferred_date">Ngày giờ mong muốn</Label>
                  <Input id="preferred_date" name="preferred_date" type="datetime-local" value={findOpponentFormData.preferred_date} onChange={(e) => handleInputChange(e, 'findOpponent')} />
                </div>
                <div>
                  <Label htmlFor="skill_level_opponent">Trình độ đội</Label>
                   <Select name="skill_level" value={findOpponentFormData.skill_level} onValueChange={(value) => handleSelectChange(value, 'skill_level', 'findOpponent')}>
                    <SelectTrigger id="skill_level_opponent">
                      <SelectValue placeholder="Chọn trình độ đội bạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes_opponent">Ghi chú thêm</Label>
                  <Textarea id="notes_opponent" name="notes" value={findOpponentFormData.notes} onChange={(e) => handleInputChange(e, 'findOpponent')} placeholder="Thông tin thêm về trận đấu mong muốn..." />
                </div>
                <Button type="submit">Đăng tin tìm đối thủ</Button>
              </form>
            </CardContent>
          </Card>
           <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Các đội đang tìm đối thủ</h2>
            {loading ? <p>Đang tải...</p> : findOpponentRequests.length === 0 ? <p>Chưa có yêu cầu nào.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findOpponentRequests.map(req => (
                  <Card key={req.id}>
                    <CardHeader>
                      <CardTitle>Đội: {req.team_name || `Team ID ${req.team_id}`}</CardTitle>
                      <CardDescription>Ngày đăng: {new Date(req.created_at).toLocaleDateString('vi-VN')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Khu vực:</strong> {req.preferred_location || 'N/A'}</p>
                      <p><strong>Thời gian:</strong> {req.preferred_date ? new Date(req.preferred_date).toLocaleString('vi-VN') : 'N/A'}</p>
                      <p><strong>Trình độ:</strong> {req.skill_level || 'N/A'}</p>
                      {req.notes && <p><strong>Ghi chú:</strong> {req.notes}</p>}
                      {/* Updated Button to Challenge */}
                      <Button 
                        size="sm" 
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleChallengeTeam(req.team_id)}
                        disabled={!findOpponentFormData.team_id || parseInt(findOpponentFormData.team_id) === req.team_id}
                      >
                        Thách đấu
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Find Team Tab */}
        <TabsContent value="findTeam">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tạo yêu cầu tìm đội</CardTitle>
              <CardDescription>Bạn đang tìm một đội để tham gia? Hãy để lại thông tin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFindTeamSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="position">Vị trí mong muốn</Label>
                  <Input id="position" name="position" value={findTeamFormData.position} onChange={(e) => handleInputChange(e, 'findTeam')} placeholder="Hậu vệ, Tiền đạo,..." />
                </div>
                <div>
                  <Label htmlFor="skill_level_team">Trình độ</Label>
                   <Select name="skill_level" value={findTeamFormData.skill_level} onValueChange={(value) => handleSelectChange(value, 'skill_level', 'findTeam')}>
                    <SelectTrigger id="skill_level_team">
                      <SelectValue placeholder="Chọn trình độ của bạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="availability">Thời gian rảnh</Label>
                  <Input id="availability" name="availability" value={findTeamFormData.availability} onChange={(e) => handleInputChange(e, 'findTeam')} placeholder="Cuối tuần, Tối thứ 3 & 5,..." />
                </div>
                <div>
                  <Label htmlFor="notes_team">Ghi chú thêm</Label>
                  <Textarea id="notes_team" name="notes" value={findTeamFormData.notes} onChange={(e) => handleInputChange(e, 'findTeam')} placeholder="Thông tin thêm về bạn..." />
                </div>
                <Button type="submit">Gửi yêu cầu tìm đội</Button>
              </form>
            </CardContent>
          </Card>
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Các yêu cầu tìm đội hiện có</h2>
            {loading ? <p>Đang tải...</p> : findTeamRequests.length === 0 ? <p>Chưa có yêu cầu nào.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findTeamRequests.map(req => (
                  <Card key={req.id}>
                    <CardHeader>
                      <CardTitle>Người chơi: {req.user_name || `User ID ${req.user_id}`}</CardTitle>
                      <CardDescription>Ngày đăng: {new Date(req.created_at).toLocaleDateString('vi-VN')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Vị trí:</strong> {req.position || 'N/A'}</p>
                      <p><strong>Trình độ:</strong> {req.skill_level || 'N/A'}</p>
                      <p><strong>Thời gian:</strong> {req.availability || 'N/A'}</p>
                      {req.notes && <p><strong>Ghi chú:</strong> {req.notes}</p>}
                      <Button size="sm" className="mt-2">Liên hệ / Mời vào đội</Button> {/* Needs invitation logic */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>

      {/* Placeholder for Match Status/Management - Could be a separate page or component */}
      {/* You would fetch matches involving the user's teams and display status (pending, confirmed) */}
      {/* Buttons to Accept/Confirm/Cancel challenges would go here or on a dedicated Match page */}

    </div>
  );
};

export default TeamFinderPage;

