import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import Layout from "@/components/layout";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getToken } from "firebase/messaging";

// Fix for TypeScript to recognize jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().min(1, "Address is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  email: z.string().email("Invalid email address")
});

type FormData = z.infer<typeof formSchema>;

// Registration type for admin view
interface Registration {
  id: number;
  name: string;
  age: string;
  gender: string;
  address: string;
  fatherName: string;
  motherName: string;
  contactNumber: string;
  email: string;
  createdAt: string;
}

// Admin component for exporting registrations
function AdminExportButton() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  // Use query to fetch registrations
  const { data: registrations, isLoading, error } = useQuery({
    queryKey: ["gurmatCampRegistrations"],
    queryFn: async () => {
      try {
          const token = localStorage.getItem("jwt_token");
        const response = await fetch("/api/gurmat-camp", {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch registrations: ${response.status}`);
        }
        
        return response.json() as Promise<Registration[]>;
      } catch (error) {
        console.error("Error fetching registrations:", error);
        throw error;
      }
    }
  });
  
  const handleExportPDF = () => {
    if (!registrations || registrations.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no registrations to export.",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      console.log("Starting PDF generation...");
      
      // Initialize PDF document with explicit font
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Try to catch specific errors
      try {
        // Add title
        doc.setFont("helvetica");
        doc.setFontSize(18);
       // doc.text("Gurmat Camp Registrations", 14, 22);
        
        // Add date
        doc.setFontSize(11);
       // doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        console.log("Added title and date");
        
        // Simple table data
        const tableColumn = ["Name", "Age", "Gender", "Contact", "Email", "Registration Date"];
        const tableRows = registrations.map(reg => [
          reg.name,
          reg.age,
          reg.gender,
          reg.contactNumber,
          reg.email,
          new Date(reg.createdAt).toLocaleDateString()
        ]);
        
        console.log("Prepared table data", tableRows.length);
        
        // Generate the table with simpler options
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid'
        });
        
        console.log("Generated table");
      } catch (innerError) {
        console.error("Error in PDF generation steps:", innerError);
        
        // Fallback to extremely simple PDF if table generation failed
        doc.setFont("helvetica");
        doc.setFontSize(12);
        doc.text("Gurmat Camp Registrations", 20, 20);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Total registrations: ${registrations.length}`, 20, 40);
        
        let yPos = 50;
        registrations.forEach((reg, i) => {
          doc.text(`${i+1}. ${reg.name} (${reg.age}, ${reg.gender}), Contact: ${reg.contactNumber}`, 20, yPos);
          yPos += 10;
          if (yPos > 280) { // Add a new page if we're near the bottom
            doc.addPage();
            yPos = 20;
          }
        });
      }
      
      // Save the PDF
      doc.save("gurmat-camp-registrations.pdf");
      console.log("PDF saved");
      
      toast({
        title: "Export Successful",
        description: "PDF has been generated and downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Fallback to CSV export if PDF fails completely
      try {
        console.log("Falling back to CSV export");
        const csvContent = "data:text/csv;charset=utf-8," + 
          "Name,Age,Gender,Address,Father Name,Mother Name,Contact,Email,Registration Date\n" +
          registrations.map(reg => {
            return `"${reg.name}","${reg.age}","${reg.gender}","${reg.address}","${reg.fatherName}","${reg.motherName}","${reg.contactNumber}","${reg.email}","${new Date(reg.createdAt).toLocaleDateString()}"`;
          }).join("\n");
          
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "gurmat-camp-registrations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Successful",
          description: "CSV has been generated and downloaded (PDF generation failed).",
        });
      } catch (csvError) {
        console.error("CSV fallback also failed:", csvError);
        toast({
          title: "Export Failed",
          description: `Failed to generate export: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mt-8 mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Gurmat Camp Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Export all registration data as a PDF file.</p>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting || isLoading || !!error}
            >
              {isExporting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Exporting...
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download className="mr-2 h-4 w-7 flex justify-center"/>
                  PDF
                </div>
              )}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">Error loading data: {error instanceof Error ? error.message : "Unknown error"}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Admin component for viewing and exporting registrations
function AdminRegistrationsView() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch registrations
  const { data: registrations, isLoading, error, refetch } = useQuery({
    queryKey: ["gurmatCampRegistrations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/gurmat-camp", {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch registrations: ${response.status}`);
        }
        
        return response.json() as Promise<Registration[]>;
      } catch (error) {
        console.error("Error fetching registrations:", error);
        throw error;
      }
    }
  });

  const handleExportPDF = () => {
    if (!registrations || registrations.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no registrations to export.",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      console.log("Starting PDF generation...");
      
      // Initialize PDF document with explicit font
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Try to catch specific errors
      try {
        // Add title
        doc.setFont("helvetica");
        doc.setFontSize(18);
       // doc.text("Gurmat Camp Registrations", 14, 22);
        
        // Add date
        doc.setFontSize(11);
       // doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        console.log("Added title and date");
        
        // Simple table data
        const tableColumn = ["Name", "Age", "Gender", "Contact", "Email", "Registration Date"];
        const tableRows = registrations.map(reg => [
          reg.name,
          reg.age,
          reg.gender,
          reg.contactNumber,
          reg.email,
          new Date(reg.createdAt).toLocaleDateString()
        ]);
        
        console.log("Prepared table data", tableRows.length);
        
        // Generate the table with simpler options
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid'
        });
        
        console.log("Generated table");
      } catch (innerError) {
        console.error("Error in PDF generation steps:", innerError);
        
        // Fallback to extremely simple PDF if table generation failed
        doc.setFont("helvetica");
        doc.setFontSize(12);
        doc.text("Gurmat Camp Registrations", 20, 20);
        // doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Total registrations: ${registrations.length}`, 20, 40);
        
        let yPos = 50;
        registrations.forEach((reg, i) => {
          doc.text(`${i+1}. ${reg.name} (${reg.age}, ${reg.gender}), Contact: ${reg.contactNumber}`, 20, yPos);
          yPos += 10;
          if (yPos > 280) { // Add a new page if we're near the bottom
            doc.addPage();
            yPos = 20;
          }
        });
      }
      
      // Save the PDF
      doc.save("gurmat-camp-registrations.pdf");
      console.log("PDF saved");
      
      toast({
        title: "Export Successful",
        description: "PDF has been generated and downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Fallback to CSV export if PDF fails completely
      try {
        console.log("Falling back to CSV export");
        const csvContent = "data:text/csv;charset=utf-8," + 
          "Name,Age,Gender,Address,Father Name,Mother Name,Contact,Email,Registration Date\n" +
          registrations.map(reg => {
            return `"${reg.name}","${reg.age}","${reg.gender}","${reg.address}","${reg.fatherName}","${reg.motherName}","${reg.contactNumber}","${reg.email}","${new Date(reg.createdAt).toLocaleDateString()}"`;
          }).join("\n");
          
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "gurmat-camp-registrations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Successful",
          description: "CSV has been generated and downloaded (PDF generation failed).",
        });
      } catch (csvError) {
        console.error("CSV fallback also failed:", csvError);
        toast({
          title: "Export Failed",
          description: `Failed to generate export: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Gurmat Camp Registrations</span>
              <Button disabled variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load registrations. Please try again later.</p>
            <p className="text-xs text-muted-foreground mt-2">{error instanceof Error ? error.message : "Unknown error"}</p>
            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
              >
                Retry
              </Button>
              <Button 
                onClick={handleExportPDF} 
                variant="outline" 
                size="sm"
                disabled={isExporting}
              >
                {isExporting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"/>
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gurmat Camp Registrations ({registrations?.length || 0})</span>
            <Button 
              onClick={handleExportPDF} 
              variant="outline" 
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"/>
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registrations && registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left">Name</th>
                    <th className="py-2 px-3 text-left">Age</th>
                    <th className="py-2 px-3 text-left">Gender</th>
                    <th className="py-2 px-3 text-left">Contact</th>
                    <th className="py-2 px-3 text-left">Email</th>
                    <th className="py-2 px-3 text-left">Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{reg.name}</td>
                      <td className="py-2 px-3">{reg.age}</td>
                      <td className="py-2 px-3">{reg.gender}</td>
                      <td className="py-2 px-3">{reg.contactNumber}</td>
                      <td className="py-2 px-3">{reg.email}</td>
                      <td className="py-2 px-3">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No registrations yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GurmatCamp() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: "",
    address: "",
    fatherName: "",
    motherName: "",
    contactNumber: "",
    email: ""
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const result = formSchema.safeParse(formData);
      
      if (!result.success) {
        const formattedErrors: Partial<Record<keyof FormData, string>> = {};
        result.error.errors.forEach(error => {
          if (error.path[0]) {
            formattedErrors[error.path[0] as keyof FormData] = error.message;
          }
        });
        setErrors(formattedErrors);
        setIsSubmitting(false);
        return;
      }
      
      // Submit form data
      await apiRequest("POST", "/api/gurmat-camp", formData);
      
      toast({
        title: "Registration Successful",
        description: "Your registration for the Summer Gurmat Camp 2025 has been submitted.",
        variant: "default",
      });
      
      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "",
        address: "",
        fatherName: "",
        motherName: "",
        contactNumber: "",
        email: ""
      });
      
    } catch (error: any) {
      // Handle email already exists error
      if (error.message.includes("email already exists")) {
        setErrors(prev => ({ ...prev, email: "This email is already registered" }));
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-4 px-2 sm:py-10 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Admin View */}
          {isAdmin && <AdminExportButton />}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden mt-8"
          >
            {/* Header with Images */}
            <div className="relative bg-amber-100 px-4 py-6 sm:p-8 text-center border-b">
              {/* Nishan Sahib - Left */}
              <div className="absolute left-2 top-2 sm:left-6 sm:top-4 w-12 h-16 sm:w-20 sm:h-24 flex items-center justify-center">
                <img 
                  src="/images/nishansahib2.png" 
                  alt="Nishan Sahib" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Khanda - Right */}
              <div className="absolute right-2 top-2 sm:right-6 sm:top-4 w-12 h-16 sm:w-20 sm:h-24 flex items-center justify-center">
                <img 
                  src="/images/khanda.png" 
                  alt="Khanda" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Title - with proper spacing for mobile */}
              <div className="mx-16 sm:mx-24">
                <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-amber-800 leading-tight">
                  SUMMER GURMAT CAMP 2025
                </h1>
                <div className="w-full h-px bg-black my-2 sm:my-4"></div>
                <h2 className="text-base sm:text-xl md:text-3xl font-bold text-gray-800">
                  REGISTRATION FORM
                </h2>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* First Row: Name, Age, Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Name - takes more space */}
                  <div className="sm:col-span-6 space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base font-semibold">Name:</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs sm:text-sm">{errors.name}</p>}
                  </div>
                  
                  {/* Age */}
                  <div className="sm:col-span-3 space-y-2">
                    <Label htmlFor="age" className="text-sm sm:text-base font-semibold">Age:</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.age ? 'border-red-500' : ''}`}
                    />
                    {errors.age && <p className="text-red-500 text-xs sm:text-sm">{errors.age}</p>}
                  </div>
                  
                  {/* Gender */}
                  <div className="sm:col-span-3 space-y-2">
                    <Label htmlFor="gender" className="text-sm sm:text-base font-semibold">Gender:</Label>
                    <Input
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.gender ? 'border-red-500' : ''}`}
                    />
                    {errors.gender && <p className="text-red-500 text-xs sm:text-sm">{errors.gender}</p>}
                  </div>
                </div>
                
                {/* Address - Full width */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm sm:text-base font-semibold">Address:</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`bg-gray-100 h-10 sm:h-12 ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && <p className="text-red-500 text-xs sm:text-sm">{errors.address}</p>}
                </div>
                
                {/* Parents Names Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Father's Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fatherName" className="text-sm sm:text-base font-semibold">Father's Name:</Label>
                    <Input
                      id="fatherName"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.fatherName ? 'border-red-500' : ''}`}
                    />
                    {errors.fatherName && <p className="text-red-500 text-xs sm:text-sm">{errors.fatherName}</p>}
                  </div>
                  
                  {/* Mother's Name */}
                  <div className="space-y-2">
                    <Label htmlFor="motherName" className="text-sm sm:text-base font-semibold">Mother's Name:</Label>
                    <Input
                      id="motherName"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.motherName ? 'border-red-500' : ''}`}
                    />
                    {errors.motherName && <p className="text-red-500 text-xs sm:text-sm">{errors.motherName}</p>}
                  </div>
                </div>
                
                {/* Contact and Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="text-sm sm:text-base font-semibold">Contact Number:</Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.contactNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.contactNumber && <p className="text-red-500 text-xs sm:text-sm">{errors.contactNumber}</p>}
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base font-semibold">Email Address:</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-gray-100 h-10 sm:h-12 ${errors.email ? 'border-red-500' : ''}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs sm:text-sm">{errors.email}</p>}
                  </div>
                </div>
              </div>
              
              {/* Venue and Details */}
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-center">
                <h3 className="text-lg sm:text-xl font-bold underline">VENUE</h3>
                <p className="text-sm sm:text-lg font-medium">At Gurdwara Nanaksar Thath, 5 Chander Road, Dalanwala, Dehradun.</p>
                
                <h3 className="text-base sm:text-xl font-bold">From 22nd Jun to 28th Jun 2025</h3>
                <h3 className="text-base sm:text-xl font-bold">TIMINGS- 4:00 pm to 9:00 pm</h3>
                
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-lg sm:text-xl font-bold underline">INSTRUCTIONS</h3>
                  <p className="text-sm sm:text-lg font-semibold">Age limit: 8 to 25 Years.</p>
                  <p className="text-sm sm:text-lg font-semibold">Submit this form by 20th June.</p>
                </div>
                
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-base sm:text-lg font-bold">Contact for more details</h3>
                  <p className="text-sm sm:text-lg">7017773924, 9837557170, 7060050630</p>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="mt-6 sm:mt-8 flex justify-center">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 sm:px-8 sm:py-3 text-sm sm:text-lg font-semibold w-full sm:w-auto"
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}