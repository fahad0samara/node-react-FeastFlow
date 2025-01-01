import SVGComponent3 from "../SVg/SVGComponent3";
import SVGComponent4 from "../SVg/SVGComponent4";
import SVGComponent5 from "../SVg/SVGComponent5";


const Contact = () => {
  return (
    <section
      className={` relative z-10 overflow-hidden  py-20 lg:py-[120px] mx-4`}
    >
      <div className="container mx-auto">
        <div className="-mx-4 flex flex-wrap lg:justify-between">
          <div className="w-full px-4 lg:w-1/2 xl:w-6/12">
            <div className="mb-12 max-w-[570px] lg:mb-0">
              <h2 className="text-green-500 italic  mb-6 text-[32px] font-bold uppercase sm:text-[40px] lg:text-[36px] xl:text-[40px]">
                GET IN TOUCH WITH US
              </h2>
              <p className=" mb-9 text-base leading-relaxed italic">
                Craving something delicious? Reach out to us to learn more about
                our menu offerings, book a table, or ask us any questions you
                may have!
              </p>
              <div className="mb-8 flex w-full max-w-[370px]">
                <div className="bg-primary text-primary mr-6 flex h-[60px] w-full max-w-[60px] items-center justify-center overflow-hidden rounded bg-opacity-5 sm:h-[70px] sm:max-w-[70px]"></div>
                <div className="w-full">
                  <h4 className="text-dark mb-1 text-xl font-bold">
                    Our Location
                  </h4>
                  <p className=" text-base">
                    99 Cypress Street, Cypress City 28292. Cyprus
                  </p>
                </div>
              </div>
              <div className="mb-8 flex w-full max-w-[370px]">
                <div className="bg-primary text-primary mr-6 flex h-[60px] w-full max-w-[60px] items-center justify-center overflow-hidden rounded bg-opacity-5 sm:h-[70px] sm:max-w-[70px]"></div>
                <div className="w-full">
                  <h4 className="text-dark mb-1 text-xl font-bold">
                    Phone Number
                  </h4>
                  <p className=" text-base">(+357) 99 123 4567</p>
                </div>
              </div>
              <div className="mb-8 flex w-full max-w-[370px]">
                <div className="bg-primary text-primary mr-6 flex h-[60px] w-full max-w-[60px] items-center justify-center overflow-hidden rounded bg-opacity-5 sm:h-[70px] sm:max-w-[70px]"></div>
                <div className="w-full">
                  <h4 className="text-dark mb-1 text-xl font-bold">
                    Email Address
                  </h4>
                  <p className=" text-base">info@yourdomain.com</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full px-4 lg:w-1/2 xl:w-5/12 ">
            <div className="relative rounded-lg bg-gradient-to-b from-green-50 to-green-100 p-8 shadow-lg sm:p-12 ">
              <form>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className=" border-[f0f0f0] focus:border-primary w-full rounded border py-3 px-[14px] text-base outline-none focus-visible:shadow-none"
                  />
                </div>
                <div className="mb-6">
                  <input
                    type="email"
                    placeholder="Your Email"
                    className=" border-[f0f0f0] focus:border-primary w-full rounded border py-3 px-[14px] text-base outline-none focus-visible:shadow-none"
                  />
                </div>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Your Phone"
                    className=" border-[f0f0f0] focus:border-primary w-full rounded border py-3 px-[14px] text-base outline-none focus-visible:shadow-none"
                  />
                </div>
                <div className="mb-6">
                  <textarea
                    placeholder="Your Message"
                    className=" border-[f0f0f0] focus:border-primary w-full resize-none rounded border py-3 px-[14px] text-base outline-none focus-visible:shadow-none"
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="  bg-green-500 w-full rounded border p-3 text-white transition hover:bg-opacity-90"
                  >
                    Send Message
                  </button>
                </div>
              </form>
              <div>
                <span className="absolute -top-10 -right-9 z-[-1]">
                  <SVGComponent3 />
                </span>
                <span className="absolute -right-10 top-[90px] z-[-1]">
                  <SVGComponent4 />
                </span>
                <span className="absolute -left-7 -bottom-7 z-[-1]">
                  <SVGComponent5 />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
