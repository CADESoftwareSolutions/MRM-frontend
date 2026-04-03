import React, { useRef, useState } from "react";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface CheckFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface Folder {
  id: string;
  name: string;
  checks: CheckFile[];
  createdAt: string;
}

type View = "folders" | "folder";

const Checks: React.FC = () => {
  const [view, setView] = useState<View>("folders");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [viewingCheck, setViewingCheck] = useState<CheckFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setView("folder");
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      checks: [],
      createdAt: new Date().toLocaleDateString(),
    };
    setFolders((prev) => [...prev, folder]);
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  const deleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !selectedFolder) return;
    const newChecks: CheckFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      uploadedAt: new Date().toLocaleDateString(),
    }));
    const updated = folders.map((f) =>
      f.id === selectedFolder.id
        ? { ...f, checks: [...f.checks, ...newChecks] }
        : f
    );
    setFolders(updated);
    setSelectedFolder((prev) =>
      prev ? { ...prev, checks: [...prev.checks, ...newChecks] } : prev
    );
  };

  const deleteCheck = (checkId: string) => {
    const updated = folders.map((f) =>
      f.id === selectedFolder?.id
        ? { ...f, checks: f.checks.filter((c) => c.id !== checkId) }
        : f
    );
    setFolders(updated);
    setSelectedFolder((prev) =>
      prev ? { ...prev, checks: prev.checks.filter((c) => c.id !== checkId) } : prev
    );
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6" style={{ marginTop: "64px" }}>
        <div className="max-w-7xl mx-auto">

          {/* ── Folders view ── */}
          {view === "folders" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <FolderOpen className="w-8 h-8 text-purple-300 mt-1" />
                  <div>
                    <h1 className="text-3xl font-bold text-white leading-none">Checks</h1>
                    <p className="text-sm text-white/50 mt-1">
                      {folders.length === 0
                        ? "Organise and store check images by folder"
                        : `${folders.length} ${folders.length === 1 ? "folder" : "folders"} · ${folders.reduce((acc, f) => acc + f.checks.length, 0)} checks`}
                    </p>
                  </div>
                </div>
                {folders.length > 0 && (
                  <Button
                    onClick={() => setShowNewFolderModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                )}
              </div>
              <div className="border-b border-purple-300/10 mb-8" />

              {folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <FolderOpen className="w-16 h-16 text-purple-300/30 mb-4" />
                  <p className="text-white/50 text-lg">No folders yet</p>
                  <p className="text-white/30 text-sm mt-1">
                    Create a folder to start uploading checks
                  </p>
                  <Button
                    onClick={() => setShowNewFolderModal(true)}
                    className="mt-6 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => openFolder(folder)}
                      className="group relative bg-white/5 border border-purple-300/20 rounded-xl p-5 cursor-pointer hover:bg-white/10 hover:border-purple-400/40 transition-all"
                    >
                      <button
                        onClick={(e) => deleteFolder(folder.id, e)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <FolderOpen className="w-10 h-10 text-purple-400 mb-3" />
                      <p className="text-white font-medium truncate pr-4">
                        {folder.name}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {folder.checks.length}{" "}
                        {folder.checks.length === 1 ? "check" : "checks"}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">
                        Created {folder.createdAt}
                      </p>
                      <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-purple-400/40 group-hover:text-purple-400 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Folder detail view ── */}
          {view === "folder" && selectedFolder && (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView("folders")}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <FolderOpen className="w-7 h-7 text-purple-300" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {selectedFolder.name}
                    </h1>
                    <p className="text-sm text-white/40">
                      {selectedFolder.checks.length}{" "}
                      {selectedFolder.checks.length === 1 ? "check" : "checks"}
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-purple-400 bg-purple-500/10"
                    : "border-purple-300/20 hover:border-purple-400/40 hover:bg-white/5"
                }`}
              >
                <Upload className="w-8 h-8 text-purple-300/50 mx-auto mb-2" />
                <p className="text-white/50 text-sm">
                  Drag & drop checks here, or{" "}
                  <span className="text-purple-300">browse</span>
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Supports images and PDF
                </p>
              </div>

              {selectedFolder.checks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="w-12 h-12 text-purple-300/20 mb-3" />
                  <p className="text-white/40">No checks uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {selectedFolder.checks.map((check) => (
                    <div
                      key={check.id}
                      className="group relative bg-white/5 border border-purple-300/20 rounded-xl overflow-hidden hover:border-purple-400/40 transition-all"
                    >
                      <button
                        onClick={() => deleteCheck(check.id)}
                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 bg-black/50 rounded-full p-1 text-white/60 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div
                        onClick={() => setViewingCheck(check)}
                        className="cursor-pointer"
                      >
                        {isImage(check.type) ? (
                          <img
                            src={check.url}
                            alt={check.name}
                            className="w-full h-36 object-cover"
                          />
                        ) : (
                          <div className="w-full h-36 flex items-center justify-center bg-purple-900/20">
                            <FileText className="w-10 h-10 text-purple-300/50" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-white text-xs font-medium truncate">
                            {check.name}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {check.uploadedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── New Folder Modal ── */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNewFolderModal(false)}
          />
          <div className="relative bg-[#1a1a2e] border border-purple-300/30 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-semibold">New Folder</h2>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              placeholder="Folder name"
              className="w-full bg-white/5 border border-purple-300/30 rounded-md px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-purple-400 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderModal(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-40"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Check viewer modal ── */}
      {viewingCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setViewingCheck(null)}
          />
          <div className="relative bg-[#1a1a2e] border border-purple-300/30 rounded-xl shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-300/20">
              <p className="text-white text-sm font-medium truncate">
                {viewingCheck.name}
              </p>
              <button
                onClick={() => setViewingCheck(null)}
                className="text-white/40 hover:text-white ml-4 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[400px]">
              {isImage(viewingCheck.type) ? (
                <img
                  src={viewingCheck.url}
                  alt={viewingCheck.name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              ) : (
                <iframe
                  src={viewingCheck.url}
                  className="w-full h-[70vh] rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Checks;
