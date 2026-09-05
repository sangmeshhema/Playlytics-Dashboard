import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import controller from "./assets/images.png";
import bg from "./assets/123.jpg";
import steamLogo from "./assets/steam.png";

function Dashboard() {
  const [youtube, setYoutube] = useState(null);
  const [steamGames, setSteamGames] = useState([]);
  const [steamUser, setSteamUser] = useState(null);

  const [connectedSteam, setConnectedSteam] = useState(false);
  const [connectedYoutube, setConnectedYoutube] = useState(false);

  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        let token = localStorage.getItem("token");

        // -----------------------------------------------------
        // NORMAL STEAM LOGIN SESSION
        // -----------------------------------------------------

        if (!token) {
          try {
            const sessionResponse = await axios.post(
              `${process.env.REACT_APP_API_URL}/auth/steam/session`,
              {},
              {
                withCredentials: true
              }
            );

            if (
              sessionResponse.data &&
              sessionResponse.data.token
            ) {
              token = sessionResponse.data.token;

              localStorage.setItem(
                "token",
                token
              );

              console.log(
                "Steam login token received ✅"
              );
            }
          } catch (sessionError) {
            console.log(
              "No Steam login session found:",
              sessionError
            );
          }
        }

        // -----------------------------------------------------
        // NO TOKEN
        // -----------------------------------------------------

        if (!token) {
          window.location.href = "/";
          return;
        }

        // -----------------------------------------------------
        // GET CURRENT PLAYLYTICS USER
        // -----------------------------------------------------

        const userResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/user`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        const user =
          userResponse.data;

        console.log(
          "Current Playlytics user:",
          user
        );

        setSteamUser(user);

        // -----------------------------------------------------
        // STEAM
        // -----------------------------------------------------

        if (
          user.steamId &&
          user.steamId !== ""
        ) {
          try {
            const steamResponse =
              await axios.get(
                `${process.env.REACT_APP_API_URL}/steam/${user.steamId}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`
                  }
                }
              );

            console.log(
              "Steam games:",
              steamResponse.data
            );

            setSteamGames(
              steamResponse.data || []
            );

            setConnectedSteam(true);
          } catch (error) {
            console.log(
              "Steam data error:",
              error
            );

            setConnectedSteam(true);
            setSteamGames([]);
          }
        } else {
          setConnectedSteam(false);
          setSteamGames([]);
        }

        // -----------------------------------------------------
        // YOUTUBE
        // -----------------------------------------------------

        if (user.youtubeChannelId) {
          try {
            const youtubeResponse =
              await axios.get(
                `${process.env.REACT_APP_API_URL}/youtube`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`
                  }
                }
              );

            console.log(
              "YouTube data:",
              youtubeResponse.data
            );

            setYoutube(
              youtubeResponse.data
            );

            setConnectedYoutube(true);
          } catch (error) {
            console.log(
              "YouTube data error:",
              error
            );

            setYoutube(null);
            setConnectedYoutube(false);
          }
        } else {
          setYoutube(null);
          setConnectedYoutube(false);
        }

      } catch (error) {
        console.log(
          "Dashboard loading error:",
          error
        );

        // -----------------------------------------------------
        // INVALID / EXPIRED TOKEN
        // -----------------------------------------------------

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem(
            "token"
          );

          window.location.href = "/";
        }
      }
    };

    loadDashboard();

    // ---------------------------------------------------------
    // LIVE CLOCK
    // ---------------------------------------------------------

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // =========================================================
  // GREETING
  // =========================================================

  const hour =
    time.getHours();

  let greeting =
    "Good Evening";

  if (hour < 12) {
    greeting =
      "Good Morning";
  } else if (hour < 18) {
    greeting =
      "Good Afternoon";
  }

  // =========================================================
  // RECENT GAME
  // =========================================================

  const recentGame =
    [...steamGames].sort(
      (a, b) =>
        (b.rtime_last_played || 0) -
        (a.rtime_last_played || 0)
    )[0];

  // =========================================================
  // TOP GAME
  // =========================================================

  const topGame =
    [...steamGames].sort(
      (a, b) =>
        (b.playtime_forever || 0) -
        (a.playtime_forever || 0)
    )[0];

  // =========================================================
  // CONNECT STEAM
  // =========================================================

  const connectSteam =
    async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        alert(
          "Please login to Playlytics first ❌"
        );

        window.location.href = "/";
        return;
      }

      try {
        const response =
          await axios.post(
            `${process.env.REACT_APP_API_URL}/auth/steam/start`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              },
              withCredentials: true
            }
          );

        if (
          response.data &&
          response.data.url
        ) {
          window.location.href =
            response.data.url;
        } else {
          throw new Error(
            "Steam login URL not received"
          );
        }

      } catch (error) {
        console.error(
          "Steam connection start error:",
          error
        );

        alert(
          "Unable to start Steam connection ❌"
        );
      }
    };

  // =========================================================
  // CONNECT YOUTUBE
  // =========================================================

  const connectYouTube =
    async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        alert(
          "Please login to Playlytics first ❌"
        );

        window.location.href = "/";
        return;
      }

      try {
        const response =
          await axios.post(
            `${process.env.REACT_APP_API_URL}/auth/youtube/start`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              },
              withCredentials: true
            }
          );

        if (
          response.data &&
          response.data.url
        ) {
          window.location.href =
            response.data.url;
        } else {
          throw new Error(
            "YouTube login URL not received"
          );
        }

      } catch (error) {
        console.error(
          "YouTube connection start error:",
          error
        );

        alert(
          "Unable to start YouTube connection ❌"
        );
      }
    };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // =========================================================
  // SIDEBAR HOVER
  // Desktop only
  // =========================================================

  const handleSidebarEnter = () => {
    if (window.innerWidth > 700) {
      setSidebarOpen(true);
    }
  };

  const handleSidebarLeave = () => {
    if (window.innerWidth > 700) {
      setSidebarOpen(false);
    }
  };

  // =========================================================
  // SCROLL TO SECTION
  // =========================================================

  const scrollToSection = (
    sectionId
  ) => {
    const section =
      document.getElementById(
        sectionId
      );

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  // =========================================================
  // GAME CARD
  // =========================================================

  const renderGameCard = (
    game
  ) => {
    return (
      <div
        key={game.appid}
        className="game-card"
      >
        <img
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
          alt={game.name}
          className="game-card-image"
        />

        <div className="game-card-overlay" />

        <div className="game-card-content">
          <h3>
            {game.name}
          </h3>

          <p>
            {
              (
                (game.playtime_forever || 0) /
                60
              ).toFixed(1)
            }{" "}
            hrs
          </p>
        </div>
      </div>
    );
  };

  // =========================================================
  // ACTIVITY CARD
  // =========================================================

  const renderActivityCard = (
    game,
    type
  ) => {
    if (!game) {
      return null;
    }

    const isRecent =
      type === "recent";

    return (
      <div className="activity-item">
        <h3
          className={
            isRecent
              ? "activity-label recent-label"
              : "activity-label top-label"
          }
        >
          {isRecent
            ? "Recently Played"
            : "Top Played Game"}
        </h3>

        <div className="activity-card">
          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
            alt={game.name}
            className="activity-card-image"
          />

          <div className="activity-card-overlay" />

          <div className="activity-card-content">
            <h4>
              {game.name}
            </h4>

            {isRecent ? (
              <p>
                {game.rtime_last_played
                  ? new Date(
                      game.rtime_last_played *
                        1000
                    ).toLocaleString()
                  : "Recently played"}
              </p>
            ) : (
              <p>
                {
                  (
                    (game.playtime_forever || 0) /
                    60
                  ).toFixed(1)
                }{" "}
                hrs played
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="dashboard-background"
        style={{
          backgroundImage:
            `url(${bg})`
        }}
      />

      <div className="dashboard-overlay" />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={
          `dashboard-sidebar ${
            sidebarOpen
              ? "sidebar-open"
              : "sidebar-closed"
          }`
        }
        onMouseEnter={
          handleSidebarEnter
        }
        onMouseLeave={
          handleSidebarLeave
        }
      >

        {/* LOGO / PROFILE */}

        <div className="sidebar-top">

          <div className="sidebar-profile">
            <img
              src={
                connectedSteam &&
                steamUser?.steamAvatar
                  ? steamUser.steamAvatar
                  : `https://api.dicebear.com/7.x/bottts/png?seed=${
                      steamUser?.email ||
                      "gamer"
                    }`
              }
              alt="profile"
              className="sidebar-profile-image"
            />
          </div>

          {/* MENU */}

          <nav className="sidebar-menu">

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "steam-section"
                )
              }
              className="sidebar-menu-button"
            >
              <span>
                🎮
              </span>

              {sidebarOpen && (
                <span>
                  Steam Connect
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "youtube-connect"
                )
              }
              className="sidebar-menu-button"
            >
              <span>
                📺
              </span>

              {sidebarOpen && (
                <span>
                  YT Connect
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "games-section"
                )
              }
              className="sidebar-menu-button"
            >
              <span>
                🕹️
              </span>

              {sidebarOpen && (
                <span>
                  My Games
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "activity-section"
                )
              }
              className="sidebar-menu-button"
            >
              <span>
                📊
              </span>

              {sidebarOpen && (
                <span>
                  Activity
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "ytanalytics-section"
                )
              }
              className="sidebar-menu-button"
            >
              <span>
                🔥
              </span>

              {sidebarOpen && (
                <span>
                  YT Analytics
                </span>
              )}
            </button>

          </nav>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={logout}
          className="sidebar-logout"
        >
          <span className="sidebar-logout-icon">
            ⇥
          </span>

          {sidebarOpen && (
            <span>
              Logout
            </span>
          )}
        </button>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className={
          `dashboard-main ${
            sidebarOpen
              ? "main-sidebar-open"
              : "main-sidebar-closed"
          }`
        }
      >

        {/* ===================================================
            HEADER
        =================================================== */}

        <h1 className="dashboard-title">
          PLAYLYTICS DASHBOARD
        </h1>

        {/* ===================================================
            TOP WIDGETS
        =================================================== */}

        <section className="dashboard-top-grid">

          {/* GREETING */}

          <div className="dashboard-card greeting-card">

            <h2>
              {greeting},{" "}
              {
                steamUser?.steamName ||
                steamUser?.displayName ||
                "Gamer"
              }{" "}
              👋
            </h2>

            <p>
              Welcome back to
              Playlytics. Track your
              Steam activity, gaming
              trends and YouTube
              growth in one powerful
              dashboard.
            </p>

          </div>

          {/* CLOCK */}

          <div className="dashboard-card clock-card">

            <p className="clock-label">
              LOCAL TIME
            </p>

            <h2 className="clock-time">
              {time.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit"
                }
              )}
            </h2>

            <p className="clock-date">
              {time.toDateString()}
            </p>

          </div>

        </section>

        {/* ===================================================
            CONNECTION STATUS
        =================================================== */}

        <section
          id="steam-section"
          className="connection-section"
        >

          {/* STEAM */}

          {connectedSteam ? (
            <div className="connection-status steam-status">
              ✅ Steam Connected
            </div>
          ) : (
            <button
              type="button"
              onClick={connectSteam}
              className="connection-button"
            >
              <img
                src={steamLogo}
                alt="Steam"
                className="connection-icon steam-icon"
              />

              <span>
                Connect Steam
              </span>
            </button>
          )}

          {/* YOUTUBE */}

          <div
            id="youtube-connect"
            className="youtube-connect-wrapper"
          >

            {connectedYoutube ? (
              <div className="youtube-controls">

                <div className="connection-status youtube-status">
                  ✅ YouTube Connected
                </div>

                <button
                  type="button"
                  onClick={connectYouTube}
                  className="change-youtube-button"
                >
                  🔄 Change YouTube
                </button>

              </div>
            ) : (
              <button
                type="button"
                onClick={connectYouTube}
                className="connection-button"
              >
                <span className="youtube-icon">
                  ▶
                </span>

                <span>
                  Connect YouTube
                </span>
              </button>
            )}

          </div>

        </section>

        {/* ===================================================
            MY GAMES
        =================================================== */}

        <section
          id="games-section"
          className="dashboard-section"
        >

          <div className="section-heading">

            <img
              src={controller}
              alt="controller"
              className="section-heading-icon"
            />

            <h2>
              My Games
            </h2>

          </div>

          {steamGames.length > 0 ? (
            <div className="games-grid">

              {[...steamGames]
                .sort(
                  (a, b) =>
                    (b.playtime_forever || 0) -
                    (a.playtime_forever || 0)
                )
                .slice(0, 4)
                .map(renderGameCard)}

            </div>
          ) : (
            <p className="empty-message">
              {connectedSteam
                ? "No Steam games available."
                : "Connect Steam to view your games."}
            </p>
          )}

        </section>

        {/* ===================================================
            ACTIVITY
        =================================================== */}

        <section
          id="activity-section"
          className="dashboard-section"
        >

          <div className="section-heading">

            <span className="section-emoji">
              📊
            </span>

            <h2>
              Activity Overview
            </h2>

          </div>

          <div className="activity-grid">

            {renderActivityCard(
              recentGame,
              "recent"
            )}

            {renderActivityCard(
              topGame,
              "top"
            )}

          </div>

        </section>

        {/* ===================================================
            YOUTUBE ANALYTICS
        =================================================== */}

        <section
          id="ytanalytics-section"
          className="dashboard-section"
        >

          <div className="section-heading">

            <span className="youtube-heading-icon">
              ▶
            </span>

            <h2>
              YouTube Analytics
            </h2>

          </div>

          {youtube ? (
            <>

              {/* STATS */}

              <div className="youtube-stats">

                <div className="youtube-stat">
                  <h3 className="youtube-stat-subs">
                    SUBSCRIBERS
                  </h3>

                  <p>
                    {Number(
                      youtube.subscribers || 0
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="youtube-stat">
                  <h3 className="youtube-stat-views">
                    VIEWS
                  </h3>

                  <p>
                    {Number(
                      youtube.views || 0
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="youtube-stat">
                  <h3 className="youtube-stat-videos">
                    VIDEOS
                  </h3>

                  <p>
                    {Number(
                      youtube.videos || 0
                    ).toLocaleString()}
                  </p>
                </div>

              </div>

              {/* MILESTONE */}

              <div className="milestone-wrapper">

                <h2>
                  Next Milestone
                </h2>

                <div className="milestone-card">

                  <h3>
                    🚀 2K Subscribers Goal
                  </h3>

                  <div className="progress-track">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${Math.min(
                            (
                              Number(
                                youtube.subscribers ||
                                0
                              ) /
                              2000
                            ) *
                            100,
                            100
                          )}%`
                      }}
                    />

                  </div>

                  <p>
                    {Number(
                      youtube.subscribers || 0
                    ).toLocaleString()}{" "}
                    / 2,000 Subscribers
                  </p>

                </div>

              </div>

            </>
          ) : (
            <p className="empty-message">
              {connectedYoutube
                ? "Loading YouTube Data..."
                : "Connect YouTube to view analytics"}
            </p>
          )}

        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="dashboard-footer">

          <div className="footer-brand">

            <h2>
              PLAYLYTICS
            </h2>

            <p>
              Built with React +
              Steam API +
              YouTube API
            </p>

          </div>

          <div className="footer-links">

            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
                alt="GitHub"
              />
            </a>

            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
                alt="YouTube"
              />
            </a>

            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                alt="Instagram"
              />
            </a>

            <a
              href="https://linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
              />
            </a>

          </div>

        </footer>

      </main>

    </div>
  );
}

export default Dashboard;
