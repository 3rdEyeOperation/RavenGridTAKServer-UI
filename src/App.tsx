import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Route, Routes } from 'react-router';
import React from 'react';
import { theme } from './theme';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '@mantine/dates/styles.css';
import './tactical-animations.css';
import './i18n';
import {I18nextProvider, useTranslation} from "react-i18next";

const Login = React.lazy(() => import('./pages/Login/Login'));
const Error404 = React.lazy(() => import('./pages/Errors/Error404'));
const DefaultLayout = React.lazy(() => import('./DefaultLayout'));
const PasswordReset = React.lazy(() => import('./pages/PasswordReset'));

export default function App() {
    const { t, i18n } = useTranslation();

  return (
    <I18nextProvider i18n={i18n}>
        <MantineProvider theme={theme}>
          <Notifications 
            position="top-right"
            styles={{
              notification: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(100, 255, 218, 0.4)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(100, 255, 218, 0.3)',
              },
            }}
          />
          <BrowserRouter>
              <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/404" element={<Error404 />} />
                  <Route path="/reset" element={<PasswordReset />} />
                  {/*<Route path="/register" name="Register Page" element={<Register />} />
                  <Route path="/500" name="Page 500" element={<Page500 />} />*/}
                  <Route path="*" element={<DefaultLayout />} />
              </Routes>
          </BrowserRouter>
        </MantineProvider>
    </I18nextProvider>
  );
}
