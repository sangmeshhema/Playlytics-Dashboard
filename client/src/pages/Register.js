import { useState } from "react";
import axios from "axios";
import "../App.css";

function Register() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerUser = async () => {

    try {

      await axios.post(
        "http://localhost:5000/register",
        {
          email,
          password
        }
      );

      alert("Registered Successfully ✅");

      window.location.href = "/";

    } catch (err) {

      console.log(err);
      alert("Registration Failed ❌");

    }
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1>PLAYLYTICS REGISTER</h1>

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

        <button onClick={registerUser}>
          Register
        </button>

        <p>
          Already have account?
          <a href="/"> Login</a>
        </p>

      </div>

    </div>
  );
}

export default Register;