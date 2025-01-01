import  {useState, useEffect} from "react";
import axios from "axios";
import { FETCH_MENU_URL } from "./urls";
import { BiLoaderCircle } from "react-icons/bi";

const Swiper = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuItems, setMenuItems] = useState([]);
  const [loading ,setloading]=useState(true)

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(FETCH_MENU_URL);
      // Extracting image URLs from the response data
      const imageUrls = response.data.map((item: { image: any; }) => item.image);
      setMenuItems(imageUrls);
      setloading(false)
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false)
      }

      
   
    
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev === menuItems.length - 1 ? 0 : prev + 1));
    }, 2000);


    return () => {
      clearInterval(interval);
    };
  }, [menuItems]);

  //loading
  if (loading) {
    return (
      <div className="
      w-full h-full flex justify-center items-center
      ">
        <BiLoaderCircle className="animate-spin text-green-500 text-6xl" />
      </div>
    );
  }
  return (
    <div className="w-full h-full relative">
      <svg
        className="h-full w-full bg-green"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="img1" x="0" y="0" width="1" height="1">
            <image
              x="0"
              y="0"
              width="200px"
              height="200px"

            
              preserveAspectRatio="xMaxYMax slice"
              xlinkHref={menuItems[activeIndex]}
            
            />
          </pattern>
        </defs>

        <path
          fill="url(#img1)"
          d="M40,-62.6C52.2,-54.5,62.5,-43.9,66.9,-31.4C71.3,-18.9,69.6,-4.6,65.9,8.3C62.2,21.1,56.4,32.5,49.2,45.2C42.1,57.9,33.7,72.1,22.2,75.3C10.7,78.5,-3.9,70.7,-14.8,62.1C-25.7,53.5,-32.8,44.1,-44.9,37.3C-57,30.5,-74.3,26.4,-83.9,15.1C-93.5,3.9,-95.5,-14.5,-90.5,-29.9C-85.5,-45.3,-73.5,-58.7,-60.3,-67.7C-47.2,-76.6,-32.8,-81.1,-20.5,-79.2C-8.2,-77.2,-0.1,-68.9,11.4,-66.4C22.9,-63.9,45.8,-67.1,57.3,-60.3Z"
          transform="translate(100 100)"
        />
      </svg>
    </div>
  );
};

export default Swiper;
