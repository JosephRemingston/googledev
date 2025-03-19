import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bed } from "lucide-react";

const bookingSchema = z.object({
  bedTypeId: z.string(),
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  hospital: any;
  isOpen: boolean;
  onClose: () => void;
  bedTypes: any[];
  selectedBedTypeId?: number;
}

const BookingModal: React.FC<BookingModalProps> = ({
  hospital,
  isOpen,
  onClose,
  bedTypes,
  selectedBedTypeId,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch hospital beds
  const { data: beds = [], isLoading } = useQuery({
    queryKey: [`/api/hospitals/${hospital.id}/beds`],
    enabled: isOpen, // Only fetch when modal is open
  });

  // Get available bed types
  const availableBedTypes = beds.filter((bed: any) => bed.availableBeds > 0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bedTypeId: selectedBedTypeId ? selectedBedTypeId.toString() : "",
      patientName: user?.name || "",
      patientPhone: "",
      notes: "",
    },
  });

  // Update form when selectedBedTypeId changes
  useEffect(() => {
    if (selectedBedTypeId) {
      form.setValue("bedTypeId", selectedBedTypeId.toString());
    } else if (availableBedTypes.length > 0) {
      form.setValue("bedTypeId", availableBedTypes[0].bedTypeId.toString());
    }
  }, [selectedBedTypeId, availableBedTypes, form]);

  // Create booking mutation
  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", {
        ...data,
        hospitalId: hospital.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking successful",
        description: "Your bed booking request has been submitted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/hospitals/${hospital.id}/beds`] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Could not process booking request",
      });
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    createBooking({
      bedTypeId: parseInt(data.bedTypeId),
      patientName: data.patientName,
      patientPhone: data.patientPhone || undefined,
      notes: data.notes || undefined,
    });
  };

  // Get bed type name
  const getBedTypeName = (id: number) => {
    const bedType = bedTypes.find((type) => type.id === id);
    return bedType ? bedType.name : `Bed Type ${id}`;
  };

  // Get available beds count for a bed type
  const getAvailableBeds = (bedTypeId: number) => {
    const bed = beds.find((b: any) => b.bedTypeId === bedTypeId);
    return bed ? bed.availableBeds : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bed className="h-5 w-5 mr-2 text-primary" />
            Book a Hospital Bed
          </DialogTitle>
          <DialogDescription>
            Please confirm your booking details for {hospital.name}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="bedTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading || isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bed type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBedTypes.map((bed: any) => (
                        <SelectItem key={bed.bedTypeId} value={bed.bedTypeId.toString()}>
                          {getBedTypeName(bed.bedTypeId)} ({getAvailableBeds(bed.bedTypeId)} available)
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
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter patient name" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="patientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information to provide"
                      rows={3}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-700 text-white"
                disabled={isPending || isLoading || availableBedTypes.length === 0}
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
                    Processing...
                  </div>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
