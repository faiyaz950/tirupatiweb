
import { KycList } from "@/components/dashboard/KycList";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AllKycPage() {
  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <KycList />
      </div>
    </ScrollArea>
  );
}
