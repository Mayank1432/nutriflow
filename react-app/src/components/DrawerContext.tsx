import { createContext, useContext } from 'react'

const DrawerContext = createContext<() => void>(() => undefined)

export const DrawerProvider = DrawerContext.Provider
export const useOpenDrawer = () => useContext(DrawerContext)
