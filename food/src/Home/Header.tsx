import {useState, useEffect} from "react";
import {FiShoppingCart} from "react-icons/fi";
import {Link} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {logout} from "../Redux/Auth/authThunks";
import {useNavigate} from "react-router-dom";
import {AppDispatch, RootState} from "../Redux/store";
import {fetchCart} from "../Redux/cart/cartThunks";
import {resetCart} from "../Redux/cart/cartSlice";
import {useDarkMode} from "../hook/useDarkMode";
import {AiOutlineMenu} from "react-icons/ai";

const Header = () => {
  const isDarkMode = useDarkMode();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const {isAuthenticated, isAdmin} = useSelector(
    (state: RootState) => state.auth
  );

  const {userId} = useSelector((state: RootState) => state.auth);

  const cart = useSelector((state: RootState) => state.cart);

  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId));
    }
  }, [dispatch, userId]);

  const itemCount = cart.itemCount;

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      await dispatch(resetCart());
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  // State to track the scroll position
  const [isScrolled, setIsScrolled] = useState(false);

  // Function to handle scroll event
  const handleScroll = () => {
    if (window.scrollY > 0) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed w-screen  top-0  left-0 right-0  z-10 flex  flex-col overflow-hidden px-12 py-3   md:flex-row md:items-center transition-all ${
        isDarkMode ? "bg-black shadow-md" : "bg-white shadow-md"
        }
        ${isScrolled && "bg-opacity-90"}

      `}
    >
      <Link
        to="/"
        className="flex cursor-pointer items-center whitespace-nowrap text-2xl font-black"
      >
        <span className="mr-2 text-4xl text-green-500"></span>
        <span className="text-green-500">YumDrop</span>
        
      </Link>
      <input type="checkbox" className="peer hidden" id="navbar-open" />
      <label
        className="absolute top-5 right-7 cursor-pointer md:hidden"
        htmlFor="navbar-open"
      >
        <span className="sr-only">Toggle Navigation</span>
        <AiOutlineMenu className="text-2xl" />
      </label>
      <nav
        aria-label="Header Navigation"
        className={
          "flex max-h-0 w-full flex-col items-center justify-between overflow-hidden transition-all peer-checked:mt-8 peer-checked:max-h-56 md:ml-24 md:max-h-full md:flex-row md:items-start"
        }
      >
        <ul className="flex flex-col items-center space-y-2 md:ml-auto md:flex-row md:space-y-0">
          <li className="font-bold md:mr-12">
            <Link to="/" className="text-green-500 hover:text-green-700">
              Home
            </Link>
          </li>
          <li className="md:mr-12">
            <Link to="/menu" className="text-green-500 hover:text-green-700">
              Menu
            </Link>
          </li>
          {isAuthenticated && isAdmin && (
            <li className="md:mr-12">
              <Link
                to="/AddMenuItem"
                className="text-green-500 hover:text-green-700"
              >
                AddMenuItem
              </Link>
            </li>
          )}
          {isAuthenticated && (
            <li className="md:mr-12 flex items-start">
              <Link to="/cart" className="text-green-500 hover:text-green-700">
                <span className="ml-1">
                  <FiShoppingCart className="inline-block text-2xl md:text-2xl" />
                </span>
                {itemCount > 0 && (
                  <span
                    className="
                    inline-block
                    text-xs
                    md:text-sm
                    bg-green-500
                    text-white
                    rounded-full
                    px-2
                    py-1
                    ml-1
                  
                    "
                  >
                    {itemCount}
                  </span>
                )}
              </Link>
            </li>
          )}

          {!isAuthenticated && (
            <>
              <li className="md:mr-12">
                <Link
                  to="/Register"
                  className="text-green-500 hover:text-green-700"
                >
                  Register
                </Link>
              </li>
              <li className="md:mr-12">
                <Link
                  to="/Login"
                  className="rounded-full border-2 border-green-500 px-6 py-1 text-green-600 transition-colors hover:bg-green-500 hover:text-white"
                >
                  Login
                </Link>
              </li>
            </>
          )}
          {isAuthenticated && (
            <li className="md:mr-12">
              <button
                onClick={handleLogout}
                className="rounded-full border-2 border-red-500 px-6 py-1 text-red-600 transition-colors hover:bg-red-500 hover:text-white"
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
