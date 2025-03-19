import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import HospitalSidebar from "@/components/HospitalSidebar";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";

const bedFormSchema = z.object({
  bedTypeId: z.string(),
  totalBeds: z.string().transform((val) => parseInt(val)),
  availableBeds: z.string().transform((val) => parseInt(val)),
});

type BedFormValues = z.infer<typeof bedFormSchema>;

const HospitalBedManagement = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<any>(null);

  useEffect(() => {
    // Redirect if not a hospital user
    if (user && !user.isHospital) {
      navigate("/");
    } else if (!user) {
      navigate("/hospital/login");
    }
  }, [user, navigate]);

  // Fetch bed data
  const { data: beds = [], isLoading: isLoadingBeds } = useQuery({
    queryKey: ["/api/hospital/beds"],
    enabled: !!user?.isHospital,
  });

  // Fetch bed types
  const { data: bedTypes = [] } = useQuery({
    queryKey: ["/api/bedtypes"],
  });

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedFormSchema),
    defaultValues: {
      bedTypeId: "",
      totalBeds: "0",
      availableBeds: "0",
    },
  });

  // Update or create bed mutation
  const { mutate: saveBed, isPending } = useMutation({
    mutationFn: async (data: BedFormValues) => {
      const response = await apiRequest("POST", "/api/hospital/beds", {
        bedTypeId: parseInt(data.bedTypeId),
        totalBeds: data.totalBeds,
        availableBeds: data.availableBeds,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingBed ? "Bed updated successfully" : "Bed added successfully",
        description: editingBed
          ? "The bed inventory has been updated"
          : "New bed type has been added to your inventory",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospital/beds"] });
      setIsDialogOpen(false);
      setEditingBed(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save bed",
        description: error.message || "Please try again",
      });
    },
  });

  const openEditDialog = (bed: any) => {
    setEditingBed(bed);
    form.setValue("bedTypeId", bed.bedTypeId.toString());
    form.setValue("totalBeds", bed.totalBeds.toString());
    form.setValue("availableBeds", bed.availableBeds.toString());
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingBed(null);
    form.reset({
      bedTypeId: "",
      totalBeds: "0",
      availableBeds: "0",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: BedFormValues) => {
    if (parseInt(data.availableBeds) > parseInt(data.totalBeds)) {
      form.setError("availableBeds", {
        type: "manual",
        message: "Available beds cannot exceed total beds",
      });
      return;
    }
    saveBed(data);
  };

  // Get bed type name by id
  const getBedTypeName = (id: number) => {
    const bedType = bedTypes.find((type: any) => type.id === id);
    return bedType ? bedType.name : `Bed Type ${id}`;
  };

  if (!user || !user.isHospital) {
    return null; // Don't render anything if not authenticated or not a hospital
  }

  return (
    <div className="flex flex-col lg:flex-row lg:space-x-8 min-h-screen bg-gray-50">
      <HospitalSidebar activePath="/hospital/dashboard/beds" />
      
      <div className="w-full lg:w-3/4 p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bed Management</h1>
            <p className="text-gray-600">Manage your hospital's bed inventory</p>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-primary hover:bg-primary-700 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Bed Type
          </Button>
        </div>
        
        {/* Bed inventory table */}
        <Card>
          <CardContent className="p-0">
            {isLoadingBeds ? (
              <div className="flex justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : beds.length === 0 ? (
              <div className="p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4M4 12H4a4 4 0 014-4h8a4 4 0 014 4v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No beds added yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by adding different types of beds available at your hospital.
                </p>
                <Button
                  onClick={openAddDialog}
                  className="bg-primary hover:bg-primary-700 text-white"
                >
                  Add Your First Bed Type
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bed Type</TableHead>
                      <TableHead>Total Beds</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Occupied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beds.map((bed: any) => (
                      <TableRow key={bed.id}>
                        <TableCell className="font-medium">
                          {getBedTypeName(bed.bedTypeId)}
                        </TableCell>
                        <TableCell>{bed.totalBeds}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              bed.availableBeds === 0
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {bed.availableBeds}
                          </span>
                        </TableCell>
                        <TableCell>{bed.totalBeds - bed.availableBeds}</TableCell>
                        <TableCell>
                          {bed.availableBeds === 0 ? (
                            <Badge variant="danger">Full</Badge>
                          ) : bed.availableBeds < bed.totalBeds / 4 ? (
                            <Badge variant="warning">Limited</Badge>
                          ) : (
                            <Badge variant="success">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(bed)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add/Edit Bed Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBed ? "Update Bed Information" : "Add New Bed Type"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bedTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!editingBed}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bedTypes.map((type: any) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalBeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Beds</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="availableBeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Beds</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-700 text-white"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </div>
                  ) : editingBed ? (
                    "Update Beds"
                  ) : (
                    "Add Beds"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalBedManagement;
