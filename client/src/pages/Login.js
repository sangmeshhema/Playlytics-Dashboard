import { useState } from "react";
import axios from "axios";
import "../App.css";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginUser = async () => {

    try {

      const res = await axios.post(
        "http://localhost:5000/login",
        {
          email,
          password
        }
      );

      if (res.data.message === "Login successful ✅") {

  localStorage.setItem(
    "token",
    res.data.token
  );

  alert("Login Successful ✅");

  window.location.href = "/dashboard";

} else {

  alert("Login Failed ❌");

}

    } catch (err) {

      console.log(err);
      alert("Login Failed ❌");

    }
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1>PLAYLYTICS LOGIN</h1>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={loginUser}>
  Login
</button>


{/* STEAM LOGIN BUTTON */}

<a
  href="http://localhost:5000/auth/steam"
  style={{
    textDecoration: "none",
    width: "100%"
  }}
>

  <button
    style={{
      marginTop: "15px",
      background: "#171a21",
      color: "white",
      width: "100%",
      padding: "14px",
      border: "none",
      borderRadius: "10px",
      fontSize: "18px",
      fontWeight: "bold",
      cursor: "pointer"
    }}
  >
    Login with Steam
  </button>

</a>

        <p>
          Don't have account?
          <a href="/register"> Register</a>
        </p>

      </div>

    </div>
  );
}

export default Login;