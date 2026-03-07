/**
 * Dialogflow Messenger chat widget.
 *
 * Embeds the Dialogflow Messenger web component as a floating chat button
 * on all customer-facing pages. The DIALOGFLOW_AGENT_ID is read from the
 * environment variable VITE_DIALOGFLOW_AGENT_ID set at build time.
 *
 * If the env var is not set (e.g. during development before GCP setup),
 * the widget renders a placeholder button that links to the contact page.
 *
 * GCP Setup: see docs/dialogflow_setup.md
 */

import { useEffect } from "react";
import { MessageCircle } from "lucide-react";

const AGENT_ID = import.meta.env.VITE_DIALOGFLOW_AGENT_ID as string | undefined;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "df-messenger": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "project-id"?: string;
          "agent-id"?: string;
          "language-code"?: string;
          "chat-title"?: string;
          "chat-icon"?: string;
          "expand"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function ChatWidget() {
  useEffect(() => {
    if (!AGENT_ID) return;

    // Load Dialogflow Messenger script dynamically
    const script = document.createElement("script");
    script.src =
      "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
    script.async = true;
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.css?v=1";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  if (!AGENT_ID) {
    // Dev placeholder — shown when VITE_DIALOGFLOW_AGENT_ID is not configured
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

  return (
    <df-messenger
      project-id={import.meta.env.VITE_DIALOGFLOW_PROJECT_ID}
      agent-id={AGENT_ID}
      language-code="en"
      chat-title="Somerset Concierge"
    />
  );
}
