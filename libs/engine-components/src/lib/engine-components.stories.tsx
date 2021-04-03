import { text } from "@storybook/addon-knobs";
import React from "react";
import { EngineComponents, EngineComponentsProps } from "./engine-components";

export default {
  component: EngineComponents,
  title: "EngineComponents",
};

export const primary = () => {
  const props: EngineComponentsProps = {
    resources: text("resources", "engine-components"),
  };

  return <EngineComponents resources={props.resources} />;
};
