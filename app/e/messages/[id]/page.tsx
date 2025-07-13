import { PageHeader } from "../../../../components/page-header"
import { ReusableDropdown } from "../../../../components/reusable-dropdown"

const MessageDetailPage = () => {
  return (
    <div>
      <PageHeader title="Message Details" />
      <ReusableDropdown options={["Option 1", "Option 2", "Option 3"]} />
      {/* Add more content here to display message details */}
    </div>
  )
}

export default MessageDetailPage
