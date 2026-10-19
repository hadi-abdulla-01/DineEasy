import svgPaths from "./svg-ln7mbtly2l";
import clsx from "clsx";
import imgScan11 from "figma:asset/daca942be80c946208617dc9f1a38f8d2626ebc9.png";

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        {children}
      </svg>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div style={{ "--transform-inner-width": "300", "--transform-inner-height": "150" } as React.CSSProperties} className={clsx("absolute flex items-center justify-center size-[52.514px]", additionalClassNames)}>
      <div className="flex-none rotate-[90.569deg]">{children}</div>
    </div>
  );
}

function Frame7({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative size-[52px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 52">
        <g id="Frame">{children}</g>
      </svg>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-0 relative shrink-0 w-[600px]">
      <div className="absolute inset-[-3px_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 600 3">
          {children}
        </svg>
      </div>
    </div>
  );
}
type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[20px] text-[rgba(46,2,73,0.3)] text-nowrap">{text}</p>
      <Wrapper>
        <line id="Line 2" stroke="var(--stroke-0, #9E090F)" strokeOpacity="0.3" strokeWidth="3" x2="600" y1="1.5" y2="1.5" />
      </Wrapper>
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <div className="flex-none rotate-[90.569deg]">
      <div className="flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[54px] justify-center leading-[0] relative text-[14px] text-[rgba(0,0,0,0.61)] text-center w-[188px]">
        <p className="leading-[normal]">{text}</p>
      </div>
    </div>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <div className="flex-none rotate-[90.569deg]">
      <div className="flex flex-col font-['Mulish:Bold',sans-serif] font-bold h-[39px] justify-center leading-[0] relative text-[26px] text-black text-center w-[158px]">
        <p className="leading-[normal]">{text}</p>
      </div>
    </div>
  );
}
type HelperProps = {
  additionalClassNames?: string;
};

function Helper({ additionalClassNames = "" }: HelperProps) {
  return (
    <div style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties} className={clsx("absolute flex h-[224.627px] items-center justify-center w-[267.722px]", additionalClassNames)}>
      <div className="flex-none rotate-[90.569deg]">
        <div className="bg-white h-[265.529px] rounded-[22.853px] shadow-[0px_4.353px_43.529px_0px_rgba(0,0,0,0.1)] w-[222px]" />
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute contents left-[105px] top-[27px]" data-name="logo">
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[105px] text-[#9e090f] text-[18px] text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">
          D<span className="text-black">ineEzee</span>
        </p>
      </div>
      <div className="absolute flex inset-[2.64%_89.53%_95.33%_9.03%] items-center justify-center">
        <div className="flex-none rotate-[344.98deg] size-[17px]">
          <div className="relative size-full" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
              <path d={svgPaths.p191d3c00} fill="var(--fill-0, #9E090F)" id="Vector" />
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
      <div className="flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[normal]">Sign In</p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="absolute contents left-[105px] top-[27px]" data-name="header">
      <Logo />
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(25%+54px)] text-[18px] text-black text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">Home</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(41.67%+56px)] text-[18px] text-black text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">About us</p>
      </div>
      <div className="absolute flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] left-[calc(58.33%+76px)] text-[#9e090f] text-[18px] text-nowrap top-[56.5px] translate-y-[-50%]">
        <p className="leading-[normal]">Contact</p>
      </div>
      <Frame1 />
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute contents leading-[0] left-[-688px] top-[286px]" data-name="heading">
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
      <div className="flex flex-col font-['Outfit:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[normal]">Kitchen Login</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute bg-[#f3f3f3] content-stretch flex items-center justify-center left-[-471px] pb-[14px] pt-[12px] px-[29px] rounded-[77px] top-[740px] w-[194px]">
      <div className="flex flex-col font-['Outfit:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#171717] text-[18px] text-nowrap">
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
    <Frame7>
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
    </Frame7>
  );
}

function Group() {
  return (
    <div className="absolute contents h-[224.627px] left-[calc(100%+14.34px)] top-[146.56px] w-[267.722px]">
      <Helper additionalClassNames="left-[calc(100%+14.34px)] top-[146.56px]" />
      <Wrapper1 additionalClassNames="left-[calc(100%+178.71px)] top-[233.18px]">
        <Frame />
      </Wrapper1>
      <div className="absolute flex h-[158.38px] items-center justify-center left-[calc(100%+158.46px)] top-[259.98px] translate-x-[-50%] translate-y-[-50%] w-[40.568px]" style={{ "--transform-inner-width": "62.140625", "--transform-inner-height": "29.59375" } as React.CSSProperties}>
        <Text text="Scan" />
      </div>
      <div className="absolute flex h-[188.527px] items-center justify-center left-[calc(100%+95.94px)] top-[262.02px] translate-x-[-50%] translate-y-[-50%] w-[55.865px]" style={{ "--transform-inner-width": "392.875", "--transform-inner-height": "16.796875" } as React.CSSProperties}>
        <Text1 text="Customers scan a QR code at their table for dine-in orders." />
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <Frame7>
      <path d={svgPaths.p231b1a00} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M26 39H26.0217" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
    </Frame7>
  );
}

function Group1() {
  return (
    <div className="absolute contents h-[224.627px] left-[calc(100%+12.01px)] top-[381.55px] w-[267.722px]">
      <Helper additionalClassNames="left-[calc(100%+12.01px)] top-[381.55px]" />
      <Wrapper1 additionalClassNames="left-[calc(100%+176.38px)] top-[468.17px]">
        <Frame4 />
      </Wrapper1>
      <div className="absolute flex h-[158.38px] items-center justify-center left-[calc(100%+156.12px)] top-[494.97px] translate-x-[-50%] translate-y-[-50%] w-[40.568px]" style={{ "--transform-inner-width": "70.8125", "--transform-inner-height": "29.59375" } as React.CSSProperties}>
        <Text text="Order" />
      </div>
      <div className="absolute flex h-[188.527px] items-center justify-center left-[calc(100%+93.6px)] top-[497.01px] translate-x-[-50%] translate-y-[-50%] w-[55.865px]" style={{ "--transform-inner-width": "466.75", "--transform-inner-height": "16.796875" } as React.CSSProperties}>
        <Text1 text="They browse the menu and place their order directly from their phone." />
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <Frame7>
      <path d={svgPaths.p3e6c0080} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d="M15.1667 4.33333V47.6667" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
      <path d={svgPaths.p2234e080} id="Vector_3" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.33333" />
    </Frame7>
  );
}

function Group2() {
  return (
    <div className="absolute contents h-[224.627px] left-[calc(100%+9.68px)] top-[616.54px] w-[267.722px]">
      <Helper additionalClassNames="left-[calc(100%+9.68px)] top-[616.54px]" />
      <Wrapper1 additionalClassNames="left-[calc(100%+174.04px)] top-[703.16px]">
        <Frame5 />
      </Wrapper1>
      <div className="absolute flex h-[158.38px] items-center justify-center left-[calc(100%+153.79px)] top-[729.96px] translate-x-[-50%] translate-y-[-50%] w-[40.568px]" style={{ "--transform-inner-width": "70.796875", "--transform-inner-height": "29.59375" } as React.CSSProperties}>
        <Text text="Enjoy" />
      </div>
      <div className="absolute flex h-[188.527px] items-center justify-center left-[calc(100%+91.27px)] top-[732px] translate-x-[-50%] translate-y-[-50%] w-[55.865px]" style={{ "--transform-inner-width": "468.875", "--transform-inner-height": "16.796875" } as React.CSSProperties}>
        <Text1 text="The kitchen receives the order instantly. Food is served fresh and fast." />
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents h-[777.397px] left-[calc(100%+9.41px)] top-[92.57px] w-[454.186px]">
      <Group />
      <Group1 />
      <Group2 />
      <div className="absolute flex h-[606.046px] items-center justify-center left-[calc(100%+343.13px)] top-[495.82px] translate-x-[-50%] translate-y-[-50%] w-[214.99px]" style={{ "--transform-inner-width": "913.609375", "--transform-inner-height": "20.796875" } as React.CSSProperties}>
        <div className="flex-none rotate-[90.569deg]">
          <div className="flex flex-col font-['Mulish:Medium',sans-serif] font-medium h-[209px] justify-center leading-[0] relative text-[18px] text-[rgba(0,0,0,0.75)] text-center w-[604px]">
            <p className="leading-[normal]">{`We've streamlined the dining experience to be as simple and intuitive as possible for both you and your customers.`}</p>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[773.866px] items-center justify-center left-[calc(100%+414.26px)] top-[483.03px] translate-x-[-50%] translate-y-[-50%] w-[98.674px]" style={{ "--transform-inner-width": "711.625", "--transform-inner-height": "91" } as React.CSSProperties}>
        <div className="flex-none rotate-[90.569deg]">
          <div className="capitalize flex flex-col font-['Mulish:Bold',sans-serif] font-bold justify-center leading-[0] relative text-[66px] text-black text-center w-[773px]">
            <p className="leading-[91px]">Simple 3-Step Process</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="h-[30px] relative shrink-0 w-[112px]">
      <p className="absolute font-['Poppins:Medium',sans-serif] leading-[normal] left-0 not-italic text-[#2e0249] text-[20px] text-nowrap top-0">Contact Us</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#9e090f] text-[20px] text-nowrap">
        <span className="text-[#2e0249]">Your name</span>|
      </p>
      <Wrapper>
        <line id="Line 1" stroke="var(--stroke-0, #9E090F)" strokeWidth="3" x2="600" y1="1.5" y2="1.5" />
      </Wrapper>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col gap-[64px] items-start relative shrink-0">
      <Frame8 />
      <Text2 text="Your email" />
      <Text2 text="Your message" />
    </div>
  );
}

function Frame16() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[64px] items-center left-[48px] top-[48px]">
      <Frame10 />
      <Frame9 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="absolute bg-[#9e090f] content-stretch flex gap-[16px] items-center left-[33px] px-[64px] py-[24px] rounded-[16px] top-[448px]">
      <div className="h-[24px] relative shrink-0 w-[24.001px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.0008 24.0003">
          <path d={svgPaths.pe092d00} fill="var(--fill-0, #EEEEEE)" id="Vector" />
        </svg>
      </div>
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#eee] text-[20px] text-center text-nowrap">Send Message</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute bg-[#eee] h-[896px] left-[calc(33.33%+120px)] overflow-clip rounded-[44px] top-[1030px] w-[722px]">
      <Frame16 />
      <Frame15 />
    </div>
  );
}

function EnvelopeFill() {
  return (
    <Wrapper2>
      <g id="EnvelopeFill">
        <path d={svgPaths.p14a6f100} fill="var(--fill-0, #9E090F)" id="Vector" />
      </g>
    </Wrapper2>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[16px] items-center pl-[24px] pr-[128px] py-[24px] relative rounded-[16px] shrink-0">
      <EnvelopeFill />
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[20px] text-nowrap text-white">SaulDesign@gmail.com</p>
    </div>
  );
}

function TelephoneFill() {
  return (
    <Wrapper2>
      <g clipPath="url(#clip0_1_433)" id="TelephoneFill">
        <path clipRule="evenodd" d={svgPaths.p2320c580} fill="var(--fill-0, #9E090F)" fillRule="evenodd" id="Vector" />
      </g>
      <defs>
        <clipPath id="clip0_1_433">
          <rect fill="white" height="24" width="24" />
        </clipPath>
      </defs>
    </Wrapper2>
  );
}

function Frame11() {
  return (
    <div className="bg-[rgba(158,9,15,0.5)] relative rounded-[16px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#9e090f] border-[3px] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center pl-[24px] pr-[256px] py-[24px] relative w-full">
          <TelephoneFill />
          <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[20px] text-nowrap text-white">+123 456 789</p>
        </div>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[16px] items-center pl-[24px] pr-[128px] py-[24px] relative rounded-[16px] shrink-0">
      <div className="h-[28px] relative shrink-0 w-[24px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 28">
          <path d={svgPaths.p28c35400} fill="var(--fill-0, #9E090F)" id="Vector" />
        </svg>
      </div>
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[20px] text-nowrap text-white">123 Street 456 House</p>
    </div>
  );
}

function Frame14() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-[140px] top-[1302px] w-[399px]">
      <Frame12 />
      <Frame11 />
      <Frame13 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute h-[64px] left-[151px] top-[1739px] w-[228px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 228 64">
        <g id="Group 8">
          <g id="Frame 24">
            <path d={svgPaths.pdf989c0} fill="var(--fill-0, #EEEEEE)" id="Vector" />
          </g>
          <g id="Group 1">
            <circle cx="123" cy="32" fill="var(--fill-0, #9E090F)" id="Ellipse 1" r="32" />
            <g clipPath="url(#clip0_1_419)" id="Instagram">
              <path d={svgPaths.p2429a870} fill="var(--fill-0, #EEEEEE)" id="Vector_2" />
            </g>
          </g>
          <path d={svgPaths.p3cd7cf80} fill="var(--fill-0, #EEEEEE)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_1_419">
            <rect fill="white" height="24" transform="translate(111 20)" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function DineEzeeContact() {
  return (
    <div className="bg-white relative size-full" data-name="DineEzee - Contact">
      <div className="absolute flex h-[2384.933px] items-center justify-center left-[-465.18px] top-[-412.74px] w-[2384.951px]" style={{ "--transform-inner-width": "300", "--transform-inner-height": "150" } as React.CSSProperties}>
        <div className="flex-none rotate-[313.871deg]">
          <div className="h-[1687.057px] relative w-[1686.415px]" data-name="Union">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1686.42 1687.06">
              <path d={svgPaths.p1f53b700} fill="var(--fill-0, #FFCE46)" id="Union" />
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[719.39px] items-center justify-center left-[-620.62px] top-[127.3px] w-[736.245px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[318.301deg]">
          <div className="h-[412px] relative rounded-[125px] w-[619px]" data-name="scan (1) 1">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[125px] size-full" src={imgScan11} />
          </div>
        </div>
      </div>
      <Header />
      <Heading />
      <Button />
      <Group3 />
      <Frame6 />
      <p className="absolute font-['Poppins:Bold',sans-serif] h-[51px] leading-[normal] left-[180px] not-italic text-[#eee] text-[48px] top-[1043px] w-[646px]">Contact Us</p>
      <Frame14 />
      <Group4 />
    </div>
  );
}