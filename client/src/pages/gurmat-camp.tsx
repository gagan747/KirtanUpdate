import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import Layout from "@/components/layout";
import { z } from "zod";

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

export default function GurmatCamp() {
  const { toast } = useToast();
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
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
                  <p className="text-sm sm:text-lg">7017773924, 9456590113, 7060050630</p>
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