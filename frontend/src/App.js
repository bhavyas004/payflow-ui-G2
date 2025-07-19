import './App.css';
import AdminLogin from './AdminLogin';

function App() {
  return (
    <div className="login-container">
      <div className="login-header">
        <h1>Payflow AI</h1>
      </div>
      <AdminLogin onLoginSuccess={() => alert("Logged in (for demo)")}/>
    </div>
  );
}

export default App;



