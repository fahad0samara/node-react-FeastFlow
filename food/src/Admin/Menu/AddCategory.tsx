/* eslint-disable @typescript-eslint/ban-ts-comment */
import {useState} from "react";
import axios from "axios";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { memo } from "react";
import { FETCH_CATEGORIES_URL } from "../../urls";
import { useDarkMode } from "../../hook/useDarkMode";

interface MyErrorType {
  response: {
    [x: string]: any;
    status: number;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface AddCategoryProps {
  setShowAddCategory: React.Dispatch<React.SetStateAction<boolean>>;
  setCategories: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        name: string;
        description: string;
      }>
    >
  >;
}

const AddCategory: React.FC<AddCategoryProps> = ({
  setShowAddCategory,
  setCategories,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const isDarkMode = useDarkMode();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post<Category>(
       FETCH_CATEGORIES_URL,
        {
          name,
          description,
        }
      );

      // Fetch the updated category list from the server
      const categoryRes = await axios.get<Category[]>(FETCH_CATEGORIES_URL);

      setCategories(categoryRes.data);
      setName("");
      setDescription("");
      setShowAddCategory(false);
      toast.success(
        `The category ${res.data.name} was added successfully. You can see it in the list of categories in the menu.`,
        {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        }
      );
    } catch (error) {
      if ((error as MyErrorType).response?.status === 400) {
        const errorMessage = (error as MyErrorType).response.data.error;
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        setError(
          "Something went wrong. Please check your internet connection and try again."
        );
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 3000);
    }
  };

  return (
    <div className="fixed bg-slate-400 inset-0 flex items-center justify-center z-50 bg-opacity-50">
      <div
        className={`
          rounded-lg shadow-lg  ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
          
        }`}
      >
        <div className="px-6 py-4">
          <h2 className="text-lg font-medium mb-4">Add Category</h2>
          {error && (
            <div className="bg-red-200 text-red-800 p-2 mb-4 rounded-md">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-200 text-green-800 p-2 mb-4 rounded-md">
              {successMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block  font-medium mb-2"
                htmlFor="name"
              >
                Name:
              </label>
              <input
                className={`appearance-none border rounded w-full text-black py-2 px-3 
             leading-tight focus:outline-none focus:shadow-outline ${
                  error ? "border-red-500" : ""
                }`}
                type="text"
                id="name"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block  font-medium mb-2"
                htmlFor="description"
              >
                Description:
              </label>
              <textarea
                className="border border-green-500 rounded-md text-black p-2 w-full"
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <button
              className="bg-green-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Add category"}
            </button>
            <button
              className="bg-red-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md ml-2"
              onClick={() => setShowAddCategory(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const NamedAddCategory = memo(AddCategory);
export default NamedAddCategory;


