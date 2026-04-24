"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [chatTitles, setChatTitles] = useState<string[]>([]);

  // Auto scroll effect 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);
  const userId = "murali99";

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/${userId}`);

        const data = await res.json();

        const formatted = data.history.map((item: string) => {
          if (item.startsWith("User:")) {
            return {
              sender: "user",
              text: item.replace("User:", "").trim(),
            };
          }
          return {
            sender: "ai",
            text: item.replace("Ai:", "").trim(),
          };
        });
        setMessages(formatted);
      } catch (err) {
        console.error("Failed to load history:", err);
      } console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
    };
    loadHistory();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userText = message;
    if (messages.length === 0) {
      const title = userText.split(" ").slice(0, 4).join(" ");
      setChatTitles((prev) => [title, ...prev]);
    }
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          message: userText
        }),
      });

      const data = await res.json();
      console.log("API Response:", data);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.reply || data.error || "AI unavailable now..." },
      ]);
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "AI server busy, please try again" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clear-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId
        }),
      });
      setMessages([]);
      setChatTitles([]);
      setMessage("");
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  return (
    <main className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white/90 backdrop-blur shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
          AI Chat Assistant</h1>
        <button
          onClick={clearChat}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition"
        >
          New Chat
        </button>
      </div>
      <div className="max-w-6xl mx-auto w-full px-4 pt-3 space-y-2">
        {chatTitles.map((title, index) => (
          <div
            key={index}
            className="bg-white/80 border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-700 shadow-sm"
          >
            {title}
          </div >
        ))}
      </div>
      {messages.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-20">
          Start a conversation 👋
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 w-full max-w-6xl mx-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-2xl shadow-sm max-w-[80%] transition-all ${msg.sender === "user"
              ? "bg-blue-600 text-white ml-auto rounded-2xl"
              : "bg-white text-gray-800 mr-auto border border-gray-200 rounded-2xl"
              }`}
          >
            <p className="text-[15px] leading-7 whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-2xl rounded-tl-none w-fit animate-pulse flex items-center gap-2 shadow-sm">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </span>
            Thinking...
          </div>
        )}
        <div ref={bottomRef} className="h-1"></div>
      </div>

      <div className="w-full border-t bg-white/90 backdrop-blur p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex gap-2 items-end">

          <textarea
            style={{ color: "black" }}
            className="flex-1 border border-gray-300 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 placeholder-gray-500 resize-none"
            placeholder="Ask anything..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
          />

          <button
            onClick={sendMessage}
            className={` rounded-2xl  px-7 py-3 font-semibold text-white font-medium transition ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
            disabled={loading || !message.trim()}
          >
            {loading ? "..." : "Send"}
          </button>

        </div>
      </div>
    </main>
  );
}