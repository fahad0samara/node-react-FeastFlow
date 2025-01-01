/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState, useEffect} from "react";
import {Helmet} from "react-helmet";
import axios from "axios";
import Loader1 from "../Loder";
import {useSelector} from "react-redux";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash} from "react-icons/fa";
import {
  DELETE_ADMIN_URL,
  DELETE_USER_URL,
  FETCH_USERS_URL,
  MAKE_ADMIN_URL,
} from "../urls";
import {RootState} from "../Redux/store";

interface User {
  _id: string;
  role: "user" | "admin";
  firstName: string;
  email: string;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const pageTitle = "EasyBuy | User Management";

  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingUpdate, setLoadingUpdate] = useState<string>("");
  const [filterBy, setFilterBy] = useState("all");
  

  // Using the useSelector hook from React Redux to extract data from the global state
  const {userId} = useSelector((state: RootState) => state.auth);

  // Finding the logged-in admin in the user list (if any)
  const loggedInAdmin = users.find(
    user => user._id === userId && user.role === "admin"
  );

  // useEffect hook to fetch the user data from the backend API on component mount
  useEffect(() => {
    // Fetch user data from the backend API
    const fetchUsers = async () => {
      setLoadingUsers(true); // Set loading state while fetching users
      try {
        const response = await axios.get(
          FETCH_USERS_URL(currentPage, filterBy)
        );

        setUsers(response.data.users); // Set the fetched user data into the state

        setTotalPages(Math.ceil(response.data.totalPages));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false); // Set loading state to false after fetching users
      }
    };

    fetchUsers();
  }, [currentPage, filterBy]);

  const handleFilterChange = (event: {
    target: {value: React.SetStateAction<string>};
  }) => {
    setFilterBy(event.target.value);
    setCurrentPage(1); // Reset the current page when the filter changes to show the first page.
  };

  const handlePageChange = (newPage: React.SetStateAction<number>) => {
    setCurrentPage(newPage);
  };

  const generatePaginationLinks = () => {
    const links = [];
    // Previous Button
    links.push(
      <li key="prev">
        <button
          className={`
          px-4 py-2 mx-1 bg-green-500 text-white
          rounded-md focus:outline-none
          hover:bg-green-700 cursor-pointer
          transition duration-300 ease-in-out transform
          ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "opacity-100"}
        `}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
      </li>
    );

    for (let page = 1; page <= totalPages; page++) {
      if (page === currentPage) {
        // Current page link (not clickable)
        links.push(
          <li key={page}>
            <span
              className="
                px-1 py-1 mx-1 bg-green-500
                text-white rounded-md focus:outline-none

            "
            >
              {page}
            </span>
          </li>
        );
      } else {
        // Other pages (clickable)
        links.push(
          <li key={page}>
            <button
              className={`
                    px-1 py-1 mx-1 bg-green-500 
                    text-white rounded-md focus:outline-none
                    
        
            `}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          </li>
        );
      }
    }

    // Next Button
    links.push(
      <li key="next">
        <button
          className={`
          px-4 py-2 mx-1 bg-green-500 text-white
          rounded-md focus:outline-none
          hover:bg-green-700 cursor-pointer
          transition duration-300 ease-in-out transform
          ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : "opacity-100"
          }
        `}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </li>
    );

    return links;
  };

  // Function to handle the action of promoting a user to an admin or vice versa
const handleUpdateRole = async (
  userId: string,
  currentRole: "user" | "admin"
) => {
  const newRole = currentRole === "user" ? "admin" : "user";

  const token = localStorage.getItem("token");

  const shouldPromote = window.confirm(
    `Are you sure you want to promote this user to ${newRole}?`
  );

  if (!shouldPromote) {
    return;
  }

  setLoadingUpdate(userId);

  try {
    await axios.put(
      MAKE_ADMIN_URL(userId),
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Update the local state to reflect the role change
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user._id === userId) {
          return {...user, role: newRole};
        }
        return user;
      })
    );

    toast.success(`User role updated successfully!`);
  } catch (error: any) {
    console.error("Error updating user role:", error);
    toast.error("Error updating user role!", error.response.data.message);
  } finally {
    setLoadingUpdate("");
  }
};


  // Function to handle the action of deleting a user
  const handleDeleteUser = async (userId: string) => {
    // Show a confirmation dialog before proceeding with the deletion
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!shouldDelete) {
      // If the user clicks "Cancel" in the confirmation dialog, do nothing
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Get the token from local storage for authentication
      await axios.delete(DELETE_USER_URL(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Update the users list after deletion
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user!");
    }
  };

  // Function to handle the action of deleting an admin
  const handleDeleteAdmin = async (adminId: string) => {
    try {
      // Show the confirmation dialog
      const confirmed = window.confirm(
        "Are you sure you want to delete this admin?"
      );
      if (!confirmed) {
        return; // If the user cancels, do nothing
      }

      const token = localStorage.getItem("token"); // Get the token from local storage for authentication
      await axios.delete(
        DELETE_ADMIN_URL(adminId),

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update the admins list after deletion
      setUsers(prevUsers => prevUsers.filter(admin => admin._id !== adminId));
      toast.success("Admin deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting admin:", error.response.data.message);
      toast.error("Error deleting admin!", error.response.data.message);
    }
  };

  // Render the UI
  if (loadingUsers) {
    return <Loader1 />; // Display the custom loader component while fetching data
  }

  return (
    <div
      className="p-4
    h-screen
    overflow-y-auto
    
    "
    >
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div
        className="grid sm:grid-cols-2 grid-cols-1
        gap-4
        mb-4
        mt-11
        items-center
        justify-between"
      >
        <h1
          className="text-2xl font-bold text-center
        sm:text-left
        "
        >
          Users and Admins List
        </h1>
        <div
          className="flex items-center
          justify-center
          sm:justify-end
          gap-2"
        >
          <label className=" font-semibold" htmlFor="filter">
            Filter by:
          </label>
          <select
            className="px-4 py-2 rounded-md border border-green-500
          focus:outline-none focus:ring-2  bg-green-500 focus:ring-green-500
          focus:border-transparent
          ml-2
          "
            id="filter"
            value={filterBy}
            onChange={handleFilterChange}
          >
            <option value="all">All</option>
            <option value="last_registered">Last Registered</option>
            <option value="name">Name</option>
            <option value="role">Role</option>
          </select>
        </div>
      </div>

      {/* Display a message if there are no users */}
      {users.length === 0 && <p className="text-gray-500">No users found.</p>}
      {/* Display a table of users if there are users */}

      <table className="table-auto w-full border-collapse border">
        <thead>
          <tr>
            <th
              className="border px-4 py-2 bg-green-500
             text-white shadow-md rounded-md"
            >
              Role
            </th>
            <th
              className="border px-4 py-2 bg-green-500
             text-white shadow-md rounded-md"
            >
              Name
            </th>
            <th
              className="border px-4 py-2 bg-green-500
             text-white shadow-md rounded-md"
            >
              created
            </th>
            <th
              className="border px-4 py-2 bg-green-500
             text-white shadow-md rounded-md
                hidden sm:grid
             "
            >
              Email
            </th>

            <th
              className="border px-4 py-2 bg-green-500
             text-white shadow-md rounded-md"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td
                className="border px-4 py-2 border-green-500
                  first-letter:text-green-500
                    first-letter:font-bold
                    first-letter:uppercase

                
                 
              "
              >
                {user.role}
              </td>
              <td className="border px-4 py-2 ">{user.firstName}</td>
              <td className="border px-4 py-2 ">
                {user.created_at.split("T")[0]}
              </td>
              <td className="px-4  text-center hidden sm:inline-grid w-full">
                {user.email}
              </td>
              <td className="border px-4 py-2">
                {/* Check if the user is the logged-in admin */}
                {user._id === userId && user.role === "admin" ? (
                  <span className="">
                    the
                    <span className="text-green-500"> logged-in </span>
                    admin
                  </span>
                ) : (
                  <>
                    {/* "Promote to Admin" button */}
                    {user.role === "user" && (
                      <button
                        className={`px-4 py-2 rounded text-cyan-500 hover:text-cyan-700`}
                        onClick={() => {
                          // Check if the user is not the logged-in admin
                          if (user._id !== userId) {
                            handleUpdateRole(user._id, user.role);
                          }
                        }}
                        disabled={
                          loadingUpdate === user._id ||
                          (loggedInAdmin && loggedInAdmin._id === user._id)
                        }
                      >
                        {loadingUpdate === user._id
                          ? "Loading..."
                          : " Promote to Admin"}
                      </button>
                    )}
                  </>
                )}
                {/* Disable "Delete" button for the logged-in admin */}
                <button
                  className={`px-4 py-2 rounded text-red-500 hover:text-red-700 ml-2`}
                  onClick={() => {
                    // Check if the user is not the logged-in admin
                    if (user._id !== userId) {
                      if (user.role === "user") {
                        handleDeleteUser(user._id);
                      } else if (user.role === "admin") {
                        handleDeleteAdmin(user._id);
                      }
                    } else {
                      toast.error("You cannot delete your own account!");
                    }
                  }}
                  disabled={
                    loadingUpdate === user._id ||
                    (loggedInAdmin &&
                      loggedInAdmin._id === user._id &&
                      user._id !== userId)
                  }
                >
                  {loadingUpdate === user._id ? "Loading..." : <FaTrash />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul
        className="
        flex
        justify-center
        align-middle
        sm:justify-start
 
        
        items-center
        mt-4
        mb-10
        w-full
        h-10

      "
      >
        {/* Pagination links */}
        {generatePaginationLinks()}
      </ul>
    </div>
  );
};

export default UserManagement;
