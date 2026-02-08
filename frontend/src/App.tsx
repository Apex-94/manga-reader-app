import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './app/layout';
import BrowsePage from './app/browse/page';
import LibraryPage from './app/library/page';
import MangaPage from './app/manga/page';
import ReaderPage from './app/reader/page';
import SourcesPage from './app/sources/page';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/manga" element={<MangaPage />} />
          <Route path="/reader" element={<ReaderPage />} />
          <Route path="/sources" element={<SourcesPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}