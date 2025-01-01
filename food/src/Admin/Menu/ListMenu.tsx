/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from "react";
import axios from "axios";
import {Helmet} from "react-helmet";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaTrash,
  FaEdit,
  FaEye,
  AiOutlineSortAscending,
  AiOutlineFile,
  BsSearch,
} from "react-icons/all";

import UpdateMenuItemForm from "./Model/UpdateMenu";
import ViewItem from "./Model/ViewItem";
import { useDarkMode } from "../../hook/useDarkMode";
import { DELETE_CATEGORY_URL, FETCH_MENU_ITEMS_URL } from "../../urls";
import { MenuItem } from "../../Type";



interface DataItem extends MenuItem {
  createdAt: string | number | Date;
  _id: string;
}




const ListMenu: React.FC = () => {
  const pageTitle = "EasyBuy | List";
  const isDarkMode = useDarkMode();
  const [data, setData] = useState<DataItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("");
  const [selectedItem, setSelectedItem] = useState<DataItem | null>(null);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{
        data: DataItem[];
        totalPages: number;
      }>(
        FETCH_MENU_ITEMS_URL(
          page,
          itemsPerPage,
          searchQuery,
          sortColumn,
          sortDirection
        )
      );

      setData(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchData();
    }, 300); // Debounce timeout: 300 milliseconds

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [page, searchQuery, itemsPerPage, sortColumn, sortDirection]);

  const handleNextPage = () => {
    setPage(page + 1);
  };

  const handlePrevPage = () => {
    setPage(page - 1);
  };

  const handleDeleteCat = (id: string) => {
    setConfirmDelete(true);
    setDeletingCatId(id);
  };

  const confirmDeleteCat = async () => {
    try {
      setLoading(true);
      await axios.delete(DELETE_CATEGORY_URL(deletingCatId));
      setData(data.filter(cat => cat._id !== deletingCatId));
      setConfirmDelete(false);
      setLoading(false);
      toast.success("Category deleted successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
      });
    } catch (error) {
      console.log(error);
      setLoading(false);

      toast.error("Something went wrong", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredData = data
    .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortColumn === "id") {
        return sortDirection === "asc"
          ? a.id.localeCompare(b.id)
          : b.id.localeCompare(a.id);
      }
      if (sortColumn === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortColumn === "category") {
        return sortDirection === "asc"
          ? a.category.name.localeCompare(b.category.name)
          : b.category.name.localeCompare(a.category.name);
      }
      if (sortColumn === "price") {
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      }
      if (sortColumn === "createdAt") {
        return sortDirection === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  // State and functions for handling the edit mode
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState("");

  // Function to handle entering edit mode
  const enterEditMode = (itemId: string) => {
    setEditMode(true);
    setEditItemId(itemId);
  };

  // Function to handle exiting edit mode
  const exitEditMode = () => {
    setEditMode(false);
    setEditItemId("");
  };

  const handleView = (item: DataItem) => {
    setSelectedItem(item);
  };

  const exportToCSV = () => {
    const csvContent = [
      "Full Name, Category, Price, Created At, Status",
      ...filteredData.map(cat =>
        [
          cat.name,
          cat.category.name,
          cat.price,
          new Date(cat.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const encodedURI = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedURI);
    link.setAttribute("download", "menu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className={"mx-auto max-w-screen-2xl px-2 py-8 sm:px-8"}>
        <div className="mx-auto mt-8 max-w-screen-lg px-2">
          <div className={"grid grid-cols-1  lg:grid-cols-3 gap-4"}>
            <div className="">
              <form className="relative flex w-full max-w-2xl items-center">
                <BsSearch className="absolute left-2 block h-5 w-5 " />
                <input
                  type="text"
                  name="search"
                  className="h-12 w-full border-b bg-transparent py-4 pl-12 text-sm outline-none focus:border-b-2 placeholder:text-green-500
                "
                  placeholder="Search by 
                 Name, Category ,Price
                                  "
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                  }}
                />
              </form>
            </div>
            <div className="col-span-2 flex flex-row items-center justify-between mt-4 sm:mt-0">
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="
                  sort

                  "
                  className="text-sm font-medium "
                >
                  Sort by:
                </label>
                <select
                  name="
                    sort
                    "
                  className="block w-full px-3 py-2 border-2 border-green-500 bg-green-500 text-white sm:w-36 whitespace-pre rounded-lg  p-1 pr-2 text-base outline-none focus:shadow sm:text-sm"
                  value={sortColumn}
                  onChange={e => {
                    setSortColumn(e.target.value);
                  }}
                >
                  <option value="">None</option>
                  <option value="createdAt">Recent</option>
                  <option value="name">Name</option>
                  <option value="category">Category</option>
                  <option value="price">Price</option>
                  {/* Add more options as needed */}
                </select>
                <AiOutlineSortAscending
                  className="
                  text-green-500 hover:text-gray-700 cursor-pointer
                  transition-all duration-150
                  text-2xl
                  hidden
                  sm:block

                  "
                />
              </div>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center rounded-lgb  py-2 px-3 text-center text-sm bg-green-500 hover:text-black  font-medium  shadow hover:bg-gray-100 focus:shadow mt-4 sm:mt-0"
                onClick={exportToCSV}
              >
                <AiOutlineFile className="mr-1 h-4 w-4 hidden sm:block" />
                Export to CSV
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border shadow">
            <table
              className="min-w-full border-2

            border-green-500
                divide-y divide-green-500

                "
              aria-label="Menu Items"
            >
              <thead
                className="hidden 
                rounded-2xl
                bg-green-500

           shadow-xl
           border
            text-white

                 lg:table-header-group"
              >
                <tr>
                  <th
                    className="whitespace-normal py-4 text-sm font-medium sm:px-6 hover:cursor-pointer"
                    onClick={() => {
                      handleSort("name");
                    }}
                    scope="col"
                  >
                    Full Name
                    <span className="ml-1">
                      {sortColumn === "name" && sortDirection === "asc"
                        ? "▲"
                        : "▼"}
                    </span>
                  </th>

                  <th
                    className="whitespace-normal py-4 text-sm font-medium hover:cursor-pointer sm:px-6"
                    onClick={() => {
                      handleSort("category");
                    }}
                    scope="col"
                  >
                    Category
                    <span className="ml-1">
                      {sortColumn === "category" && sortDirection === "asc"
                        ? "▲"
                        : "▼"}
                    </span>
                  </th>

                  <th
                    className="whitespace-normal py-4 hover:cursor-pointer text-sm font-medium sm:px-6"
                    onClick={() => {
                      handleSort("price");
                    }}
                    scope="col"
                  >
                    Price
                    <span className="ml-1">
                      {sortColumn === "price" && sortDirection === "asc"
                        ? "▲"
                        : "▼"}
                    </span>
                  </th>

                  <th
                    className="whitespace-normal py-4 cursor-pointer text-sm font-medium sm:px-6 hidden md:block"
                    onClick={() => {
                      handleSort("createdAt");
                    }}
                    scope="col"
                  >
                    Created at
                    <span className="ml-1">
                      {sortColumn === "createdAt" && sortDirection === "asc"
                        ? "▲"
                        : "▼"}
                    </span>
                  </th>

                  <th
                    className="whitespace-normal py-4 text-sm font-medium sm:px-6"
                    scope="col"
                  >
                    Status
                  </th>
                </tr>
              </thead>

              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-xl py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No items found
                  </td>
                </tr>
              ) : (
                <tbody
                  className="
                 divide-y divide-green-500 divide-opacity-25
                  "
                >
                  {filteredData.map((cat, index) => (
                    <tr
                      className="hover:bg-gray-100
                      transition-all
                      duration-150
                      hover:transform
                      hover:scale-x-100
                      cursor-pointer
                      hover:text-black

                      "
                      key={index}
                    >
                      <td className="whitespace-no-wrap py-4 text-sm font-bold  sm:px-2">
                        {cat.name}
                      </td>

                      <td className="whitespace-no-wrap py-4 px-2 text-right text-sm lg:text-left">
                        {cat.category.name}
                      </td>

                      <td className="whitespace-no-wrap py-4 px-4 text-right text-sm lg:text-left">
                        {cat.price}
                      </td>

                      <td className="whitespace-no-wrap py-4 px-6 text-right text-sm lg:text-left hidden md:block">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-no-wrap py-2 px-2  text-right text-sm lg:text-left">
                        <div className="grid md:grid-cols-3   gap-4 items-center">
                          <FaTrash
                            onClick={() => {
                              handleDeleteCat(cat._id);
                            }}
                            className="
                                text-red-500
                                hover:text-red-700
                                cursor-pointer
                                text-xl
                                 transition-all
                                duration-150
                                hover:transform
                                hover:scale-110
                                "
                            aria-label="Delete Category"
                          />

                          <FaEdit
                            onClick={() => {
                              enterEditMode(cat._id);
                            }}
                            className="
                                text-green-500
                                hover:text-green-700
                               transition-all
                                duration-150
                                hover:transform
                                hover:scale-110
                                cursor-pointer
                                text-xl
                                "
                            aria-label="Edit Category"
                          />

                          <FaEye
                            onClick={() => {
                              handleView(cat);
                            }}
                            className="
                                text-blue-500
                                hover:text-blue-700
                                transition-all
                                duration-150
                                hover:transform
                                hover:scale-110
                                cursor-pointer
                                text-xl
                                "
                            aria-label="View Category"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
        <div
          className={
            "flex flex-col sm:flex-row justify-between my-4 mx-3 items-center"
          }
        >
          <div>
            <span className="text-xs sm:text-xl">
              Showing {page} of {totalPages} Entries
            </span>
          </div>
          <div className="flex items-center justify-center mt-4 sm:mt-0 sm:ml-4">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="mr-2 h-12 w-12 rounded-full text-white bg-green-500 text-black border text-md font-semibold transition duration-150 hover:bg-gray-100"
            >
              Prev
            </button>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="h-12 w-12 rounded-full border text-white  bg-green-500 text-black text-md font-semibold transition duration-150 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
          <div className="flex items-center justify-center mt-4 sm:mt-0 ">
            <div className="ml-4">
              {/* Dropdown to select items per page */}
              <label htmlFor="itemsPerPage" className="mr-2 text-sm">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                className="px-2 py-1 border rounded-md  bg-green-500 text-white"
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
            </div>
            <div className="ml-4">
              {/* Direct page number input */}
              <label htmlFor="pageNumber" className="mr-2 text-sm">
                Go to page:
              </label>
              <input
                id="pageNumber"
                type="number"
                min={1}
                max={totalPages}
                className="px-2 py-1 border rounded-md w-16  bg-green-500 text-white"
                value={page}
                onChange={e => {
                  setPage(Number(e.target.value));
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {editMode && editItemId && (
        <UpdateMenuItemForm
          itemId={editItemId}
          //@ts-ignore
          initialValues={
            editItemId && data.find(item => item._id === editItemId)
          }
          onClose={exitEditMode}
          onUpdate={fetchData}
        />
      )}
      {selectedItem && (
        <ViewItem
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
          }}
        />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`fixed inset-0 ${
              isDarkMode ? "bg-black" : "bg-white"
            } bg-opacity-50`}
          ></div>
          <div
            className={`rounded-lg shadow-lg relative flex flex-col w-full max-w-md mx-auto px-2 py-6 z-50 ${
              isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
            }`}
          >
            <h2 className="text-lg font-semibold text-red-500 mb-4">
              Confirm Delete
            </h2>
            <p className="">Are you sure you want to delete this category?</p>
            <div className="flex justify-end mt-6">
              <button
                className="px-2 py-2 text-white bg-red-500 rounded-lg mr-2"
                onClick={async () => {
                  await confirmDeleteCat();
                }}
              >
                {loading ? "Loading..." : "Delete"}
              </button>
              <button
                className="px-2 py-2 text-white bg-gray-600 rounded-lg"
                onClick={() => {
                  setConfirmDelete(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListMenu;
