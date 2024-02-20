import { useReducer, useRef } from "react";
import SimpleReactValidator from "simple-react-validator";

const useValidator = (customMessage = {}, customValidator = {}) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const validator = useRef(
    new SimpleReactValidator({ autoForceUpdate: { forceUpdate: forceUpdate } })
  );
  return [validator];
};

export default useValidator;
