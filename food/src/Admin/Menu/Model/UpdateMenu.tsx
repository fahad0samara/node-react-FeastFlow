import React, {useState, useEffect} from "react";
import {AiOutlineCloudUpload, AiOutlineReload} from "react-icons/ai";
import {MdClose} from "react-icons/md";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import { ADD_CATEGORY_URL, DELETE_MENU_ITEM_URL } from "../../../urls";
import { useDarkMode } from "../../../hook/useDarkMode";

interface MenuItem {
  _id: string;
  name: string;
  price: string;
  category: {
    _id: string;
    name: string;
  };
  description: string;
}

interface UpdateMenuItemFormProps {
  itemId: string;
  initialValues: MenuItem | null;
  onClose: () => void;
  onUpdate: () => void;
}

const UpdateMenuItemForm: React.FC<UpdateMenuItemFormProps> = ({
  itemId,
  initialValues,
  onClose,
  onUpdate,
}) => {
  const isDarkMode = useDarkMode();
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Update the form fields when initialValues change
    if (initialValues) {
      const {name, price, category, description} = initialValues;
      setName(name || "");
      setPrice(price || "");
      setCategory(category ? category._id : "");
      setDescription(description || "");
    }
  }, [initialValues]);

  useEffect(() => {
    // Fetch categories from the API
    const fetchCategories = async () => {
      setIsLoadingCategory(true);

      try {
        const response = await fetch(ADD_CATEGORY_URL);
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setIsLoadingCategory(false);
      }
    };

    fetchCategories();
  }, []);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!name) {
      errors.name = "Name is required";
    }

    if (!price) {
      errors.price = "Price is required";
    } else if (isNaN(parseFloat(price))) {
      errors.price = "Price must be a number";
    }

    if (!category) {
      errors.category = "Category is required";
    }

    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    try {
      setIsLoading(true);

 await fetch(
          DELETE_MENU_ITEM_URL(
            itemId
       ),
        {
          method: "PUT",
          body: formData,
        }
      );
   
      toast.success("Menu Item Updated Successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result?.toString() || null);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  return (
    <div
      className="fixed transition-all
                            duration-300

                             inset-0 flex items-center justify-center z-50"
    >
      <div
        className={`fixed inset-0 ${
          isDarkMode ? "bg-black" : "bg-white"
        } bg-opacity-50`}
      ></div>
      <div
        className={`rounded-lg shadow-lg relative flex flex-col w-full max-w-md mx-auto px-4 py-6 z-50 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
        }`}
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`text-gray-500 hover:text-gray-600 focus:outline-none ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            <MdClose size={24} />
          </button>
        </div>
        <h2
          className={`text-2xl font-bold mb-4 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Edit Product
        </h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`mt-2 w-full px-4 py-2 text-black border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium">
                Price
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className={`mt-2 w-full px-4 py-2 text-black border ${
                  errors.price ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>
          </div>
          <div className="my-5">
            <label htmlFor="category" className="block text-sm font-medium">
              Category
            </label>
            {isLoadingCategory ? (
              <div className="flex items-center justify-center rounded-md">
                <AiOutlineReload className="animate-spin h-5 w-5 mr-3" />
                <span className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                  Loading categories...
                </span>
              </div>
            ) : (
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`mt-2 w-full px-4 py-2 text-black border ${
                  errors.category ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              >
                <option value="">Select a category</option>
                {categories.map(data => (
                  <option key={data._id} value={data._id}>
                    {data.name}
                  </option>
                ))}
              </select>
            )}
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`mt-2 block w-full px-4 py-2 text-black border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-2" htmlFor="image">
              Image:
            </label>
            <div className="relative border-dashed border-2 border-gray-400 rounded-lg h-32">
              <input
                key={image ? image.name : ""}
                className="h-full w-full opacity-0"
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div className="absolute top-0 left-0 w-full">
                  <img
                    src={imagePreview}
                    alt="Selected image preview"
                    className="h-32 w-full object-center rounded-lg"
                  />
                  <div className="flex justify-end">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                    >
                      Cancel or Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex flex-col items-center justify-center">
                    <AiOutlineCloudUpload className="w-12 h-12" />
                    <span className="block font-normal">
                      Select a file or drag and drop it here
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="mt-2 w-full py-2 bg-[#caacfb] text-white font-semibold rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-i[#caacfb]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <AiOutlineReload className="animate-spin h-5 w-5 mr-3" />
                <span>Updating...</span>
              </div>
            ) : (
              "Update"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateMenuItemForm;
