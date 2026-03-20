import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Edit, FileText, Search, Trash2 } from "lucide-react";
import { ModuleConfig } from "../../src/config/directoryConfig";

interface ListProps {
  config: ModuleConfig;
  data: any[];
  loading?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export const List: React.FC<ListProps> = ({
  config,
  data,
  loading = false,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
}) => {
  const getModuleIcon = () => {
    switch (config.name) {
      case "directory":
        return <Building2 className="w-5 h-5 text-purple-300 shrink-0" />;
      case "leases":
        return <FileText className="w-5 h-5 text-purple-300 shrink-0" />;
      case "deeds":
        return <FileText className="w-5 h-5 text-purple-300 shrink-0" />;
      default:
        return <FileText className="w-5 h-5 text-purple-300 shrink-0" />;
    }
  };

  const getPrimaryField = (item: any) => {
    const primaryFieldId = config.listFields[0];
    return item[primaryFieldId] || "N/A";
  };

  const getSecondaryId = (item: any) => {
    const idField = config.listFields.find(
      (field) => field.toLowerCase().includes("id") && field !== "id"
    );
    return idField ? item[idField] : null;
  };

  const renderArrayBadges = (item: any) => {
    const arrayFields = config.listFields.filter(
      (fieldId) => Array.isArray(item[fieldId]) && item[fieldId].length > 0
    );

    if (arrayFields.length === 0) return null;

    return (
      <>
        {arrayFields.map((fieldId) =>
          item[fieldId].slice(0, 3).map((value: string) => (
            <Badge
              key={`${fieldId}-${value}`}
              variant="outline"
              className="bg-blue-500/20 text-white/80 border-blue-300/30"
            >
              {value}
            </Badge>
          ))
        )}
        {arrayFields.some((fieldId) => item[fieldId].length > 3) && (
          <Badge
            variant="outline"
            className="bg-blue-500/20 text-white/80 border-blue-300/30"
          >
            +
            {arrayFields.reduce(
              (sum, fieldId) => sum + item[fieldId].length,
              0
            ) - 3}
          </Badge>
        )}
      </>
    );
  };

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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
              <p className="text-purple-300/70 text-sm">Loading...</p>
            </div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-300">
                No {config.title.toLowerCase()} found
              </p>
            </div>
          ) : (
            data?.map((item) => (
              <div
                key={item.id}
                onClick={() => onEdit(item)}
                className="rounded-lg bg-white/5 border border-purple-300/20 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {getModuleIcon()}

                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {getPrimaryField(item)}
                      </h3>
                      {getSecondaryId(item) && (
                        <Badge
                          variant="outline"
                          className="bg-purple-500/20 text-white/90 border-purple-300/30 shrink-0"
                        >
                          {getSecondaryId(item)}
                        </Badge>
                      )}
                      {renderArrayBadges(item)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === "Active" && (
                      <Badge className="bg-green-500/20 text-white/90 border-green-300/30 mr-2">
                        Active
                      </Badge>
                    )}
                    {item.leaseStatus === "Active" && (
                      <Badge className="bg-green-500/20 text-white/90 border-green-300/30 mr-2">
                        Active
                      </Badge>
                    )}
                    {item.leaseStatus === "HBP" && (
                      <Badge className="bg-blue-500/20 text-white/90 border-blue-300/30 mr-2">
                        HBP
                      </Badge>
                    )}
                    {item.leaseStatus === "Expired" && (
                      <Badge className="bg-gray-500/20 text-white/90 border-gray-300/30 mr-2">
                        Expired
                      </Badge>
                    )}
                    {item.leaseStatus === "Released" && (
                      <Badge className="bg-orange-500/20 text-white/90 border-orange-300/30 mr-2">
                        Released
                      </Badge>
                    )}

                    <div
                      className="flex rounded-md overflow-hidden border border-purple-300/20"
                      onClick={(e) => e.stopPropagation()}
                    >
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
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default List;
