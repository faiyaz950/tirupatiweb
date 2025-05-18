
import { UserProfile } from "@/components/dashboard/UserProfile";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SuperAdminProfilePage() {
  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <UserProfile />
      </div>
    </ScrollArea>
  );
}
