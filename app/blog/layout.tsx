import { useTopBar } from "@/lib/stores/topbar-store";
import { useEffect } from "react";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTopBar } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: "Blog",
      subtitle: "Stories and updates",
    });

    return () => {
      setTopBar({ rightContent: null });
    };
  }, [setTopBar]);

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col relative">
      
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}