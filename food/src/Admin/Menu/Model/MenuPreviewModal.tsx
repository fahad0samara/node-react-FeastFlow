import {FC, memo} from "react";
import {useDarkMode} from "../../../hook/useDarkMode";

interface MenuPreviewModalProps {
  previewData: {
    name: string;
    description: string;
    category: string;
    price: number;
    image?: File;
  };
  onClose: () => void;
}

const MenuPreviewModal: FC<MenuPreviewModalProps> = ({
  previewData,
  onClose,
}) => {
  const isDarkMode = useDarkMode();
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
      <div
        className={`rounded-lg shadow-lg  ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className=" px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-500 sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium" id="modal-headline">
                Preview
              </h3>
              <div className="mt-2">
                <p className="text-sm text-green-500">
                  Please review the details before submitting.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <p>Name: {previewData.name}</p>
            <p>Description: {previewData.description}</p>

            <p>Price: {previewData.price}</p>
            {previewData.image && (
              <img
                className="h-64 w-64 rounded-full mx-auto"
                src={URL.createObjectURL(previewData.image)}
                alt="menu item"
              />
            )}
          </div>
        </div>
        <div className="bg-green-500 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            onClick={onClose}
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const NamedAddMenu = memo(MenuPreviewModal);
export {NamedAddMenu as MenuPreviewModal};
