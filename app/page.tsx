import ChatAssistant from "@/components/chat/chat-assistant";

export default function Home() {
  return (
    <div
      className="h-screen flex flex-col max-w-4xl mx-auto overflow-hidden relative"
      style={{
        backgroundImage: 'url("/sports-background.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="border-b p-4 bg-white/95">
        <h1 className="text-xl font-semibold">Sports Betting Assistant</h1>
      </div>

      <div className="flex-1 overflow-hidden bg-white/90">
        <ChatAssistant />
      </div>
    </div>
  );
}
