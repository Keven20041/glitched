export const dropListJoinedEventName = "glitched-drop-list-joined";

export type DropListJoinedEventDetail = {
  message: string;
};

export const notifyDropListJoined = (message: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<DropListJoinedEventDetail>(dropListJoinedEventName, {
      detail: {
        message,
      },
    }),
  );
};