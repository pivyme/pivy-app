import { useState } from "react";

export const useFirstMount = () => {
  const [first, setFirst] = useState(true);

  function disableMount() {
    setFirst(false);
  }
  return {
    isFirstMount: first,
    disableMount,
  };
};
