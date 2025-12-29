import svgPaths from "./svg-ygbblntbv8";
import imgImage2 from "figma:asset/050610ad75ca5a5603ab5253bfba0ca6722c747a.png";

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e0e2e9] border-[1.604px] border-solid inset-[-0.802px] pointer-events-none rounded-[8.802px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center px-[20px] py-[12px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="absolute content-stretch flex flex-col inset-[21.33%_0_5.2%_-15.79%] items-end">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="h-[389px] relative w-[583px]" data-name="image 2">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Quote() {
  return (
    <div className="absolute inset-[18.13%_57.67%_25.05%_10.78%]" data-name="Quote">
      <Frame9 />
    </div>
  );
}

function Group() {
  return (
    <div className="[grid-area:1_/_1] h-[17.2px] ml-0 mt-0 relative w-[21.5px]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5001 17.2001">
        <g id="Group">
          <path d={svgPaths.p284e0100} fill="var(--fill-0, #ADB0CD)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Group">
      <Group />
    </div>
  );
}

function Frame1() {
  return (
    <Wrapper>
      <Group1 />
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#969ab8] text-[14px] text-nowrap tracking-[0.1px]">Kitchen User</p>
    </Wrapper>
  );
}

function Group2() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="Group">
      <div className="absolute inset-[-6.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.3028 21.303">
          <g id="Group">
            <path d={svgPaths.p17bde00} id="Vector" stroke="var(--stroke-0, #ADB0CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.30303" />
            <path d={svgPaths.p22eec3e0} id="Vector_2" stroke="var(--stroke-0, #ADB0CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.30303" />
            <path d={svgPaths.p655580} id="Vector_3" stroke="var(--stroke-0, #ADB0CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.30303" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <Wrapper>
      <Group2 />
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#969ab8] text-[14px] text-nowrap tracking-[0.1px]">Password</p>
    </Wrapper>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame1 />
      <Frame />
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[#cb1e1d] relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[64px] py-[12px] relative w-full">
          <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[15px] text-center text-nowrap text-white tracking-[0.1px]">Login</p>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame2 />
      <Frame3 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Frame4 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col items-end relative shrink-0">
      <Frame5 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[8px] items-start leading-[24px] not-italic relative shrink-0 text-[15px] text-center text-nowrap tracking-[0.1px]">
      <p className="font-['Poppins:Regular',sans-serif] relative shrink-0 text-[rgba(203,30,29,0.45)]">Not a kitchen user?</p>
      <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[#cb1e1d]">Admin Login</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start justify-center relative shrink-0">
      <Frame6 />
      <Frame8 />
    </div>
  );
}

function Form() {
  return (
    <div className="absolute bg-[#f1b715] content-stretch flex flex-col gap-[40px] h-[982px] items-start justify-center p-[128px] right-0 top-1/2 translate-y-[-50%]" data-name="Form">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#cb1e1d] text-[30px] text-center text-nowrap tracking-[0.1px]">Kitchen Login</p>
      <Frame7 />
    </div>
  );
}

export default function KItchenLogin() {
  return (
    <div className="bg-[#cb1e1d] relative size-full" data-name="KItchen login">
      <Quote />
      <Form />
    </div>
  );
}