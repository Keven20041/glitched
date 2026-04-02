"use client";

import { useEffect, useState } from "react";
import { dropListJoinedEventName, type DropListJoinedEventDetail } from "../lib/newsletter";

const HIDE_DELAY_MS = 2200;

export default function DropListNotification() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onDropListJoined = (event: Event) => {
      const customEvent = event as CustomEvent<DropListJoinedEventDetail>;
      const nextMessage = customEvent.detail?.message?.trim();

      if (!nextMessage) {
        return;
      }

      setMessage(nextMessage);
    };

    window.addEventListener(dropListJoinedEventName, onDropListJoined);

    return () => {
      window.removeEventListener(dropListJoinedEventName, onDropListJoined);
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMessage("");
    }, HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [message]);

  return (
    <p className={`drop-list-toast ${message ? "is-visible" : ""}`} role="status" aria-live="polite">
      {message || "You joined the drop list"}
    </p>
  );
}