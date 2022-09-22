import { createContext, useContext } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  return (
    <AppContext.Provider
      value={{
        // Put functions/variables you want to bring out of context to App in here
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
