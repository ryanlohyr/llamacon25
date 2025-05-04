import { Chat } from "@/components/Chat";

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-2 gap-4">
      <div className="w-full border rounded-lg shadow-sm dark:bg-gray-800 h-[80vh]">
          {/* Your other component will go here */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Other Component</h2>
          </div>
          <div className="flex items-center justify-center h-[calc(100%-60px)] text-gray-500">
            <p>Your content will go here</p>
          </div>
        </div>
        <div className="w-full">
          <Chat />
        </div>
        
      </div>
    </div>
  );
}
