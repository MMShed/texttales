import { useState, useEffect } from "react";
import "../styles/pages/Explore.css";
import { useNavigate } from "react-router-dom";

import "../styles/pages/Explore.css"

function Explore() {
  const navigate = useNavigate();

  let [filter, setFilter] = useState("All");
  const [stories, setStories] = useState([]);

  const [remaining, setRemaining] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

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
    const fetchStories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/stories`);
        const data = await res.json();
        setStories(data);
      } catch (err) {
        console.error("Error fetching stories:", err);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="explore_page">
      <p className="explore_title">Explore Stories</p>


      {remaining !== null && (
        <div className="limit_info">
          <p>{remaining} stories remaining</p>
          <p>Resets in {formatTime(timeLeft)}</p>
        </div>
      )}

      <div className="story_container">
        {stories.map((story) => (
          <div key={story._id} className="story_card">
            <div className="card_content">
              <h3>{story.title}</h3>

              {/*  hidden description on hover */}
              <p className="story_description">{story.description}</p>
            </div>

            <button
              className="play_button"
              onClick={async () => {
                try {
                  const userId = localStorage.getItem("userId"); // ✅ DEFINE IT HERE

                  const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/stories/${story._id}?check=true`,
                    {
                      headers: userId
                        ? { "x-user-id": userId }
                        : {}
                    }
                  );
                  

                  const data = await res.json();

                  setRemaining(data.remaining);
                  setTimeLeft(data.timeLeft);

                  console.log("CHECK DATA:", data)


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


          </div>
        ))}
      </div>
    </div>
  );
}

export default Explore;