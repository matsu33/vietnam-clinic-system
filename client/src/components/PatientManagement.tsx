
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Eye, Phone, MapPin, Calendar, User } from 'lucide-react';
import type { Patient, CreatePatientInput, UpdatePatientInput } from '../../../server/src/schema';

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreatePatientInput>({
    full_name: '',
    date_of_birth: new Date(),
    gender: 'male',
    address: '',
    phone_number: null,
    insurance_information: null
  });

  const [editFormData, setEditFormData] = useState<UpdatePatientInput>({
    id: 0,
    full_name: '',
    date_of_birth: new Date(),
    gender: 'male',
    address: '',
    phone_number: null,
    insurance_information: null
  });

  const loadPatients = useCallback(async () => {
    try {
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newPatient = await trpc.createPatient.mutate(createFormData);
      setPatients((prev: Patient[]) => [...prev, newPatient]);
      setCreateFormData({
        full_name: '',
        date_of_birth: new Date(),
        gender: 'male',
        address: '',
        phone_number: null,
        insurance_information: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedPatient = await trpc.updatePatient.mutate(editFormData);
      setPatients((prev: Patient[]) =>
        prev.map((p: Patient) => p.id === updatedPatient.id ? updatedPatient : p)
      );
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (patient: Patient) => {
    setEditFormData({
      id: patient.id,
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      address: patient.address,
      phone_number: patient.phone_number,
      insurance_information: patient.insurance_information
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const filteredPatients = patients.filter((patient: Patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getGenderLabel = (gender: string): string => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return gender;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm bệnh nhân..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Thêm bệnh nhân mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm bệnh nhân mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin bệnh nhân để tạo hồ sơ mới
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePatient}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Họ và tên *</Label>
                  <Input
                    id="full_name"
                    value={createFormData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, full_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date_of_birth">Ngày sinh *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={createFormData.date_of_birth.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, date_of_birth: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gender">Giới tính *</Label>
                  <Select
                    value={createFormData.gender || 'male'}
                    onValueChange={(value: 'male' | 'female' | 'other') =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Địa chỉ *</Label>
                  <Input
                    id="address"
                    value={createFormData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, address: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Số điện thoại</Label>
                  <Input
                    id="phone_number"
                    value={createFormData.phone_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, phone_number: e.target.value || null }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="insurance_info">Thông tin bảo hiểm</Label>
                  <Input
                    id="insurance_info"
                    value={createFormData.insurance_information || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, insurance_information: e.target.value || null }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang tạo...' : 'Tạo bệnh nhân'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Không tìm thấy bệnh nhân nào' : 'Chưa có bệnh nhân nào. Thêm bệnh nhân mới để bắt đầu!'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Tuổi</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient: Patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">#{patient.id}</TableCell>
                    <TableCell>{patient.full_name}</TableCell>
                    <TableCell>{calculateAge(patient.date_of_birth)} tuổi</TableCell>
                    <TableCell>
                      <Badge variant={patient.gender === 'male' ? 'default' : patient.gender === 'female' ? 'secondary' : 'outline'}>
                        {getGenderLabel(patient.gender)}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.phone_number || 'Chưa có'}</TableCell>
                    <TableCell>{formatDate(patient.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(patient)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Patient Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thông tin bệnh nhân</DialogTitle>
            <DialogDescription>
              Chi tiết hồ sơ bệnh nhân #{selectedPatient?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedPatient.full_name}</h3>
                  <p className="text-sm text-gray-500">Mã BN: #{selectedPatient.id}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Ngày sinh:</span>
                  </div>
                  <p className="font-medium">{formatDate(selectedPatient.date_of_birth)}</p>
                  <p className="text-sm text-gray-500">({calculateAge(selectedPatient.date_of_birth)} tuổi)</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Giới tính:</span>
                  </div>
                  <Badge variant={selectedPatient.gender === 'male' ? 'default' : selectedPatient.gender === 'female' ? 'secondary' : 'outline'}>
                    {getGenderLabel(selectedPatient.gender)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Địa chỉ:</span>
                </div>
                <p className="font-medium">{selectedPatient.address}</p>
              </div>

              {selectedPatient.phone_number && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>Số điện thoại:</span>
                  </div>
                  <p className="font-medium">{selectedPatient.phone_number}</p>
                </div>
              )}

              {selectedPatient.insurance_information && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Thông tin bảo hiểm:</span>
                  </div>
                  <p className="font-medium">{selectedPatient.insurance_information}</p>
                </div>
              )}

              <Separator />
              
              <div className="text-xs text-gray-500">
                <p>Ngày tạo: {formatDate(selectedPatient.created_at)}</p>
                <p>Cập nhật lần cuối: {formatDate(selectedPatient.updated_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin bệnh nhân</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin bệnh nhân #{editFormData.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePatient}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_full_name">Họ và tên *</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_date_of_birth">Ngày sinh *</Label>
                <Input
                  id="edit_date_of_birth"
                  type="date"
                  value={editFormData.date_of_birth ? new Date(editFormData.date_of_birth).toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, date_of_birth: new Date(e.target.value) }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_gender">Giới tính *</Label>
                <Select
                  value={editFormData.gender || 'male'}
                  onValueChange={(value: 'male' | 'female' | 'other') =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_address">Địa chỉ *</Label>
                <Input
                  id="edit_address"
                  value={editFormData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, address: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_phone_number">Số điện thoại</Label>
                <Input
                  id="edit_phone_number"
                  value={editFormData.phone_number || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, phone_number: e.target.value || null }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_insurance_info">Thông tin bảo hiểm</Label>
                <Input
                  id="edit_insurance_info"
                  value={editFormData.insurance_information || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, insurance_information: e.target.value || null }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
