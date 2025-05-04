import { Chat } from "@/components/Chat";

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-6">AI Chat Assistant</h1>
      <Chat />
    </div>
  );
}
