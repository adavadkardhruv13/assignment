import React from "react";
import "./MessageBox.css";
import Avatar from "../Avatar/Avatar";
import chatLoader from "../assets/chat_loader.gif";
import PropTypes from "prop-types";

function MessageBox(props) {
  return (
    <div className="message-box">
      {props.isDisplay ? (
        <Avatar image={props.image} />
      ) : (
        <img
          src={chatLoader}
          style={{ height: "50px", width: "50px" }}
          alt="Loading animation"
        />
      )}
      <span className="text-cont">{props.text}</span>
    </div>
  );
}

// Prop validation
MessageBox.propTypes = {
  isDisplay: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
  image: PropTypes.string,
};

MessageBox.defaultProps = {
  image: null,
};

export default MessageBox;
