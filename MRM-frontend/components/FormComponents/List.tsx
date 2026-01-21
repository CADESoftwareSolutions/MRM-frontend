// components/List.tsx - Fully Reusable List Component
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Edit,
  Search,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
} from "lucide-react";
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
  // Get the icon based on module type
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

  // Get the primary display field (first in listFields)
  const getPrimaryField = (item: any) => {
    const primaryFieldId = config.listFields[0];
    return item[primaryFieldId] || "N/A";
  };

  // Get the secondary ID field (usually has 'Id' in the name)
  const getSecondaryId = (item: any) => {
    const idField = config.listFields.find(
      (field) => field.toLowerCase().includes("id") && field !== "id"
    );
    return idField ? item[idField] : null;
  };

  // Format date fields nicely
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render badges for array fields (like classifications, provisions)
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

  // Render detail fields based on module type
  const renderDetails = (item: any) => {
    // Get non-primary, non-array fields to display
    const primaryField = config.listFields[0];
    const detailFields = config.listFields
      .slice(1, 5)
      .filter(
        (fieldId) =>
          !Array.isArray(item[fieldId]) &&
          fieldId !== "status" &&
          fieldId !== primaryField &&
          item[fieldId]
      );

    return (
      <div className="flex items-center gap-4 text-sm text-purple-200 ml-9">
        {detailFields.map((fieldId, index) => {
          const value = item[fieldId];

          // Date fields
          if (fieldId.toLowerCase().includes("date")) {
            return (
              <div key={fieldId} className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(value)}</span>
              </div>
            );
          }

          // Location fields (city, county, state)
          if (
            fieldId.toLowerCase().includes("city") ||
            fieldId.toLowerCase().includes("county") ||
            fieldId.toLowerCase().includes("state")
          ) {
            return (
              <div key={fieldId} className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{value}</span>
              </div>
            );
          }

          // Money fields
          if (
            fieldId.toLowerCase().includes("rate") ||
            fieldId.toLowerCase().includes("bonus") ||
            fieldId.toLowerCase().includes("price")
          ) {
            return (
              <div key={fieldId} className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>
                  {typeof value === "number" ? value.toFixed(2) : value}
                </span>
              </div>
            );
          }

          // Default - just show the value
          return (
            <span key={fieldId} className="truncate max-w-[200px]">
              {value}
            </span>
          );
        })}
      </div>
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
          {data?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-300">
                No {config.title.toLowerCase()} found
              </p>
            </div>
          ) : (
            data?.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-white/5 border border-purple-300/20 hover:bg-white/10 transition-all"
              >
                {/* Main row with primary info and actions */}
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

                {/* Detail row with secondary info */}
                {renderDetails(item)}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default List;
