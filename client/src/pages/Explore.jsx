import { useState, useEffect } from "react";
import "../styles/pages/Explore.css";
import { useNavigate } from "react-router-dom";

function Explore() {
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [progressMap, setProgressMap] = useState({});

  function formatTime(ms) {
    if (!ms) return "";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [storiesRes, limitRes, meRes, progressRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/stories`, { credentials: "include" }),
          fetch(`${import.meta.env.VITE_API_URL}/limit-info`, { credentials: "include" }),
          fetch(`${import.meta.env.VITE_API_URL}/me`, { credentials: "include" }),
          fetch(`${import.meta.env.VITE_API_URL}/me/progress`, { credentials: "include" })
        ]);

        const storiesData = await storiesRes.json();
        setStories(storiesData);

        const limitData = await limitRes.json();
        setRemaining(limitData.remaining);
        setTimeLeft(limitData.timeLeft);

        const meData = await meRes.json();
        setLoggedIn(meData.loggedIn);

        const progressData = await progressRes.json();
        const map = {};
        (progressData.progress || []).forEach(p => {
          map[p.storyId] = p.nodeId;
        });
        setProgressMap(map);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev) return prev;
        if (prev <= 1000) return 0;
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = async (e, storyId) => {
    e.stopPropagation();

    if (!loggedIn) {
      alert("Create an account to like stories!");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stories/${storyId}/like`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();

      setStories(prev =>
        prev.map(s =>
          s._id === storyId
            ? { ...s, userLiked: data.liked, likeCount: data.likeCount }
            : s
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="explore_page">
      <head>
        <title>Explore</title>
      </head>

      <p className="explore_title">Explore Stories</p>

      {remaining !== null && (
        <div className="limit_banner">
          <span className="limit_badge">
            {remaining === 0 ? "🚫 Limit reached" : `🟢 ${remaining} stories left`}
          </span>
          <p>Resets in {formatTime(timeLeft)}</p>
        </div>
      )}

      {loading ? (
        <div className="story_container">
          <p className="loading_message">Loading stories...</p>
        </div>
      ) : (
        <div className="story_container">
          {stories.map((story) => (
            <div key={story._id} className="story_card">
              <div className="card_content">
                <h3>{story.title}</h3>
                <p className="story_description">{story.description}</p>
              </div>

              {story.ready ? (
                <div className="story_card_bottom_content">
                  {progressMap[story._id] && (
                    <span className="continue_badge">▶ In progress</span>
                  )}

                  <button
                    className="play_button"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${import.meta.env.VITE_API_URL}/stories/${story._id}?check=true`,
                          { credentials: "include" }
                        );
                        const data = await res.json();
                        setRemaining(data.remaining);
                        setTimeLeft(data.timeLeft);

                        if (!res.ok) {
                          if (data.error === "FREE_LIMIT_REACHED") {
                            alert("You've reached the free limit. Please log in.");
                            return;
                          }
                        }
                        navigate(`/stories/${story._id}`);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    {progressMap[story._id] ? "Continue" : "Play Story"}
                  </button>

                  <div className="story_card_meta">
                    <span className="story_views">👁 {story.view_count || 0}</span>
                    <button
                      className={`like_button ${story.userLiked ? "liked" : ""}`}
                      onClick={(e) => handleLike(e, story._id)}
                    >
                      {story.userLiked ? "♥" : "♡"} {story.likeCount || 0}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="coming_soon">Coming soon</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Explore;
