import {SVGProps} from "react";
const SVGComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    className="absolute -bottom-14 -left-4 hidden w-10 text-green-400 sm:block"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 399.141 399.141"
    xmlSpace="preserve"
    {...props}
  >
    <path d="M399.141 128.482 309.998 39.34l-89.143 89.142 28.285 28.285 51.741-51.742c18.059 82.074-24.769 168.023-105.056 201.28-57.514 23.824-121.894 16.075-172.213-20.725L0 317.868c29.504 21.576 64.251 35.463 100.484 40.156a214.426 214.426 0 0 0 27.578 1.776 217.307 217.307 0 0 0 83.07-16.54c53.507-22.163 95.18-63.836 117.343-117.343 12.699-30.658 18.107-63.097 16.254-95.277l26.126 26.127 28.286-28.285z" />
  </svg>
);
export default SVGComponent;
