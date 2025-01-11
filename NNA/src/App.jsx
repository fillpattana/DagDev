import "bootstrap/dist/css/bootstrap.min.css";
import { Route, Routes } from "react-router-dom";
import Agents2 from "./pages/Agents2";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import NavBar from "./components/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Overview" element={<Overview />} />
          <Route path="/Agents" element={<Agents2 />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
