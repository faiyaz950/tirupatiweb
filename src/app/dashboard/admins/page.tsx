
import { AdminList } from "@/components/dashboard/AdminList";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AllAdminsPage() {
  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <AdminList />
      </div>
    </ScrollArea>
  );
}
