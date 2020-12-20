import React from "react";
import { ThemeProvider } from "@material-ui/core";
import { createMuiTheme } from "@material-ui/core/styles";
import { addDecorator } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { withThemes } from "@react-theming/storybook-addon";

import theme from "./theme";

const providerFn = ({ theme, children }) => {
  const muTheme = createMuiTheme(theme);
  return <ThemeProvider theme={muTheme}>{children}</ThemeProvider>;
};

// pass ThemeProvider and array of your themes to decorator
addDecorator(withThemes(null, [theme], { providerFn }));
addDecorator(withKnobs);
