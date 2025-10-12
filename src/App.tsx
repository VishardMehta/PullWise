import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PullRequestDetail from './pages/PullRequestDetail';
import './styles/global.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pr/:id" element={<PullRequestDetail />} />
      </Routes>
    </Router>
  );
}
