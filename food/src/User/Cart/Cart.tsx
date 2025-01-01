import React, {useEffect} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useSelector, useDispatch} from "react-redux";
import {AppDispatch, RootState} from "../../Redux/store";
import {fetchCart} from "../../Redux/cart/cartThunks";
import {FaMinus, FaPlus, FaShoppingCart} from "react-icons/fa";
import {
  clearCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "../../Redux/cart/cartThunks";
import {BiLoaderCircle} from "react-icons/bi";

const Cart: React.FC = () => {
  const {userId} = useSelector((state: RootState) => state.auth);
  const dispatch: AppDispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId));
    }
  }, [dispatch, userId]);

  const handleRemoveItem = async (itemId: string) => {
    if (userId) {
      await dispatch(removeItemFromCart({userId, itemId})); // Explicitly type dispatch as 'any'
      await dispatch(fetchCart(userId)).unwrap();
    }
  };

  const handleClearCart = async () => {
    if (userId) {
      await dispatch(clearCart(userId));
    }
  };

  const handleUpdateQuantity = async (
    e: React.MouseEvent,
    itemId: string,
    quantity: number
  ) => {
    e.preventDefault();
    if (userId) {
      await dispatch(
        updateCartItemQuantity({userId, itemId, quantity})
      ).unwrap();
      await dispatch(fetchCart(userId)).unwrap();
    }
  };

  if (cart.loading) {
    return (
      <div className="flex items-center h-screen justify-center">
        <BiLoaderCircle className="animate-spin text-green-500 text-6xl" />
      </div>
    );
  }

  const totalPrice =
    cart.items.length > 0
      ? cart.items
          .reduce(
            (acc, cartItem) => acc + cartItem.item.price * cartItem.quantity,
            0
          )
          .toFixed(2)
      : 0;

  return (
    <div className="min-h-screen mt-10">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold  mb-8">Your Cart</h1>

        {cart.items.length > 0 ? (
          <div className="flex flex-col md:flex-row md:-mx-6 ">
            <div className="md:w-2/3 md:mx-6">
              <div className=" overflow-hidden sm:rounded-lg   border-green-500 border-2 shadow-green-500">
                <ul>
                  {cart.items.map((cartItem: any) => (
                    <li key={cartItem._id}>
                      <div className="flex px-4 py-5 sm:px-6">
                        <div className="flex-shrink-0">
                          <img
                            className="h-16 w-16 rounded-md object-cover object-center"
                            src={cartItem.item.image}
                            alt={cartItem.item.name}
                          />
                        </div>
                        <div className="ml-6 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between">
                            <h3 className="text-md font-medium text-green-500">
                              {cartItem.item.name}
                            </h3>
                            <button
                              onClick={() =>
                                handleRemoveItem(cartItem.item._id)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center">
                              <span className=" mr-2">Quantity:</span>
                              <span
                                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-lg cursor-pointer"
                                onClick={e =>
                                  cartItem.quantity > 1 &&
                                  handleUpdateQuantity(
                                    e,
                                    cartItem.item._id,
                                    cartItem.quantity - 1
                                  )
                                }
                              >
                                <FaMinus />
                              </span>
                              <span className="bg-gray-200 text-gray-700 px-4 py-1">
                                {cartItem.quantity}
                              </span>
                              <span
                                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-lg cursor-pointer"
                                onClick={e =>
                                  handleUpdateQuantity(
                                    e,
                                    cartItem.item._id,
                                    cartItem.quantity + 1
                                  )
                                }
                              >
                                <FaPlus />
                              </span>
                            </div>
                            <span className="">${cartItem.item.price}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className=" mx-28 my-6">
                  <button
                    onClick={handleClearCart}
                    className="w-full inline-flex rounded-xl items-center justify-center px-4 py-2 border border-transparent shadow-sm text-base font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 md:mx-6 mt-8 md:mt-0">
              <div className="border-2 border-green-500 px-8 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium  mb-4">Order Summary</h3>
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="border-b border-gray-200 mb-2"></div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/checkout", {state: {totalPrice}})}
                  className="w-full inline-flex items-center justify-center  py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white  bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaShoppingCart className="mr-2" />
                  Checkout
                </button>
                <p className="text-xs  my-3 text-center">
                  Taxes and shipping calculated at checkout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-16">
            <h2 className="text-lg font-bold  mb-4">Your cart is empty.</h2>
            <p className=" mb-8">
              Start adding items to your cart to see them here.
            </p>
            <Link
              to="/menu"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
