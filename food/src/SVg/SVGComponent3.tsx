import {SVGProps} from "react";
const SVGComponent3 = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={100}
    height={100}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 100V0c55.228 0 100 44.772 100 100H0Z"
      fill="#22c55e"
    />
  </svg>
);
export default SVGComponent3;
