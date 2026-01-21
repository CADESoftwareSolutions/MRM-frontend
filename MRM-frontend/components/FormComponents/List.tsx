import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Edit, Search, Trash2 } from "lucide-react";
import { ModuleConfig } from "../../pages/Dashboard/DashboardDirectory/Directory/directoryConfig";

interface ListProps {
  config: ModuleConfig;
  data: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export const List: React.FC<ListProps> = ({
  config,
  data,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-300/30">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-4 h-4" />
            <Input
              placeholder={`Search ${config?.title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/50"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5 border border-purple-300/20 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Building2 className="w-5 h-5 text-purple-300 shrink-0" />

                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {item.name}
                  </h3>

                  {item.nameId && (
                    <Badge
                      variant="outline"
                      className="bg-purple-500/20 text-white/90 border-purple-300/30"
                    >
                      {item.nameId}
                    </Badge>
                  )}

                  {item.classifications?.map((cls: string) => (
                    <Badge
                      key={cls}
                      variant="outline"
                      className="bg-blue-500/20 text-white/80 border-blue-300/30"
                    >
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.status === "Active" && (
                  <Badge className="bg-green-500/20 text-white/90 border-green-300/30 mr-2">
                    Active
                  </Badge>
                )}

                <div className="flex rounded-md overflow-hidden border border-purple-300/20">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 cursor-pointer"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
