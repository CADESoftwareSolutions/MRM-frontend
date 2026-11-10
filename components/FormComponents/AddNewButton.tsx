import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The small right-aligned trigger a useAddFormToggle form hides behind once entries exist. */
export const AddNewButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <div className="flex justify-end">
    <Button
      type="button"
      size="sm"
      onClick={onClick}
      className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      {label}
    </Button>
  </div>
);
