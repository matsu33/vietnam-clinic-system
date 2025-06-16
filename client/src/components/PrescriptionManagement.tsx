import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Trash2, FileText, Pill, User, Stethoscope } from 'lucide-react';
import type { Patient, CreatePrescriptionInput } from '../../../server/src/schema';
import type { PrescriptionWithMedications } from '../../../server/src/handlers/get_prescription_with_medications';

interface MedicationInput {
  medicine_name: string;
  strength: string;
  dosage_form: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instruction: string;
}

export function PrescriptionManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithMedications[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithMedications | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePrescriptionInput>({
    patient_id: 0,
    diagnosis: '',
    icd_10_code: null,
    doctor_name: '',
    doctor_qualification: '',
    clinic_name: '',
    clinic_code: '',
    digital_signature: null,
    additional_notes: null,
    medications: [{
      medicine_name: '',
      strength: '',
      dosage_form: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instruction: ''
    }]
  });

  const loadPatients = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error: unknown) {
      console.error('Failed to load patients:', error);
      if (error && typeof error === 'object' && 'data' in error && 
          typeof (error as { data?: { code?: string } }).data === 'object' &&
          (error as { data: { code?: string } }).data?.code === 'UNAUTHORIZED') {
        // Auth will be handled at the App level
        window.location.reload();
      } else {
        setError('Không thể tải danh sách bệnh nhân');
      }
    }
  }, []);

  const loadPrescriptionsForPatient = useCallback(async (patientId: number) => {
    try {
      setError(null);
      const prescriptionList = await trpc.getPrescriptionsByPatientId.query({ patient_id: patientId });
      const prescriptionsWithMeds = await Promise.all(
        prescriptionList.map(async (prescription) => {
          const prescriptionWithMedications = await trpc.getPrescriptionWithMedications.query({ id: prescription.id });
          return prescriptionWithMedications;
        })
      );
      setPrescriptions(prescriptionsWithMeds.filter((p): p is PrescriptionWithMedications => p !== null));
    } catch (error: unknown) {
      console.error('Failed to load prescriptions:', error);
      if (error && typeof error === 'object' && 'data' in error && 
          typeof (error as { data?: { code?: string } }).data === 'object' &&
          (error as { data: { code?: string } }).data?.code === 'UNAUTHORIZED') {
        // Auth will be handled at the App level
        window.location.reload();
      } else {
        setError('Không thể tải danh sách đơn thuốc');
      }
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      loadPrescriptionsForPatient(selectedPatientId);
    } else {
      setPrescriptions([]);
    }
  }, [selectedPatientId, loadPrescriptionsForPatient]);

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const prescriptionData = {
        ...formData,
        patient_id: selectedPatientId
      };
      
      await trpc.createPrescription.mutate(prescriptionData);
      await loadPrescriptionsForPatient(selectedPatientId);
      
      // Reset form
      setFormData({
        patient_id: 0,
        diagnosis: '',
        icd_10_code: null,
        doctor_name: '',
        doctor_qualification: '',
        clinic_name: '',
        clinic_code: '',
        digital_signature: null,
        additional_notes: null,
        medications: [{
          medicine_name: '',
          strength: '',
          dosage_form: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: '',
          instruction: ''
        }]
      });
      setIsCreateDialogOpen(false);
    } catch (error: unknown) {
      console.error('Failed to create prescription:', error);
      if (error && typeof error === 'object' && 'data' in error && 
          typeof (error as { data?: { code?: string } }).data === 'object' &&
          (error as { data: { code?: string } }).data?.code === 'UNAUTHORIZED') {
        // Auth will be handled at the App level
        window.location.reload();
      } else {
        setError('Không thể tạo đơn thuốc');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addMedication = () => {
    setFormData((prev: CreatePrescriptionInput) => ({
      ...prev,
      medications: [...prev.medications, {
        medicine_name: '',
        strength: '',
        dosage_form: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: '',
        instruction: ''
      }]
    }));
  };

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData((prev: CreatePrescriptionInput) => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index)
      }));
    }
  };

  const updateMedication = (index: number, field: keyof MedicationInput, value: string) => {
    setFormData((prev: CreatePrescriptionInput) => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const filteredPatients = patients.filter((patient: Patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId);

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

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Chọn bệnh nhân
          </CardTitle>
          <CardDescription>
            Chọn bệnh nhân để tạo hoặc xem đơn thuốc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
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
            <Select
              value={selectedPatientId?.toString() || 'none'}
              onValueChange={(value: string) => setSelectedPatientId(value === 'none' ? null : parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Chọn bệnh nhân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chọn bệnh nhân</SelectItem>
                {filteredPatients.map((patient: Patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.full_name} - #{patient.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedPatient.full_name}</h3>
                  <p className="text-sm text-blue-700">
                    {getGenderLabel(selectedPatient.gender)} • {calculateAge(selectedPatient.date_of_birth)} tuổi • 
                    Sinh: {formatDate(selectedPatient.date_of_birth)}
                  </p>
                  <p className="text-sm text-blue-600">{selectedPatient.address}</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo đơn thuốc
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tạo đơn thuốc mới</DialogTitle>
                      <DialogDescription>
                        Tạo đơn thuốc cho bệnh nhân: {selectedPatient?.full_name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePrescription}>
                      <div className="grid gap-6 py-4">
                        {/* Doctor and Clinic Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Thông tin bác sĩ và phòng khám
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="doctor_name">Tên bác sĩ *</Label>
                              <Input
                                id="doctor_name"
                                value={formData.doctor_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreatePrescriptionInput) => ({ ...prev, doctor_name: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="doctor_qualification">Bằng cấp/Chuyên khoa *</Label>
                              <Input
                                id="doctor_qualification"
                                value={formData.doctor_qualification}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreatePrescriptionInput) => ({ ...prev, doctor_qualification: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="clinic_name">Tên phòng khám *</Label>
                              <Input
                                id="clinic_name"
                                value={formData.clinic_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreatePrescriptionInput) => ({ ...prev, clinic_name: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="clinic_code">Mã phòng khám *</Label>
                              <Input
                                id="clinic_code"
                                value={formData.clinic_code}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreatePrescriptionInput) => ({ ...prev, clinic_code: e.target.value }))
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Diagnosis */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Chẩn đoán</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="diagnosis">Chẩn đoán *</Label>
                              <Input
                                id="diagnosis"
                                value={formData.diagnosis}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreatePrescriptionInput) => ({ ...prev, diagnosis: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="icd_10_code">Mã ICD-10</Label>
                              <Input
                                id="icd_10_code"
                                value={formData.icd_10_code || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreatePrescriptionInput) => ({ ...prev, icd_10_code: e.target.value || null }))
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Medications */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Pill className="h-5 w-5" />
                              Danh sách thuốc
                            </h3>
                            <Button type="button" variant="outline" onClick={addMedication}>
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm thuốc
                            </Button>
                          </div>

                          {formData.medications.map((medication, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold">Thuốc #{index + 1}</h4>
                                {formData.medications.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeMedication(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                  <Label>Tên thuốc *</Label>
                                  <Input
                                    value={medication.medicine_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'medicine_name', e.target.value)
                                    }
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Hàm lượng *</Label>
                                  <Input
                                    value={medication.strength}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'strength', e.target.value)
                                    }
                                    placeholder="VD: 500mg"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Dạng bào chế *</Label>
                                  <Input
                                    value={medication.dosage_form}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'dosage_form', e.target.value)
                                    }
                                    placeholder="VD: Viên nén"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Liều dùng *</Label>
                                  <Input
                                    value={medication.dosage}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'dosage', e.target.value)
                                    }
                                    placeholder="VD: 1 viên"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Tần suất *</Label>
                                  <Input
                                    value={medication.frequency}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'frequency', e.target.value)
                                    }
                                    placeholder="VD: 2 lần/ngày"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Thời gian dùng *</Label>
                                  <Input
                                    value={medication.duration}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'duration', e.target.value)
                                    }
                                    placeholder="VD: 7 ngày"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Số lượng *</Label>
                                  <Input
                                    value={medication.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'quantity', e.target.value)
                                    }
                                    placeholder="VD: 14 viên"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Cách dùng *</Label>
                                  <Input
                                    value={medication.instruction}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      updateMedication(index, 'instruction', e.target.value)
                                    }
                                    placeholder="VD: Uống sau ăn"
                                    required
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <Separator />

                        {/* Additional Notes */}
                        <div className="grid gap-2">
                          <Label htmlFor="additional_notes">Ghi chú thêm</Label>
                          <Textarea
                            id="additional_notes"
                            value={formData.additional_notes || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setFormData((prev: CreatePrescriptionInput) => ({ ...prev, additional_notes: e.target.value || null }))
                            }
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Đang tạo...' : 'Tạo đơn thuốc'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      {selectedPatientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Danh sách đơn thuốc ({prescriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Chưa có đơn thuốc nào cho bệnh nhân này</p>
                <p className="text-sm">Tạo đơn thuốc mới để bắt đầu!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Chẩn đoán</TableHead>
                    <TableHead>Bác sĩ</TableHead>
                    <TableHead>Ngày kê đơn</TableHead>
                    <TableHead>Số loại thuốc</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((prescription: PrescriptionWithMedications) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">#{prescription.id}</TableCell>
                      <TableCell>{prescription.diagnosis}</TableCell>
                      <TableCell>{prescription.doctor_name}</TableCell>
                      <TableCell>{formatDate(prescription.date_of_issue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {prescription.medications.length} loại thuốc
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Prescription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đơn thuốc #{selectedPrescription?.id}</DialogTitle>
            <DialogDescription>
              Chi tiết đơn thuốc - {formatDate(selectedPrescription?.date_of_issue || new Date())}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Thông tin bệnh nhân</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Họ tên:</span>
                    <p className="font-medium">{selectedPrescription.patient_full_name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Tuổi:</span>
                    <p className="font-medium">
                      {selectedPrescription.patient_age || calculateAge(selectedPrescription.patient_date_of_birth)} tuổi
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700">Giới tính:</span>
                    <p className="font-medium">{getGenderLabel(selectedPrescription.gender)}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Địa chỉ:</span>
                    <p className="font-medium">{selectedPrescription.address}</p>
                  </div>
                </div>
              </div>

              {/* Doctor & Clinic Info */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Thông tin bác sĩ & phòng khám</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Bác sĩ:</span>
                    <p className="font-medium">{selectedPrescription.doctor_name}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Bằng cấp:</span>
                    <p className="font-medium">{selectedPrescription.doctor_qualification}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Phòng khám:</span>
                    <p className="font-medium">{selectedPrescription.clinic_name}</p>
                  </div>
                  <div>
                    <span className="text-green-700">Mã phòng khám:</span>
                    <p className="font-medium">{selectedPrescription.clinic_code}</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="font-semibold mb-2">Chẩn đoán</h3>
                <p className="bg-gray-50 p-3 rounded">{selectedPrescription.diagnosis}</p>
                {selectedPrescription.icd_10_code && (
                  <p className="text-sm text-gray-600 mt-1">Mã ICD-10: {selectedPrescription.icd_10_code}</p>
                )}
              </div>

              {/* Medications */}
              <div>
                <h3 className="font-semibold mb-4">Danh sách thuốc ({selectedPrescription.medications.length})</h3>
                <div className="space-y-4">
                  {selectedPrescription.medications.map((medication) => (
                    <Card key={medication.id} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">{medication.medicine_name}</h4>
                        <Badge variant="outline">{medication.strength}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Dạng bào chế:</span>
                          <p className="font-medium">{medication.dosage_form}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Liều dùng:</span>
                          <p className="font-medium">{medication.dosage}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Tần suất:</span>
                          <p className="font-medium">{medication.frequency}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Thời gian:</span>
                          <p className="font-medium">{medication.duration}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Số lượng:</span>
                          <p className="font-medium">{medication.quantity}</p>
                        </div>
                        <div className="md:col-span-3">
                          <span className="text-gray-600">Cách dùng:</span>
                          <p className="font-medium">{medication.instruction}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              {selectedPrescription.additional_notes && (
                <div>
                  <h3 className="font-semibold mb-2">Ghi chú thêm</h3>
                  <p className="bg-gray-50 p-3 rounded">{selectedPrescription.additional_notes}</p>
                </div>
              )}

              {/* Footer Info */}
              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Ngày kê đơn: {formatDate(selectedPrescription.date_of_issue)}</p>
                <p>Ngày tạo: {formatDate(selectedPrescription.created_at)}</p>
                {selectedPrescription.digital_signature && (
                  <p>Chữ ký số: Có</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}