import React, { useState } from "react";
import "./Tooltip.css";

const Tooltip = ({ text, children, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <div
      className="tooltip-container"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      tabIndex="0" // Makes the tooltip focusable
      aria-describedby="tooltip-text"
    >
      {children}
      {isVisible && (
        <div id="tooltip-text" className={`tooltip tooltip-${position}`} role="tooltip">
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
