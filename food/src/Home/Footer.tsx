// import {Link} from "react-router-dom";

// const Footer = () => {
//   return (
//     <footer className="bg-gradient-to-b from-green-400 to-green-500 rounded-lg shadow-lg p-8 relative">
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         viewBox="0 0 1440 320"
//         className="absolute bottom-0 left-0 right-0"
//       >
//         <path
//           fill="#fff"
//           d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,240C1120,235,1280,181,1360,154.7L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
//         ></path>
//       </svg>
//       <div className="max-w-screen-xl mx-auto relative z-10">
//         <div className="flex items-center justify-between mb-8">
//           <Link to="/" className="flex items-center">
//             <img
//               src="https://flowbite.com/docs/images/logo.svg"
//               className="h-8 mr-3"
//               alt="Flowbite Logo"
//             />
//             <span className="text-xl font-semibold text-white">
//               Taste the World
//             </span>
//           </Link>
//           <ul className="flex flex-wrap items-center space-x-4 text-sm font-medium text-gray-800">
//             <li>
//               <Link to="/" className="hover:underline">
//                 Home
//               </Link>
//             </li>
//             <li>
//               <Link to="/" className="hover:underline">
//                 Menu
//               </Link>
//             </li>
//             <li>
//               <Link to="/" className="hover:underline">
//                 About
//               </Link>
//             </li>
//             <li>
//               <Link to="/" className="hover:underline">
//                 Contact
//               </Link>
//             </li>
//           </ul>
//         </div>
//         <hr className="border-green-50 mb-8" />

//         <div className="flex justify-center mt-8">
//           <span className="text-gray-800">
//             © 2023{" "}
//             <Link to="/" className="hover:underline text-blue-700">
//               Taste the World
//             </Link>
//             . All Rights Reserved.
//           </span>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;


import {Link} from "react-router-dom";
import { useDarkMode } from "../hook/useDarkMode";
import logo from '../../public/vite.svg'

const Footer = () => {
  const isDarkMode = useDarkMode();
  return (
    <footer className="bg-gradient-to-b from-green-400 to-green-500 rounded-lg shadow-lg p-8 relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        className="absolute bottom-0 left-0 right-0 "
      >
        <path
          fill={`${isDarkMode ? "#000" : "#fff"}`}
          d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,240C1120,235,1280,181,1360,154.7L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
        ></path>
      </svg>
      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center bg-black">
            <img
              src={logo}
              className="h-8 mr-3"
              alt="YumDrop
 Logo"
            />
            <span className="text-xl font-semibold text-white">YumDrop</span>
          </Link>
       
        </div>
        <hr className="border-green-50 mb-8" />

        <div className="flex justify-center">
          <span className="">
            © 2023{" "}
            <Link to="/" className="hover:underline md:text-green-500 md:bg-transparent bg-green-500 text-white">
              YumDrop
            </Link>
            . All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
