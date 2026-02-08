import React from 'react';
import { Providers } from "./providers";
import AppFrame from "../components/AppFrame";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppFrame>
        {children}
      </AppFrame>
    </Providers>
  );
}