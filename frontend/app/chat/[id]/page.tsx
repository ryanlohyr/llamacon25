"use client";

import { Chat } from "@/components/Chat";
import { Graph } from "@/components/Graph";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  console.log("id: ", id);

  const handleNewChat = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat Session</h1>
        <Button onClick={handleNewChat} className="text-white">
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="w-full border rounded-lg shadow-sm dark:bg-gray-800 h-[80vh]">
          <Graph />
        </div>
        <div className="w-full">
          <Chat sessionId={id as string} />
        </div>
      </div>
    </div>
  );
}