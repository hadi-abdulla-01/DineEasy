import svgPaths from "./svg-ltqdfmwwoe";
import clsx from "clsx";
import imgScan11 from "figma:asset/daca942be80c946208617dc9f1a38f8d2626ebc9.png";
type Frame6Props = {
  additionalClassNames?: string;
};

function Frame6({ children, additionalClassNames = "" }: React.PropsWithChildren<Frame6Props>) {
  return (
    <div className={clsx("absolute size-[52px] top-[465px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 52">
        <g id="Frame">{children}</g>
      </svg>
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute contents left-[105px] top-[23.73px]" data-name="logo">
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[105px] text-[#9e090f] text-[18px] text-left text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">
          D<span className="text-black">ineEzee</span>
        </p>
      </div>
      <div className="absolute flex inset-[2.64%_89.53%_95.33%_9.03%] items-center justify-center">
        <div className="flex-none h-[15.088px] rotate-[346.73deg] skew-x-[3.7deg] w-[16.87px]">
          <div className="relative size-full" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.8696 15.0885">
              <path d={svgPaths.p3188aa80} fill="var(--fill-0, #9E090F)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute bg-[#9e090f] content-stretch flex items-center justify-center left-[calc(91.67%-85px)] px-[28px] py-[8px] rounded-[25px] top-[35px]">
      <div className="flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-left text-nowrap text-white">
        <p className="leading-[normal]">Sign In</p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="absolute contents left-[105px] top-[23.73px]" data-name="header">
      <Logo />
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(25%+54px)] text-[18px] text-black text-left text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">Home</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(41.67%+56px)] text-[#9e090f] text-[18px] text-left text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">About us</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(58.33%+76px)] text-[#171717] text-[18px] text-left text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">Contact</p>
      </div>
      <Frame1 />
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute contents leading-[0] left-[-688px] text-left top-[286px]" data-name="heading">
      <div className="absolute capitalize flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[269px] justify-center left-[-685px] text-[78px] text-black top-[420.5px] translate-y-[-50%] w-[674px]">
        <p className="leading-[91px]">Effortless Dining, Unforgettable Experience</p>
      </div>
      <div className="absolute flex flex-col font-['Outfit:Medium',sans-serif] font-medium h-[68px] justify-center left-[-688px] text-[#5a5a5a] text-[18px] top-[625px] translate-y-[-50%] w-[529px]">
        <p className="leading-[34px]">Revolutionize your restaurant with seamless QR code ordering. Increase efficiency, reduce wait times, and delight your customers.</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute bg-[#9e090f] content-stretch flex items-center justify-center left-[-680px] pb-[14px] pt-[12px] px-0 rounded-[77px] top-[740px] w-[196px]">
      <div className="flex flex-col font-['Outfit:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-left text-nowrap text-white">
        <p className="leading-[normal]">Kitchen Login</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute bg-[#f3f3f3] content-stretch flex items-center justify-center left-[-471px] pb-[14px] pt-[12px] px-[29px] rounded-[77px] top-[740px] w-[194px]">
      <div className="flex flex-col font-['Outfit:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#171717] text-[18px] text-left text-nowrap">
        <p className="leading-[normal]">Admin Login</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute contents left-[-680px] top-[740px]" data-name="button">
      <Frame2 />
      <Frame3 />
    </div>
  );
}

function Frame() {
  return (
    <Frame6 additionalClassNames="left-[calc(50%+44px)]">
      <path d={svgPaths.p3201aa00} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d={svgPaths.p79456e0} id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d={svgPaths.p359b5900} id="Vector_3" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d={svgPaths.p39e63e00} id="Vector_4" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M45.5 45.5V45.5217" id="Vector_5" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d={svgPaths.pba90180} id="Vector_6" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M6.5 26H6.52167" id="Vector_7" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M26 6.5H26.0217" id="Vector_8" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M26 34.6667V34.6883" id="Vector_9" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M34.6667 26H36.8333" id="Vector_10" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M45.5 26V26.0217" id="Vector_11" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M26 45.5V43.3333" id="Vector_12" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
    </Frame6>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[calc(41.67%+79px)] top-[415px]">
      <div className="absolute bg-white h-[265.529px] left-[calc(41.67%+79px)] rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] top-[415px] w-[222px]" />
      <Frame />
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[39px] justify-center leading-[0] left-[calc(50%+71px)] text-[26px] text-black text-center top-[537.5px] translate-x-[-50%] translate-y-[-50%] w-[158px]">
        <p className="leading-[normal]">Scan</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[54px] justify-center leading-[0] left-[calc(41.67%+193.67px)] text-[14px] text-[rgba(0,0,0,0.61)] text-center top-[600px] translate-x-[-50%] translate-y-[-50%] w-[188px]">
        <p className="leading-[normal]">Customers scan a QR code at their table for dine-in orders.</p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <Frame6 additionalClassNames="left-[calc(66.67%+42px)]">
      <path d={svgPaths.p231b1a00} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M26 39H26.0217" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
    </Frame6>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[calc(58.33%+77px)] top-[415px]">
      <div className="absolute bg-white h-[265.529px] left-[calc(58.33%+77px)] rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] top-[415px] w-[222px]" />
      <Frame4 />
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[39px] justify-center leading-[0] left-[calc(66.67%+69px)] text-[26px] text-black text-center top-[537.5px] translate-x-[-50%] translate-y-[-50%] w-[158px]">
        <p className="leading-[normal]">Order</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[54px] justify-center leading-[0] left-[calc(66.67%+71.67px)] text-[14px] text-[rgba(0,0,0,0.61)] text-center top-[600px] translate-x-[-50%] translate-y-[-50%] w-[188px]">
        <p className="leading-[normal]">They browse the menu and place their order directly from their phone.</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <Frame6 additionalClassNames="left-[calc(91.67%-83px)]">
      <path d={svgPaths.p3e6c0080} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M15.1667 4.33333V47.6667" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d={svgPaths.p2234e080} id="Vector_3" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
    </Frame6>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[calc(83.33%-48px)] top-[415px]">
      <div className="absolute bg-white h-[265.529px] left-[calc(83.33%-48px)] rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] top-[415px] w-[222px]" />
      <Frame5 />
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[39px] justify-center leading-[0] left-[calc(83.33%+64px)] text-[26px] text-black text-center top-[537.5px] translate-x-[-50%] translate-y-[-50%] w-[158px]">
        <p className="leading-[normal]">Enjoy</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[54px] justify-center leading-[0] left-[calc(83.33%+66.67px)] text-[14px] text-[rgba(0,0,0,0.61)] text-center top-[600px] translate-x-[-50%] translate-y-[-50%] w-[188px]">
        <p className="leading-[normal]">The kitchen receives the order instantly. Food is served fresh and fast.</p>
      </div>
    </div>
  );
}

export default function DineEzeeAbout() {
  return (
    <button className="bg-white block cursor-pointer relative size-full" data-name="DineEzee - About">
      <div className="absolute h-[1456.223px] left-[-807.81px] top-[-273.61px] w-[1454.62px]" data-name="Union">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1454.62 1456.22">
          <path d={svgPaths.p3894f280} fill="var(--fill-0, #FFCE46)" id="Union" />
        </svg>
      </div>
      <div className="absolute h-[412px] left-[-83px] rounded-[125px] top-[256px] w-[619px]" data-name="scan (1) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[125px] size-full" src={imgScan11} />
      </div>
      <Header />
      <Heading />
      <Button />
      <Group />
      <Group1 />
      <Group2 />
      <div className="absolute flex flex-col font-['Mulish:Medium',sans-serif] font-medium h-[209px] justify-center leading-[0] left-[calc(50%+308px)] text-[18px] text-[rgba(0,0,0,0.75)] text-center top-[350.5px] translate-x-[-50%] translate-y-[-50%] w-[604px]">
        <p className="leading-[normal]">{`We've streamlined the dining experience to be as simple and intuitive as possible for both you and your customers.`}</p>
      </div>
      <div className="absolute capitalize flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(41.67%+414.5px)] text-[66px] text-black text-center top-[279.5px] translate-x-[-50%] translate-y-[-50%] w-[773px]">
        <p className="leading-[91px]">Simple 3-Step Process</p>
      </div>
    </button>
  );
}