import { createContext, useContext, useEffect, useState } from 'react';

const CursorContext = createContext({
  active: false,
  label: '',
  setActive: () => {},
  setLabel: () => {},
});

export const CursorProvider = ({ children }) => {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState('');

  return (
    <CursorContext.Provider value={{ active, label, setActive, setLabel }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => useContext(CursorContext);
