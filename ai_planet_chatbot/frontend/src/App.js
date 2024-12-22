import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import ChatBox from "./Components/ChatBox/ChatBox";
import LoadingBar from "react-top-loading-bar";
import { useRef, useState } from "react";
import Signup from "./Components/Auth/signup.js";
import Signin from "./Components/Auth/signin.js";
import { BrowserRouter, Route, Routes } from "react-router-dom";
function App() {
  const loadingBar = useRef(null);
  const [isUploaded, setIsUploaded] = useState(true);
  return (
    <>
      <BrowserRouter>
        <Navbar loadingBar={loadingBar} setIsUploaded={setIsUploaded} />
        <LoadingBar color="#0FA958" ref={loadingBar} />
        <Routes>
          {/* <ChatBox isUploaded={isUploaded} setIsUploaded={setIsUploaded} /> */}
          <Route
            exact
            path="/chat"
            element={
              <ChatBox isUploaded={isUploaded} setIsUploaded={setIsUploaded} />
            }
          />
          <Route exact path="/signup" element={<Signup />} />
          <Route exact path="/signin" element={<Signin />} />

          {/* <Signin /> */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
