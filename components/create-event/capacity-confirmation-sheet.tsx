import { DetachedSheet } from '@/components/ui/detached-sheet'
import { AlertTriangle } from 'lucide-react'

interface CapacityConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentCapacity?: string;
}

export default function CapacityConfirmationSheet({ 
  isOpen, 
  onClose, 
  onConfirm,
  currentCapacity 
}: CapacityConfirmationSheetProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
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
                  <button onClick={onClose} className="text-red-500 font-medium">
                    Cancel
                  </button>
                  <h2 className="font-semibold text-lg">Turn Off Capacity?</h2>
                  <button
                    onClick={handleConfirm}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium"
                  >
                    Turn Off
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                </div>
                
                <div className="space-y-3 text-left">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Are you sure you want to turn off capacity limits for this event?
                    {currentCapacity && (
                      <span className="font-semibold text-gray-900">
                        {" "}Your current capacity is set to {currentCapacity} attendees.
                      </span>
                    )}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    This action will remove all capacity restrictions. You can always set a new capacity later.
                  </p>
                </div>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  )
}