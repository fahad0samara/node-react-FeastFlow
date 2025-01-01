import {Player} from "@lottiefiles/react-lottie-player";

import animationData from "../src/assets/loader.json"
import { useDarkMode } from "./hook/useDarkMode";

const Loder = () => {
  const isDarkMode = useDarkMode();
  return (
    <div
      className={`w-full overflow-hidden
        rounded-lg shadow-xs p-4
        h-screen
        ${isDarkMode ? "bg-black text-white" : "bg-white text-gray-800"}
        `}
    >
      <Player
        autoplay
        loop
        src={animationData}
        style={{
            height: "400px",  
            width: "400px",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
};

export default Loder;
