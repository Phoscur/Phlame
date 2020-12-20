import { text } from "@storybook/addon-knobs";
import React from "react";
import { EngineComponents, EngineComponentsProps } from "./engine-components";
import Button from "@material-ui/core/Button";

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

export const secondary = () => {
  const props = {
    text: text("text", "hello"),
  };
  return <Button variant="contained">{props.text}</Button>;
};
