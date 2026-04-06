"use client";

import { useEffect } from "react";

export default function EconomicCalendarWidget() {
  useEffect(() => {
    // Remove any existing script/containers to avoid duplicates
    const existingScript = document.querySelector('script[data-type="calendar-widget"]');
    if (existingScript) {
      existingScript.remove();
    }
    const existingContainer = document.getElementById("economicCalendarWidget");
    if (existingContainer) {
      existingContainer.innerHTML = "";
    }

    // Create script element
    const script = document.createElement("script");
    script.async = true;
    script.type = "text/javascript";
    script.setAttribute("data-type", "calendar-widget");
    script.src = "https://www.tradays.com/c/js/widgets/calendar/widget.js?v=15";
    script.textContent = JSON.stringify({
      width: "100%",
      height: "100%",
      mode: "1",
      fw: "html"
    });

    // Append to container
    const container = document.getElementById("economicCalendarWidget");
    if (container) {
      container.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div id="economicCalendarWidget" className="w-full h-[700px]" />
      </div>
      <div className="ecw-copyright text-xs text-gray-500 text-center py-2">
        <a
          href="https://www.mql5.com/?utm_source=calendar.widget&utm_medium=link&utm_term=economic.calendar&utm_content=visit.mql5.calendar&utm_campaign=202.calendar.widget"
          rel="noopener nofollow"
          target="_blank"
        >
          MQL5 Algo Trading Community
        </a>
      </div>
    </div>
  );
}
