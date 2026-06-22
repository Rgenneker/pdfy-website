import { useEffect } from "react";

export default function NativeBannerAd() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pl29741920.effectivecpmnetwork.com/f3cd17a6141bd5a667e4309a986aafc3/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="relative z-0 my-8 flex justify-center">
      <div id="container-f3cd17a6141bd5a667e4309a986aafc3"></div>
    </div>
  );
}