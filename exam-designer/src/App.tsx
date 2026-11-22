import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Editor from './pages/Editor';

function parseHash() {
  const m = location.hash.match(/^#\/exam\/([\w-]+)/);
  return m ? m[1] : null;
}

export function go(id: string | null) {
  location.hash = id ? `#/exam/${id}` : '#/';
}

export default function App() {
  const [examId, setExamId] = useState(parseHash());
  useEffect(() => {
    const on = () => {
      setExamId(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return examId ? <Editor key={examId} id={examId} /> : <Home />;
}
