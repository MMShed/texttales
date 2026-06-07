import { useState, useEffect } from "react";
import "../styles/pages/Explore.css";
import { useNavigate } from "react-router-dom";

import "../styles/pages/Explore.css"

function Explore() {
  const navigate = useNavigate();

  let [filter, setFilter] = useState("All");
  const [stories, setStories] = useState([]);

  const filter_selections = [
    "All",
    "Horror",
    "Mystery",
    "Comedy",
    "Sci-Fi",
    "Fantasy",
    "Thriller"
  ];

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

      <div className="filters">
        {filter_selections.map((f) => {
          return (
            <div key={f} className="filter_choice">
              <a
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  setFilter(f);
                }}
              >
                {f}
              </a>
            </div>
          );
        })}
      </div>

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
              onClick={() => {
                // ✅ Just navigate
                navigate(`/stories/${story._id}`);
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