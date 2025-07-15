import { useState } from 'react'
import { DetachedSheet } from '@/components/ui/detached-sheet'

interface CapacitySettingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (capacity: string) => void;
  initialCapacity?: string;
}

export default function CapacitySettingSheet({ 
  isOpen, 
  onClose, 
  onSave, 
  initialCapacity = "" 
}: CapacitySettingSheetProps) {
  const [capacity, setCapacity] = useState(initialCapacity)
  const [error, setError] = useState("")

  const handleSave = () => {
    if (!capacity.trim()) {
      setError("Please enter a capacity number")
      return
    }

    const num = parseInt(capacity.trim())
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid number greater than 0")
      return
    }

    onSave(capacity.trim())
  }

  const handleClose = () => {
    setCapacity(initialCapacity)
    setError("")
    onClose()
  }

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={handleClose} className="text-red-500 font-medium">
                    Cancel
                  </button>
                  <h2 className="font-semibold text-lg">Set Event Capacity</h2>
                  <button
                    onClick={handleSave}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Maximum number of attendees
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => {
                      setCapacity(e.target.value)
                      setError("")
                    }}
                    placeholder="Enter capacity"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  )
}