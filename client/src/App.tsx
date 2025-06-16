
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientManagement } from '@/components/PatientManagement';
import { PrescriptionManagement } from '@/components/PrescriptionManagement';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { Stethoscope, FileText, Receipt, Users } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">MediCare Pro</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Phần mềm quản lý phòng khám - Medical Clinic Management System
          </p>
          <p className="text-gray-500">
            Quản lý bệnh nhân, đơn thuốc điện tử và hóa đơn điện tử
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-14">
            <TabsTrigger value="patients" className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Quản lý bệnh nhân
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Đơn thuốc điện tử
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5" />
              Hóa đơn điện tử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Quản lý thông tin bệnh nhân
                </CardTitle>
                <CardDescription>
                  Quản lý hồ sơ bệnh nhân, thông tin cá nhân và liên kết với đơn thuốc, hóa đơn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  Quản lý đơn thuốc điện tử
                </CardTitle>
                <CardDescription>
                  Tạo và quản lý đơn thuốc điện tử theo mẫu chuẩn của Bộ Y tế Việt Nam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrescriptionManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-orange-600" />
                  Quản lý hóa đơn điện tử
                </CardTitle>
                <CardDescription>
                  Tạo và quản lý hóa đơn điện tử tuân thủ quy định pháp luật Việt Nam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
