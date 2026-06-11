import "../styles/pages/StoryPage.css";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function StoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // ✅ NEW: dynamic contact name
  const [currentContactName, setCurrentContactName] = useState("");

  // fetch story
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const userId = localStorage.getItem("userId");

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/stories/${id}`,
          {
            headers: userId ? { "x-user-id": userId } : {}
          }
        );

        console.log("STORY FETCH STATUS:", res.status);

        if (!res.ok) {
          console.error("Failed to fetch story");
          return;
        }

        const data = await res.json();
        console.log("STORY DATA:", data);

        setStory(data.story);

        // ✅ initialize contact name
        setCurrentContactName(
          data.story.contact_name || "Unknown"
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchStory();
  }, [id]);

  // start story
  useEffect(() => {
    if (story && story.nodes.length > 0) {
      setMessages([story.nodes[0]]);
    }
  }, [story]);

  const goToNext = (nextId, playerText = null) => {
    const nextNode = story.nodes.find(
      (node) => node.nodeId === nextId
    );

    if (!nextNode) return;

    // ✅ HANDLE COMMAND: new_contact
    if (nextNode.command === "new_contact") {
      setCurrentContactName(
        nextNode.contact_name || "Unknown"
      );

      setMessages([]); // clear chat

      // continue story automatically
      if (nextNode.nextNodeId) {
        setTimeout(() => {
          goToNext(nextNode.nextNodeId);
        }, 300);
      }

      return;
    }

    // add player message instantly
    if (playerText) {
      setMessages((prev) => [
        ...prev,
        {
          nodeId: "player-" + Date.now(),
          speaker: "You",
          text: playerText,
          isPlayer: true
        }
      ]);
    }

    const isNextPlayerMessage =
      nextNode.speaker === "You";

    // show typing only for NPC text messages
    if (!isNextPlayerMessage && !nextNode.narrator_text) {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, nextNode]);
      }, 1000);
    } else {
      setMessages((prev) => [...prev, nextNode]);
    }
  };

  if (!story || messages.length === 0) {
    return <div>Loading...</div>;
  }

  const currentNode = messages[messages.length - 1];

  return (
    <div className="chat-page">
      <head>
        <title>{story.title}</title>
      </head>

      <h2 className="story-title">{story.title}</h2>

      {/* HEADER */}
      <div className="chat-header">
        <div className="avatar"></div>

        <h3 className="chat-name">
          {currentContactName || "Unknown"}
        </h3>
      </div>

      {/* CHAT */}
      <div className="chat-container">
        {messages.map((node, index) => {
          const previous = messages[index - 1];

          const showName =
            node.speaker &&
            (!previous || previous.speaker !== node.speaker);

          const isPlayerMessage =
            node.speaker === "You" || node.isPlayer;

          return (
            <div
              key={node.nodeId}
              className={`message-container ${
                node.narrator_text
                  ? "narrator"
                  : isPlayerMessage
                  ? "player"
                  : "npc"
              }`}
            >
              {/* NARRATOR */}
              {node.narrator_text ? (
                <div className="narrator-text">
                  {node.narrator_text}
                </div>
              ) : (
                <>
                  {/* show name only for NPC */}
                  {!isPlayerMessage && showName && (
                    <h4 className="speaker-name">
                      {node.speaker}
                    </h4>
                  )}

                  <div className="bubble">
                    {node.text}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Typing animation */}
        {isTyping && (
          <div className="message-container npc">
            <div className="bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* CHOICES */}
      <div className="choices">
        {currentNode.choices && currentNode.choices.length > 0 ? (
          currentNode.choices.map((choice) => (
            <button
              key={choice.nextNodeId}
              className="choice-btn"
              onClick={() =>
                goToNext(choice.nextNodeId, choice.playerText)
              }
              disabled={isTyping}
            >
              {choice.text}
            </button>
          ))
        ) : currentNode.nextNodeId ? (
          <button
            className="choice-btn"
            onClick={() => goToNext(currentNode.nextNodeId)}
            disabled={isTyping}
          >
            Next
          </button>
        ) : (
          <button
            className="end-btn"
            onClick={() => navigate("/explore")}
          >
            Back to Explore
          </button>
        )}
      </div>
    </div>
  );
}

export default StoryPage;