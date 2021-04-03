import React from "react";
import { render } from "@testing-library/react";

import EngineComponents from "./engine-components";

describe("EngineComponents", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<EngineComponents />);
    expect(baseElement).toBeTruthy();
  });
});
