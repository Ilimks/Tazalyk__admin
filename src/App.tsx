import { AdminPanel } from './components/AdminPanel/AdminPanel';
import { NotificationContainer } from './components/common/Notification';
import './App.css';

function App() {
  return (
    <div className="app">
      <AdminPanel />
      <NotificationContainer />
    </div>
  );
}

export default App;