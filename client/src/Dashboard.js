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



 useEffect(() => {

  // ================= GET TOKEN =================

  const params = new URLSearchParams(
    window.location.search
  );

  const token = params.get("token");

  if (token) {

    localStorage.setItem(
      "token",
      token
    );

  }

// ================= GET USER =================

axios.get(
  `${process.env.REACT_APP_API_URL}/user`,
  {
    headers: {
      Authorization:
        `Bearer ${localStorage.getItem("token")}`
    }
  }
)

.then((res) => {

  console.log("User:", res.data);

  setSteamUser(res.data);

  // ================= STEAM =================

  if (
    res.data.steamId &&
    res.data.steamId !== ""
  ) {

    setConnectedSteam(true);

    axios.get(
      `${process.env.REACT_APP_API_URL}/steam/${res.data.steamId}`
    )

    .then((response) => {

      setSteamGames(response.data);

    })

    .catch((err) => {

      console.log(err);

    });

  } else {

    setConnectedSteam(false);

    setSteamGames([]);

  }

  // ================= YOUTUBE =================

  if (
    res.data.youtubeChannelId &&
    res.data.youtubeTokens
  ) {

    axios.get(
      `${process.env.REACT_APP_API_URL}/youtube`,
      {
        headers: {
          Authorization:
            `Bearer ${localStorage.getItem("token")}`
        }
      }
    )

    .then((yt) => {

      console.log("YouTube:", yt.data);

      setYoutube(yt.data);

      // ONLY CONNECT AFTER SUCCESS

      setConnectedYoutube(true);

    })

    .catch((err) => {

      console.log(err);

      // FAILED

      setConnectedYoutube(false);

      setYoutube(null);

    });

  } else {

    setConnectedYoutube(false);

    setYoutube(null);

  }

})

.catch((err) => {

  console.log(err);

});

  // ================= CLOCK =================

  const timer = setInterval(() => {

    setTime(new Date());

  }, 1000);

  return () => clearInterval(timer);

}, []);




  const hour = time.getHours();

  let greeting = "";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }


const recentGame = [...steamGames]
  .sort(
    (a, b) =>
      b.rtime_last_played - a.rtime_last_played
  )[0];

const topGame = [...steamGames]
  .sort(
    (a, b) =>
      b.playtime_forever - a.playtime_forever
  )[0];


if (hour < 12) {
  greeting = "Good Morning";
} else if (hour < 18) {
  greeting = "Good Afternoon";
} else {
  greeting = "Good Evening";
} 

  return (

    <div
      className="container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        paddingLeft: sidebarOpen ? "290px" : "120px",
        paddingTop: "20px",
        paddingRight: "20px",
        transition: "0.3s ease",
        paddingBottom: "40px",

        maxWidth: "1700px",
        margin: "0 auto",

        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* DARK OVERLAY */}

<div
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.60)",
    zIndex: 0
  }}
/>

<div
  style={{
    position: "relative",
    zIndex: 2
  }}
>

</div>

      {/* ================= TITLE ================= */}

      <h1
        style={{
          color: "white",
          fontSize: "clamp(32px, 4vw, 52px)",
          marginBottom: "30px",
          paddingLeft: "20px",
          fontFamily: "Orbitron"
        }}
      >
        PLAYLYTICS DASHBOARD
      </h1>

      {/* ================= SIDEBAR ================= */}

<div
  onMouseEnter={() =>
    setSidebarOpen(true)
  }

  onMouseLeave={() =>
    setSidebarOpen(false)
  }

  style={{
    width: sidebarOpen
      ? "260px"
      : "90px",

    height: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    background:
      "rgba(15,15,15,0.96)",

    backdropFilter: "blur(12px)",

    borderRight:
      "1px solid rgba(255,255,255,0.08)",

    position: "fixed",

    left: 0,
    top: 0,

    zIndex: 999,

    transition: "0.35s ease",

    padding: "20px 15px",

    display: "flex",

    flexDirection: "column",

    justifyContent: "space-between",

    overflow: "hidden"
  }}
>

  {/* TOP */}

  <div>

    {/* LOGO */}

    <div
      style={{
        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        marginBottom: "50px"
      }}
    >

      <img
  src={
    connectedSteam && steamUser?.steamAvatar
      ? steamUser.steamAvatar
      : `https://api.dicebear.com/7.x/bottts/png?seed=${steamUser?.email || "gamer"}`
  }

  alt="profile"

  style={{
    width: "70px",
    height: "70px",

    borderRadius: "50%",

    objectFit: "cover",

    border: "2px solid rgba(255,255,255,0.15)",

    boxShadow:
      "0 0 20px rgba(0,195,255,0.35)"
  }}
/>



</div>

    {/* MENU */}

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}
    >

      {[
  ["🎮", "Steam Connect", "steam-section"],
  ["📺", "YT Connect", "youtube-connect"],
  ["🕹️", "My Games", "games-section"],
  ["📊", "Activity ", "activity-section"],
  ["🔥", "YT Analytics", "ytanalytics-section"]
].map((item, index) => (

        <button
  key={index}

  onClick={() => {

    const section =
      document.getElementById(item[2]);

    if (section) {

      section.scrollIntoView({
        behavior: "smooth"
      });

    }

  }}
          style={{
            display: "flex",

            alignItems: "center",

            gap: "18px",

            width: "100%",

            padding: "18px",

            borderRadius: "18px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            background:
              "rgba(255,255,255,0.04)",

            color: "white",

            cursor: "pointer",

            transition: "0.3s ease",

            fontSize: "20px",

            fontFamily: "Poppins",

            overflow: "hidden",

            whiteSpace: "nowrap"
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
              textAlign: "center"
            }}
          >
            {item[0]}
          </span>

          {sidebarOpen && item[1]}

        </button>

      ))}

    </div>

  </div>





  {/* LOGOUT */}

  <button
   onClick={() => {

    localStorage.removeItem("token");

    window.location.href = "/";

  }}
    style={{
  display: "flex",
  alignItems: "center",
  justifyContent: sidebarOpen ? "flex-start" : "center",
  gap: "18px",
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid rgba(255,0,0,0.2)",
  background: "rgba(255,0,0,0.08)",
  color: "white",
  cursor: "pointer",
  fontSize: "20px",
  fontFamily: "Poppins",
  whiteSpace: "nowrap",
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
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
    flexShrink: 0
  }}
/>

    {sidebarOpen && "Logout"}

  </button>

</div>

      {/* ================= TOP WIDGETS ================= */}

<div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "40px",
    alignItems: "center"
  }}
>




  {/* GREETING CARD */}

  <div
    style={{
      

      flex: "1 1 700px",
      minWidth: "300px",

      background:
        "rgba(20,20,20,0.35)",

      backdropFilter: "blur(12px)",

      border:
        "1px solid rgba(255,255,255,0.08)",

      borderRadius: "28px",

      padding: "35px",

      boxShadow:
        "0 0 25px rgba(0,0,0,0.35)"
    }}
  >

    <h2
      style={{
        color: "white",

        fontSize: "clamp(28px, 3vw, 42px)",

        fontFamily: "Orbitron",

        marginBottom: "15px"
      }}
    >
      {greeting},{" "}
      {steamUser?.displayName || "Gamer"} 👋
    </h2>





    <p
      style={{
        color: "rgba(255,255,255,0.85)",

        fontSize: "22px",

        lineHeight: "1.6",

        fontFamily: "Poppins"
      }}
    >
      Welcome back to Playlytics.

      Track your Steam activity,
      gaming trends and YouTube growth
      in one powerful dashboard.
    </p>

  </div>





  {/* CLOCK CARD */}

  <div
    style={{
      flex: "1 1 280px",
      maxWidth: "320px",
      minWidth: "260px",

      background:
        "rgba(20,20,20,0.35)",

      backdropFilter: "blur(12px)",

      border:
        "1px solid rgba(255,255,255,0.08)",

      borderRadius: "28px",

      padding: "30px",

      textAlign: "center",

      boxShadow:
        "0 0 25px rgba(0,0,0,0.35)"
    }}
  >

    <p
      style={{
        color: "#00c3ff",

        fontSize: "18px",

        marginBottom: "15px",

        letterSpacing: "2px",

        fontFamily: "Orbitron"
      }}
    >
      LOCAL TIME
    </p>





    <h1
      style={{
        color: "white",

        fontSize: "clamp(34px, 4vw, 52px)",

        marginBottom: "15px",

        fontFamily: "Orbitron"
      }}
    >
      {time.toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit"
})}
    </h1>





    <p
      style={{
        color: "rgba(255,255,255,0.8)",

        fontSize: "20px",

        fontFamily: "Poppins"
      }}
    >
      {time.toDateString()}
    </p>

  </div>

</div>

{/* ================= CONNECTION STATUS ================= */}

<div id="steam-section"
  style={{
    display: "flex",
    gap: "20px",
    paddingLeft: "20px",
    marginBottom: "50px",
    flexWrap: "wrap"
  }}
>
  {/* STEAM STATUS */}

{connectedSteam ? (

  <div
    style={{
      background:
        "rgba(0,255,150,0.1)",

      border:
        "1px solid #00ff99",

      padding: "18px 28px",

      borderRadius: "15px",

      color: "white",

      fontSize: "20px",

      fontFamily: "Orbitron"
    }}
  >
    ✅ Steam Connected
  </div>

) : (

  <a
  href={`${process.env.REACT_APP_API_URL}/auth/steam`}
  style={{
    textDecoration: "none"
  }}
>

    <div
      style={{
        background:
          "rgba(255,255,255,0.05)",

        border:
          "1px solid rgba(255,255,255,0.1)",

        padding: "18px 28px",

        borderRadius: "15px",

        color: "white",

        fontSize: "20px",

        fontFamily: "Orbitron",

        display: "flex",

        alignItems: "center",

        gap: "12px",

        cursor: "pointer",

        transition: "0.3s ease"
      }}
    >

      <img
  src={steamLogo}
  alt="Steam"
  style={{
    width: "34px",
    height: "34px",
    objectFit: "contain",
    borderRadius: "50%"
  }}
/>

<span>
  Connect Steam
</span>

    </div>

  </a>

)}


  {/* YOUTUBE STATUS */}

{connectedYoutube ? (

  <div
  id="youtube-connect"
    style={{
      background: "rgba(0,255,150,0.1)",

      border: "1px solid #00ff99",

      padding: "18px 28px",

      borderRadius: "15px",

      color: "white",

      fontSize: "20px",

      fontFamily: "Orbitron"
    }}
  >
    ✅ YouTube Connected
  </div>

) : (

  <div
  onClick={() => {

    const token =
      localStorage.getItem("token");

    window.location.href =
  `${process.env.REACT_APP_API_URL}/auth/youtube?token=${token}`;

  }}

  style={{
    textDecoration: "none"
  }}
>

    <div
      style={{
        background:
          "rgba(255,255,255,0.05)",

        border:
          "1px solid rgba(255,255,255,0.1)",

        padding: "18px 28px",

        borderRadius: "15px",

        color: "white",

        fontSize: "20px",

        fontFamily: "Orbitron",

        display: "flex",

        alignItems: "center",

        gap: "12px",

        cursor: "pointer",

        transition: "0.3s ease"
      }}
    >

      <img
        src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        alt="youtube"
        style={{
          width: "28px",
          height: "28px"
        }}
      />

      Connect YouTube

    </div>

 </div> 
)}
</div>

      {/* ================= MY GAMES SECTION ================= */}

<div id="games-section"
  style={{
  background: "rgba(20,20,20,0.35)",

  backdropFilter: "blur(12px)",

  border: "1px solid rgba(255,255,255,0.08)",

  borderRadius: "30px",

  padding: "35px",

  marginBottom: "45px",

  width: "100%",

  boxSizing: "border-box",

  boxShadow: "0 0 30px rgba(0,0,0,0.35)"
}}
>




  {/* TITLE */}

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "35px"
    }}
  >

    <img
      src={controller}
      alt="controller"
      style={{
        width: "55px",
        height: "55px",

        objectFit: "contain",

        filter:
          "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
      }}
    />





    <h2
      style={{
        color: "white",

        fontSize: "clamp(28px, 3vw, 42px)",

        fontFamily: "Orbitron",

        margin: 0
      }}
    >
      My Games
    </h2>

  </div>





  {/* GAME CARDS */}

  <div
    style={{
      display: "flex",
      gap: "22px",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "flex-start"
    }}
  >

    {[...steamGames]
      .sort(
        (a, b) =>
          b.playtime_forever -
          a.playtime_forever
      )
      .slice(0, 4)
      .map((game) => (

        <div
          key={game.appid}

          onMouseEnter={(e) => {

            e.currentTarget.style.transform =
              "translateY(-10px) scale(1.02)";

            e.currentTarget.style.boxShadow =
              "0 0 35px rgba(0,195,255,0.35)";
          }}

          onMouseLeave={(e) => {

            e.currentTarget.style.transform =
              "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow =
              "0 0 25px rgba(0,0,0,0.5)";
          }}

          style={{
            position: "relative",

            overflow: "hidden",

            borderRadius: "25px",

            width: "clamp(220px, 22vw, 300px)",
            height: "190px",

            color: "white",

            boxShadow:
              "0 0 25px rgba(0,0,0,0.5)",

            transition: "0.35s ease",

            cursor: "pointer"
          }}
        >




          {/* IMAGE */}

          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
            alt={game.name}
            style={{
              width: "100%",
              height: "100%",

              objectFit: "cover",

              position: "absolute",

              top: 0,
              left: 0
            }}
          />





          {/* OVERLAY */}

          <div
            style={{
              position: "absolute",
              inset: 0,

              background:
                "rgba(0,0,0,0.45)",

              backdropFilter:
                "blur(3px)"
            }}
          />





          {/* CONTENT */}

          <div
            style={{
              position: "relative",

              zIndex: 2,

              padding: "20px"
            }}
          >

            <h3
              style={{
                color: "white",

                marginBottom: "15px",

                fontSize: "22px",

                lineHeight: "28px",

                textShadow:
                  "0 0 10px black",

                minHeight: "70px"
              }}
            >
              {game.name}
            </h3>





            <p
              style={{
                fontSize: "22px",

                color: "#00c3ff",

                textShadow:
                  "0 0 15px black",

                marginTop: "10px",

                fontWeight: "bold"
              }}
            >
              {(game.playtime_forever / 60).toFixed(1)} hrs
            </p>





            

          </div>

        </div>

      ))}

  </div>

</div>





{/* ================= RECENT + TOP PLAYED ================= */}

<div id="activity-section"
  style={{
    background: "rgba(20,20,20,0.35)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "30px",
    padding: "35px",
    marginBottom: "50px",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 0 30px rgba(0,0,0,0.35)"
  }}
>

  {/* TITLE */}

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "35px"
  }}
>

  <img
  src="https://cdn-icons-png.flaticon.com/512/686/686589.png"
  alt="activity"
  style={{
    width: "55px",
    height: "55px",
    objectFit: "contain",

    filter:
      "drop-shadow(0 0 10px rgba(0,255,255,0.6))"
  }}
/>

  <h2
    style={{
      color: "white",
      fontSize: "clamp(26px, 2.8vw, 38px)",
      margin: 0,
      fontFamily: "Orbitron"
    }}
  >
    Activity Overview
  </h2>

</div>



  <div
    style={{
      display: "flex",
      gap: "25px",
      flexWrap: "wrap"
    }}
  >




    {/* RECENTLY PLAYED */}

    {recentGame && (

      <div>

        <h3
          style={{
            color: "#00c3ff",
            fontSize: "26px",
            marginBottom: "18px",
            fontFamily: "Orbitron"
          }}
        >
          Recently Played
        </h3>

        <div
          onMouseEnter={(e) => {

            e.currentTarget.style.transform =
              "translateY(-10px) scale(1.02)";

            e.currentTarget.style.boxShadow =
              "0 0 35px rgba(0,195,255,0.35)";
          }}

          onMouseLeave={(e) => {

            e.currentTarget.style.transform =
              "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow =
              "0 0 25px rgba(0,0,0,0.5)";
          }}

          style={{
            position: "relative",

            overflow: "hidden",

            borderRadius: "25px",

            width: "clamp(220px, 22vw, 300px)",
            height: "190px",

            color: "white",

            boxShadow:
              "0 0 25px rgba(0,0,0,0.5)",

            transition: "0.35s ease",

            cursor: "pointer"
          }}
        >

          {/* IMAGE */}

          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${recentGame.appid}/header.jpg`}
            alt={recentGame.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0
            }}
          />



          {/* OVERLAY */}

          <div
            style={{
              position: "absolute",
              inset: 0,

              background:
                "rgba(0,0,0,0.45)",

              backdropFilter:
                "blur(3px)"
            }}
          />



          {/* CONTENT */}

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "20px"
            }}
          >

            <h3
              style={{
                color: "white",
                marginBottom: "15px",
                fontSize: "22px",
                lineHeight: "28px",
                textShadow:
                  "0 0 10px black",
                minHeight: "70px"
              }}
            >
              {recentGame.name}
            </h3>

            

            <p
              style={{
                fontSize: "14px",
                opacity: 0.75,
                marginTop: "8px",
                fontFamily: "Poppins"
              }}
            >
              {new Date(
                recentGame.rtime_last_played * 1000
              ).toLocaleString()}
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
            color: "#00ff99",
            fontSize: "26px",
            marginBottom: "18px",
            fontFamily: "Orbitron"
          }}
        >
          Top Played Game
        </h3>

        <div
          onMouseEnter={(e) => {

            e.currentTarget.style.transform =
              "translateY(-10px) scale(1.02)";

            e.currentTarget.style.boxShadow =
              "0 0 35px rgba(0,255,153,0.35)";
          }}

          onMouseLeave={(e) => {

            e.currentTarget.style.transform =
              "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow =
              "0 0 25px rgba(0,0,0,0.5)";
          }}

          style={{
            position: "relative",

            overflow: "hidden",

            borderRadius: "25px",

            width: "clamp(220px, 22vw, 300px)",
            height: "190px",

            color: "white",

            boxShadow:
              "0 0 25px rgba(0,0,0,0.5)",

            transition: "0.35s ease",

            cursor: "pointer"
          }}
        >

          {/* IMAGE */}

          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${topGame.appid}/header.jpg`}
            alt={topGame.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0
            }}
          />



          {/* OVERLAY */}

          <div
            style={{
              position: "absolute",
              inset: 0,

              background:
                "rgba(0,0,0,0.45)",

              backdropFilter:
                "blur(3px)"
            }}
          />



          {/* CONTENT */}

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "20px"
            }}
          >

            <h3
              style={{
                color: "white",
                marginBottom: "15px",
                fontSize: "22px",
                lineHeight: "28px",
                textShadow:
                  "0 0 10px black",
                minHeight: "70px"
              }}
            >
              {topGame.name}
            </h3>

            

            <p
  style={{
    fontSize: "14px",
    opacity: 0.75,
    marginTop: "8px",
    fontFamily: "Poppins",
    color: "white"
  }}
>
  {(topGame.playtime_forever / 60).toFixed(1)} hrs played
</p>

          </div>

        </div>

      </div>

    )}

  </div>

</div>

{/* ================= YOUTUBE DATA ================= */}

<div
  style={{
    background: "rgba(20,20,20,0.35)",

    backdropFilter: "blur(12px)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius: "30px",

    padding: "35px",

    marginBottom: "50px",

    width: "100%",

    boxSizing: "border-box",

    boxShadow:
      "0 0 30px rgba(0,0,0,0.35)"
  }}
>
  {/* TITLE */}

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "40px"
  }}
>

  <img
    src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
    alt="youtube"
    style={{
      width: "55px",
      height: "55px",
      objectFit: "contain",
      filter:
        "drop-shadow(0 0 8px rgba(255,0,0,0.7))"
    }}
  />

  <h2
    style={{
      color: "white",
      fontSize: "clamp(28px, 3vw, 42px)",
      fontFamily: "Orbitron",
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        flexWrap: "wrap",
        padding: "20px",
        gap: "40px"
      }}
    >




      {/* Subscribers */}

      <div>

        <h3
          style={{
            color: "#ff3b3b",
            fontSize: "clamp(24px, 2.5vw, 40px)",
            marginBottom: "10px",
            fontFamily: "Orbitron"
          }}
        >
          SUBSCRIBERS
        </h3>

        <p
          style={{
            fontSize: "clamp(24px, 2.2vw, 35px)",
            color: "white",
            margin: 0,
            fontWeight: "bold"
          }}
        >
          {(youtube.subscribers / 1000).toFixed(1)}K
        </p>

      </div>





      {/* Views */}

      <div>

        <h3
          style={{
            color: "#00c3ff",
            fontSize: "clamp(24px, 2.5vw, 40px)",
            marginBottom: "10px",
            fontFamily: "Orbitron"
          }}
        >
          VIEWS
        </h3>

        <p
          style={{
            fontSize: "clamp(24px, 2.2vw, 35px)",
            color: "white",
            margin: 0,
            fontWeight: "bold"
          }}
        >
          {(youtube.views / 1000000).toFixed(2)}M
        </p>

      </div>





      {/* Videos */}

      <div>

        <h3
          style={{
            color: "#00ff99",
            fontSize: "clamp(24px, 2.5vw, 40px)",
            marginBottom: "10px",
            fontFamily: "Orbitron"
          }}
        >
          VIDEOS
        </h3>

        <p
          style={{
            fontSize: "clamp(24px, 2.2vw, 35px)",
            color: "white",
            margin: 0,
            fontWeight: "bold"
          }}
        >
          {youtube.videos}
        </p>

      </div>

    </div>






    {/* ================= FEATURED YOUTUBE SECTION ================= */}

    <div
      style={{
        display: "flex",
        gap: "35px",
        flexWrap: "wrap",
        marginTop: "70px",
        paddingLeft: "20px"
      }}
    >


      {/* NEXT MILESTONE */}

      <div>

        <h2
          style={{
            color: "white",
            fontSize: "clamp(28px, 3vw, 45px)",
            marginBottom: "20px",
            fontFamily: "Orbitron"
          }}
        >
          Next Milestone
        </h2>

        <div
          style={{
            width: "420px",
            height: "230px",
            borderRadius: "25px",
            padding: "30px",
            background: "rgba(255, 255, 255, 0)",
            boxShadow: "0 0 25px rgba(0, 0, 0, 0)"
          }}
        >

          <h3
            style={{
              color: "white",
              fontSize: "30px",
              marginBottom: "30px"
            }}
          >
            🚀 2K Subscribers Goal
          </h3>

          <div
            style={{
              width: "100%",
              height: "25px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "20px",
              overflow: "hidden",
              marginBottom: "20px"
            }}
          >

            <div
              style={{
                width: `${(youtube.subscribers / 2000) * 100}%`,
                height: "100%",
                background:
                  "linear-gradient(to right, #ff0000, #ff4d4d)"
              }}
            />

          </div>

          <p
            style={{
              color: "white",
              fontSize: "22px"
            }}
          >
            {youtube.subscribers} / 2000 Subscribers
          </p>

        </div>

      </div>

    </div>

  
  </>

) : (

  <p
  style={{
    color: "white",
    paddingLeft: "20px",
    fontSize: "22px"
  }}
>
  {connectedYoutube
    ? "Loading YouTube Data..."
    : "Connect YouTube to view analytics"}
</p>

)}

</div>

{/* ================= FOOTER ================= */}

<div
  style={{
    marginTop: "100px",
    padding: "40px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px"
  }}
>

  {/* LEFT */}

  <div>

    <h2
      style={{
        color: "white",
        fontFamily: "Orbitron",
        fontSize: "28px",
        marginBottom: "10px"
      }}
    >
      PLAYLYTICS
    </h2>

    <p
      style={{
        color: "rgba(255,255,255,0.7)",
        fontSize: "18px"
      }}
    >
      Built with React + Steam API + YouTube API
    </p>

  </div>





  {/* SOCIAL LINKS */}

  <div
    style={{
      display: "flex",
      gap: "25px",
      alignItems: "center"
    }}
  >

    {/* GITHUB */}

    <a
      href="https://github.com/"
      target="_blank"
      rel="noreferrer"
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
        alt="github"
        style={{
          width: "45px",
          height: "45px",
          filter: "brightness(0) invert(1)"
        }}
      />
    </a>



    {/* YOUTUBE */}

    <a
      href="https://youtube.com/"
      target="_blank"
      rel="noreferrer"
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        alt="youtube"
        style={{
          width: "50px",
          height: "50px"
        }}
      />
    </a>



    {/* INSTAGRAM */}

    <a
      href="https://instagram.com/"
      target="_blank"
      rel="noreferrer"
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
        alt="instagram"
        style={{
          width: "45px",
          height: "45px"
        }}
      />
    </a>



    {/* LINKEDIN */}

    <a
      href="https://linkedin.com/"
      target="_blank"
      rel="noreferrer"
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
        alt="linkedin"
        style={{
          width: "45px",
          height: "45px"
        }}
      />
    </a>

  </div>

</div> 
    </div>


    
  );
}

export default Dashboard;