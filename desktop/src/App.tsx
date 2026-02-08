import { BrowserRouter } from 'react-router-dom';
import App from 'pyyomi-ui/App';

function DesktopApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default DesktopApp;