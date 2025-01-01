import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AiOutlineCloudUpload } from 'react-icons/ai';

interface DragAndDropProps {
  onFilesDrop: (files: File[]) => void;
  maxSize?: number; // in MB
  maxFiles?: number;
  accept?: string[];
  className?: string;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({
  onFilesDrop,
  maxSize = 5,
  maxFiles = 10,
  accept = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesDrop(acceptedFiles);
  }, [onFilesDrop]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    maxFiles,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false)
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <AiOutlineCloudUpload className="text-4xl text-gray-400" />
          <div className="text-gray-600">
            <p className="font-medium">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop files here, or click to select files'}
            </p>
            <p className="text-sm mt-2">
              {`Maximum ${maxFiles} file${maxFiles !== 1 ? 's' : ''}, up to ${maxSize}MB each`}
            </p>
            <p className="text-sm mt-1">
              Supported formats: {accept.map(type => type.split('/')[1].toUpperCase()).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="text-red-800 font-medium mb-2">File Upload Issues:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name} className="mb-2">
                <span className="font-medium">{file.name}:</span>
                <ul className="list-disc list-inside ml-4">
                  {errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DragAndDrop;
