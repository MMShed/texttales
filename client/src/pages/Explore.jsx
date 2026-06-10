import { useState, useEffect } from "react";
import "../styles/pages/Explore.css";
import { useNavigate } from "react-router-dom";

function Explore() {
  const navigate = useNavigate();

  let [filter, setFilter] = useState("All");
  const [stories, setStories] = useState([]);

  const [remaining, setRemaining] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const [loading, setLoading] = useState(true);

  const filter_selections = [
    "All",
    "Horror",
    "Mystery",
    "Comedy",
    "Sci-Fi",
    "Fantasy",
    "Thriller"
  ];

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

        const storiesRes = await fetch(`${import.meta.env.VITE_API_URL}/stories`);
        const storiesData = await storiesRes.json();
        setStories(storiesData);

        const userId = localStorage.getItem("userId");

        const limitRes = await fetch(
          `${import.meta.env.VITE_API_URL}/limit-info`,
          {
            headers: userId ? { "x-user-id": userId } : {}
          }
        );

        const limitData = await limitRes.json();

        setRemaining(limitData.remaining);
        setTimeLeft(limitData.timeLeft);

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

      {/* ✅ LOADING UI */}
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
                  <button
                    className="play_button"
                    onClick={async () => {
                      try {
                        const userId = localStorage.getItem("userId");

                        const res = await fetch(
                          `${import.meta.env.VITE_API_URL}/stories/${story._id}?check=true`,
                          {
                            headers: userId ? { "x-user-id": userId } : {}
                          }
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
                    Play Story
                  </button>

                  <div className="story_views">
                    👁 {story.view_count || 0} views
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