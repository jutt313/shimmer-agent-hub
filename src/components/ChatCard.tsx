import { ScrollArea } from "@/components/ui/scroll-area";
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}
interface ChatCardProps {
  messages: Message[];
}
const ChatCard = ({
  messages
}: ChatCardProps) => {
  return <div style={{
    boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
  }} className="w-full max-w-5xl h-[70vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative px-[12px] py-[9px]">
      {/* Subtle glow effect inside */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10">
        <div className="space-y-4">
          {messages.map(message => <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.isBot ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'} transition-all duration-300`} style={!message.isBot ? {
            boxShadow: '0 0 20px rgba(92, 142, 246, 0.3)'
          } : {}}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                  {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
                </p>
              </div>
            </div>)}
        </div>
      </ScrollArea>
    </div>;
};
export default ChatCard;