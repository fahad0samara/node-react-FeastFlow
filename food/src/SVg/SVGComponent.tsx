import {SVGProps} from "react";
const SVGComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    className="absolute -bottom-2 hidden w-28 text-green-400 sm:block"
    viewBox="0 0 490 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10.631 17.089c3.837 0 7.856-.178 11.692-.356 1.644 0 3.106-.178 4.75-.178l20.826-1.068c8.404-.356 16.625-.89 25.028-1.246 11.875-.712 23.75-1.246 35.624-1.958 2.74-.178 5.481-.178 8.221-.356 6.942-.356 13.884-.712 20.826-.89 6.942-.356 13.884-.712 20.826-.89 2.741-.178 5.481-.356 8.221-.356 10.961-.356 22.105-.712 33.067-1.068 6.759-.179 13.518-.357 20.46-.713 2.741 0 5.298-.178 8.039-.178 10.595-.178 21.374-.356 31.97-.534 10.595-.178 21.009-.356 31.604-.534h29.047c10.779 0 21.375 0 32.153-.178h34.163c-16.442.178-33.067.356-49.508.712-6.942.178-13.702.178-20.644.356-2.923 0-6.029 0-8.952.178-10.047.178-19.912.534-29.96.712-11.509.357-23.019.535-34.528.89-2.009 0-3.836.179-5.846.179-6.211.356-12.24.534-18.451.89l-37.268 1.602c-1.827 0-3.654.178-5.481.356-6.028.356-12.24.89-18.268 1.246-10.961.712-21.74 1.424-32.701 2.136-2.923.178-6.029.534-8.952.712-6.942.534-13.884 1.068-20.826 1.78-8.769.712-17.72 1.424-26.49 2.136-12.24 1.068-24.662 2.136-36.902 3.204-2.923.178-5.846.534-8.952.712L7.526 25.99c-.549 0-1.097.357-1.097 1.069 0 .534.548 1.068 1.097 1.068 2.01 0 3.836.178 5.845.178-.365.89-.548 1.424-.548 1.958 0 1.958 1.645 3.738 3.837 3.738 15.163-.89 30.143-1.958 45.306-2.67 13.154-.534 26.307-1.246 39.46-1.78 14.433-.712 29.047-1.424 43.48-1.958 4.567-.178 9.134-.356 13.701-.712 1.279 0 2.558-.178 4.019-.178 23.384-.535 46.768-1.247 70.152-1.78 12.422-.357 25.028-.713 37.45-.89 4.568-.179 8.952-.179 13.519-.357l71.796-1.068 30.691-.534c8.769-.178 17.538-.178 26.307-.534 7.307-.178 14.432-.534 21.74-.712 3.653-.178 7.307-.178 10.778-.356l24.663-1.602c-.548.712-.548 1.78-.366 2.492.183.89.731 1.602 1.645 1.958.73.356 1.826.712 2.557.356 1.827-.712 3.654-1.424 5.298-2.136h-.183c.183 0 .183-.178.366-.178.182 0 .365-.178.365-.178h-.183c.914-.356 1.827-.712 2.923-1.246.914-.356 2.01-.89 2.923-1.246 1.097-.534 2.01-1.068 3.106-1.602S490 15.131 490 13.885c0-.712-.183-1.246-.548-1.958-.365-.712-1.279-1.602-2.192-1.78-.914-.178-1.827-.356-2.741-.356h-.548c-.548 0-1.278 0-1.827.178-1.461.178-2.74.356-4.201.356-1.096 0-2.193.178-3.471.178-3.106.178-6.029.356-9.135.712-.73 0-1.644.178-2.375.178.366-.356.548-.712.548-1.068.183-.356.183-.712.183-1.068 0-.178 0-.534.183-.713 0-.356 0-.712-.183-.89 0 0 .183 0 .183-.178.548-.356 1.096-.712 1.461-1.424.366-.534.548-1.246.548-1.958s-.182-1.246-.548-1.958c-.182-.178-.365-.534-.548-.712-.548-.534-1.096-.712-1.644-.89C462.049.178 460.77 0 459.491 0h-59.738c-18.817 0-37.451.178-56.267.356-14.067.178-28.134.356-42.201.356-6.211 0-12.605.178-18.817.356-14.066.356-28.133.534-42.2.89-4.019 0-8.038.178-12.057.178-2.375 0-4.568.178-6.943.178l-41.652 1.602c-4.202.178-8.404.356-12.788.534-2.375 0-4.75.178-7.125.356-13.884.712-27.585 1.424-41.47 2.136-7.124.356-14.249.712-21.374 1.246-12.24.713-24.48 1.425-36.537 2.315-10.596.712-21.192 1.246-31.788 1.78-1.644.178-3.288.178-5.115.356-2.74.178-5.48.178-8.22.356-2.376.712-4.933.712-7.308.712-.183-.712-.914-1.246-1.462-1.068-1.644 0-3.105.178-4.75.356-.73.178-1.46.534-1.644 1.246-.182.89.366 1.78 1.097 1.958l2.192.534c.73.178 1.279.178 2.01.178 1.826.178 3.47.178 5.297.178Zm427.486-5.696h6.759c.183.534.549.89.914 1.246-.914 0-1.827.178-2.558.178-1.644 0-3.288.178-4.932.178-7.308.178-14.432.534-21.74.712-3.288.178-6.577.356-9.865.356-5.115 0-10.413.178-15.528.178l-35.441.534-68.873 1.068c-16.442.178-32.884.712-49.325 1.246-24.663.712-49.508 1.246-74.171 1.958-4.933.178-9.865.356-14.798.712-14.066.712-28.133 1.246-42.2 1.958-13.702.712-27.586 1.246-41.287 1.958-1.28 0-2.558.178-3.837.178 3.654-.356 7.49-.534 11.144-.89 12.97-.89 25.942-1.958 38.912-2.848 4.568-.356 9.135-.712 13.519-1.068 2.375-.178 4.75-.356 6.942-.356 13.702-.712 27.22-1.602 40.739-2.314 2.558-.178 5.298-.356 7.856-.534 3.836-.178 7.673-.356 11.326-.356l41.653-1.602c3.105-.178 6.211-.178 9.134-.356h2.375c2.192 0 4.384 0 6.394-.178 13.884-.356 27.951-.534 41.835-.89 6.394-.178 12.788-.356 19.182-.356l62.114-.534c21.557 0 42.748-.178 63.757-.178ZM38 42a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      fill="currentColor"
    />
  </svg>
);
export default SVGComponent;
