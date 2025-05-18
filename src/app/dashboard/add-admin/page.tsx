
import { AddAdminForm } from "@/components/dashboard/AddAdminForm";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AddAdminPage() {
  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
          <AddAdminForm />
      </div>
    </ScrollArea>
  );
}
