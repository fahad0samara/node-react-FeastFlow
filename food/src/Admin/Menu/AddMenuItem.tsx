/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import axios from "axios";
import AddCategory from "./AddCategory";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCallback } from "react";
import { MenuPreviewModal } from "./Model/MenuPreviewModal";
import { FETCH_CATEGORIES_URL, ADD_MENU_URL } from "../../urls";
import ImageUploader from "../../components/ImageUploader/ImageUploader";
import { AiOutlineFileAdd } from "react-icons/ai";

interface Category {
  [x: string]: string | number | readonly string[] | undefined;
  _id: string;
  name: string;
  description: string;
}

interface MyErrorType {
  response: {
    status: number;
    data: {
      message: boolean | unknown;
      error: string;
    };
  };
}

const AddMenuItem = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [error, setError] = useState<{[key: string]: string | unknown}>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [menuPreview, setMenuPreview] = useState({});

  const isFormEmpty = !name || !description || !price || !category || !imageUrl;

  const handleImageUpload = useCallback((url: string, publicId: string) => {
    setImageUrl(url);
    setImagePublicId(publicId);
  }, []);

  const handleImageDelete = useCallback(() => {
    setImageUrl("");
    setImagePublicId("");
  }, []);

  const handlePreview = () => {
    setMenuPreview({
      name,
      description,
      category,
      price,
      image: imageUrl
    });
    setShowPreviewModal(true);
  };

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get<Category[]>(FETCH_CATEGORIES_URL);
        const data = res.data;
        setCategories(data);
        setLoading(false);
      } catch (error) {
        const errorMessage = error
          ? (error as MyErrorType).response?.data.error
          : "An error occurred while fetching categories.";

        toast.error(`Error: ${errorMessage}`, {
          position: "top-left",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        console.error(error);
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    setShowAddCategory(true);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      setLoading(true);
      setSubmitSuccess(false);

      e.preventDefault();

      // Check for missing required fields
      if (isFormEmpty) {
        setLoading(false);
        setSubmitSuccess(false);
        setShowAddCategory(false);

        toast.error(
          `Error: Please fill in all required fields.\n\nMissing fields:\n${!name ? "Name\n" : ""}${!description ? "Description\n" : ""}${!category ? "Category\n" : ""}${!price ? "Price\n" : ""}${!imageUrl ? "Image\n" : ""}`,
          {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          }
        );

        setLoading(false);
        return;
      }

      try {
        const menuData = {
          name,
          description,
          category,
          price: parseFloat(price),
          imageUrl,
          imagePublicId
        };

        await axios.post(ADD_MENU_URL, menuData);

        // reset form fields
        setName("");
        setDescription("");
        setCategory("");
        setPrice("");
        setImageUrl("");
        setImagePublicId("");

        setSubmitSuccess(true);
        toast.success("Menu item added successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } catch (error: any) {
        let errorMessage = "An error occurred while adding the menu item.";
        if (error.response) {
          if (error.response.status === 400) {
            errorMessage = error.response.data.error;
          } else {
            errorMessage = "Something went wrong.";
          }
        } else if (error.request) {
          errorMessage = "The request was made but no response was received.";
        } else {
          errorMessage = error.message;
        }
        setError({
          message: errorMessage,
        });
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
      } finally {
        setLoading(false);
      }
    },
    [name, description, category, price, imageUrl, imagePublicId, isFormEmpty]
  );

  return (
    <div className="flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-4">Add Menu Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter item name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter item description"
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Category</label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 p-2 border rounded"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCategory}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <AiOutlineFileAdd className="text-xl" />
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <ImageUploader
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDelete}
            category={category}
            maxSize={5}
            aspectRatio={1}
            initialImage={imageUrl}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isFormEmpty || loading}
            className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Menu Item"}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={isFormEmpty}
            className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Preview
          </button>
        </div>
      </form>

      {showAddCategory && (
        <AddCategory
          onClose={() => setShowAddCategory(false)}
          onSuccess={() => {
            setShowAddCategory(false);
            // Refresh categories
            axios.get<Category[]>(FETCH_CATEGORIES_URL).then((res) => {
              setCategories(res.data);
            });
          }}
        />
      )}

      <MenuPreviewModal
        show={showPreviewModal}
        onClose={handleClosePreviewModal}
        menuItem={menuPreview}
      />
    </div>
  );
};

export default AddMenuItem;
