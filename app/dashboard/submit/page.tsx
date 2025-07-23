// "use client";

// import type React from "react";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { supabase } from "@/lib/supabase";
// import { useAuth } from "@/lib/auth-context";
// import { toast } from "@/hooks/use-toast";
// import { uploadFile, validateFile } from "@/lib/file-upload";
// import {
//   Upload,
//   X,
//   FileText,
//   ImageIcon,
//   Calendar,
//   MapPin,
//   Plane,
//   Car,
//   Train,
//   Bus,
//   UtensilsCrossed,
//   Users,
//   User,
// } from "lucide-react";
// import { id } from "date-fns/locale";

// interface ExpenseCategory {
//   id: string;
//   name: string;
//   description: string;
// }

// interface MealType {
//   id: string;
//   name: string;
//   description: string;
// }

// interface UploadedFile {
//   file: File;
//   url?: string;
//   uploading: boolean;
//   error?: string;
// }

// const transportModes = [
//   { value: "flight", label: "Flight", icon: Plane },
//   { value: "car", label: "Car/Taxi", icon: Car },
//   { value: "train", label: "Train", icon: Train },
//   { value: "bus", label: "Bus", icon: Bus },
//   { value: "bike", label: "Bike", icon: Car },
//   { value: "other", label: "Other", icon: Car },
// ];

// export default function SubmitExpensePage() {
//   const [categories, setCategories] = useState<ExpenseCategory[]>([]);
//   const [mealTypes, setMealTypes] = useState<MealType[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
//   const [formData, setFormData] = useState({
//     title: "",
//     categoryId: "",
//     amount: "",
//     expenseDate: "",
//     description: "",

//     // Travel fields
//     isTravelExpense: false,
//     fromLocation: "",
//     toLocation: "",
//     travelStartDate: "",
//     travelEndDate: "",
//     transportMode: "",
//     accommodationDetails: "",
//     businessPurpose: "",

//     // Food fields
//     isFoodExpense: false,
//     foodName: "",
//     restaurantName: "",
//     withClient: false,
//     clientName: "",
//     clientCompany: "",
//     numberOfAttendees: "1",
//     mealType: "",
//   });
//   const { userProfile } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     fetchCategories();
//     fetchMealTypes();
//   }, []);

//   const fetchCategories = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("expense_categories")
//         .select("*")
//         .eq("is_active", true)
//         .order("name");

//       if (error) {
//         throw error;
//       }

//       setCategories(data || []);
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load expense categories",
//         variant: "destructive",
//       });
//     }
//   };

//   const fetchMealTypes = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("meal_types")
//         .select("*")
//         .eq("is_active", true)
//         .order("name");

//       if (error) {
//         throw error;
//       }

//       setMealTypes(data || []);
//     } catch (error) {
//       console.error("Error fetching meal types:", error);
//       // Don't show error toast for meal types as it's not critical
//     }
//   };

//   const handleFileUpload = async (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const files = Array.from(event.target.files || []);

//     for (const file of files) {
//       const validation = validateFile(file);
//       if (!validation.valid) {
//         toast({
//           title: "Invalid File",
//           description: validation.error,
//           variant: "destructive",
//         });
//         continue;
//       }

//       const newFile: UploadedFile = {
//         file,
//         uploading: true,
//       };

//       setUploadedFiles((prev) => [...prev, newFile]);

//       try {
//         const result = await uploadFile(file);
//         if (result.error) {
//           throw new Error(result.error);
//         }

//         setUploadedFiles((prev) =>
//           prev.map((f) =>
//             f.file === file ? { ...f, url: result.url, uploading: false } : f
//           )
//         );
//       } catch (error: any) {
//         setUploadedFiles((prev) =>
//           prev.map((f) =>
//             f.file === file
//               ? { ...f, uploading: false, error: error.message }
//               : f
//           )
//         );
//         toast({
//           title: "Upload Failed",
//           description: error.message,
//           variant: "destructive",
//         });
//       }
//     }
//   };

//   const removeFile = (fileToRemove: File) => {
//     setUploadedFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!userProfile) return;

//     // Validate travel fields if it's a travel expense
//     if (formData.isTravelExpense) {
//       if (
//         !formData.fromLocation ||
//         !formData.toLocation ||
//         !formData.travelStartDate ||
//         !formData.travelEndDate ||
//         !formData.transportMode ||
//         !formData.businessPurpose
//       ) {
//         toast({
//           title: "Missing Information",
//           description: "Please fill in all travel-related fields",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (
//         new Date(formData.travelStartDate) > new Date(formData.travelEndDate)
//       ) {
//         toast({
//           title: "Invalid Dates",
//           description: "Travel start date must be before end date",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     // Validate food fields if it's a food expense
//     if (formData.isFoodExpense) {
//       if (!formData.foodName || !formData.mealType) {
//         toast({
//           title: "Missing Information",
//           description: "Please fill in food name and meal type",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (formData.withClient && !formData.clientName) {
//         toast({
//           title: "Missing Information",
//           description: "Please provide client name when dining with client",
//           variant: "destructive",
//         });
//         return;
//       }

//       const attendees = Number.parseInt(formData.numberOfAttendees);
//       if (attendees < 1 || attendees > 50) {
//         toast({
//           title: "Invalid Number",
//           description: "Number of attendees must be between 1 and 50",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     // Check if files are still uploading
//     const stillUploading = uploadedFiles.some((f) => f.uploading);
//     if (stillUploading) {
//       toast({
//         title: "Upload in Progress",
//         description: "Please wait for all files to finish uploading",
//         variant: "destructive",
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       // Get the main bill file (first uploaded file)
//       const mainBillFile = uploadedFiles[0];

//       const expenseData = {
//         user_id: userProfile.id,
//         category_id: formData.categoryId,
//         title: formData.title,
//         description: formData.description,
//         amount: Number.parseFloat(formData.amount),
//         expense_date: formData.expenseDate,
//         status: "pending",
//         // Travel fields
//         is_travel_expense: formData.isTravelExpense,
//         ...(formData.isTravelExpense && {
//           from_location: formData.fromLocation,
//           to_location: formData.toLocation,
//           travel_start_date: formData.travelStartDate,
//           travel_end_date: formData.travelEndDate,
//           transport_mode: formData.transportMode,
//           accommodation_details: formData.accommodationDetails,
//           business_purpose: formData.businessPurpose,
//         }),
//         // Food fields
//         is_food_expense: formData.isFoodExpense,
//         ...(formData.isFoodExpense && {
//           food_name: formData.foodName,
//           restaurant_name: formData.restaurantName,
//           with_client: formData.withClient,
//           client_name: formData.withClient ? formData.clientName : null,
//           client_company: formData.withClient ? formData.clientCompany : null,
//           number_of_attendees: Number.parseInt(formData.numberOfAttendees),
//           meal_type: formData.mealType,
//         }),
//         // File attachment
//         ...(mainBillFile?.url && {
//           bill_file_url: mainBillFile.url,
//           bill_file_name: mainBillFile.file.name,
//           bill_file_size: mainBillFile.file.size,
//         }),
//       };

//       const { data: expenseReport, error } = await supabase
//         .from("expense_reports")
//         .insert(expenseData)
//         .select()
//         .single();

//       if (error) throw error;

//       // Upload additional attachments if any
//       if (uploadedFiles.length > 1) {
//         const attachments = uploadedFiles.slice(1).map((file) => ({
//           expense_report_id: expenseReport.id,
//           file_name: file.file.name,
//           file_url: file.url!,
//           file_size: file.file.size,
//           file_type: file.file.type,
//         }));

//         const { error: attachmentError } = await supabase
//           .from("expense_attachments")
//           .insert(attachments);

//         if (attachmentError) {
//           console.error("Error uploading attachments:", attachmentError);
//           // Don't fail the whole submission for attachment errors
//         }
//       }

//       toast({
//         title: "Success",
//         description: "Expense report submitted successfully",
//       });

//       router.push("/dashboard/reports");
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (
//     field: string,
//     value: string | boolean | number
//   ) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return (
//       Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
//     );
//   };

//   const getFileIcon = (file: File) => {
//     if (file.type.startsWith("image/")) {
//       return <ImageIcon className="h-4 w-4" />;
//     }
//     return <FileText className="h-4 w-4" />;
//   };

//   return (
//     <div className="max-w-4xl mx-auto">
//       <Card>
//         <CardHeader>
//           <CardTitle>Submit Expense Report</CardTitle>
//           <CardDescription>
//             Fill out the form below to submit a new expense report for
//             reimbursement
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Basic Information */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">Basic Information</h3>

//               <div className="space-y-2">
//                 <Label htmlFor="title">Expense Title</Label>
//                 <Input
//                   id="title"
//                   value={formData.title}
//                   onChange={(e) => handleInputChange("title", e.target.value)}
//                   placeholder="Brief description of the expense"
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="category">Category</Label>
//                 <Select
//                   value={formData.categoryId}
//                   onValueChange={(value) =>
//                     handleInputChange("categoryId", value)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select expense category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {categories.map((category) => (
//                       <SelectItem key={category.id} value={category.id}>
//                         {category.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="amount">Amount (₹)</Label>
//                   <Input
//                     id="amount"
//                     type="number"
//                     step="0.01"
//                     min="0"
//                     value={formData.amount}
//                     onChange={(e) =>
//                       handleInputChange("amount", e.target.value)
//                     }
//                     placeholder="0.00"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="expenseDate">Expense Date</Label>
//                   <Input
//                     id="expenseDate"
//                     type="date"
//                     value={formData.expenseDate}
//                     onChange={(e) =>
//                       handleInputChange("expenseDate", e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Textarea
//                   id="description"
//                   value={formData.description}
//                   onChange={(e) =>
//                     handleInputChange("description", e.target.value)
//                   }
//                   placeholder="Provide additional details about this expense..."
//                   rows={3}
//                 />
//               </div>
//             </div>

//             {/* Expense Type Toggles */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">Expense Type</h3>

//               <div className="flex flex-col space-y-3">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="isTravelExpense"
//                     checked={formData.isTravelExpense}
//                     onCheckedChange={(checked) => {
//                       handleInputChange("isTravelExpense", checked as boolean);
//                       if (checked) handleInputChange("isFoodExpense", false);
//                     }}
//                   />
//                   <Label
//                     htmlFor="isTravelExpense"
//                     className="text-sm font-medium"
//                   >
//                     This is a travel-related expense
//                   </Label>
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="isFoodExpense"
//                     checked={formData.isFoodExpense}
//                     onCheckedChange={(checked) => {
//                       handleInputChange("isFoodExpense", checked as boolean);
//                       if (checked) handleInputChange("isTravelExpense", false);
//                     }}
//                   />
//                   <Label
//                     htmlFor="isFoodExpense"
//                     className="text-sm font-medium"
//                   >
//                     This is a food/meal expense
//                   </Label>
//                 </div>
//               </div>
//             </div>

//             {/* Travel Details */}
//             {formData.isTravelExpense && (
//               <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
//                 <h3 className="text-lg font-semibold flex items-center">
//                   <Plane className="mr-2 h-5 w-5" />
//                   Travel Details
//                 </h3>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="fromLocation">From Location</Label>
//                     <div className="relative">
//                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                       <Input
//                         id="fromLocation"
//                         value={formData.fromLocation}
//                         onChange={(e) =>
//                           handleInputChange("fromLocation", e.target.value)
//                         }
//                         placeholder="Departure city/location"
//                         className="pl-10"
//                         required={formData.isTravelExpense}
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="toLocation">To Location</Label>
//                     <div className="relative">
//                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                       <Input
//                         id="toLocation"
//                         value={formData.toLocation}
//                         onChange={(e) =>
//                           handleInputChange("toLocation", e.target.value)
//                         }
//                         placeholder="Destination city/location"
//                         className="pl-10"
//                         required={formData.isTravelExpense}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="travelStartDate">Travel Start Date</Label>
//                     <div className="relative">
//                       <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                       <Input
//                         id="travelStartDate"
//                         type="date"
//                         value={formData.travelStartDate}
//                         onChange={(e) =>
//                           handleInputChange("travelStartDate", e.target.value)
//                         }
//                         className="pl-10"
//                         required={formData.isTravelExpense}
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="travelEndDate">Travel End Date</Label>
//                     <div className="relative">
//                       <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                       <Input
//                         id="travelEndDate"
//                         type="date"
//                         value={formData.travelEndDate}
//                         onChange={(e) =>
//                           handleInputChange("travelEndDate", e.target.value)
//                         }
//                         className="pl-10"
//                         required={formData.isTravelExpense}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="transportMode">Mode of Transport</Label>
//                   <Select
//                     value={formData.transportMode}
//                     onValueChange={(value) =>
//                       handleInputChange("transportMode", value)
//                     }
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select transport mode" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {transportModes.map((mode) => (
//                         <SelectItem key={mode.value} value={mode.value}>
//                           <div className="flex items-center">
//                             <mode.icon className="mr-2 h-4 w-4" />
//                             {mode.label}
//                           </div>
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="businessPurpose">Business Purpose</Label>
//                   <Textarea
//                     id="businessPurpose"
//                     value={formData.businessPurpose}
//                     onChange={(e) =>
//                       handleInputChange("businessPurpose", e.target.value)
//                     }
//                     placeholder="Describe the business purpose of this travel..."
//                     rows={2}
//                     required={formData.isTravelExpense}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="accommodationDetails">
//                     Accommodation Details (Optional)
//                   </Label>
//                   <Textarea
//                     id="accommodationDetails"
//                     value={formData.accommodationDetails}
//                     onChange={(e) =>
//                       handleInputChange("accommodationDetails", e.target.value)
//                     }
//                     placeholder="Hotel name, dates, special requirements..."
//                     rows={2}
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Food Details */}
//             {formData.isFoodExpense && (
//               <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
//                 <h3 className="text-lg font-semibold flex items-center">
//                   <UtensilsCrossed className="mr-2 h-5 w-5" />
//                   Food/Meal Details
//                 </h3>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="foodName">Food/Meal Name</Label>
//                     <Input
//                       id="foodName"
//                       value={formData.foodName}
//                       onChange={(e) =>
//                         handleInputChange("foodName", e.target.value)
//                       }
//                       placeholder="e.g., Business lunch, Coffee meeting"
//                       required={formData.isFoodExpense}
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="mealType">Meal Type</Label>
//                     <Select
//                       value={formData.mealType}
//                       onValueChange={(value) =>
//                         handleInputChange("mealType", value)
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select meal type" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {mealTypes.map((type) => (
//                           <SelectItem key={type.id} value={type.name}>
//                             {type.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="restaurantName">
//                     Restaurant/Hotel Name (Optional)
//                   </Label>
//                   <Input
//                     id="restaurantName"
//                     value={formData.restaurantName}
//                     onChange={(e) =>
//                       handleInputChange("restaurantName", e.target.value)
//                     }
//                     placeholder="Name of restaurant, hotel, or venue"
//                   />
//                 </div>

//                 <div className="space-y-3">
//                   <Label>Dining Arrangement</Label>
//                   <RadioGroup
//                     value={formData.withClient ? "client" : "alone"}
//                     onValueChange={(value) =>
//                       handleInputChange("withClient", value === "client")
//                     }
//                   >
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="alone" id="alone" />
//                       <Label htmlFor="alone" className="flex items-center">
//                         <User className="mr-2 h-4 w-4" />
//                         Dining alone or with colleagues
//                       </Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="client" id="client" />
//                       <Label htmlFor="client" className="flex items-center">
//                         <Users className="mr-2 h-4 w-4" />
//                         Dining with client(s)
//                       </Label>
//                     </div>
//                   </RadioGroup>
//                 </div>

//                 {formData.withClient && (
//                   <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-md border">
//                     <div className="space-y-2">
//                       <Label htmlFor="clientName">Client Name</Label>
//                       <Input
//                         id="clientName"
//                         value={formData.clientName}
//                         onChange={(e) =>
//                           handleInputChange("clientName", e.target.value)
//                         }
//                         placeholder="Client's full name"
//                         required={formData.withClient}
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="clientCompany">
//                         Client Company (Optional)
//                       </Label>
//                       <Input
//                         id="clientCompany"
//                         value={formData.clientCompany}
//                         onChange={(e) =>
//                           handleInputChange("clientCompany", e.target.value)
//                         }
//                         placeholder="Client's company name"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="numberOfAttendees">Number of Attendees</Label>
//                   <Input
//                     id="numberOfAttendees"
//                     type="number"
//                     min="1"
//                     max="50"
//                     value={formData.numberOfAttendees}
//                     onChange={(e) =>
//                       handleInputChange("numberOfAttendees", e.target.value)
//                     }
//                     placeholder="Total number of people"
//                     required={formData.isFoodExpense}
//                   />
//                   <p className="text-xs text-gray-500">
//                     Include yourself and all attendees
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* File Upload */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">Bill/Receipt Upload</h3>

//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
//                 <div className="text-center">
//                   <Upload className="mx-auto h-12 w-12 text-gray-400" />
//                   <div className="mt-4">
//                     <Label htmlFor="file-upload" className="cursor-pointer">
//                       <span className="mt-2 block text-sm font-medium text-gray-900">
//                         Upload bills, receipts, or supporting documents
//                       </span>
//                       <span className="mt-1 block text-xs text-gray-500">
//                         PNG, JPG, PDF up to 10MB each
//                       </span>
//                     </Label>
//                     <Input
//                       id="file-upload"
//                       type="file"
//                       multiple
//                       accept="image/*,.pdf,.doc,.docx,.txt"
//                       onChange={handleFileUpload}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Uploaded Files */}
//               {uploadedFiles.length > 0 && (
//                 <div className="space-y-2">
//                   <Label>Uploaded Files</Label>
//                   <div className="space-y-2">
//                     {uploadedFiles.map((uploadedFile, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center justify-between p-3 border rounded-lg"
//                       >
//                         <div className="flex items-center space-x-3">
//                           {getFileIcon(uploadedFile.file)}
//                           <div>
//                             <p className="text-sm font-medium">
//                               {uploadedFile.file.name}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               {formatFileSize(uploadedFile.file.size)}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           {uploadedFile.uploading && (
//                             <Badge variant="secondary">Uploading...</Badge>
//                           )}
//                           {uploadedFile.error && (
//                             <Badge variant="destructive">Error</Badge>
//                           )}
//                           {uploadedFile.url && !uploadedFile.uploading && (
//                             <Badge variant="default">Uploaded</Badge>
//                           )}
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => removeFile(uploadedFile.file)}
//                           >
//                             <X className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="flex gap-4">

//               <Button type="submit" disabled={loading} className="flex-1">
//                 {loading ? "Submitting..." : "Submit Expense Report"}
//               </Button>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => router.push("/dashboard/reports")}
//               >
//                 Cancel
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { uploadFile, validateFile } from "@/lib/file-upload";
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  Calendar,
  MapPin,
  Plane,
  Car,
  Train,
  Bus,
  UtensilsCrossed,
  Users,
  User,
  Bike,
} from "lucide-react";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

interface MealType {
  id: string;
  name: string;
  description: string;
}

interface UploadedFile {
  file: File;
  url?: string;
  uploading: boolean;
  error?: string;
}

const transportModes = [
  { value: "flight", label: "Flight", icon: Plane },
  { value: "car", label: "Car/Taxi", icon: Car },
  { value: "train", label: "Train", icon: Train },
  { value: "bus", label: "Bus", icon: Bus },
  { value: "other", label: "Other", icon: Car },
  { value: "hired bike", label: "Hired Car/Bike", icon: Bike },
  { value: "own", label: "Own Bike/Car", icon: Bike },
];

export default function SubmitExpensePage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    amount: "",
    expenseDate: "",
    description: "",

    // Travel fields
    isTravelExpense: false,
    fromLocation: "",
    toLocation: "",
    travelStartDate: "",
    travelEndDate: "",
    transportMode: "",
    accommodationDetails: "",
    businessPurpose: "",

    // Food fields
    isFoodExpense: false,
    foodName: "",
    restaurantName: "",
    withClient: false,
    clientName: "",
    clientCompany: "",
    numberOfAttendees: "1",
    mealType: "",
  });

  const [FormData, setFormdata] = useState({
    hotelName: "",
    dates: "",
    specialRequirements: "",
  });
  const { userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchMealTypes();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        throw error;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load expense categories",
        variant: "destructive",
      });
    }
  };

  const fetchMealTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("meal_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        throw error;
      }

      setMealTypes(data || []);
    } catch (error) {
      console.error("Error fetching meal types:", error);
      // Don't show error toast for meal types as it's not critical
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive",
        });
        continue;
      }

      const newFile: UploadedFile = {
        file,
        uploading: true,
      };

      setUploadedFiles((prev) => [...prev, newFile]);

      try {
        const result = await uploadFile(file);
        if (result.error) {
          throw new Error(result.error);
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, url: result.url, uploading: false } : f
          )
        );
      } catch (error: any) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, uploading: false, error: error.message }
              : f
          )
        );
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    // Validate travel fields if it's a travel expense
    if (formData.isTravelExpense) {
      if (
        !formData.fromLocation ||
        !formData.toLocation ||
        !formData.travelStartDate ||
        !formData.travelEndDate ||
        !formData.transportMode ||
        !formData.businessPurpose
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all travel-related fields",
          variant: "destructive",
        });
        return;
      }

      if (
        new Date(formData.travelStartDate) > new Date(formData.travelEndDate)
      ) {
        toast({
          title: "Invalid Dates",
          description: "Travel start date must be before end date",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate food fields if it's a food expense
    if (formData.isFoodExpense) {
      if (!formData.foodName || !formData.mealType) {
        toast({
          title: "Missing Information",
          description: "Please fill in food name and meal type",
          variant: "destructive",
        });
        return;
      }

      if (formData.withClient && !formData.clientName) {
        toast({
          title: "Missing Information",
          description: "Please provide client name when dining with client",
          variant: "destructive",
        });
        return;
      }

      const attendees = Number.parseInt(formData.numberOfAttendees);
      if (attendees < 1 || attendees > 50) {
        toast({
          title: "Invalid Number",
          description: "Number of attendees must be between 1 and 50",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if files are still uploading
    const stillUploading = uploadedFiles.some((f) => f.uploading);
    if (stillUploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for all files to finish uploading",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get the main bill file (first uploaded file)
      const mainBillFile = uploadedFiles[0];

      const expenseData = {
        user_id: userProfile.id,
        category_id: formData.categoryId,
        title: formData.title,
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        expense_date: formData.expenseDate,
        status: "pending",
        current_stage: "submitted",
        // Travel fields
        is_travel_expense: formData.isTravelExpense,
        ...(formData.isTravelExpense && {
          from_location: formData.fromLocation,
          to_location: formData.toLocation,
          travel_start_date: formData.travelStartDate,
          travel_end_date: formData.travelEndDate,
          transport_mode: formData.transportMode,
          accommodation_details: formData.accommodationDetails,
          business_purpose: formData.businessPurpose,
        }),
        // Food fields
        is_food_expense: formData.isFoodExpense,
        ...(formData.isFoodExpense && {
          food_name: formData.foodName,
          restaurant_name: formData.restaurantName,
          with_client: formData.withClient,
          client_name: formData.withClient ? formData.clientName : null,
          client_company: formData.withClient ? formData.clientCompany : null,
          number_of_attendees: Number.parseInt(formData.numberOfAttendees),
          meal_type: formData.mealType,
        }),
        // File attachment
        ...(mainBillFile?.url && {
          bill_file_url: mainBillFile.url,
          bill_file_name: mainBillFile.file.name,
          bill_file_size: mainBillFile.file.size,
        }),
      };

      const { data: expenseReport, error } = await supabase
        .from("expense_reports")
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;

      // Create initial workflow entry
      await supabase.rpc("update_expense_workflow", {
        p_expense_id: expenseReport.id,
        p_new_stage: "submitted",
        p_approved_by: null,
        p_notes: "Expense report submitted by employee",
      });

      // Upload additional attachments if any
      if (uploadedFiles.length > 1) {
        const attachments = uploadedFiles.slice(1).map((file) => ({
          expense_report_id: expenseReport.id,
          file_name: file.file.name,
          file_url: file.url!,
          file_size: file.file.size,
          file_type: file.file.type,
        }));

        const { error: attachmentError } = await supabase
          .from("expense_attachments")
          .insert(attachments);

        if (attachmentError) {
          console.error("Error uploading attachments:", attachmentError);
          // Don't fail the whole submission for attachment errors
        }
      }

      toast({
        title: "Success",
        description:
          "Expense report submitted successfully! You can now track its progress.",
      });

      router.push("/dashboard/reports");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };



  


  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Expense Report</CardTitle>
          <CardDescription>
            Fill out the form below to submit a new expense report for
            reimbursement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Expense Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Brief description of the expense"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    handleInputChange("categoryId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Expense Date</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      handleInputChange("expenseDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Provide additional details about this expense..."
                  rows={3}
                />
              </div>
            </div>

            {/* Expense Type Toggles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Expense Type</h3>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTravelExpense"
                    checked={formData.isTravelExpense}
                    onCheckedChange={(checked) => {
                      handleInputChange("isTravelExpense", checked as boolean);
                      if (checked) handleInputChange("isFoodExpense", false);
                    }}
                  />
                  <Label
                    htmlFor="isTravelExpense"
                    className="text-sm font-medium"
                  >
                    This is a travel-related expense
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFoodExpense"
                    checked={formData.isFoodExpense}
                    onCheckedChange={(checked) => {
                      handleInputChange("isFoodExpense", checked as boolean);
                      if (checked) handleInputChange("isTravelExpense", false);
                    }}
                  />
                  <Label
                    htmlFor="isFoodExpense"
                    className="text-sm font-medium"
                  >
                    This is a food/meal expense
                  </Label>
                </div>
              </div>
            </div>

            {/* Travel Details */}
            {formData.isTravelExpense && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h3 className="text-lg font-semibold flex items-center">
                  <Plane className="mr-2 h-5 w-5" />
                  Travel Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromLocation">From Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="fromLocation"
                        value={formData.fromLocation}
                        onChange={(e) =>
                          handleInputChange("fromLocation", e.target.value)
                        }
                        placeholder="Departure city/location"
                        className="pl-10"
                        required={formData.isTravelExpense}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toLocation">To Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="toLocation"
                        value={formData.toLocation}
                        onChange={(e) =>
                          handleInputChange("toLocation", e.target.value)
                        }
                        placeholder="Destination city/location"
                        className="pl-10"
                        required={formData.isTravelExpense}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="travelStartDate">Travel Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="travelStartDate"
                        type="date"
                        value={formData.travelStartDate}
                        onChange={(e) =>
                          handleInputChange("travelStartDate", e.target.value)
                        }
                        className="pl-10"
                        required={formData.isTravelExpense}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelEndDate">Travel End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="travelEndDate"
                        type="date"
                        value={formData.travelEndDate}
                        onChange={(e) =>
                          handleInputChange("travelEndDate", e.target.value)
                        }
                        className="pl-10"
                        required={formData.isTravelExpense}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportMode">Mode of Transport</Label>
                  <Select
                    value={formData.transportMode}
                    onValueChange={(value) =>
                      handleInputChange("transportMode", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transport mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          <div className="flex items-center">
                            <mode.icon className="mr-2 h-4 w-4" />
                            {mode.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPurpose">Business Purpose</Label>
                  <Textarea
                    id="businessPurpose"
                    value={formData.businessPurpose}
                    onChange={(e) =>
                      handleInputChange("businessPurpose", e.target.value)
                    }
                    placeholder="Describe the business purpose of this travel..."
                    rows={2}
                    required={formData.isTravelExpense}
                  />
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="accommodationDetails">
                    Accommodation Details (Optional)
                  </Label>
                  <Textarea
                    id="accommodationDetails"
                    value={formData.accommodationDetails}
                    onChange={(e) =>
                      handleInputChange("accommodationDetails", e.target.value)
                    }
                    placeholder="Hotel name, dates, special requirements..."
                    rows={2}
                  />
                </div> */}
                
                <div className="space-y-2">
                  <Label htmlFor="accommodationDetails">
                    Accommodation Details (Optional)
                  </Label>
                  <table className="border-separate border-spacing-4">
                    <thead>
                      <tr>
                        <th>Hotel Name</th>
                        <th>Dates</th>
                        <th>Special Requirements</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                            <Input
                              className="outline-none"
                              id="hotelName"
                              value={FormData.hotelName}
                              onChange={(e) =>
                                setFormdata((prev) => ({ ...prev, hotelName: e.target.value }))
                              }
                              placeholder="Hotel Name"
                            />
                        </td>
                        <td>
                            <Input
                              id="dates"
                              value={FormData.dates}
                              onChange={(e) =>
                                setFormdata((prev) => ({ ...prev, dates: e.target.value }))
                              }
                              placeholder="Dates"
                            />
                        </td>
                        <td>
                            <Input
                              id="specialRequirements"
                              value={FormData.specialRequirements}
                              onChange={(e) =>
                                setFormdata((prev) => ({ ...prev, specialRequirements: e.target.value }))
                              }
                              placeholder="Special Requirements"
                            />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Food Details */}
            {formData.isFoodExpense && (
              <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                <h3 className="text-lg font-semibold flex items-center">
                  <UtensilsCrossed className="mr-2 h-5 w-5" />
                  Food/Meal Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foodName">Food/Meal Name</Label>
                    <Input
                      id="foodName"
                      value={formData.foodName}
                      onChange={(e) =>
                        handleInputChange("foodName", e.target.value)
                      }
                      placeholder="e.g., Business lunch, Coffee meeting"
                      required={formData.isFoodExpense}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mealType">Meal Type</Label>
                    <Select
                      value={formData.mealType}
                      onValueChange={(value) =>
                        handleInputChange("mealType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantName">
                    Restaurant/Hotel Name (Optional)
                  </Label>
                  <Input
                    id="restaurantName"
                    value={formData.restaurantName}
                    onChange={(e) =>
                      handleInputChange("restaurantName", e.target.value)
                    }
                    placeholder="Name of restaurant, hotel, or venue"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Dining Arrangement</Label>
                  <RadioGroup
                    value={formData.withClient ? "client" : "alone"}
                    onValueChange={(value) =>
                      handleInputChange("withClient", value === "client")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="alone" id="alone" />
                      <Label htmlFor="alone" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Dining alone or with colleagues
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Dining with client(s)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.withClient && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-md border">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) =>
                          handleInputChange("clientName", e.target.value)
                        }
                        placeholder="Client's full name"
                        required={formData.withClient}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientCompany">
                        Client Company (Optional)
                      </Label>
                      <Input
                        id="clientCompany"
                        value={formData.clientCompany}
                        onChange={(e) =>
                          handleInputChange("clientCompany", e.target.value)
                        }
                        placeholder="Client's company name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="numberOfAttendees">Number of Attendees</Label>
                  <Input
                    id="numberOfAttendees"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfAttendees}
                    onChange={(e) =>
                      handleInputChange("numberOfAttendees", e.target.value)
                    }
                    placeholder="Total number of people"
                    required={formData.isFoodExpense}
                  />
                  <p className="text-xs text-gray-500">
                    Include yourself and all attendees
                  </p>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bill/Receipt Upload</h3>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload bills, receipts, or supporting documents
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PNG, JPG, PDF up to 10MB each
                      </span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(uploadedFile.file)}
                          <div>
                            <p className="text-sm font-medium">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {uploadedFile.uploading && (
                            <Badge variant="secondary">Uploading...</Badge>
                          )}
                          {uploadedFile.error && (
                            <Badge variant="destructive">Error</Badge>
                          )}
                          {uploadedFile.url && !uploadedFile.uploading && (
                            <Badge variant="default">Uploaded</Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadedFile.file)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit Expense Report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/reports")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
