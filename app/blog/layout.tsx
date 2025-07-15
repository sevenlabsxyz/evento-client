import { PageHeader } from "@/components/page-header";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col relative">
      <PageHeader
        title="Blog"
        subtitle="Stories, news, and updates"
        showMenu={true}
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}