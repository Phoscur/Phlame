import React from "react";

import styles from "./engine-components.module.scss";

export interface EngineComponentsProps {
  resources: string;
}

export function EngineComponents(props: EngineComponentsProps) {
  return (
    <div className={styles.overview}>
      <h1>here be {props.resources}!</h1>
    </div>
  );
}

export default EngineComponents;
