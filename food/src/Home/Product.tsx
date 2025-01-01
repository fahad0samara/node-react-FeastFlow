// // import React, {useState, useEffect, useRef} from "react";

// // const Responsive = () => {
// //   const [windowWidth, setWindowWidth] = useState(window.innerWidth);
// //   const [slidesToShow, setSlidesToShow] = useState(4);
// //   const [slideWidth, setSlideWidth] = useState(0);
// //   const sliderRef = useRef(null);
// //   const [isAutoScrolling, setIsAutoScrolling] = useState(true);

// //   const products = [
// //     {
// //       id: 1,
// //       title: "Product 1",
// //       description:
// //         "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed imperdiet, quam eget sagittis consequat, lectus velit pellentesque felis, at blandit sapien nisl nec ipsum.",
// //       price: 10.99,
// //       image:
// //         "https://images.unsplash.com/photo-1684331733995-b0c69118251a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwzNXx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=60",
// //     },
// //     {
// //       id: 2,
// //       title: "Product 2",
// //       description:
// //         "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed imperdiet, quam eget sagittis consequat, lectus velit pellentesque felis, at blandit sapien nisl nec ipsum.",
// //       price: 12.99,
// //       image:
// //         "https://images.unsplash.com/photo-1683924071058-727d83504671?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw5fHx8ZW58MHx8fHx8&auto=format&fit=crop&w=500&q=60",
// //     },

// //     // Add more products here
// //   ]; // Placeholder products array

// //   useEffect(() => {
// //     const handleResize = () => {
// //       setWindowWidth(window.innerWidth);
// //     };

// //     handleResize();
// //     window.addEventListener("resize", handleResize);

// //     return () => {
// //       window.removeEventListener("resize", handleResize);
// //     };
// //   }, []);

// //   useEffect(() => {
// //     if (windowWidth >= 1024) {
// //       setSlidesToShow(4);
// //     } else if (windowWidth >= 600) {
// //       setSlidesToShow(2);
// //     } else {
// //       setSlidesToShow(1);
// //     }
// //   }, [windowWidth]);

// //   useEffect(() => {
// //     const slider = sliderRef.current;
// //     const slideWidth = slider.querySelector(".slide").offsetWidth;
// //     setSlideWidth(slideWidth);
// //   }, []);

// //   useEffect(() => {
// //     let interval;

// //     if (isAutoScrolling) {
// //       interval = setInterval(() => {
// //         const slider = sliderRef.current;
// //         const slideWidth = slider.querySelector(".slide").offsetWidth;
// //         const totalSlideWidth = slideWidth * products.length;
// //         const maxScrollLeft = totalSlideWidth - slider.offsetWidth;

// //         if (slider.scrollLeft >= maxScrollLeft) {
// //           slider.scrollTo({
// //             left: 0,
// //             behavior: "smooth",
// //           });
// //         } else {
// //           slider.scrollBy({
// //             left: slideWidth,
// //             behavior: "smooth",
// //           });
// //         }
// //       }, 3000);
// //     }

// //     return () => clearInterval(interval);
// //   }, [isAutoScrolling]);

// //   const handlePrev = () => {
// //     const slider = sliderRef.current;
// //     const slideWidth = slider.querySelector(".slide").offsetWidth;
// //     const totalSlideWidth = slideWidth * products.length;
// //     const maxScrollLeft = totalSlideWidth - slider.offsetWidth;

// //     if (slider.scrollLeft <= 0) {
// //       slider.scrollTo({
// //         left: maxScrollLeft,
// //         behavior: "smooth",
// //       });
// //     } else {
// //       slider.scrollBy({
// //         left: -slideWidth,
// //         behavior: "smooth",
// //       });
// //     }

// //     setIsAutoScrolling(false);
// //   };

// //   const handleNext = () => {
// //     const slider = sliderRef.current;
// //     const slideWidth = slider.querySelector(".slide").offsetWidth;
// //     const totalSlideWidth = slideWidth * products.length;
// //     const maxScrollLeft = totalSlideWidth - slider.offsetWidth;

// //     if (slider.scrollLeft >= maxScrollLeft) {
// //       slider.scrollTo({
// //         left: 0,
// //         behavior: "smooth",
// //       });
// //     } else {
// //       slider.scrollBy({
// //         left: slideWidth,
// //         behavior: "smooth",
// //       });
// //     }

// //     setIsAutoScrolling(false);
// //   };

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //       <h2 className="text-3xl font-medium text-gray-900 mb-4">Food Menu</h2>
// //       <div
// //         ref={sliderRef}
// //         className="flex overflow-hidden bg-gray-100 rounded-lg"
// //         style={{scrollSnapType: "x mandatory"}}
// //         onMouseEnter={() => setIsAutoScrolling(false)}
// //         onMouseLeave={() => setIsAutoScrolling(true)}
// //       >
// //         {products.map(product => (
// //           <div
// //             key={product.id}
// //             className={`relative py-8 bg-white shadow-lg rounded-lg mx-2 slide`}
// //             style={{
// //               flex: `0 0 ${100 / slidesToShow}%`,
// //               scrollSnapAlign: "start",
// //               minWidth: `${slideWidth}px`,
// //               maxWidth: "400px",
// //             }}
// //           >
// //             <div className="absolute top-0 left-0 bg-green-600 px-3 py-1 text-sm text-white font-medium rounded-tr-lg rounded-bl-lg">
// //               New
// //             </div>
// //             <div className="relative">
// //               <img
// //                 src={product.image}
// //                 alt={product.title}
// //                 className="h-32 w-full object-cover rounded-t-lg"
// //               />
// //             </div>
// //             <div className="p-4">
// //               <h3 className="text-lg font-medium  mb-2">
// //                 {product.title}
// //               </h3>
// //               <p className="mb-4">{product.description}</p>
// //               <div className="flex justify-between">
// //                 <span className=" font-medium">
// //                   ${product.price.toFixed(2)}
// //                 </span>
// //                 <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg">
// //                   Add to Cart
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //       <div className="flex justify-between mt-4">
// //         <button
// //           className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg"
// //           onClick={handlePrev}
// //         >
// //           Previous
// //         </button>
// //         <button
// //           className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg"
// //           onClick={handleNext}
// //         >
// //           Next
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Responsive;

// import React, {useState, useEffect, useRef} from "react";
// import "./Card.css"; // Import the CSS file for card styling

// const Responsive = () => {
//   const [windowWidth, setWindowWidth] = useState(window.innerWidth);
//   const [slidesToShow, setSlidesToShow] = useState(4);
//   const [slideWidth, setSlideWidth] = useState(0);
//   const sliderRef = useRef(null);
//   const [isAutoScrolling, setIsAutoScrolling] = useState(true);

//   const products = [
//     {
//       id: 1,
//       title: "Product 1",
//       description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
//       price: 10.99,
//       image: "https://example.com/product1.jpg",
//     },
//     {
//       id: 2,
//       title: "Product 2",
//       description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
//       price: 12.99,
//       image: "https://example.com/product2.jpg",
//     },
//     // Add more products here
//   ]; // Placeholder products array

//   useEffect(() => {
//     const handleResize = () => {
//       setWindowWidth(window.innerWidth);
//     };

//     handleResize();
//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     if (windowWidth >= 1024) {
//       setSlidesToShow(4);
//     } else if (windowWidth >= 600) {
//       setSlidesToShow(2);
//     } else {
//       setSlidesToShow(1);
//     }
//   }, [windowWidth]);

//   useEffect(() => {
//     const slider = sliderRef.current;
//     const slideWidth = slider.querySelector(".slide").offsetWidth;
//     setSlideWidth(slideWidth);
//   }, []);

//   useEffect(() => {
//     let interval;

//     if (isAutoScrolling) {
//       interval = setInterval(() => {
//         const slider = sliderRef.current;
//         const slideWidth = slider.querySelector(".slide").offsetWidth;
//         const totalSlideWidth = slideWidth * products.length;
//         const maxScrollLeft = totalSlideWidth - slider.offsetWidth;

//         if (slider.scrollLeft >= maxScrollLeft) {
//           slider.scrollTo({
//             left: 0,
//             behavior: "smooth",
//           });
//         } else {
//           slider.scrollBy({
//             left: slideWidth,
//             behavior: "smooth",
//           });
//         }
//       }, 3000);
//     }

//     return () => clearInterval(interval);
//   }, [isAutoScrolling]);

//   const handlePrev = () => {
//     const slider = sliderRef.current;
//     const slideWidth = slider.querySelector(".slide").offsetWidth;
//     const totalSlideWidth = slideWidth * products.length;
//     const maxScrollLeft = totalSlideWidth - slider.offsetWidth;

//     if (slider.scrollLeft <= 0) {
//       slider.scrollTo({
//         left: maxScrollLeft,
//         behavior: "smooth",
//       });
//     } else {
//       slider.scrollBy({
//         left: -slideWidth,
//         behavior: "smooth",
//       });
//     }

//     setIsAutoScrolling(false);
//   };

//   const handleNext = () => {
//     const slider = sliderRef.current;
//     const slideWidth = slider.querySelector(".slide").offsetWidth;
//     const totalSlideWidth = slideWidth * products.length;
//     const maxScrollLeft = totalSlideWidth - slider.offsetWidth;

//     if (slider.scrollLeft >= maxScrollLeft) {
//       slider.scrollTo({
//         left: 0,
//         behavior: "smooth",
//       });
//     } else {
//       slider.scrollBy({
//         left: slideWidth,
//         behavior: "smooth",
//       });
//     }

//     setIsAutoScrolling(false);
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//       <h2 className="text-3xl font-medium text-gray-900 mb-4">Food Menu</h2>
//       <div
//         ref={sliderRef}
//         className="slider-container"
//         onMouseEnter={() => setIsAutoScrolling(false)}
//         onMouseLeave={() => setIsAutoScrolling(true)}
//       >
//         <div className="slider-content">
//           {products.map(product => (
//             <div key={product.id} className="slide">
//               <div className="card">
//                 <div className="card-front">
//                   <div className="card-image">
//                     <img src={product.image} alt={product.title} />
//                   </div>
//                   <div className="card-body">
//                     <h3 className="card-title">{product.title}</h3>
//                     <p className="card-description">{product.description}</p>
//                     <div className="card-footer">
//                       <span className="card-price">
//                         ${product.price.toFixed(2)}
//                       </span>
//                       <button className="add-to-cart-btn">Add to Cart</button>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="card-back">
//                   <div className="card-image">
//                     <img src={product.image} alt={product.title} />
//                   </div>
//                   <div className="card-body">
//                     <h3 className="card-title">{product.title}</h3>
//                     <p className="card-description">{product.description}</p>
//                     <div className="card-footer">
//                       <span className="card-price">
//                         ${product.price.toFixed(2)}
//                       </span>
//                       <button className="add-to-cart-btn">Add to Cart</button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="controls">
//         <button className="prev-btn" onClick={handlePrev}>
//           Previous
//         </button>
//         <button className="next-btn" onClick={handleNext}>
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Responsive;
interface MenuItem {
  _id: string;
  id: string;
  isNew: boolean;
  image: string;
  name: string;
  category: {
    name: string;
  };
  description: string;
  price: number;
}

import {useState, useEffect, useRef} from "react";
import {FaArrowLeft, FaArrowRight} from "react-icons/fa";
import {Link} from "react-router-dom";

import SVGComponent2 from "../SVg/SVGComponent2";
import axios from "axios";
import {toast} from "react-toastify";
import {addItemToCart} from "../Redux/cart/cartThunks";
import {AppDispatch, RootState} from "../Redux/store";
import {useSelector} from "react-redux";
import {useDispatch} from "react-redux";
import { FETCH_MENU_URL } from "../urls";
import { BiLoaderCircle } from "react-icons/bi";

const Responsive = () => {
    const {userId} = useSelector((state: RootState) => state.auth);
    const {isAuthenticated} = useSelector((state: RootState) => state.auth);
    const dispatch: AppDispatch = useDispatch();

  const sliderRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [loading, setloading] = useState(true);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [slidesToShow, setSlidesToShow] = useState(4);

  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(FETCH_MENU_URL);

      setMenuItems(response.data);
      setloading(false);
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (windowWidth >= 1024) {
      setSlidesToShow(4);
    } else if (windowWidth >= 600) {
      setSlidesToShow(2);
    } else {
      setSlidesToShow(1);
    }
  }, [windowWidth]);

  useEffect(() => {
    const slider = sliderRef.current;

    if (slider) {
      const slideElement = slider.querySelector(".slide") as HTMLElement;

      if (slideElement) {
        const slideWidth = slideElement.offsetWidth;
        setSlideWidth(slideWidth);
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isAutoScrolling) {
      interval = setInterval(() => {
        const slider = sliderRef.current;
        const slideElement = slider?.querySelector(".slide") as HTMLElement;
        const slideWidth = slideElement.offsetWidth;
        const totalSlideWidth = slideWidth * menuItems.length;
        const maxScrollLeft = totalSlideWidth - (slider?.offsetWidth || 0);

        if (slider && slideElement) {
          if (slider.scrollLeft >= maxScrollLeft) {
            slider.scrollTo({
              left: 0,
              behavior: "smooth",
            });
          } else {
            slider.scrollBy({
              left: slideWidth,
              behavior: "smooth",
            });
          }
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoScrolling, menuItems]);

  const handlePrev = () => {
    const slider = sliderRef.current;
    const slideElement = slider?.querySelector(".slide") as HTMLElement;
    const slideWidth = slideElement.offsetWidth;
    const totalSlideWidth = slideWidth * menuItems.length;
    const maxScrollLeft = totalSlideWidth - (slider?.offsetWidth || 0);

    if (slider && slideElement) {
      if (slider.scrollLeft <= 0) {
        slider.scrollTo({
          left: maxScrollLeft,
          behavior: "smooth",
        });
      } else {
        slider.scrollBy({
          left: -slideWidth,
          behavior: "smooth",
        });
      }
    }

    setIsAutoScrolling(false);
  };

  const handleNext = () => {
    const slider = sliderRef.current;
    const slideElement = slider?.querySelector(".slide") as HTMLElement;
    const slideWidth = slideElement.offsetWidth;
    const totalSlideWidth = slideWidth * menuItems.length;
    const maxScrollLeft = totalSlideWidth - (slider?.offsetWidth || 0);

    if (slider && slideElement) {
      if (slider.scrollLeft >= maxScrollLeft) {
        slider.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        slider.scrollBy({
          left: slideWidth,
          behavior: "smooth",
        });
      }
    }

    setIsAutoScrolling(false);
  };


  const handleAddToCart = (menuItem: MenuItem) => {
    if (isAuthenticated) {
      dispatch(
        addItemToCart({
          itemId: menuItem._id,
          quantity: 1,
          userId: userId || "",
        })
      );
      toast.success("😋😋 food add to the cart", {
        position: "bottom-center",
        autoClose: 1990,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
        theme: "light",
      });
    } else {
      toast.info("Please login or register to add items to the cart.", {
        position: "bottom-center",
        autoClose: 2990,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: 1,
        theme: "light",
      });
    }
  };

  //loading
  if (loading) {
    return (
      <div
        className="
      w-full h-full flex justify-center items-center
      "
      >
        <BiLoaderCircle className="animate-spin text-green-500 text-6xl" />
      </div>
    );
  }


  return (
    <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12"}>
      <div className="flex justify-between mb-10 mt-16">
        <h1>
          <span className="text-3xl font-medium  mb-4">Food Menu</span>
        </h1>
        <Link
          to="/menu"
          className="underline text-green-500 hover:text-green-600"
        >
          <span className="relative inline-flex justify-center whitespace-nowrap font-bold mx-2">
            <SVGComponent2 />
            See All Menu
          </span>
        </Link>
      </div>

      <div
        ref={sliderRef}
        className="flex overflow-hidden rounded-lg space-x-6"
        style={{scrollSnapType: "x mandatory"}}
        onMouseEnter={() => setIsAutoScrolling(false)}
        onMouseLeave={() => setIsAutoScrolling(true)}
      >
        {menuItems.map((menuItem: MenuItem) => (
          <div
            key={menuItem.id}
            className={
              "relative py-8 rounded-lg hover:shadow-2xl mx-2 slide transform-gpu"
            }
            style={{
              flex: `0 0 ${100 / slidesToShow}%`,
              scrollSnapAlign: "start",
              minWidth: `${slideWidth}px`,
              maxWidth: "400px",
            }}
          >
            {menuItem.isNew && (
              <div className="absolute top-0 left-0 bg-green-600 px-3 py-1 text-sm text-white font-medium rounded-tr-lg rounded-bl-lg transform -skew-x-12">
                New
              </div>
            )}

            <div className="relative">
              <img
                src={menuItem.image}
                alt={menuItem.name}
                className="h-40 w-40 object-cover mx-auto rounded-full shadow-lg transform hover:scale-110 transition duration-300"
              />
            </div>
            <div className="p-4   rounded-lg shadow-md">
              <div className="flex justify-between mx-1">
                <h3 className="text-lg font-medium  mb-2">{menuItem.name}</h3>
                {menuItem.category.name && (
                  <div className="  px-3 w-16 py-1 text-sm text-green-500 font-medium rounded-tr-lg rounded-bl-lg transform -skew-x-12">
                    {menuItem.category.name}
                  </div>
                )}
              </div>

              <p className="mb-4"> {menuItem.description}</p>
              <div className="flex justify-between">
                <span className=" font-medium">
                  ${menuItem.price.toFixed(2)}
                </span>
                <button
                  onClick={() => handleAddToCart(menuItem)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transform -skew-x-12 transition duration-300"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="italic font-bold">
          Check out our delicious menu items above.
        </p>
      </div>
      <div className="flex justify-center mt-4 space-x-6">
        <button
          className={
            "bg-green-500 hover:bg-green-600 rounded-full px-3 py-2 flex items-center text-white font-medium transition duration-300 transform hover:scale-110 shadow-2xl"
          }
          onClick={handlePrev}
        >
          <FaArrowLeft className="mr-2" />
        </button>
        <button
          className={
            "bg-green-500 hover:bg-green-600 rounded-full px-3 py-2 flex items-center text-white font-medium transition duration-300 transform hover:scale-110 shadow-2xl"
          }
          onClick={handleNext}
        >
          <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Responsive;
