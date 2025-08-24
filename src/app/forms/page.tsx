"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const FormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

type FormValues = z.infer<typeof FormSchema>;

export default function FormsPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = (data: FormValues) => {
    toast.success("Submitted!");
    console.log("Form data:", data);
  };

  return (
    <form className="space-y-4 max-w-md" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} placeholder="Jane Doe" />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" {...form.register("email")} placeholder="jane@company.com" />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
