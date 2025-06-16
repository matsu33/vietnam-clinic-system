
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Trash2, Receipt, CreditCard, User, Building, Calculator } from 'lucide-react';
import type { Patient, CreateInvoiceInput } from '../../../server/src/schema';
import type { InvoiceWithLineItems } from '../../../server/src/handlers/get_invoice_with_line_items';

interface LineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export function InvoiceManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithLineItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithLineItems | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateInvoiceInput>({
    invoice_code: '',
    patient_id: null,
    seller_clinic_name: '',
    seller_tax_id: '',
    seller_address: '',
    seller_phone: '',
    buyer_full_name: '',
    buyer_address: null,
    buyer_tax_code: null,
    payment_method: 'cash',
    digital_signature: null,
    line_items: [{
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: 0.1
    }]
  });

  const loadPatients = useCallback(async () => {
    try {
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  const loadInvoicesForPatient = useCallback(async (patientId: number) => {
    try {
      const invoiceList = await trpc.getInvoicesByPatientId.query({ patient_id: patientId });
      const invoicesWithItems = await Promise.all(
        invoiceList.map(async (invoice) => {
          const invoiceWithLineItems = await trpc.getInvoiceWithLineItems.query({ id: invoice.id });
          return invoiceWithLineItems;
        })
      );
      setInvoices(invoicesWithItems.filter((i): i is InvoiceWithLineItems => i !== null));
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  }, []);

  const generateInvoiceCode = useCallback(async () => {
    try {
      const invoiceNumber = await trpc.generateInvoiceNumber.query();
      setFormData((prev: CreateInvoiceInput) => ({
        ...prev,
        invoice_code: invoiceNumber
      }));
    } catch (error) {
      console.error('Failed to generate invoice code:', error);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      loadInvoicesForPatient(selectedPatientId);
    } else {
      setInvoices([]);
    }
  }, [selectedPatientId, loadInvoicesForPatient]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const invoiceData = {
        ...formData,
        patient_id: selectedPatientId
      };
      
      await trpc.createInvoice.mutate(invoiceData);
      if (selectedPatientId) {
        await loadInvoicesForPatient(selectedPatientId);
      }
      
      // Reset form
      setFormData({
        invoice_code: '',
        patient_id: null,
        seller_clinic_name: '',
        seller_tax_id: '',
        seller_address: '',
        seller_phone: '',
        buyer_full_name: '',
        buyer_address: null,
        buyer_tax_code: null,
        payment_method: 'cash',
        digital_signature: null,
        line_items: [{
          description: '',
          quantity: 1,
          unit_price: 0,
          vat_rate: 0.1
        }]
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addLineItem = () => {
    setFormData((prev: CreateInvoiceInput) => ({
      ...prev,
      line_items: [...prev.line_items, {
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: 0.1
      }]
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length > 1) {
      setFormData((prev: CreateInvoiceInput) => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItemInput, value: string | number) => {
    setFormData((prev: CreateInvoiceInput) => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateLineAmount = (quantity: number, unitPrice: number): number => {
    return quantity * unitPrice;
  };

  const calculateVatAmount = (lineAmount: number, vatRate: number): number => {
    return lineAmount * vatRate;
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce(
      (sum, item) => sum + calculateLineAmount(item.quantity, item.unit_price), 0
    );
    const totalVat = formData.line_items.reduce(
      (sum, item) => sum + calculateVatAmount(calculateLineAmount(item.quantity, item.unit_price), item.vat_rate), 0
    );
    const total = subtotal + totalVat;
    
    return { subtotal, totalVat, total };
  };

  const filteredPatients = patients.filter((patient: Patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'credit_card': return 'Thẻ tín dụng';
      case 'insurance': return 'Bảo hiểm';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Chọn bệnh nhân
          </CardTitle>
          <CardDescription>
            Chọn bệnh nhân để tạo hoặc xem hóa đơn
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
              onValueChange={(value: string) => {
                const patientId = value === 'none' ? null : parseInt(value);
                setSelectedPatientId(patientId);
                if (patientId) {
                  const patient = patients.find((p: Patient) => p.id === patientId);
                  if (patient) {
                    setFormData((prev: CreateInvoiceInput) => ({
                      ...prev,
                      buyer_full_name: patient.full_name,
                      buyer_address: patient.address
                    }));
                  }
                }
              }}
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
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-900">{selectedPatient.full_name}</h3>
                  <p className="text-sm text-orange-700">{selectedPatient.address}</p>
                  {selectedPatient.phone_number && (
                    <p className="text-sm text-orange-600">SĐT: {selectedPatient.phone_number}</p>
                  )}
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={generateInvoiceCode}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo hóa đơn
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      {selectedPatientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-600" />
              Danh sách hóa đơn ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Chưa có hóa đơn nào cho bệnh nhân này</p>
                <p className="text-sm">Tạo hóa đơn mới để bắt đầu!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số hóa đơn</TableHead>
                    <TableHead>Mã hóa đơn</TableHead>
                    <TableHead>Ngày lập</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: InvoiceWithLineItems) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.invoice_code}</TableCell>
                      <TableCell>{formatDate(invoice.invoice_issue_date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total_payable_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPaymentMethodLabel(invoice.payment_method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
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

      {/* Create Invoice Dialog */}
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn mới</DialogTitle>
          <DialogDescription>
            Tạo hóa đơn cho bệnh nhân: {selectedPatient?.full_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateInvoice}>
          <div className="grid gap-6 py-4">
            {/* Invoice Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Thông tin hóa đơn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="invoice_code">Mã hóa đơn *</Label>
                  <Input
                    id="invoice_code"
                    value={formData.invoice_code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, invoice_code: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_method">Phương thức thanh toán *</Label>
                  <Select
                    value={formData.payment_method || 'cash'}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, payment_method: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tiền mặt</SelectItem>
                      <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                      <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                      <SelectItem value="insurance">Bảo hiểm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seller Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Thông tin đơn vị bán hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="seller_clinic_name">Tên phòng khám *</Label>
                  <Input
                    id="seller_clinic_name"
                    value={formData.seller_clinic_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, seller_clinic_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seller_tax_id">Mã số thuế *</Label>
                  <Input
                    id="seller_tax_id"
                    value={formData.seller_tax_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, seller_tax_id: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seller_address">Địa chỉ *</Label>
                  <Input
                    id="seller_address"
                    value={formData.seller_address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, seller_address: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seller_phone">Số điện thoại *</Label>
                  <Input
                    id="seller_phone"
                    value={formData.seller_phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, seller_phone: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Buyer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin người mua
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="buyer_full_name">Họ tên *</Label>
                  <Input
                    id="buyer_full_name"
                    value={formData.buyer_full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, buyer_full_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="buyer_tax_code">Mã số thuế</Label>
                  <Input
                    id="buyer_tax_code"
                    value={formData.buyer_tax_code || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, buyer_tax_code: e.target.value || null }))
                    }
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="buyer_address">Địa chỉ</Label>
                  <Input
                    id="buyer_address"
                    value={formData.buyer_address || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, buyer_address: e.target.value || null }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Chi tiết hóa đơn
                </h3>
                <Button type="button" variant="outline" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dòng
                </Button>
              </div>

              {formData.line_items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Dòng #{index + 1}</h4>
                    {formData.line_items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="grid gap-2 lg:col-span-2">
                      <Label>Mô tả *</Label>
                      <Input
                        value={item.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateLineItem(index, 'description', e.target.value)
                        }
                        placeholder="VD: Khám tổng quát"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Số lượng *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        min="1"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Đơn giá *</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        step="1000"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Thuế VAT (%)</Label>
                      <Select
                        value={(item.vat_rate * 100).toString()}
                        onValueChange={(value: string) =>
                          updateLineItem(index, 'vat_rate', parseFloat(value) / 100)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Thành tiền</Label>
                      <Input
                        value={formatCurrency(calculateLineAmount(item.quantity, item.unit_price))}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tiền thuế</Label>
                      <Input
                        value={formatCurrency(calculateVatAmount(calculateLineAmount(item.quantity, item.unit_price), item.vat_rate))}
                        disabled
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {/* Totals */}
              <Card className="p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền hàng:</p>
                    <p className="font-semibold">{formatCurrency(calculateTotals().subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng thuế VAT:</p>
                    <p className="font-semibold">{formatCurrency(calculateTotals().totalVat)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng thanh toán:</p>
                    <p className="font-bold text-lg text-orange-600">{formatCurrency(calculateTotals().total)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hóa đơn {selectedInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>
              Chi tiết hóa đơn - {formatDate(selectedInvoice?.invoice_issue_date || new Date())}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">HÓA ĐƠN ĐIỆN TỬ</h2>
                <p className="text-lg">Số: {selectedInvoice.invoice_number}</p>
                <p className="text-sm text-gray-600">Mã hóa đơn: {selectedInvoice.invoice_code}</p>
                <p className="text-sm text-gray-600">
                  Ngày lập: {formatDate(selectedInvoice.invoice_issue_date)}
                </p>
              </div>

              {/* Seller Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Đơn vị bán hàng</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Tên:</strong> {selectedInvoice.seller_clinic_name}</p>
                  <p><strong>MST:</strong> {selectedInvoice.seller_tax_id}</p>
                  <p><strong>Địa chỉ:</strong> {selectedInvoice.seller_address}</p>
                  <p><strong>Điện thoại:</strong> {selectedInvoice.seller_phone}</p>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Người mua hàng</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Tên:</strong> {selectedInvoice.buyer_full_name}</p>
                  {selectedInvoice.buyer_address && (
                    <p><strong>Địa chỉ:</strong> {selectedInvoice.buyer_address}</p>
                  )}
                  {selectedInvoice.buyer_tax_code && (
                    <p><strong>MST:</strong> {selectedInvoice.buyer_tax_code}</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-4">Chi tiết hóa đơn</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>SL</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Thành tiền</TableHead>
                      <TableHead>Thuế VAT</TableHead>
                      <TableHead>Tiền thuế</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.line_amount)}</TableCell>
                        <TableCell>{(item.vat_rate * 100).toFixed(0)}%</TableCell>
                        <TableCell>{formatCurrency(item.vat_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.total_amount_before_tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng thuế VAT:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.total_vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Tổng thanh toán:</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(selectedInvoice.total_payable_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <span>Phương thức thanh toán:</span>
                <Badge variant="outline">
                  {getPaymentMethodLabel(selectedInvoice.payment_method)}
                </Badge>
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Ngày tạo: {formatDate(selectedInvoice.created_at)}</p>
                {selectedInvoice.digital_signature && (
                  <p>Chữ ký số: Có</p>
                )}
                {selectedInvoice.qr_code && (
                  <p>Mã QR: Có</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
