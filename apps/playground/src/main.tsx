import React from "react";
import ReactDOM from "react-dom";

import App from "./app/app";

if (
  process.env.NODE_ENV === "development" &&
  window.location.pathname === "/__dev__/graphiql"
) {
  import("./app/dev/GraphiQL").then(({ GraphiQL }) => {
    ReactDOM.render(
      <React.StrictMode>
        <GraphiQL />
      </React.StrictMode>,
      document.getElementById("root"),
    );
  });
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root"),
  );
}
