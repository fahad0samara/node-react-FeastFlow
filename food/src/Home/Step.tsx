import  {useState} from "react";
import {animated, useTrail} from "@react-spring/web";
import {Link} from "react-router-dom";
const Step = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      label: "Step 1",
      content: "Login to your account to get started with our food service.",
      info: "Click the 'Login' button to proceed.",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=400&q=60",
    },
    {
      id: 2,
      label: "Step 2",
      content: "Explore the menu and choose your favorite dishes.",
      info: "Click the 'Menu' button to browse through our food options.",
      image: "menu-image.jpg",
    },
    {
      id: 3,
      label: "Step 3",
      content: "Add your selected items to the cart for ordering.",
      info: "Click the 'Add to Cart' button to add items to your order.",
      image: "cart-image.jpg",
    },
    {
      id: 4,
      label: "Step 4",
      content: "Review your order details and proceed to checkout.",
      info: "Click the 'Checkout' button to finalize your order.",
      image: "checkout-image.jpg",
    },
    {
      id: 5,
      label: "Step 5",
      content:
        "Sit back, relax, and wait for your delicious food to be delivered.",
      info: "Enjoy your meal!",
      image: "delivery-image.jpg",
    },
  ];

  const trail = useTrail(steps.length, {
    opacity: 1,
    x: 0,
    from: {opacity: 0, x: 20},
    config: {mass: 1, tension: 170, friction: 26, clamp: true, precision: 0.01},
  });

  const handleStepClick = (index:any) => {
    setActiveStep(index);
  };

  return (
    <div
      className={
        "flex flex-col px-5 items-center bg-gradient-to-b from-green-50 to-green-100 my-6 md:px-0"
      }
    >
      <h1 className="text-3xl font-bold mb-4">Food Ordering Process</h1>

      <p className="text-md mb-2 italic font-semibold">
        Our platform offers a wide variety of mouthwatering dishes that cater to
        all tastes and preferences.
      </p>
      <p className="text-md mb-6 font-medium italic">
        Simply follow the steps below and indulge in a delightful culinary
        experience.
      </p>

      <div
        className={
          "flex w-full max-w-2xl md:flex-row flex-col items-center  space-y-3 md:space-y-0  px-20"
        }
      >
        {trail.map(({x, opacity}, index) => (
          <animated.div
            key={index}
            style={{
              opacity,
              transform: x.interpolate(val => `translate3d(${val}%, 0, 0)`),
            }}
            className="relative flex items-center w-full"
          >
            <button
              type="button"
              className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto text-white ${
                index === activeStep ? "bg-green-500" : "bg-gray-200"
              }`}
              onClick={() => handleStepClick(index)}
            >
              {index + 1}
            </button>
            <div className="ml-2 font-medium">
              <span className="relative z-10">{steps[index].label}</span>
            </div>
          </animated.div>
        ))}
      </div>
      <div className="my-8">
        <h2 className="font-semibold mb-2 text-2xl text-green-500 italic">
          {steps[activeStep].label}
        </h2>
        <div className="flex">
          <div>
            <p className="text-xl mb-4 italic">{steps[activeStep].content}</p>
            <p className="text-gray-600">{steps[activeStep].info}</p>
          </div>
        </div>
        <div className="mt-4">
          {activeStep === 0 && (
            <Link
              to="/login"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              Login
            </Link>
          )}
          {activeStep === 1 && (
            <Link
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              to="/menu"
            >
              Menu
            </Link>
          )}
          {activeStep === 2 && (
            <Link
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              to="/cart"
            >
              Add to Cart
            </Link>
          )}
          {activeStep === 3 && (
            <button
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              onClick={() => {
                // Handle checkout button click
                console.log("Checkout button clicked");
              }}
            >
              Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step;
