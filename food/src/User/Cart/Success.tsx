// /* eslint-disable @typescript-eslint/ban-ts-comment */
// // import React, {useEffect, useState} from "react";
// // import {useLocation} from "react-router-dom";
// // import {
// //   FaCheckCircle,
// //   FaClock,
// //   FaTruck,
// //   FaBoxOpen,
// //   FaShippingFast,
// //   FaSmileBeam,
// // } from "react-icons/fa";

// // const steps = [
// //   {
// //     id: 1,
// //     title: "Processing Order",
// //     description: "We've received your order and are working on it.",
// //     image: "https://source.unsplash.com/500x500/?food",
// //     icon: FaCheckCircle,
// //     message: "Your order is being processed. Please wait...",
// //     details: [
// //       {label: "Order Number", value: "123456789"},
// //       {label: "Payment Method", value: "Credit Card"},
// //     ],
// //   },
// //   {
// //     id: 2,
// //     title: "Preparing for Delivery",
// //     description: "We're preparing your food for delivery.",
// //     image: "https://source.unsplash.com/500x500/?restaurant",
// //     icon: FaClock,
// //     message: "Your food is being prepared. It will be ready soon...",
// //     details: [
// //       {label: "Order Number", value: "123456789"},
// //       {label: "Delivery Address", value: "123 Main St, Anytown USA"},
// //     ],
// //   },
// //   {
// //     id: 3,
// //     title: "Order Packed",
// //     description: "Your order has been packed and is ready to be shipped.",
// //     image: "https://source.unsplash.com/500x500/?packaging",
// //     icon: FaBoxOpen,
// //     message: "Your order has been packed and is ready to be shipped.",
// //     details: [
// //       {label: "Order Number", value: "123456789"},
// //       {label: "Shipping Method", value: "Standard"},
// //     ],
// //   },
// //   {
// //     id: 4,
// //     title: "Order Shipped",
// //     description: "Your order is on the way and should arrive soon.",
// //     image: "https://source.unsplash.com/500x500/?delivery",
// //     icon: FaShippingFast,
// //     message: "Your order is on the way. It should arrive soon...",
// //     details: [
// //       {label: "Order Number", value: "123456789"},
// //       {label: "Tracking Number", value: "123456789"},
// //     ],
// //   },
// //   {
// //     id: 5,
// //     title: "Out for Delivery",
// //     description: "Your food is out for delivery.",
// //     image: "https://source.unsplash.com/500x500/?delivery",
// //     icon: FaTruck,
// //     message: "Your order is out for delivery. It should arrive soon...",
// //     details: [
// //       {label: "Order Number", value: "123456789"},
// //       {label: "Delivery Time", value: "2:00 PM - 4:00 PM"},
// //     ],
// //   },
// //   {
// //     id: 6,
// //     title: "Order Delivered",
// //     description: "Your food has been delivered. Enjoy your meal!",
// //     image: "https://source.unsplash.com/500x500/?smile",
// //     icon: FaSmileBeam,
// //     message: "Your order has been delivered. Enjoy your meal!",
// //     details: [
// //       {label: "Order Number", value: "123456789"},
// //       {label: "Delivery Time", value: "3:30 PM"},
// //     ],
// //   },
// // ];

// // function SuccessPage() {
// //   const location = useLocation();
// //   const {paymentInfo, totalPrice} = location.state;
// //   const [currentStep, setCurrentStep] = useState(1);
// //   const [isLoading, setIsLoading] = useState(true);

// //   useEffect(() => {
// //     let step = 1;
// //     const interval = setInterval(() => {
// //       step++;
// //       if (step <= steps.length) {
// //         setCurrentStep(step);
// //         setIsLoading(true);
// //         setTimeout(() => {
// //           setIsLoading(false);
// //         }, 60000);
// //       } else {
// //         clearInterval(interval);
// //       }
// //     }, 60000);

// //     return () => clearInterval(interval);
// //   }, []);

// //   const handleStepClick = step => {
// //     setCurrentStep(step.id);
// //   };

// //   const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

// //   return (
// //     <div className="text-center">
// //       <h1 className="text-3xl font-semibold mb-4">Order Successful</h1>
// //       ini Copy
// //       <div className="mt-8">
// //         <div className="flex items-center justify-between">
// //           {steps.map((step, index) => (
// //             <div
// //               className="flex flex-col items-center justify-center relative w-1/6"
// //               key={step.id}
// //             >
// //               <div className="flex items-center justify-center">
// //                 <div
// //                   className={`flex-shrink-0 rounded-full h-12 w-12 flex items-center justify-center ${
// //                     step.id === currentStep
// //                       ? "bg-green-500 text-white"
// //                       : "bg-gray-200 text-gray-500"
// //                   }`}
// //                 >
// //                   <step.icon className="w-6 h-6" />
// //                 </div>
// //                 <div
// //                   className={`${
// //                     step.id !== steps.length ? "ml-2" : ""
// //                   } w-1/2 bg-gray-300`}
// //                   style={{height: "2px"}}
// //                 >
// //                   <div
// //                     className={`${
// //                       step.id === currentStep ? "bg-green-500" : "bg-gray-400"
// //                     } h-full rounded-full transition-all duration-500`}
// //                     style={{
// //                       width:
// //                         step.id < currentStep || index === steps.length - 1
// //                           ? "100%"
// //                           : `${progress}%`,
// //                     }}
// //                   />
// //                 </div>
// //               </div>

// //               <div
// //                 className={`${
// //                   step.id === currentStep ? "text-green-500" : "text-gray-500"
// //                 } mt-2 font-semibold`}
// //                 onClick={() => handleStepClick(step)}
// //               >
// //                 {step.title}
// //               </div>
// //               {step.description && (
// //                 <div
// //                   className={`text-xs ${
// //                     step.id === currentStep
// //                       ? "text-green-500"
// //                       : "text-gray-500"
// //                   }`}
// //                 >
// //                   {step.description}
// //                 </div>
// //               )}
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //       <div className="mt-8">
// //         {isLoading ? (
// //           <div className="text-gray-500 text-sm">
// //             {steps[currentStep - 1].message}
// //           </div>
// //         ) : (
// //           <div className="flex items-center justify-center">
// //             <img
// //               className="w-24 h-24 rounded-full object-cover mr-4"
// //               src={steps[currentStep - 1].image}
// //               alt={steps[currentStep - 1].title}
// //             />
// //             <div className="text-left">
// //               <div className="text-xl font-semibold mb-2">
// //                 {steps[currentStep - 1].title}
// //               </div>
// //               {steps[currentStep - 1].details.map(detail => (
// //                 <div className="text-sm mb-1" key={detail.label}>
// //                   <span className="font-semibold mr-2">{detail.label}:</span>
// //                   {detail.value}
// //                 </div>
// //               ))}
// //               <div className="text-sm font-semibold text-gray-500 mt-4">
// //                 Total: ${totalPrice}
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default SuccessPage;
// //@ts-nocheck
// import  {useEffect, useState} from "react";
// import {useLocation, useNavigate} from "react-router-dom";
// import {
//   FaCheckCircle,
//   FaClock,
//   FaTruck,
//   FaBoxOpen,
//   FaShippingFast,
//   FaSmileBeam,
// } from "react-icons/fa";

// const steps = [
//   {
//     id: 1,
//     title: "Processing Order",
//     description: "We've received your order and are working on it.",
//     image: "https://source.unsplash.com/500x500/?food",
//     icon: FaCheckCircle,
//     message: "Your order is being processed. Please wait...",
//     details: [
//       {label: "Order Number", value: "123456789"},
//       {label: "Payment Method", value: "Credit Card"},
//     ],
//   },
//   {
//     id: 2,
//     title: "Preparing for Delivery",
//     description: "We're preparing your food for delivery.",
//     image: "https://source.unsplash.com/500x500/?restaurant",
//     icon: FaClock,
//     message: "Your food is being prepared. It will be ready soon...",
//     details: [
//       {label: "Order Number", value: "123456789"},
//       {label: "Delivery Address", value: "123 Main St, Anytown USA"},
//     ],
//   },
//   {
//     id: 3,
//     title: "Order Packed",
//     description: "Your order has been packed and is ready to be shipped.",
//     image: "https://source.unsplash.com/500x500/?packaging",
//     icon: FaBoxOpen,
//     message: "Your order has been packed and is ready to be shipped.",
//     details: [
//       {label: "Order Number", value: "123456789"},
//       {label: "Shipping Method", value: "Standard"},
//     ],
//   },
//   {
//     id: 4,
//     title: "Order Shipped",
//     description: "Your order is on the way and should arrive soon.",
//     image: "https://source.unsplash.com/500x500/?delivery",
//     icon: FaShippingFast,
//     message: "Your order is on the way. It should arrive soon...",
//     details: [
//       {label: "Order Number", value: "123456789"},
//       {label: "Tracking Number", value: "123456789"},
//     ],
//   },
//   {
//     id: 5,
//     title: "Out for Delivery",
//     description: "Your food is out for delivery.",
//     image: "https://source.unsplash.com/500x500/?delivery",
//     icon: FaTruck,
//     message: "Your order is out for delivery. It should arrive soon...",
//     details: [
//       {label: "Order Number", value: "123456789"},
//       {label: "Delivery Time", value: "2:00 PM - 4:00 PM"},
//     ],
//   },
//   {
//     id: 6,
//     title: "Order Delivered",
//     description: "Your food has been delivered. Enjoy your meal!",
//     image: "https://source.unsplash.com/500x500/?smile",
//     icon: FaSmileBeam,
//     message: "Your order has been delivered. Enjoy your meal!",
//     details: [
//       {label: "Order Number", value: "123456789"},
//       {label: "Delivery Time", value: "3:30 PM"},
//     ],
//   },
// ];

// function Success() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { totalPrice} = location.state;
//   const [currentStep, setCurrentStep] = useState(() => {
//     const storedStep = localStorage.getItem("currentStep");
//     return storedStep ? parseInt(storedStep) : 1;
//   });
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     let step = currentStep;
//     const interval = setInterval(() => {
//       step++;
//       if (step <= steps.length) {
//         setCurrentStep(step);
//         setIsLoading(true);
//         setTimeout(() => {
//           setIsLoading(false);
//         }, 6000);
//         localStorage.setItem("currentStep", step.toString());
//       } else {
//         clearInterval(interval);
//       }
//     }, 6000);

//     return () => clearInterval(interval);
//   }, [currentStep]);

//   useEffect(() => {
//     if (location.state.orderType === "fish") {
//       const timeout = setTimeout(() => {
//         navigate("/");
//       }, 10000);
//       return () => clearTimeout(timeout);
//     }
//   }, [location.state.orderType, navigate]);

//   const handleStepClick = step => {
//     setCurrentStep(step.id);
//     localStorage.setItem("currentStep", step.id.toString());
//   };

//   const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

//   const handleGoToHomeClick = () => {
//     navigate("/");
//     localStorage.clear();
//   };

//   const handleClearClick = () => {
//     navigate("/");
//   };

//   return (
//     <div className="text-center h-screen">
//       <h1 className="text-3xl font-semibold mb-4">Order Successful</h1>
//       <div className="mt-8">
//         <div className="flex items-center justify-between mb-4">
//           <button
//             className="bg-gray-500 text-white py-2 px-4 rounded mr-4"
//             onClick={handleClearClick}
//           >
//             Go to Home
//           </button>
//         </div>
//         <div className="flex items-center justify-between">
//           {steps.map((step, index) => (
//             <div
//               className="flex flex-col items-center justify-center relative w-1/6"
//               key={step.id}
//             >
//               <div className="flex items-center justify-center">
//                 <div
//                   className={`flex-shrink-0 rounded-full h-12 w-12 flex items-center justify-center ${
//                     step.id === currentStep
//                       ? "bg-green-500 text-white"
//                       : "bg-gray-200 text-gray-500"
//                   }`}
//                 >
//                   <step.icon className="w-6 h-6" />
//                 </div>
//                 <div
//                   className={`${
//                     step.id !== steps.length ? "ml-2" : ""
//                   } w-1/2 bg-gray-300`}
//                   style={{height: "2px"}}
//                 >
//                   <div
//                     className={`${
//                       step.id === currentStep ? "bg-green-500" : "bg-gray-400"
//                     } h-full rounded-full transition-all duration-500`}
//                     style={{
//                       width:
//                         step.id < currentStep || index === steps.length - 1
//                           ? "100%"
//                           : `${progress}%`,
//                     }}
//                   />
//                 </div>
//               </div>

//               <div
//                 className={`${
//                   step.id === currentStep ? "text-green-500" : "text-gray-500"
//                 } mt-2 font-semibold`}
//                 onClick={() => handleStepClick(step)}
//               >
//                 {step.title}
//               </div>
//               {step.description && (
//                 <div
//                   className={`text-xs ${
//                     step.id === currentStep
//                       ? "text-green-500"
//                       : "text-gray-500"
//                   }`}
//                 >
//                   {step.description}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="mt-8">
//         {isLoading ? (
//           <div className="text-gray-500 text-sm">
//             {steps[currentStep - 1].message}
//           </div>
//         ) : (
//           <div className="flex items-center justify-center">
//             <img
//               className="w-24 h-24 rounded-full object-cover mr-4"
//               src={steps[currentStep - 1].image}
//               alt={steps[currentStep - 1].title}
//             />
//             <div className="text-left">
//               <div className="text-xl font-semibold mb-2">
//                 {steps[currentStep - 1].title}
//               </div>
//               {steps[currentStep - 1].details.map(detail => (
//                 <div className="text-sm mb-1" key={detail.label}>
//                   <span className="font-semibold mr-2">{detail.label}:</span>
//                   {detail.value}
//                 </div>
//               ))}
//               <div className="text-sm font-semibold text-gray-500 mt-4">
//                 Total: ${totalPrice}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       <div className="mt-8">
//         {isLoading ? null : (
//           <button
//             className="bg-green-500 text-white py-2 px-4 rounded"
//             onClick={handleGoToHomeClick}
//           >
//             Back to Home
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Success;

// // function SuccessPage() {
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const {paymentInfo, totalPrice} = location.state;
// //   const [currentStep, setCurrentStep] = useState(() => {
// //     const storedStep = localStorage.getItem("currentStep");
// //     return storedStep ? parseInt(storedStep) : 1;
// //   });
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [redirectToHome, setRedirectToHome] = useState(false);

// //   useEffect(() => {
// //     let step = currentStep;
// //     const interval = setInterval(() => {
// //       step++;
// //       if (step <= steps.length) {
// //         setCurrentStep(step);
// //         setIsLoading(true);
// //         setTimeout(() => {
// //           setIsLoading(false);
// //         }, 60000);
// //         localStorage.setItem("currentStep", step.toString());
// //       } else {
// //         clearInterval(interval);
// //       }
// //     }, 60000);

// //     return () => clearInterval(interval);
// //   }, [currentStep]);

// //   useEffect(() => {
// //     if (location.state.orderType === "fish") {
// //       const timeout = setTimeout(() => {
// //         setRedirectToHome(true);
// //       }, 10000);
// //       return () => clearTimeout(timeout);
// //     }
// //   }, [location.state.orderType]);

// //   const handleStepClick = step => {
// //     setCurrentStep(step.id);
// //     localStorage.setItem("currentStep", step.id.toString());
// //   };

// //   const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

// //   const handleGoToHomeClick = () => {
// //     setRedirectToHome(true);
// //   };

// //   if (redirectToHome) {
// //     return;
// //   }

// //   return (
// //     <div className="text-center">
// //       <h1 className="text-3xl font-semibold mb-4">Order Successful</h1>
// //       <div className="mt-8">
// //         <div className="mt-8">
// //           {isLoading ? null : (
// //             <button
// //               className={`${
// //                 location.state.orderType === "fish"
// //                   ? "bg-red-500"
// //                   : "bg-green-500"
// //               } text-white py-2 px-4 rounded`}
// //               onClick={handleGoToHomeClick}
// //             >
// //               Go to Home
// //             </button>
// //           )}
// //         </div>
// //         <div className="flex items-center justify-between">
// //           {steps.map((step, index) => (
// //             <div
// //               className="flex flex-col items-center justify-center relative w-1/6"
// //               key={step.id}
// //             >
// //               <div className="flex items-center justify-center">
// //                 <div
// //                   className={`flex-shrink-0 rounded-full h-12 w-12 flex items-center justify-center ${
// //                     step.id === currentStep
// //                       ? "bg-green-500 text-white"
// //                       : "bg-gray-200 text-gray-500"
// //                   }`}
// //                 >
// //                   <step.icon className="w-6 h-6" />
// //                 </div>
// //                 <div
// //                   className={`${
// //                     step.id !== steps.length ? "ml-2" : ""
// //                   } w-1/2 bg-gray-300`}
// //                   style={{height: "2px"}}
// //                 >
// //                   <div
// //                     className={`${
// //                       step.id === currentStep ? "bg-green-500" : "bg-gray-400"
// //                     } h-full rounded-full transition-all duration-500`}
// //                     style={{
// //                       width:
// //                         step.id < currentStep || index === steps.length - 1
// //                           ? "100%"
// //                           : `${progress}%`,
// //                     }}
// //                   />
// //                 </div>
// //               </div>

// //               <div
// //                 className={`${
// //                   step.id === currentStep ? "text-green-500" : "text-gray-500"
// //                 } mt-2 font-semibold`}
// //                 onClick={() => handleStepClick(step)}
// //               >
// //                 {step.title}
// //               </div>
// //               {step.description && (
// //                 <div
// //                   className={`text-xs ${
// //                     step.id === currentStep
// //                       ? "text-green-500"
// //                       : "text-gray-500"
// //                   }`}
// //                 >
// //                   {step.description}
// //                 </div>
// //               )}
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //       <div className="mt-8">
// //         {isLoading ? (
// //           <div className="text-gray-500 text-sm">
// //             {steps[currentStep - 1].message}
// //           </div>
// //         ) : (
// //           <div className="flex items-center justify-center">
// //             <img
// //               className="w-24 h-24 rounded-full object-cover mr-4"
// //               src={steps[currentStep - 1].image}
// //               alt={steps[currentStep - 1].title}
// //             />
// //             <div className="text-left">
// //               <div className="text-xl font-semibold mb-2">
// //                 {steps[currentStep - 1].title}
// //               </div>
// //               {steps[currentStep - 1].details.map(detail => (
// //                 <div className="text-sm mb-1" key={detail.label}>
// //                   <span className="font-semibold mr-2">{detail.label}:</span>
// //                   {detail.value}
// //                 </div>
// //               ))}
// //               <div className="text-sm font-semibold text-gray-500 mt-4">
// //                 {/* Total: ${totalPrice} */}
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //       <div className="mt-8">
// //         {isLoading ? null : (
// //           <button
// //             className="bg-green-500 text-white py-2 px-4 rounded"
// //             onClick={handleHomeClick}
// //           >
// //             Back to Home
// //           </button>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default SuccessPage;

import {useEffect, useState, useCallback} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaBoxOpen,
  FaShippingFast,
  FaSmileBeam,
} from "react-icons/fa";

import {
  FaInfoCircle,
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCity,
  FaFlag,
  FaBarcode,
} from "react-icons/fa";
import {useDarkMode} from "../../hook/useDarkMode";
import {MdKeyboardBackspace} from "react-icons/md";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {memo} from "react";

interface Item {
  _id: string;
  image: string;
  name: string;
  description: string;
  price: number;
}

const iconMap = {
  info: FaInfoCircle,
  user: FaUser,
  envelope: FaEnvelope,
  map: FaMapMarkerAlt,
  city: FaCity,
  flag: FaFlag,
  barcode: FaBarcode,
};

const orderStatusMessages = [
  {
    title: "Order Placed",
    icon: FaCheckCircle,
    message: "Your order is being processed. Please wait...",
  },
  {
    title: "Preparing for Delivery",
    icon: FaClock,
    message: "We're preparing your order for delivery.",
  },
  {
    title: "Order Packed",
    icon: FaBoxOpen,
    message: "Your order has been packed and is ready to be shipped.",
  },
  {
    title: "Order Shipped",
    icon: FaShippingFast,
    message: `Your order is on the way and should arrive soon.
    You can track your order using the tracking number sent to your email.
    
    `,
  },
  {
    title: "Out for Delivery",
    icon: FaTruck,
    message: "Your order is out for delivery. It should arrive soon...",
  },
  {
    title: "Order Delivered",
    icon: FaSmileBeam,
    message: "Your order has been delivered. Enjoy your purchase!",
  },
];

const Success: React.FC = memo(() => {
  const isDarkMode = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const {paymentInfo, totalPrice, items} = location.state;
  const [currentStep, setCurrentStep] = useState(() => {
    // Get the step from sessionStorage, or default to 0 if not present
    const storedStep = sessionStorage.getItem("currentStep");
    return storedStep ? parseInt(storedStep, 10) : 0;
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prevStep =>
        prevStep + 1 < orderStatusMessages.length ? prevStep + 1 : prevStep
      );
      setIsLoading(true);

      setTimeout(() => {
        setIsLoading(false);
      }, 9000);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Save the current step to sessionStorage whenever it changes
    sessionStorage.setItem("currentStep", currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    // Clear the current step value from sessionStorage when the component mounts
    sessionStorage.removeItem("currentStep");
  }, []);

  const handleStepClick = (
    stepIndex: number | ((prevState: number) => number)
  ) => {
    setCurrentStep(stepIndex);
  };

  const handleGoToHomeClick = useCallback(() => {
    navigate("/");
    window.scrollTo({top: 0});

    localStorage.clear();
  }, [navigate]);

  // Redirect the user after 6 seconds when the last step is finished
  useEffect(() => {
    if (currentStep === orderStatusMessages.length - 1) {
      const redirectTimer = setTimeout(() => {
        handleGoToHomeClick();
        // show him a success toast
        toast.success("Your order has been placed successfully!");
      }, 6000); // Redirect after 6 seconds

      return () => clearTimeout(redirectTimer); // Clean up the timer on component unmount
    }
  }, [currentStep, handleGoToHomeClick]);


  //

  return (
    <div className="min-h-screen">
      <div
        className={`${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        } min-h-screen mt-20`}
      >
        <h1 className="text-3xl font-semibold   text-center ">
          Your Fashion E-commerce Journey
        </h1>
        <div className={"flex flex-col sm:flex-row justify-center"}>
          {orderStatusMessages.map((step, index) => (
            <div
              className={
                "relative flex flex-col items-center justify-center w-full sm:w-1/6 p-2 sm:p-4 cursor-pointer space-y-5"
              }
              key={index}
              onClick={() => handleStepClick(index)}
            >
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index < currentStep ? (
                  <step.icon className="w-6 h-6" />
                ) : (
                  index + 1
                )}
              </div>
              <div
                className={`mt-14 text-lg font-semibold text-center ${
                  index === currentStep ? "text-green-500" : ""
                }`}
              >
                {index === currentStep ? "Order Details" : step.title}
              </div>
            </div>
          ))}
        </div>
        {currentStep === orderStatusMessages.length - 5 ? (
          <div
            className={
              "grid grid-cols-1 bg-black md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-7 sm:gap-8 px-2 items-center mt-3"
            }
          >
            {items.map((item: Item) => (
              <div key={item._id} className="">
                <img
                  className="w-20 h-20 rounded-full object-cover mb-4"
                  src={item.image}
                  alt={item.name}
                />
                <div className="text-xl font-semibold mb-2">{item.name}</div>
                <div className="text-sm mb-1">
                  <span className="font-semibold mr-2">Description:</span>
                  {item.description}
                </div>
                <div className="text-sm font-semibold  mt-4">
                  Price: ${item.price}
                </div>
              </div>
            ))}
            <div className={"text-center sm:text-left my-9"}>
              <div className="text-xl font-semibold mb-2">Total Price</div>

              <div className="text-sm font-semibold  mt-4">
                Total: ${totalPrice}
              </div>
            </div>
          </div>
        ) : currentStep === 3 ? (
          <div className="text-center my-2  text-xl  ">
            {orderStatusMessages[currentStep].message}
            <div
              className={
                "flex flex-col items-center space-x-3 space-y-7 sm:flex-row justify-center mb-8"
              }
            >
              {currentStep === 3 ? (
                <>
                  <div className="text-xl font-semibold mb-2"></div>
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">
                      <iconMap.user className="w-4 h-4 inline-block mb-1 mr-1" />
                      Name:
                    </span>
                    {paymentInfo.name}
                  </div>
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">
                      <iconMap.envelope className="w-4 h-4 inline-block mb-1 mr-1" />
                      Email:
                    </span>
                    {paymentInfo.email}
                  </div>
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">
                      <iconMap.map className="w-4 h-4 inline-block mb-1 mr-1" />
                      Address:
                    </span>
                    {paymentInfo.address}
                  </div>
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">
                      <iconMap.city className="w-4 h-4 inline-block mb-1 mr-1" />
                      City:
                    </span>
                    {paymentInfo.city}
                  </div>
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">
                      <iconMap.flag className="w-4 h-4 inline-block mb-1 mr-1" />
                      State:
                    </span>
                    {paymentInfo.state}
                  </div>
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">
                      <iconMap.barcode className="w-4 h-4 inline-block mb-1 mr-1" />
                      Zip Code:
                    </span>
                    {paymentInfo.zipCode}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-center  text-xl my-11">
            {orderStatusMessages[currentStep].message}
          </div>
        )}
        {currentStep === orderStatusMessages.length - 1 ? (
          <div className="text-center">
            <button
              className={
                "bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
              }
              onClick={handleGoToHomeClick}
            >
              <MdKeyboardBackspace className="w-4 h-4 mr-2" />
              Go to Home
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="text-center mt-5">
            <div className="text-lg font-semibold">Loading...</div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default Success;
