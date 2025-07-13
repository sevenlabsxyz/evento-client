"use client";

import { X, Plus, Bookmark, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SavedListsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [savedLists, setSavedLists] = useState([
    {
      id: 1,
      name: "Event toes",
      eventCount: 5,
      isDefault: true,
      lastUpdated: "2 days ago",
      preview: [
        "/placeholder.svg?height=40&width=40",
        "/placeholder.svg?height=40&width=40",
        "/placeholder.svg?height=40&width=40",
      ],
    },
    {
      id: 2,
      name: "Tokyo Adventures",
      eventCount: 3,
      isDefault: false,
      lastUpdated: "1 week ago",
      preview: [
        "/placeholder.svg?height=40&width=40",
        "/placeholder.svg?height=40&width=40",
      ],
    },
    {
      id: 3,
      name: "Food Experiences",
      eventCount: 7,
      isDefault: false,
      lastUpdated: "3 days ago",
      preview: [
        "/placeholder.svg?height=40&width=40",
        "/placeholder.svg?height=40&width=40",
        "/placeholder.svg?height=40&width=40",
      ],
    },
  ]);

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    const newList = {
      id: Date.now(),
      name: newListName.trim(),
      eventCount: 0,
      isDefault: false,
      lastUpdated: "Just now",
      preview: [],
    };

    setSavedLists([...savedLists, newList]);
    setNewListName("");
    setShowCreateModal(false);
    toast.success(`"${newList.name}" list created!`);
  };

  const handleListClick = (listId: number) => {
    router.push(`/saved/${listId}`);
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200">
        <PageHeader
          title="Saved"
          subtitle={`${savedLists.length} lists • ${savedLists.reduce(
            (total, list) => total + list.eventCount,
            0
          )} events`}
          rightContent={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-100"
              onClick={() => router.back()}
            >
              <X className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Add New List Button */}
        <div className="px-4 py-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New List
          </Button>
        </div>

        {/* Lists */}
        <div className="px-4 pb-6 space-y-3">
          {savedLists.map((list) => (
            <div
              key={list.id}
              onClick={() => handleListClick(list.id)}
              className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{list.name}</h3>
                    {list.isDefault && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {list.eventCount}{" "}
                    {list.eventCount === 1 ? "event" : "events"} • Updated{" "}
                    {list.lastUpdated}
                  </p>

                  {/* Preview Images */}
                  {list.preview.length > 0 && (
                    <div className="flex -space-x-2 mb-2">
                      {list.preview.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image || "/placeholder.svg"}
                          alt=""
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        />
                      ))}
                      {list.eventCount > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          +{list.eventCount - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {savedLists.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No saved lists
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Create your first list to start saving events.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Create List
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full md:max-w-sm max-w-full">
            <h3 className="text-xl font-bold mb-4">Create New List</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleCreateList()}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
