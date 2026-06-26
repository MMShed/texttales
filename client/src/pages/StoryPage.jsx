import "../styles/pages/StoryPage.css";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function StoryPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentContactName, setCurrentContactName] = useState("");

  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const checkLogin = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        credentials: "include"
      });
      const data = await res.json();
      setLoggedIn(data.loggedIn);
    };
    checkLogin();
  }, []);

  // fetch story
  useEffect(() => {
    const controller = new AbortController();

    const fetchStory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/stories/${id}`,
          {
            credentials: "include",
            signal: controller.signal
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch story");
          return;
        }

        const data = await res.json();

        setStory(data.story);
        setCurrentContactName(data.story.contact_name || "Unknown");
        setUserLiked(data.userLiked || false);
        setLikeCount(data.story.likes ? data.story.likes.length : 0);

        // store savedNodeId so start story effect can use it
        if (data.savedNodeId) {
          sessionStorage.setItem(`checkpoint_${id}`, data.savedNodeId);
        }

        fetch(`${import.meta.env.VITE_API_URL}/stories/${id}/view`, {
          method: "POST",
          credentials: "include"
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
      }
    };

    fetchStory();

    return () => controller.abort();
  }, [id]);

  // start story — resume from checkpoint if available
  useEffect(() => {
    if (!story || story.nodes.length === 0) return;

    const savedNodeId = sessionStorage.getItem(`checkpoint_${id}`);

    if (savedNodeId) {
      const savedNode = story.nodes.find(n => n.nodeId === savedNodeId);
      if (savedNode) {
        setMessages([savedNode]);
        return;
      }
    }

    setMessages([story.nodes[0]]);
  }, [story, id]);

  const saveProgress = (nodeId) => {
    if (!loggedIn) return;
    fetch(`${import.meta.env.VITE_API_URL}/stories/${id}/progress`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId })
    });
  };

  const handleReset = async () => {
    if (!story) return;
    sessionStorage.removeItem(`checkpoint_${id}`);
    if (loggedIn) {
      await fetch(`${import.meta.env.VITE_API_URL}/stories/${id}/progress`, {
        method: "DELETE",
        credentials: "include"
      });
    }
    setMessages([story.nodes[0]]);
  };

  const handleLike = async () => {
    if (!loggedIn) {
      alert("Create an account to like stories!");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stories/${id}/like`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      setUserLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (err) {
      console.error(err);
    }
  };

  const goToNext = (nextId, playerText = null) => {
    const nextNode = story.nodes.find((node) => node.nodeId === nextId);
    if (!nextNode) return;

    // HANDLE COMMAND: new_contact
    if (nextNode.command === "new_contact") {
      setCurrentContactName(nextNode.contact_name || "Unknown");
      setMessages([]);
      if (nextNode.nextNodeId) {
        setTimeout(() => goToNext(nextNode.nextNodeId), 300);
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

    const isNextPlayerMessage = nextNode.speaker === "You";

    if (!isNextPlayerMessage && !nextNode.narrator_text) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, nextNode]);
        if (nextNode.isCheckpoint) saveProgress(nextNode.nodeId);
      }, 1000);
    } else {
      setMessages((prev) => [...prev, nextNode]);
      if (nextNode.isCheckpoint) saveProgress(nextNode.nodeId);
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

      <div className="story-title-row">
        <h2 className="story-title">{story.title}</h2>
        <div className="story-title-actions">
          <button
            className={`story-like-btn ${userLiked ? "liked" : ""}`}
            onClick={handleLike}
          >
            {userLiked ? "♥" : "♡"} {likeCount}
          </button>
          <button className="story-reset-btn" onClick={handleReset}>
            ↺ Restart
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="chat-header">
        <div className="avatar"></div>
        <h3 className="chat-name">{currentContactName || "Unknown"}</h3>
      </div>

      {/* CHAT */}
      <div className="chat-container">
        {messages.map((node, index) => {
          const previous = messages[index - 1];
          const showName =
            node.speaker && (!previous || previous.speaker !== node.speaker);
          const isPlayerMessage = node.speaker === "You" || node.isPlayer;

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
              {node.narrator_text ? (
                <div className="narrator-text">{node.narrator_text}</div>
              ) : (
                <>
                  {!isPlayerMessage && showName && (
                    <h4 className="speaker-name">{node.speaker}</h4>
                  )}

                  {node.imageUrl && (
                    <div className="bubble image-bubble">
                      <div className="image-wrapper">
                        <img src={node.imageUrl} className="story-image" />
                        {!loggedIn && (
                          <div className="image-overlay">
                            🔒 Create an account to view images
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {node.text && <div className="bubble">{node.text}</div>}
                </>
              )}
            </div>
          );
        })}

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
        {isTyping ? null : currentNode.choices && currentNode.choices.length > 0 ? (
          currentNode.choices.map((choice) => (
            <button
              key={choice.nextNodeId}
              className="choice-btn"
              onClick={() => goToNext(choice.nextNodeId, choice.playerText)}
            >
              {choice.text}
            </button>
          ))
        ) : currentNode.nextNodeId ? (
          <button className="choice-btn" onClick={() => goToNext(currentNode.nextNodeId)}>
            Next
          </button>
        ) : (
          <button className="end-btn" onClick={() => navigate("/explore")}>
            Back to Explore
          </button>
        )}
      </div>
    </div>
  );
}

export default StoryPage;
