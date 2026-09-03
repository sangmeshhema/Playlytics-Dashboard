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
        // -----------------------------------------------------
        // GET JWT
        // -----------------------------------------------------

        let token =
          localStorage.getItem("token");

        // -----------------------------------------------------
        // GET TOKEN FROM OAUTH REDIRECT
        // -----------------------------------------------------

        const params =
          new URLSearchParams(
            window.location.search
          );

        const urlToken =
          params.get("token");

        if (urlToken) {
          token = urlToken;

          localStorage.setItem(
            "token",
            urlToken
          );

          // Remove token from browser URL
          window.history.replaceState(
            {},
            document.title,
            "/dashboard"
          );
        }

        // -----------------------------------------------------
        // NO TOKEN = GO TO LOGIN
        // -----------------------------------------------------

        if (!token) {
          window.location.href = "/";
          return;
        }

        // =====================================================
        // GET CURRENT PLAYLYTICS USER
        // =====================================================

        const userResponse =
          await axios.get(
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

        // =====================================================
        // STEAM
        // =====================================================

        if (
          user.steamId &&
          user.steamId !== ""
        ) {
          try {
            const steamResponse =
              await axios.get(
                `${process.env.REACT_APP_API_URL}/steam/${user.steamId}`
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

        // =====================================================
        // YOUTUBE
        // =====================================================

        if (
          user.youtubeChannelId &&
          user.youtubeTokens
        ) {
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

        // Invalid/expired token
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

    // =======================================================
    // LIVE CLOCK
    // =======================================================

    const timer =
      setInterval(() => {
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

  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  }

  // =========================================================
  // RECENT GAME
  // =========================================================

  const recentGame =
    [...steamGames]
      .sort(
        (a, b) =>
          (b.rtime_last_played || 0) -
          (a.rtime_last_played || 0)
      )[0];

  // =========================================================
  // TOP GAME
  // =========================================================

  const topGame =
    [...steamGames]
      .sort(
        (a, b) =>
          (b.playtime_forever || 0) -
          (a.playtime_forever || 0)
      )[0];

  // =========================================================
  // CONNECT STEAM
  // =========================================================

  const connectSteam = () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert(
        "Please login to Playlytics first ❌"
      );

      window.location.href = "/";
      return;
    }

    window.location.href =
      `${process.env.REACT_APP_API_URL}/auth/steam?token=${encodeURIComponent(token)}`;
  };

  // =========================================================
  // CONNECT YOUTUBE
  // =========================================================

  const connectYouTube = () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert(
        "Please login to Playlytics first ❌"
      );

      window.location.href = "/";
      return;
    }

    window.location.href =
      `${process.env.REACT_APP_API_URL}/auth/youtube?token=${encodeURIComponent(token)}`;
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");

    window.location.href = "/";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="container"
      style={{
        backgroundImage:
          `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",

        paddingLeft:
          sidebarOpen
            ? "290px"
            : "120px",

        paddingTop: "20px",
        paddingRight: "20px",
        paddingBottom: "40px",

        transition:
          "0.3s ease",

        maxWidth: "1700px",
        margin: "0 auto",

        position: "relative",
        overflow: "hidden"
      }}
    >

      {/* =====================================================
          DARK OVERLAY
      ===================================================== */}

      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "rgba(0,0,0,0.60)",
          zIndex: 0
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2
        }}
      >

        {/* ===================================================
            TITLE
        =================================================== */}

        <h1
          style={{
            color: "white",
            fontSize:
              "clamp(32px, 4vw, 52px)",
            marginBottom: "30px",
            paddingLeft: "20px",
            fontFamily: "Orbitron"
          }}
        >
          PLAYLYTICS DASHBOARD
        </h1>

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <div
          onMouseEnter={() =>
            setSidebarOpen(true)
          }
          onMouseLeave={() =>
            setSidebarOpen(false)
          }
          style={{
            width:
              sidebarOpen
                ? "260px"
                : "90px",

            height: "100%",
            minHeight: "100vh",

            boxSizing: "border-box",

            background:
              "rgba(15,15,15,0.96)",

            backdropFilter:
              "blur(12px)",

            borderRight:
              "1px solid rgba(255,255,255,0.08)",

            position: "fixed",

            left: 0,
            top: 0,

            zIndex: 999,

            transition:
              "0.35s ease",

            padding:
              "20px 15px",

            display: "flex",
            flexDirection: "column",
            justifyContent:
              "space-between",

            overflow: "hidden"
          }}
        >

          {/* TOP */}

          <div>

            {/* LOGO */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                alignItems:
                  "center",
                marginBottom:
                  "50px"
              }}
            >
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
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius:
                    "50%",
                  objectFit:
                    "cover",
                  border:
                    "2px solid rgba(255,255,255,0.15)",
                  boxShadow:
                    "0 0 20px rgba(0,195,255,0.35)"
                }}
              />
            </div>

            {/* MENU */}

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "18px"
              }}
            >

              {[
                [
                  "🎮",
                  "Steam Connect",
                  "steam-section"
                ],
                [
                  "📺",
                  "YT Connect",
                  "youtube-connect"
                ],
                [
                  "🕹️",
                  "My Games",
                  "games-section"
                ],
                [
                  "📊",
                  "Activity",
                  "activity-section"
                ],
                [
                  "🔥",
                  "YT Analytics",
                  "ytanalytics-section"
                ]
              ].map(
                (item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const section =
                        document.getElementById(
                          item[2]
                        );

                      if (section) {
                        section.scrollIntoView(
                          {
                            behavior:
                              "smooth"
                          }
                        );
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "18px",

                      width: "100%",
                      padding: "18px",

                      borderRadius:
                        "18px",

                      border:
                        "1px solid rgba(255,255,255,0.08)",

                      background:
                        "rgba(255,255,255,0.04)",

                      color: "white",

                      cursor:
                        "pointer",

                      transition:
                        "0.3s ease",

                      fontSize: "20px",

                      fontFamily:
                        "Poppins",

                      overflow: "hidden",
                      whiteSpace:
                        "nowrap"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(0,255,255,0.10)";

                      e.currentTarget.style.transform =
                        "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";

                      e.currentTarget.style.transform =
                        "translateX(0px)";
                    }}
                  >

                    <span
                      style={{
                        minWidth: "30px",
                        textAlign:
                          "center"
                      }}
                    >
                      {item[0]}
                    </span>

                    {sidebarOpen &&
                      item[1]}

                  </button>
                )
              )}

            </div>

          </div>

          {/* LOGOUT */}

          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                sidebarOpen
                  ? "flex-start"
                  : "center",

              gap: "18px",

              padding: "18px",

              borderRadius:
                "18px",

              border:
                "1px solid rgba(255,0,0,0.2)",

              background:
                "rgba(255,0,0,0.08)",

              color: "white",

              cursor:
                "pointer",

              fontSize: "20px",

              fontFamily:
                "Poppins",

              whiteSpace:
                "nowrap",

              width: "100%",

              flexShrink: 0
            }}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/1828/1828479.png"
              alt="logout"
              style={{
                width: "28px",
                height: "28px",
                objectFit:
                  "contain",
                filter:
                  "brightness(0) invert(1)",
                flexShrink: 0
              }}
            />

            {sidebarOpen &&
              "Logout"}

          </button>

        </div>

        {/* ===================================================
            TOP WIDGETS
        =================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-start",
            flexWrap:
              "wrap",
            gap: "20px",
            marginBottom:
              "40px",
            alignItems:
              "center"
          }}
        >

          {/* GREETING */}

          <div
            style={{
              flex:
                "1 1 700px",
              minWidth:
                "300px",

              background:
                "rgba(20,20,20,0.35)",

              backdropFilter:
                "blur(12px)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius:
                "28px",

              padding:
                "35px",

              boxShadow:
                "0 0 25px rgba(0,0,0,0.35)"
            }}
          >

            <h2
              style={{
                color: "white",
                fontSize:
                  "clamp(28px, 3vw, 42px)",
                fontFamily:
                  "Orbitron",
                marginBottom:
                  "15px"
              }}
            >
              {greeting},{" "}
              {steamUser?.steamName ||
                steamUser?.displayName ||
                "Gamer"}{" "}
              👋
            </h2>

            <p
              style={{
                color:
                  "rgba(255,255,255,0.85)",

                fontSize:
                  "22px",

                lineHeight:
                  "1.6",

                fontFamily:
                  "Poppins"
              }}
            >
              Welcome back to
              Playlytics.
              Track your Steam
              activity, gaming
              trends and YouTube
              growth in one
              powerful dashboard.
            </p>

          </div>

          {/* CLOCK */}

          <div
            style={{
              flex:
                "1 1 280px",
              maxWidth:
                "320px",
              minWidth:
                "260px",

              background:
                "rgba(20,20,20,0.35)",

              backdropFilter:
                "blur(12px)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius:
                "28px",

              padding:
                "30px",

              textAlign:
                "center",

              boxShadow:
                "0 0 25px rgba(0,0,0,0.35)"
            }}
          >

            <p
              style={{
                color:
                  "#00c3ff",

                fontSize:
                  "18px",

                marginBottom:
                  "15px",

                letterSpacing:
                  "2px",

                fontFamily:
                  "Orbitron"
              }}
            >
              LOCAL TIME
            </p>

            <h1
              style={{
                color: "white",

                fontSize:
                  "clamp(34px, 4vw, 52px)",

                marginBottom:
                  "15px",

                fontFamily:
                  "Orbitron"
              }}
            >
              {time.toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit"
                }
              )}
            </h1>

            <p
              style={{
                color:
                  "rgba(255,255,255,0.8)",

                fontSize:
                  "20px",

                fontFamily:
                  "Poppins"
              }}
            >
              {time.toDateString()}
            </p>

          </div>

        </div>

        {/* ===================================================
            CONNECTION STATUS
        =================================================== */}

        <div
          id="steam-section"
          style={{
            display: "flex",
            gap: "20px",
            paddingLeft:
              "20px",
            marginBottom:
              "50px",
            flexWrap:
              "wrap"
          }}
        >

          {/* STEAM */}

          {connectedSteam ? (

            <div
              style={{
                background:
                  "rgba(0,255,150,0.1)",

                border:
                  "1px solid #00ff99",

                padding:
                  "18px 28px",

                borderRadius:
                  "15px",

                color: "white",

                fontSize:
                  "20px",

                fontFamily:
                  "Orbitron"
              }}
            >
              ✅ Steam Connected
            </div>

          ) : (

            <button
              onClick={
                connectSteam
              }
              style={{
                background:
                  "rgba(255,255,255,0.05)",

                border:
                  "1px solid rgba(255,255,255,0.1)",

                padding:
                  "18px 28px",

                borderRadius:
                  "15px",

                color: "white",

                fontSize:
                  "20px",

                fontFamily:
                  "Orbitron",

                display:
                  "flex",

                alignItems:
                  "center",

                gap: "12px",

                cursor:
                  "pointer",

                transition:
                  "0.3s ease"
              }}
            >
              <img
                src={steamLogo}
                alt="Steam"
                style={{
                  width: "34px",
                  height: "34px",
                  objectFit:
                    "contain",
                  borderRadius:
                    "50%"
                }}
              />

              <span>
                Connect Steam
              </span>
            </button>

          )}

          {/* =========================================================
    YOUTUBE
========================================================= */}

<div id="youtube-connect">

  {connectedYoutube ? (

    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        flexWrap: "wrap"
      }}
    >

      {/* CONNECTED STATUS */}

      <div
        style={{
          background:
            "rgba(0,255,150,0.1)",

          border:
            "1px solid #00ff99",

          padding:
            "18px 28px",

          borderRadius:
            "15px",

          color:
            "white",

          fontSize:
            "20px",

          fontFamily:
            "Orbitron"
        }}
      >
        ✅ YouTube Connected
      </div>


      {/* CHANGE YOUTUBE */}

      <button
        onClick={connectYouTube}
        style={{
          background:
            "rgba(255,255,255,0.05)",

          border:
            "1px solid rgba(255,255,255,0.1)",

          padding:
            "18px 28px",

          borderRadius:
            "15px",

          color:
            "white",

          fontSize:
            "18px",

          fontFamily:
            "Orbitron",

          cursor:
            "pointer",

          transition:
            "0.3s ease"
        }}
      >
        🔄 Change YouTube
      </button>

    </div>

  ) : (

    <button
      onClick={connectYouTube}
      style={{
        background:
          "rgba(255,255,255,0.05)",

        border:
          "1px solid rgba(255,255,255,0.1)",

        padding:
          "18px 28px",

        borderRadius:
          "15px",

        color:
          "white",

        fontSize:
          "20px",

        fontFamily:
          "Orbitron",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "12px",

        cursor:
          "pointer",

        transition:
          "0.3s ease"
      }}
    >

      <img
        src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        alt="youtube"
        style={{
          width:
            "28px",

          height:
            "28px"
        }}
      />

      Connect YouTube

    </button>

  )}

</div>
</div>

        {/* ===================================================
            MY GAMES
        =================================================== */}

        <div
          id="games-section"
          style={{
            background:
              "rgba(20,20,20,0.35)",

            backdropFilter:
              "blur(12px)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "30px",

            padding:
              "35px",

            marginBottom:
              "45px",

            width:
              "100%",

            boxSizing:
              "border-box",

            boxShadow:
              "0 0 30px rgba(0,0,0,0.35)"
          }}
        >

          {/* TITLE */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "15px",

              marginBottom:
                "35px"
            }}
          >

            <img
              src={controller}
              alt="controller"
              style={{
                width:
                  "55px",

                height:
                  "55px",

                objectFit:
                  "contain",

                filter:
                  "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
              }}
            />

            <h2
              style={{
                color:
                  "white",

                fontSize:
                  "clamp(28px, 3vw, 42px)",

                fontFamily:
                  "Orbitron",

                margin: 0
              }}
            >
              My Games
            </h2>

          </div>

          {/* GAME CARDS */}

          {steamGames.length > 0 ? (

            <div
              style={{
                display:
                  "flex",

                gap: "22px",

                flexWrap:
                  "wrap",

                justifyContent:
                  "flex-start",

                alignItems:
                  "flex-start"
              }}
            >

              {[...steamGames]
                .sort(
                  (a, b) =>
                    (b.playtime_forever || 0) -
                    (a.playtime_forever || 0)
                )
                .slice(0, 4)
                .map(
                  (game) => (

                    <div
                      key={
                        game.appid
                      }
                      onMouseEnter={
                        (e) => {
                          e.currentTarget.style.transform =
                            "translateY(-10px) scale(1.02)";

                          e.currentTarget.style.boxShadow =
                            "0 0 35px rgba(0,195,255,0.35)";
                        }
                      }
                      onMouseLeave={
                        (e) => {
                          e.currentTarget.style.transform =
                            "translateY(0px) scale(1)";

                          e.currentTarget.style.boxShadow =
                            "0 0 25px rgba(0,0,0,0.5)";
                        }
                      }
                      style={{
                        position:
                          "relative",

                        overflow:
                          "hidden",

                        borderRadius:
                          "25px",

                        width:
                          "clamp(220px, 22vw, 300px)",

                        height:
                          "190px",

                        color:
                          "white",

                        boxShadow:
                          "0 0 25px rgba(0,0,0,0.5)",

                        transition:
                          "0.35s ease",

                        cursor:
                          "pointer"
                      }}
                    >

                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                        alt={
                          game.name
                        }
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",

                          objectFit:
                            "cover",

                          position:
                            "absolute",

                          top: 0,
                          left: 0
                        }}
                      />

                      <div
                        style={{
                          position:
                            "absolute",

                          inset: 0,

                          background:
                            "rgba(0,0,0,0.45)",

                          backdropFilter:
                            "blur(3px)"
                        }}
                      />

                      <div
                        style={{
                          position:
                            "relative",

                          zIndex: 2,

                          padding:
                            "20px"
                        }}
                      >

                        <h3
                          style={{
                            color:
                              "white",

                            marginBottom:
                              "15px",

                            fontSize:
                              "22px",

                            lineHeight:
                              "28px",

                            textShadow:
                              "0 0 10px black",

                            minHeight:
                              "70px"
                          }}
                        >
                          {
                            game.name
                          }
                        </h3>

                        <p
                          style={{
                            fontSize:
                              "22px",

                            color:
                              "#00c3ff",

                            textShadow:
                              "0 0 15px black",

                            marginTop:
                              "10px",

                            fontWeight:
                              "bold"
                          }}
                        >
                          {
                            (
                              (game.playtime_forever ||
                                0) /
                              60
                            ).toFixed(1)
                          }{" "}
                          hrs
                        </p>

                      </div>

                    </div>

                  )
                )}

            </div>

          ) : (

            <p
              style={{
                color:
                  "rgba(255,255,255,0.75)",

                fontSize:
                  "20px",

                fontFamily:
                  "Poppins"
              }}
            >
              {connectedSteam
                ? "No Steam games available."
                : "Connect Steam to view your games."}
            </p>

          )}

        </div>

        {/* ===================================================
            ACTIVITY
        =================================================== */}

        <div
          id="activity-section"
          style={{
            background:
              "rgba(20,20,20,0.35)",

            backdropFilter:
              "blur(12px)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "30px",

            padding:
              "35px",

            marginBottom:
              "50px",

            width:
              "100%",

            boxSizing:
              "border-box",

            boxShadow:
              "0 0 30px rgba(0,0,0,0.35)"
          }}
        >

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "15px",

              marginBottom:
                "35px"
            }}
          >

            <img
              src="https://cdn-icons-png.flaticon.com/512/686/686589.png"
              alt="activity"
              style={{
                width:
                  "55px",

                height:
                  "55px",

                objectFit:
                  "contain",

                filter:
                  "drop-shadow(0 0 10px rgba(0,255,255,0.6))"
              }}
            />

            <h2
              style={{
                color:
                  "white",

                fontSize:
                  "clamp(26px, 2.8vw, 38px)",

                margin: 0,

                fontFamily:
                  "Orbitron"
              }}
            >
              Activity Overview
            </h2>

          </div>

          <div
            style={{
              display:
                "flex",

              gap:
                "25px",

              flexWrap:
                "wrap"
            }}
          >

            {/* RECENT */}

            {recentGame && (

              <div>

                <h3
                  style={{
                    color:
                      "#00c3ff",

                    fontSize:
                      "26px",

                    marginBottom:
                      "18px",

                    fontFamily:
                      "Orbitron"
                  }}
                >
                  Recently Played
                </h3>

                <div
                  style={{
                    position:
                      "relative",

                    overflow:
                      "hidden",

                    borderRadius:
                      "25px",

                    width:
                      "clamp(220px, 22vw, 300px)",

                    height:
                      "190px",

                    color:
                      "white",

                    boxShadow:
                      "0 0 25px rgba(0,0,0,0.5)"
                  }}
                >

                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${recentGame.appid}/header.jpg`}
                    alt={
                      recentGame.name
                    }
                    style={{
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",

                      position:
                        "absolute",

                      top: 0,

                      left: 0
                    }}
                  />

                  <div
                    style={{
                      position:
                        "absolute",

                      inset: 0,

                      background:
                        "rgba(0,0,0,0.45)",

                      backdropFilter:
                        "blur(3px)"
                    }}
                  />

                  <div
                    style={{
                      position:
                        "relative",

                      zIndex: 2,

                      padding:
                        "20px"
                    }}
                  >

                    <h3
                      style={{
                        color:
                          "white",

                        marginBottom:
                          "15px",

                        fontSize:
                          "22px",

                        lineHeight:
                          "28px",

                        textShadow:
                          "0 0 10px black",

                        minHeight:
                          "70px"
                      }}
                    >
                      {
                        recentGame.name
                      }
                    </h3>

                    <p
                      style={{
                        fontSize:
                          "14px",

                        opacity:
                          0.75,

                        marginTop:
                          "8px",

                        fontFamily:
                          "Poppins"
                      }}
                    >
                      {
                        recentGame.rtime_last_played
                          ? new Date(
                              recentGame.rtime_last_played *
                                1000
                            ).toLocaleString()
                          : "Recently played"
                      }
                    </p>

                  </div>

                </div>

              </div>

            )}

            {/* TOP PLAYED */}

            {topGame && (

              <div>

                <h3
                  style={{
                    color:
                      "#00ff99",

                    fontSize:
                      "26px",

                    marginBottom:
                      "18px",

                    fontFamily:
                      "Orbitron"
                  }}
                >
                  Top Played Game
                </h3>

                <div
                  style={{
                    position:
                      "relative",

                    overflow:
                      "hidden",

                    borderRadius:
                      "25px",

                    width:
                      "clamp(220px, 22vw, 300px)",

                    height:
                      "190px",

                    color:
                      "white",

                    boxShadow:
                      "0 0 25px rgba(0,0,0,0.5)"
                  }}
                >

                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${topGame.appid}/header.jpg`}
                    alt={
                      topGame.name
                    }
                    style={{
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",

                      position:
                        "absolute",

                      top: 0,

                      left: 0
                    }}
                  />

                  <div
                    style={{
                      position:
                        "absolute",

                      inset: 0,

                      background:
                        "rgba(0,0,0,0.45)",

                      backdropFilter:
                        "blur(3px)"
                    }}
                  />

                  <div
                    style={{
                      position:
                        "relative",

                      zIndex: 2,

                      padding:
                        "20px"
                    }}
                  >

                    <h3
                      style={{
                        color:
                          "white",

                        marginBottom:
                          "15px",

                        fontSize:
                          "22px",

                        lineHeight:
                          "28px",

                        textShadow:
                          "0 0 10px black",

                        minHeight:
                          "70px"
                      }}
                    >
                      {
                        topGame.name
                      }
                    </h3>

                    <p
                      style={{
                        fontSize:
                          "14px",

                        opacity:
                          0.75,

                        marginTop:
                          "8px",

                        fontFamily:
                          "Poppins",

                        color:
                          "white"
                      }}
                    >
                      {
                        (
                          (topGame.playtime_forever ||
                            0) /
                          60
                        ).toFixed(1)
                      }{" "}
                      hrs played
                    </p>

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>

        {/* ===================================================
            YOUTUBE ANALYTICS
        =================================================== */}

        <div
          id="ytanalytics-section"
          style={{
            background:
              "rgba(20,20,20,0.35)",

            backdropFilter:
              "blur(12px)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "30px",

            padding:
              "35px",

            marginBottom:
              "50px",

            width:
              "100%",

            boxSizing:
              "border-box",

            boxShadow:
              "0 0 30px rgba(0,0,0,0.35)"
          }}
        >

          {/* TITLE */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "15px",

              marginBottom:
                "40px"
            }}
          >

            <img
              src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
              alt="youtube"
              style={{
                width:
                  "55px",

                height:
                  "55px",

                objectFit:
                  "contain",

                filter:
                  "drop-shadow(0 0 8px rgba(255,0,0,0.7))"
              }}
            />

            <h2
              style={{
                color:
                  "white",

                fontSize:
                  "clamp(28px, 3vw, 42px)",

                fontFamily:
                  "Orbitron",

                margin: 0
              }}
            >
              YouTube Analytics
            </h2>

          </div>

          {youtube ? (

            <>

              {/* STATS */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  textAlign:
                    "center",

                  flexWrap:
                    "wrap",

                  padding:
                    "20px",

                  gap:
                    "40px"
                }}
              >

                {/* SUBSCRIBERS */}

                <div>

                  <h3
                    style={{
                      color:
                        "#ff3b3b",

                      fontSize:
                        "clamp(24px, 2.5vw, 40px)",

                      marginBottom:
                        "10px",

                      fontFamily:
                        "Orbitron"
                    }}
                  >
                    SUBSCRIBERS
                  </h3>

                  <p
                    style={{
                      fontSize:
                        "clamp(24px, 2.2vw, 35px)",

                      color:
                        "white",

                      margin:
                        0,

                      fontWeight:
                        "bold"
                    }}
                  >
                    {Number(
                      youtube.subscribers ||
                        0
                    ).toLocaleString()}
                  </p>

                </div>

                {/* VIEWS */}

                <div>

                  <h3
                    style={{
                      color:
                        "#00c3ff",

                      fontSize:
                        "clamp(24px, 2.5vw, 40px)",

                      marginBottom:
                        "10px",

                      fontFamily:
                        "Orbitron"
                    }}
                  >
                    VIEWS
                  </h3>

                  <p
                    style={{
                      fontSize:
                        "clamp(24px, 2.2vw, 35px)",

                      color:
                        "white",

                      margin:
                        0,

                      fontWeight:
                        "bold"
                    }}
                  >
                    {Number(
                      youtube.views ||
                        0
                    ).toLocaleString()}
                  </p>

                </div>

                {/* VIDEOS */}

                <div>

                  <h3
                    style={{
                      color:
                        "#00ff99",

                      fontSize:
                        "clamp(24px, 2.5vw, 40px)",

                      marginBottom:
                        "10px",

                      fontFamily:
                        "Orbitron"
                    }}
                  >
                    VIDEOS
                  </h3>

                  <p
                    style={{
                      fontSize:
                        "clamp(24px, 2.2vw, 35px)",

                      color:
                        "white",

                      margin:
                        0,

                      fontWeight:
                        "bold"
                    }}
                  >
                    {Number(
                      youtube.videos ||
                        0
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

              {/* MILESTONE */}

              <div
                style={{
                  marginTop:
                    "70px",

                  paddingLeft:
                    "20px"
                }}
              >

                <h2
                  style={{
                    color:
                      "white",

                    fontSize:
                      "clamp(28px, 3vw, 45px)",

                    marginBottom:
                      "20px",

                    fontFamily:
                      "Orbitron"
                  }}
                >
                  Next Milestone
                </h2>

                <div
                  style={{
                    width:
                      "min(420px, 100%)",

                    padding:
                      "30px",

                    boxSizing:
                      "border-box"
                  }}
                >

                  <h3
                    style={{
                      color:
                        "white",

                      fontSize:
                        "30px",

                      marginBottom:
                        "30px"
                    }}
                  >
                    🚀 2K Subscribers Goal
                  </h3>

                  <div
                    style={{
                      width:
                        "100%",

                      height:
                        "25px",

                      background:
                        "rgba(255,255,255,0.15)",

                      borderRadius:
                        "20px",

                      overflow:
                        "hidden",

                      marginBottom:
                        "20px"
                    }}
                  >

                    <div
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
                          )}%`,

                        height:
                          "100%",

                        background:
                          "linear-gradient(to right, #ff0000, #ff4d4d)"
                      }}
                    />

                  </div>

                  <p
                    style={{
                      color:
                        "white",

                      fontSize:
                        "22px"
                    }}
                  >
                    {Number(
                      youtube.subscribers ||
                        0
                    ).toLocaleString()}{" "}
                    / 2,000 Subscribers
                  </p>

                </div>

              </div>

            </>

          ) : (

            <p
              style={{
                color:
                  "white",

                paddingLeft:
                  "20px",

                fontSize:
                  "22px"
              }}
            >
              {connectedYoutube
                ? "Loading YouTube Data..."
                : "Connect YouTube to view analytics"}
            </p>

          )}

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div
          style={{
            marginTop:
              "100px",

            padding:
              "40px 20px",

            borderTop:
              "1px solid rgba(255,255,255,0.1)",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            flexWrap:
              "wrap",

            gap:
              "20px"
          }}
        >

          <div>

            <h2
              style={{
                color:
                  "white",

                fontFamily:
                  "Orbitron",

                fontSize:
                  "28px",

                marginBottom:
                  "10px"
              }}
            >
              PLAYLYTICS
            </h2>

            <p
              style={{
                color:
                  "rgba(255,255,255,0.7)",

                fontSize:
                  "18px"
              }}
            >
              Built with React +
              Steam API +
              YouTube API
            </p>

          </div>

          <div
            style={{
              display:
                "flex",

              gap:
                "25px",

              alignItems:
                "center"
            }}
          >

            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
                alt="github"
                style={{
                  width:
                    "45px",

                  height:
                    "45px",

                  filter:
                    "brightness(0) invert(1)"
                }}
              />
            </a>

            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
                alt="youtube"
                style={{
                  width:
                    "50px",

                  height:
                    "50px"
                }}
              />
            </a>

            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                alt="instagram"
                style={{
                  width:
                    "45px",

                  height:
                    "45px"
                }}
              />
            </a>

            <a
              href="https://linkedin.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="linkedin"
                style={{
                  width:
                    "45px",

                  height:
                    "45px"
                }}
              />
            </a>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;