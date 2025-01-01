/* eslint-disable @typescript-eslint/ban-ts-comment */
import {useState, useEffect} from "react";
import axios from "axios";
import {AiOutlineUsergroupDelete} from "react-icons/ai";
import {IoFastFoodOutline} from "react-icons/io5";
import {BiBarcodeReader, BiCategoryAlt} from "react-icons/bi";
import {useDarkMode} from "../hook/useDarkMode";
import {MdOutlineAdminPanelSettings} from "react-icons/md";

import ReactApexChart from "react-apexcharts";
import RecentOrders from "./RecentOrders";

const Home = () => {
  const isDarkMode = useDarkMode();
  const [loading, setloading] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    orderCount: 0,
    CartCount: 0,
    UserCount: 0,
    CategoryCount: 0,
    MenuCount: 0,
    AdminCount: 0,
    SalesCount: 0,
    RevenueCount: 0,
    ExpenseCount: 0,
    orderPercentageDiff: 0,
    cartPercentageDiff: 0,
    categoryPercentageDiff: 0,
    userPercentageDiff: 0,
    salesPercentageDiff: 0,
    revenuePercentageDiff: 0,
    expensePercentageDiff: 0,
  });

  useEffect(() => {
    //loading
    setloading(true);

    // Fetch dashboard data from the server
    axios
      .get("https://food-yumdrop0.azurewebsites.net/orders/count")
      .then(response => {
        setDashboardData(response.data);
        setloading(false);
      })
      .catch(error => {
        console.error("Error fetching dashboard data:", error);
      });
    setloading(false);
  }, []);

  //loading
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center">
        <h1>loading...</h1>
      </div>
    )
    
  }

  // Destructure the data for easy access
  const {
    orderCount,
    CartCount,
    UserCount,
    CategoryCount,
    MenuCount,
    AdminCount,
    SalesCount,
    RevenueCount,
    ExpenseCount,

    cartPercentageDiff,
    categoryPercentageDiff,

    salesPercentageDiff,
    revenuePercentageDiff,
    expensePercentageDiff,
  } = dashboardData;

  // Create the chart options and series

  // Pie chart data
  const pieChartData = {
    series: [
      cartPercentageDiff,
      categoryPercentageDiff,
      salesPercentageDiff,
      revenuePercentageDiff,
      expensePercentageDiff,
    ],
    options: {
      chart: {
        type: "pie",
        height: 250,
        width: 450,
        foreColor: isDarkMode ? "#ffffff" : "#373d3f",
        background: isDarkMode ? "#1e1e1e" : "#f9f9f9",
      },
      labels: ["Cart", "Category", "Sales", "Revenue", "Expense"],
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300,
              width: 450,
            },
          },
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 350,
            },
            xaxis: {
              labels: {
                rotate: -45,
              },
            },
          },
        },
      ],
    },
  };

  // Pie chart data (remains unchanged from the previous example)
  // Area chart data
  // Area chart data
  const areaChartData = {
    series: [
      {
        name: "Counts",
        data: [
          orderCount,
          CartCount,
          UserCount,
          CategoryCount,
          MenuCount,
          AdminCount,
          SalesCount,
          RevenueCount,
          ExpenseCount,
        ],
      },
    ],
    options: {
      chart: {
        type: "area",
        height: 250,
        foreColor: isDarkMode ? "#ffffff" : "#373d3f",
        background: isDarkMode ? "#1e1e1e" : "#f9f9f9",
      },
      xaxis: {
        categories: [
          "Orders",
          "Cart",
          "Users",
          "Categories",
          "Menu",
          "Admin",
          "Sales",
          "Revenue",
          "Expense",
        ],
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300,
              width: 450,
            },
          },
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 350,
            },
            xaxis: {
              labels: {
                rotate: -45,
              },
            },
          },
        },
      ],
    },
  };

  return (
    <div className="max-w-6xl mx-auto mt-16">
      <div className=" mx-auto grid max-w-6xl md:grid-cols-1 grid-cols-1 gap-y-4 px-4 py-1 sm:my-10 sm:rounded-md sm:border border-green-500 shadow  shadow-green-300">
        <div className="grid -mx-4 bg-gradient-to-t md:grid-cols-5 grid-cols-3 from-green-500 to-green-500 px-4 py-8  sm:mx-0 sm:rounded-xl sm:py-4">
          <div className="mb-6 flex max-w-xs">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl  t sm:mr-3 sm:mb-0 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100"
              }
          `}
            >
              <AiOutlineUsergroupDelete size={30} />
            </div>
            <div className="px-4">
              <p className="mb-1 text-2xl font-black text-white">{UserCount}</p>
              <p className="font-medium text-indigo-100">Users</p>
            </div>
          </div>
          <div className="mb-6 flex max-w-xs">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl  t sm:mr-3 sm:mb-0 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }
          `}
            >
              <BiBarcodeReader size={30} />
            </div>
            <div className="px-4">
              <p className="mb-1 text-2xl font-black text-white">
                {orderCount}
              </p>
              <p className="font-medium text-indigo-100">orderCount</p>
            </div>
          </div>
          <div className="mb-6 flex max-w-xs">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl  t sm:mr-3 sm:mb-0 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }
          `}
            >
              <BiCategoryAlt size={30} />
            </div>
            <div className="px-4">
              <p className="mb-1 text-2xl font-black text-white">
                {CategoryCount}
              </p>
              <p className="font-medium text-indigo-100">Categories</p>
            </div>
          </div>
          <div className="mb-6 flex max-w-xs">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl t sm:mr-3 sm:mb-0 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100"
              }
          `}
            >
              <MdOutlineAdminPanelSettings size={30} />
            </div>
            <div className="px-4">
              <p className="mb-1 text-2xl font-black text-white">
                {AdminCount}
              </p>
              <p className="font-medium text-indigo-100">Admins</p>
            </div>
          </div>
          <div className="mb-6 flex max-w-xs">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl  t sm:mr-3 sm:mb-0 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }
          `}
            >
              <IoFastFoodOutline size={30} />
            </div>
            <div className="px-4">
              <p className="mb-1 text-2xl font-black text-white">{MenuCount}</p>
              <p className="font-medium text-indigo-100">Menus</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 col-start-1 grid grid-cols-2 gap-6 border-t py-4 sm:grid-cols-4 sm:px-4 sm:py-8">
          <div className="">
            <p className=" text-sm">Revenue</p>
            <p className="text-xl font-medium">${RevenueCount}</p>
          </div>
          <div className="">
            <p className=" text-sm">Expenses</p>
            <p className="text-xl font-medium">${ExpenseCount}</p>
          </div>
          <div className="">
            <p className=" text-sm">Profit</p>
            <p className="text-xl font-medium">
              ${RevenueCount - ExpenseCount}
            </p>
          </div>
          <div className="">
            <p className=" text-sm">Target</p>
            <p className="text-xl font-medium">
              ${RevenueCount + ExpenseCount}
            </p>
          </div>

          <div>
            <p className=" text-sm">Revenue Change</p>
            <p className="text-xl font-medium">
              {revenuePercentageDiff > 0 ? (
                <span className="text-green-500">{revenuePercentageDiff}%</span>
              ) : (
                <span className="text-red-500">{revenuePercentageDiff}%</span>
              )}
            </p>
          </div>
          <div>
            <p className=" text-sm">Expense Change</p>
            <p className="text-xl font-medium">
              {expensePercentageDiff > 0 ? (
                <span className="text-green-500">{expensePercentageDiff}%</span>
              ) : (
                <span className="text-red-500">{expensePercentageDiff}%</span>
              )}
            </p>
          </div>
          <div>
            <p className=" text-sm">Profit Change</p>
            <p className="text-xl font-medium">
              {revenuePercentageDiff - expensePercentageDiff > 0 ? (
                <span className="text-green-500">
                  {revenuePercentageDiff - expensePercentageDiff}%
                </span>
              ) : (
                <span className="text-red-500">
                  {revenuePercentageDiff - expensePercentageDiff}%
                </span>
              )}
            </p>
          </div>
          <div>
            <p className=" text-sm">Target Change</p>
            <p className="text-xl font-medium">
              {revenuePercentageDiff + expensePercentageDiff > 0 ? (
                <span className="text-green-500">
                  {revenuePercentageDiff + expensePercentageDiff}%
                </span>
              ) : (
                <span className="text-red-500">
                  {revenuePercentageDiff + expensePercentageDiff}%
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 py-4 sm:gap-8 sm:px-4">
          <div className="bg-gradient-to-t from-green-500 to-green-500 rounded-lg p-4 text-center shadow-md">
            <p className="text-lg font-bold text-white">{CartCount}</p>
            <p className="text-white mb-2 font-medium">
              {cartPercentageDiff > 0 ? (
                <span className="text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {cartPercentageDiff}%
                </span>
              ) : (
                <span className="text-red-500 bg-white px-2 py-0.5 rounded-full">
                  {cartPercentageDiff}%
                </span>
              )}
            </p>
            <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-600">
              Carts
            </span>
          </div>
          <div className="bg-gradient-to-t from-green-500 to-green-500 rounded-lg p-4 text-center shadow-md">
            <p className="text-lg font-bold text-white">{CategoryCount}</p>
            <p className="text-white mb-2 font-medium">
              {categoryPercentageDiff > 0 ? (
                <span className="text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {categoryPercentageDiff}%
                </span>
              ) : (
                <span className="text-red-500 bg-white px-2 py-0.5 rounded-full">
                  {categoryPercentageDiff}%
                </span>
              )}
            </p>
            <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-700">
              Categories
            </span>
          </div>
          <div className="bg-gradient-to-t from-green-500 to-green-500 rounded-lg p-4 text-center shadow-md">
            <p className="text-lg font-bold text-white">{SalesCount}</p>
            <p className="text-white mb-2 font-medium">
              {salesPercentageDiff > 0 ? (
                <span className="text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {salesPercentageDiff}%
                </span>
              ) : (
                <span className="text-red-500 bg-white px-2 py-0.5 rounded-full">
                  {salesPercentageDiff}%
                </span>
              )}
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-green-600">
              Sales
            </span>
          </div>
        </div>
      </div>
      <div className={`grid md:grid-cols-2 grid-cols-1 gap-6 px-8`}>
        {/* Area Chart */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Order Counts</h2>
          <ReactApexChart
            //@ts-ignore
            options={areaChartData.options}
            series={areaChartData.series}
            type="area"
            height={350}
          />
        </div>

        {/* Pie Chart */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Percentage Differences</h2>
          <ReactApexChart
            //@ts-ignore
            options={pieChartData.options}
            series={pieChartData.series}
            type="pie"
            height={350}
          />
        </div>
      </div>
      <RecentOrders/>
    </div>
  );
};

export default Home;
