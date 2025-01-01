import React, {useEffect, useState} from "react";
import axios from "axios";
import {BsSearch} from "react-icons/bs";
import {FiFilter} from "react-icons/fi";
import {useDarkMode} from "../hook/useDarkMode";

import {Helmet} from "react-helmet";
import Loder from "../Loder";

interface Order {
  _id: string;
  created_at: string;
  user: {
    firstName: string;
    email: string;
  };
  items: {
    _id: string;
    name: string;
    price: string;
    image: string;
  }[];
  totalAmount: string;
}

const OrderList: React.FC = () => {
  const pageTitle = "EasyBuy | Orders";
  const isDarkMode = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "https://food-yumdrop0.azurewebsites.net/orders/orders"
        );
        setOrders(response.data.orders);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch orders. Please try again later.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const openModal = (orderId: string) => {
    setExpandedOrder(orderId);
  };

  const closeModal = () => {
    setExpandedOrder(null);
  };

  const filteredOrders = orders
    .filter(order => {
      const {_id, created_at, user} = order;
      const searchTerm = searchQuery.toLowerCase();

      if (selectedFilter === "name") {
        return user.firstName.toLowerCase().includes(searchTerm);
      } else if (selectedFilter === "price") {
        return order.items.some(item =>
          item.price.toString().includes(searchTerm)
        );
      } else if (selectedFilter === "lastPayment") {
        return created_at.includes(searchTerm);
      } else {
        return (
          _id.toLowerCase().includes(searchTerm) ||
          created_at.includes(searchTerm) ||
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        );
      }
    })
    .sort((a, b) => {
      if (selectedFilter === "name") {
        return a.user.firstName.localeCompare(b.user.firstName);
      } else if (selectedFilter === "price") {
        const matchedItemsA = a.items.filter(item =>
          item.price.toString().includes(searchQuery)
        );
        const pricesA = matchedItemsA.map(item => parseFloat(item.price));
        const priceA = Math.min(...pricesA);

        const matchedItemsB = b.items.filter(item =>
          item.price.toString().includes(searchQuery)
        );
        const pricesB = matchedItemsB.map(item => parseFloat(item.price));
        const priceB = Math.min(...pricesB);

        return priceA - priceB;
      } else if (selectedFilter === "lastPayment") {
        return a.created_at.localeCompare(b.created_at);
      } else {
        return 0;
      }
    });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loder />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen ">
        {error}
      </div>
    );
  }

  //if there no item
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen ">
        No orders found.
      </div>
    );
  }

  return (
      <div className="px-7 py-10  mr-5 h-screen">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <div className=" w-full mt-8">
          <div className={'flex w-full flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0'}>
            <form className="relative flex w-full max-w-2xl items-center">
              <BsSearch className="absolute left-2 block h-5 w-5 " />
              <input
                type="text"
                name="search"
                className="h-12 w-full border-b bg-transparent py-4 pl-12 text-sm outline-none focus:border-b-2 placeholder:text-green-500
                "
                placeholder="Search by Order ID, Date, Customer"
                value={searchQuery}
                onChange={handleSearch}
              />
            </form>
            <div className="relative inline-flex">
              <select
                className="border  border-white  bg-green-500 text-lg   text-white px-2 py-3 rounded-xl  outline-none focus:border-blue-500"
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
              >
                <option value="">
                  {selectedFilter ? selectedFilter : "All"}
                </option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="lastPayment">Last Payment</option>
              </select>
              {selectedFilter && (
                <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                  <FiFilter className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <table className="min-w-full border-collapse border-spacing-y-2 border-spacing-x-2 ">
            <thead className="hidden border-l lg:table-header-group bg-green-500 text-white ">
              <tr>
                <th className="px-6 py-3 text-left text-xl italic font-medium  uppercase tracking-wider border border-green-500">
                  User
                </th>
                <th className="px-6 py-3  text-xl font-medium italic  uppercase tracking-wider border border-green-500">
                  Items
                </th>
                <th className="lg:px-6 py-1 text-left text-lg italic font-medium  uppercase tracking-wider border-green-500 border">
                  Total Amount
                </th>
                <th className="px-6 py-1 text-left text-xl italic font-medium  uppercase tracking-wider border-green-500 border">
                  last payment
                </th>
              </tr>
            </thead>
            <tbody className="lg:border-green-500 border-none border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td className="whitespace-no-wrap py-4 text-left text-sm  sm:px-3 lg:text-left ">
                      <div className="text-lg  font-medium ">
                        {order.user.firstName}
                      </div>
                      <div className="text-lg italic ">{order.user.email}</div>
                    </td>
                    <td className="sm:px-6 py-4 whitespace-nowrap">
                      <div className="grid lg:grid-cols-3 grid-cols-1">
                        {order.items
                          .filter(item => {
                            if (selectedFilter === "price") {
                              return item.price.toString().includes(searchQuery);
                            }
                            return true;
                          })
                          .map(item => (
                            <div
                              key={item._id}
                              className="flex items-center space-x-5 space-y-4 border-l px-6 border-green-500 "
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="md:h-12 md:w-12 h-10 w-10 mt-2 rounded-full object-cover border-2 "
                              />
                              <div className="text-md  cursor-pointer  hidden sm:inline">
                                <div className="text-xs italic font-medium">
                                  {item.name}
                                </div>

                                <div className="text-lg text-green-500">
                                  {item.price}$
                                </div>
                              </div>
                              <div className="text-xs  cursor-pointer sm:hidden">
                                <div className="text-sm font-medium">
                                  {item.name.slice(0, 13)}
                                </div>
                              </div>
                            </div>
                          ))}
                        {order.items.length > 3 && (
                          <div
                            className="text-green-500 font-bold italic md:text-start text-center mt-3 cursor-pointer items-center"
                            onClick={() => openModal(order._id)}
                          >
                            View All
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-no-wrap py-4 px-6 border-green-500  hidden sm:block text-lg mt-10 border-x text-center lg:text-left">
                      {order.totalAmount} $
                    </td>
                    <td className="whitespace-no-wrap hidden py-4 text-sm font-normal  text-white sm:px-3 sm:table-cell">
                      <span className="ml-2 mr-3 whitespace-nowrap rounded-full bg-green-500 px-2 py-0.5 ">
                        {order.created_at
                          .split("T")[0]
                          .split("-")
                          .reverse()
                          .join("-")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {expandedOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className={`
          ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}
          p-8 max-w-2xl mx-auto rounded shadow-lg 
          overflow-hidden
          
        `}
            >
              <div>
                <div className="flex items-center justify-between my-2">
                  <h2 className="text-xl font-bold">Items</h2>
                  <button
                    className="bg-red-500
                    hover:bg-red-600
                    text-white
                      py-2 px-4 rounded mt-4"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-64">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders
                    .find(order => order._id === expandedOrder)
                    ?.items.map(item => (
                      <div
                        key={item._id}
                        className="flex items-center space-x-5 mb-2"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-full object-cover border-2"
                        />
                        <div>
                          <div className="text-lg font-medium">{item.name}</div>
                          <div className="text-lg">{item.price}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default OrderList;
