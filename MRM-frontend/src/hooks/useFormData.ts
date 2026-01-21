import { useState, useEffect } from "react";
import { ModuleConfig } from "../../pages/Dashboard/DashboardDirectory/Directory/directoryConfig";

export const useFormData = (config: ModuleConfig, apiEndpoint: string) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiEndpoint);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    const method = view === "add" ? "POST" : "PUT";
    const url =
      view === "add" ? apiEndpoint : `${apiEndpoint}/${selectedItem?.id}`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setView("list");
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.name || "this item"}?`)) return;

    try {
      const response = await fetch(`${apiEndpoint}/${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return {
    data,
    loading,
    view,
    searchTerm,
    selectedItem,
    filteredData: data, //filter
    setSearchTerm,
    handleAdd: () => {
      setSelectedItem(null);
      setView("add");
    },
    handleEdit: (item) => {
      setSelectedItem(item);
      setView("edit");
    },
    handleSave,
    handleDelete,
    handleCancel: () => {
      setView("list");
      setSelectedItem(null);
    },
  };
};
