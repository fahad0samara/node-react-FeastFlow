// // // import React, {useState, useEffect, useRef} from "react";

// // // const Slider = () => {
// // //   const [activeIndex, setActiveIndex] = useState(0);
// // //   const sliderRef = useRef(null);
// // //   const slides = [
// // //     {id: 1, caption: "Slide 1"},
// // //     {id: 2, caption: "Slide 2"},
// // //     {id: 3, caption: "Slide 3"},
// // //     {id: 1, caption: "Slide 1"},
// // //     {id: 2, caption: "Slide 2"},
// // //     {id: 3, caption: "Slide 3"},
// // //   ];

// // //   const nextSlide = () => {
// // //     setActiveIndex(prevIndex => (prevIndex + 1) % slides.length);
// // //   };

// // //   useEffect(() => {
// // //     const interval = setInterval(() => {
// // //       nextSlide();
// // //     }, 5000);

// // //     return () => clearInterval(interval);
// // //   }, []);

// // //   useEffect(() => {
// // //     if (sliderRef.current) {
// // //       sliderRef.current.style.transform = `translateX(-${
// // //         activeIndex * (100 / slides.length)
// // //       }%)`;
// // //     }
// // //   }, [activeIndex]);

// // //   return (
// // //     <div className="w-full max-w-screen-lg mx-auto relative mb-8">
// // //       <div
// // //         className="flex overflow-hidden space-x-10"
// // //         ref={sliderRef}
// // //         style={{transition: "transform 0.5s"}}
// // //       >
// // //         {slides.map(slide => (
// // //           <div
// // //             key={slide.id}
// // //             className="w-full"
// // //             style={{width: `${100 / slides.length}%`}}
// // //           >
// // //             <div className="p-4 bg-black bg-opacity-50 text-white text-lg">
// // //               {slide.caption}
// // //             </div>
// // //           </div>
// // //         ))}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default Slider;

// // import React, {useState, useEffect, useRef} from "react";

// // const Slider = () => {
// //   const [activeIndex, setActiveIndex] = useState(0);
// //   const sliderRef = useRef(null);
// //   const categories = [
// //     {id: 1, name: "Italian Cuisine", color: "#ff6347"},
// //     {id: 2, name: "Asian Delights", color: "#ffd700"},
// //     {id: 3, name: "Mexican Flavors", color: "#00bfff"},
// //     {id: 4, name: "Healthy Salads", color: "#32cd32"},
// //     {id: 5, name: "Sweet Treats", color: "#ff69b4"},
// //     {id: 6, name: "Italian Cuisine", color: "#ff6347"},
// //     {id: 7, name: "Asian Delights", color: "#ffd700"},
// //     {id: 8, name: "Mexican Flavors", color: "#00bfff"},
// //     {id: 9, name: "Healthy Salads", color: "#32cd32"},
// //     {id: 10, name: "Sweet Treats", color: "#ff69b4"},
// //   ];

// //   const nextSlide = () => {
// //     setActiveIndex(prevIndex => (prevIndex + 1) % categories.length);
// //   };

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       nextSlide();
// //     }, 5000);

// //     return () => clearInterval(interval);
// //   }, []);

// //   useEffect(() => {
// //     if (sliderRef.current) {
// //       sliderRef.current.style.transform = `translateX(-${
// //         activeIndex * (100 / categories.length)
// //       }%)`;
// //     }
// //   }, [activeIndex]);

// //   return (
// //     <div className="w-full max-w-screen-lg mx-auto relative mb-8">
// //       <div
// //         className="flex overflow-hidden space-x-10"
// //         ref={sliderRef}
// //         style={{transition: "transform 0.5s"}}
// //       >
// //         {categories.map(category => (
// //           <div
// //             key={category.id}
// //             className="w-full flex-shrink-0 bg-gray-200 rounded-md"
// //             style={{
// //               width: `${100 / categories.length}%`,
// //             }}
// //           >
// //             <div className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transform -skew-x-12 transition duration-300">
// //               {category.name}
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // export default Slider;

// import React, {useState, useEffect, useRef} from "react";
// import axios from "axios";

// interface Category {
//   _id: string;
//   name: string;
// }

// const Slider: React.FC = () => {
//   const [activeIndex, setActiveIndex] = useState<number>(0);
//   const sliderRef = useRef<HTMLDivElement>(null);
//   const [categories, setCategories] = useState<Category[]>([]);

//   const fetchCategories = async () => {
//     try {
//       const response = await axios.get<Category[]>(
//         "http://localhost:1337/api/categories"
//       );
//       setCategories(response.data);
//     } catch (error) {
//       console.error("Error retrieving categories:", error);
//     }
//   };

//   const nextSlide = () => {
//     setActiveIndex(prevIndex => (prevIndex + 1) % categories.length);
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       nextSlide();
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [categories]);

//   useEffect(() => {
//     if (sliderRef.current) {
//       sliderRef.current.style.transform = `translateX(-${
//         activeIndex * (100 / categories.length)
//       }%)`;
//     }
//   }, [activeIndex, categories]);

//   return (
//     <div className="w-full max-w-screen-lg mx-auto relative mb-8">
//       <div
//         className="flex overflow-hidden space-x-10"
//         ref={sliderRef}
//         style={{transition: "transform 0.5s"}}
//       >
//         {categories.map(category => (
//           <div
//             key={category._id}
//             className="w-full flex-shrink-0 bg-gray-200 rounded-md"
//             style={{
//               width: `${100 / categories.length}%`,
//             }}
//           >
//             <div className="bg-green-600 hover:bg-green-700 text-white px-4  py-2 rounded-lg transform -skew-x-12 transition duration-300">
//               {category.name}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Slider;
// import React, {useState, useEffect, useRef} from "react";
// import {FiChevronLeft, FiChevronRight, FiTag} from "react-icons/fi";
// import axios from "axios";

// interface Category {
//   _id: string;
//   name: string;
//   description: string;
// }

// const Slider: React.FC = () => {
//   const [activeIndex, setActiveIndex] = useState<number>(0);
//   const sliderRef = useRef<HTMLDivElement>(null);
//   const [categories, setCategories] = useState<Category[]>([]);

//   const fetchCategories = async () => {
//     try {
//       const response = await axios.get<Category[]>(
//         "http://localhost:1337/api/categories"
//       );
//       setCategories(response.data);
//     } catch (error) {
//       console.error("Error retrieving categories:", error);
//     }
//   };

//   const nextSlide = () => {
//     setActiveIndex(prevIndex => (prevIndex + 1) % categories.length);
//   };

//   const prevSlide = () => {
//     setActiveIndex(prevIndex =>
//       prevIndex === 0 ? categories.length - 1 : prevIndex - 1
//     );
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   useEffect(() => {
//     if (sliderRef.current) {
//       sliderRef.current.style.transform = `translateX(-${
//         activeIndex * (100 / categories.length)
//       }%)`;
//     }
//   }, [activeIndex, categories]);

//   return (
//     <div className="w-full max-w-screen-lg mx-auto relative mb-8 my-3">
//       <div className="flex flex-col items-center justify-center mb-4">
//         <h2 className="text-lg font-bold text-green-500 italic">
//           Explore Our Categories
//         </h2>
//         <p className="text-center font-semibold">
//           Discover a wide range of categories to find your inspiration and
//           explore new culinary adventures.
//         </p>
//       </div>
//       <div
//         className="relative overflow-hidden whitespace-nowrap"
//         style={{
//           scrollSnapType: "x mandatory",
//           WebkitOverflowScrolling: "touch",
//         }}
//       >
//         <div
//           className="flex space-x-10"
//           ref={sliderRef}
//           style={{transition: "transform 0.5s"}}
//         >
//           {categories.map((category, index) => (
//             <div
//               key={category._id}
//               className="flex-shrink-0 bg-gray-200 rounded-md inline-block"
//               style={{
//                 width: `${
//                   index === categories.length - 1
//                     ? `calc(100% / ${categories.length})`
//                     : `${100 / categories.length}%`
//                 }`,
//               }}
//             >
//               <div className="bg-green-600 text-center hover:bg-green-700 text-white px-1 py-1 rounded-lg transform -skew-x-12 transition duration-300">
//                 {category.name}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {activeIndex > 0 && (
//         <button
//           className="absolute top-1/2 -left-14 transform -translate-y-1/2 bg-green-500 rounded-full p-2 text-gray-600"
//           onClick={prevSlide}
//         >
//           <FiChevronLeft size={20} />
//         </button>
//       )}
//       {activeIndex < categories.length - 1 && (
//         <button
//           className="absolute top-1/2 -right-14 bg-green-500 transform -translate-y-1/2 rounded-full p-2 text-gray-600"
//           onClick={nextSlide}
//         >
//           <FiChevronRight size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default Slider;

import React, {useState, useEffect, useRef} from "react";
import {FiChevronLeft, FiChevronRight} from "react-icons/fi";
import axios from "axios";
import { FETCH_CATEGORIES_URL } from "../urls";

interface Category {
  _id: string;
  name: string;
  description: string;
}

const Slider: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>(FETCH_CATEGORIES_URL);
      setCategories(response.data);
    } catch (error) {
      console.error("Error retrieving categories:", error);
    }
  };

  const nextSlide = () => {
    setActiveIndex(prevIndex => (prevIndex + 1) % categories.length);
  };

  const prevSlide = () => {
    setActiveIndex(prevIndex =>
      prevIndex === 0 ? categories.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.transform = `translateX(-${
        activeIndex * (100 / categories.length)
      }%)`;
    }
  }, [activeIndex, categories]);

  return (
    <div className="w-full max-w-screen-lg mb-20 mx-auto relative  mt-12">
      <div className="flex flex-col items-center justify-center mb-4">
        <h2 className="text-lg font-bold text-green-500 italic">
          Explore Our Categories
        </h2>
        <p className="text-center font-semibold">
          Discover a wide range of categories to find your inspiration and
          explore new culinary adventures.
        </p>
      </div>
      <div
        className="relative overflow-hidden whitespace-nowrap"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          className="flex space-x-10"
          ref={sliderRef}
          style={{transition: "transform 0.5s"}}
        >
          {categories.map((category) => (
            <div
              key={category._id}
              className="flex-shrink-0  rounded-md inline-block w-32"
            >
              <div className="bg-green-600 text-center hover:bg-green-700 text-white px-1 py-1 rounded-lg transform -skew-x-12 transition duration-300">
                {category.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeIndex > 0 && (
        <button
          className={
            "absolute xl:top-1/2   -bottom-16 xl:-bottom-0 xl:-left-14  left-16  transform -translate-y-1/2 bg-green-500 rounded-full p-2 text-gray-600"
          }
          onClick={prevSlide}
        >
          <FiChevronLeft size={20} />
        </button>
      )}
      {activeIndex < categories.length - 1 && (
        <button
          className={
            "absolute xl:top-1/2 -bottom-16 xl:-bottom-0 xl:-right-14   right-16 bg-green-500 transform -translate-y-1/2 rounded-full p-2 text-gray-600"
          }
          onClick={nextSlide}
        >
          <FiChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export default Slider;
