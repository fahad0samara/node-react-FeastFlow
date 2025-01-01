interface MenuItem {
  id: string;

  itemId: string;
  isNew: boolean;
  itemPrice: string;
  itemName: string;
  category: {
    name: string;
  };
  totalOrders: string;
  itemImage: string;
}

import {useState, useEffect, useRef} from "react";

import axios from "axios";

import {AiOutlineLeft, AiOutlineRight} from "react-icons/ai";
import { FETCH_MOST_ORDERED_ITEMS_URL } from "../urls";

const MostOrderd = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [slidesToShow, setSlidesToShow] = useState(4);

  const [menuItems, setMenuItems] = useState([]);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(FETCH_MOST_ORDERED_ITEMS_URL);

      setMenuItems(response.data.mostOrderedItems);
    } catch (error) {
      console.error(error);
      // Handle error state or display an error message
    }
  };
  useEffect(() => {
    fetchMenuItems();
  }, []);

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

  return (
    <div>
      <div
        className={
          "mx-auto my-10 grid max-w-screen-xl grid-cols-1 px-10  sm:px-20 lg:grid-cols-3"
        }
      >
        <div className="col-span-1 flex flex-col justify-center text-center sm:text-left md:pr-10">
          <h1 className="mb-6 text-4xl text-green-500">
            Discover the Art of Culinary Delights
          </h1>
          <p className="">
            Explore the exquisite world of restaurant food and gastronomic
            experiences.
          </p>
        </div>
        <div className="col-span-2 mt-10 grid grid-cols-1 gap-6 rounded-2xl  p-5 sm:p-10 md:grid-cols-2 lg:mt-0">
          <div className="relative flex gap-5">
            <div className="absolute -left-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-green-500 sm:static sm:bg-transparent md:text-5xl">
              01
            </div>
            <div className="">
              <h3 className="text-xl font-semibold text-green-500">
                Mastering the Basics
              </h3>
              <p className=" mt-3">
                Embark on a journey to learn the fundamental techniques that
                form the foundation of culinary art.
              </p>
            </div>
          </div>
          <div className="relative flex gap-5">
            <div className="absolute -left-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-green-500 sm:static sm:bg-transparent md:text-5xl">
              02
            </div>
            <div className="">
              <h3 className="text-xl font-semibold text-green-500">
                The Art of Flavorful Tales
              </h3>
              <p className=" mt-3">
                Unleash the power of storytelling through each dish, where
                flavors blend into captivating narratives.
              </p>
            </div>
          </div>
          <div className="relative flex gap-5">
            <div className="absolute -left-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-green-500 sm:static sm:bg-transparent md:text-5xl">
              03
            </div>
            <div className="">
              <h3 className="text-xl font-semibold text-green-500">
                Keeping Diners Engaged
              </h3>
              <p className=" mt-3">
                Discover the secrets to keeping your guests hooked with
                delightful surprises and culinary wonders.
              </p>
            </div>
          </div>
          <div className="relative flex gap-5">
            <div className="absolute -left-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-green-500 sm:static sm:bg-transparent md:text-5xl">
              04
            </div>
            <div className="">
              <h3 className="text-xl font-semibold text-green-500">
                Leaving a Lasting Impression
              </h3>
              <p className=" mt-3">
                Master the art of concluding your culinary creations with a
                lasting impression that lingers on every palate.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-3">
        <p className="font-light text-sm text-center tracking-widest mt-6">
          Most Ordered Items
        </p>
        <h2 className="md:text-4xl text-2xl font-medium capitalize text-center my-2">
          Most Ordered Items
        </h2>

        <div className="mt-12 w-full flex justify-end gap-5 items-center md:px-6 px-3">
          <button
            className={
              "bg-green-500 hover:bg-[#f4fbac] rounded-full px-3 py-2 flex items-center text-white font-medium transition duration-300 transform hover:scale-110 shadow-2xl"
            }
            onClick={handlePrev}
          >
            <AiOutlineLeft size={20} />
          </button>
          <button
            className={
              "bg-green-500 hover:bg-[#f4fbac] rounded-full px-3 py-2 flex items-center text-white font-medium transition duration-300 transform hover:scale-110 shadow-2xl"
            }
            onClick={handleNext}
            type="button"
          >
            <AiOutlineRight size={20} />
          </button>
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
                <div className="absolute top-0 left-0 bg-green-500 px-3 py-1 text-sm text-white font-medium rounded-tr-lg rounded-bl-lg transform -skew-x-12">
                  {menuItem.totalOrders}
                </div>
              )}

              <div className="relative">
                <img
                  src={menuItem.itemImage}
                  alt={menuItem.itemName}
                  className={
                    " w-48 h-48  object-cover mx-auto rounded-full shadow-lg transform hover:scale-110 transition duration-300"
                  }
                />
              </div>
              <div className="p-4   rounded-lg shadow-md">
                <div className="flex justify-between mx-1">
                  <h3 className="text-lg font-medium  mb-2">
                    {menuItem.itemName}
                  </h3>
                </div>

                <div className="flex justify-between">
                  <span className=" font-medium">${menuItem.itemPrice}</span>
                  <h3
                    className={
                      "bg-green-500 hover:bg-green-700 text-white px-3 py-2 rounded-lg transform -skew-x-12 transition duration-300"
                    }
                  >
                    {menuItem.totalOrders}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MostOrderd;
