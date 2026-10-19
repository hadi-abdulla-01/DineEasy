import svgPaths from "./svg-xk929g7nkl";
import imgFlatChineseNewYearReunionDinnerIllustration1 from "figma:asset/e469a5ef4a653f0f58194891b580d935bd7fc2ba.png";

function Logo() {
  return (
    <div className="absolute contents left-[38px] top-[25px]" data-name="logo">
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[38.37px] text-[#9e090f] text-[18px] top-[54.77px] translate-y-[-50%] w-[88.751px]">
        <p className="leading-[normal]">
          D<span className="text-black">ineEzee</span>
        </p>
      </div>
      <div className="absolute flex inset-[2.78%_95.74%_95.19%_2.64%] items-center justify-center">
        <div className="flex-none h-[15.256px] rotate-[348.136deg] skew-x-[7.001deg] w-[18.848px]">
          <div className="relative size-full" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.8479 15.2561">
              <path d={svgPaths.p372f1e00} fill="var(--fill-0, #9E090F)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-[#9e090f] content-stretch flex h-[39px] items-center justify-center left-[calc(83.33%+13.5px)] px-[28px] py-[8px] rounded-[25px] top-[35px] w-[120.209px]">
      <div className="flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[normal]">Sign In</p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="absolute contents left-[38px] top-[25px]" data-name="header">
      <Logo />
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(8.33%+151.71px)] text-[#9e090f] text-[18px] top-[54.5px] translate-y-[-50%] w-[53.887px]">
        <p className="leading-[normal]">Home</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(33.33%+126.74px)] text-[#171717] text-[18px] top-[54.5px] translate-y-[-50%] w-[80.83px]">
        <p className="leading-[normal]">About us</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(66.67%-18.54px)] text-[#171717] text-[18px] top-[54.5px] translate-y-[-50%] w-[72.54px]">
        <p className="leading-[normal]">Contact</p>
      </div>
      <Frame />
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute contents leading-[0] left-[75px] top-[201px]" data-name="heading">
      <div className="absolute capitalize flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[269px] justify-center left-[78px] opacity-20 text-[78px] text-black top-[335.5px] translate-y-[-50%] w-[674px]">
        <p className="leading-[91px]">Effortless Dining, Unforgettable Experience</p>
      </div>
      <div className="absolute flex flex-col font-['Outfit:Medium',sans-serif] font-medium h-[68px] justify-center left-[75px] opacity-20 text-[#5a5a5a] text-[18px] top-[540px] translate-y-[-50%] w-[529px]">
        <p className="leading-[34px]">Revolutionize your restaurant with seamless QR code ordering. Increase efficiency, reduce wait times, and delight your customers.</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute bg-[#9e090f] content-stretch flex items-center justify-center left-[78px] pb-[14px] pt-[12px] px-0 rounded-[77px] top-[657px] w-[196px]">
      <div className="flex flex-col font-['Outfit:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[normal]">Kitchen Login</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute bg-[#f3f3f3] content-stretch flex items-center justify-center left-[calc(8.33%+167px)] pb-[14px] pt-[12px] px-[29px] rounded-[77px] top-[657px] w-[194px]">
      <div className="flex flex-col font-['Outfit:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#171717] text-[18px] text-nowrap">
        <p className="leading-[normal]">Admin Login</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute contents left-[78px] top-[657px]" data-name="button">
      <Frame1 />
      <Frame2 />
    </div>
  );
}

export default function DineEzee() {
  return (
    <div className="bg-white relative size-full" data-name="DineEzee">
      <div className="absolute h-[1478.766px] left-[calc(41.67%+82px)] top-[-249px] w-[1464.159px]" data-name="Union">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1464.16 1478.77">
          <path d={svgPaths.p2030ea00} fill="var(--fill-0, #FFCE46)" id="Union" />
        </svg>
      </div>
      <div className="absolute h-[388px] left-[calc(58.33%+27px)] rounded-[99px] top-[281px] w-[582px]" data-name="flat-chinese-new-year-reunion-dinner-illustration 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[99px] size-full" src={imgFlatChineseNewYearReunionDinnerIllustration1} />
      </div>
      <Header />
      <Heading />
      <Button />
    </div>
  );
}