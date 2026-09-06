import { MessageSquare } from "lucide-react";
import { EmptyState } from "../components/UI";
export default function Messages() {
  return (
    <div className="content-container">
      <EmptyState
        title="Messaging is not connected yet"
        text="The supplied backend does not currently expose message endpoints. This protected screen is ready for that module when you add it."
        action={
          <span className="empty-icon-text">
            <MessageSquare size={16} />
            Protected placeholder
          </span>
        }
      />
    </div>
  );
}
