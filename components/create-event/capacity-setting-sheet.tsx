import { useState } from 'react'
import { SheetWithDetent } from '@/components/ui/sheet-with-detent'

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

  const quickNumbers = [5, 10, 25, 100]

  const handleQuickSelect = (num: number) => {
    setCapacity(num.toString())
    setError("")
  }

  return (
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <SheetWithDetent.Handle />
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
                  
                  {/* Quick select buttons */}
                  <div className="flex gap-2 mb-3">
                    {quickNumbers.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleQuickSelect(num)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          capacity === num.toString()
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  
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
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  )
}