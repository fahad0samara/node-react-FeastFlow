import {useEffect, useState} from "react";
import axios from "axios";
import {FETCH_RECENT_ORDERS_URL} from "../urls";

interface Order {
  _id: string;
  user: {
    firstName: string;
  };
  created_at: string;
  totalAmount: number;
}

const RecentOrders: React.FC = () => {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recent orders from the backend API
    axios
      .get<{orders: Order[]}>(FETCH_RECENT_ORDERS_URL)
      .then(response => {
        setRecentOrders(response.data.orders);
        setLoading(false); // Set loading to false when data is fetched successfully
      })
      .catch(error => {
        setError(error.message); // Set the error message if the API call fails
        setLoading(false); // Set loading to false on error
      });
  }, []);

  if (loading) {
    return (
      <div
        className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Loading!</strong>
        <span className="block sm:inline">
          {" "}
          Please wait while we fetch the data.
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  //if there are no orders
  if (recentOrders.length === 0) {
    return null;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Most Recent Orders</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border">
          <thead className="bg-green-500 border-b border-gray-200 text-white uppercase text-sm leading-normal">
            <tr>
              <th className="px-4 py-2 border hidden md:block">Order ID</th>
              <th className="px-4 py-2 border">Customer Name</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order._id}>
                <td className="px-4 py-2 border hidden md:block">
                  {order._id}
                </td>
                <td className="px-4 py-2 border text-xl">{order.user.firstName}</td>
                <td className="px-4 py-2 border text-xl">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border text-xl">
                  ${order.totalAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
