/**
 * Dialogflow Messenger chat widget.
 */

import { useEffect } from "react";
import { MessageCircle } from "lucide-react";

const AGENT_ID = import.meta.env.VITE_DIALOGFLOW_AGENT_ID as string | undefined;
const PROJECT_ID = import.meta.env.VITE_DIALOGFLOW_PROJECT_ID as string | undefined;

export default function ChatWidget() {
  useEffect(() => {
    if (!AGENT_ID) return;

    // Prevent duplicate script loading
    if (document.getElementById("df-messenger-script")) return;

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.css?v=1";
    document.head.appendChild(link);

    // Load script
    const script = document.createElement("script");
    script.id = "df-messenger-script";
    script.src =
      "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
    script.async = true;

    // Only create df-messenger AFTER script fully loads
    script.onload = () => {
      // Remove existing widget if any
      const existing = document.getElementById("df-messenger-widget");
      if (existing) existing.remove();

      // Create and inject df-messenger into body
      const dfMessenger = document.createElement("df-messenger");
      dfMessenger.id = "df-messenger-widget";
      dfMessenger.setAttribute("project-id", PROJECT_ID ?? "");
      dfMessenger.setAttribute("agent-id", AGENT_ID ?? "");
      dfMessenger.setAttribute("language-code", "en");
      dfMessenger.setAttribute("chat-title", "Somerset Assistant");
      document.body.appendChild(dfMessenger);
    };

    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const widget = document.getElementById("df-messenger-widget");
      if (widget) widget.remove();
    };
  }, []);

  // Placeholder when Agent ID not set in .env
  if (!AGENT_ID) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="w-14 h-14 bg-[#0ea5e9] rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-[#0284c7] transition-colors"
          title="Chat with us (Dialogflow not configured)"
          onClick={() =>
            alert(
              "Chat widget requires VITE_DIALOGFLOW_AGENT_ID.\nSee docs/dialogflow_setup.md"
            )
          }
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // Empty div — actual widget is injected into body via useEffect
  return <div id="df-messenger-container" />;
}