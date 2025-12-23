import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AdapterDayjs }  from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { dayjs } from 'dayjs';

import './index.css'
import App from './App.jsx'
createRoot(document.getElementById('root')).render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <App />
    </LocalizationProvider>
)
