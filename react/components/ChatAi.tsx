import React from "react";

const ChatAi = ({ titleContent }: any) => {
  return (
    <>
      {titleContent}
    </>
  )
};


ChatAi.defaultProps = {
  titleContent: "Mi Chat AI",
}

ChatAi.schema = {
  title: "Chat AI",
  type: "object",
  properties: {
    titleContent: {
      type: "string",
      title: "Título",
      default: "Mi Chat AI",
    }
  }
};

export default ChatAi;
