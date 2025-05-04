import { Chat } from "@/components/Chat";
import { Graph } from "@/components/Graph";
export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-2 gap-4">
        <div className="w-full border rounded-lg shadow-sm dark:bg-gray-800 h-[80vh]">
          <Graph />
        </div>
        <div className="w-full">
          <Chat />
        </div>
      </div>
    </div>
  );
}
