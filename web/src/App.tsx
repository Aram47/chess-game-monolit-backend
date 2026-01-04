import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ProblemsListPage } from '../pages/ProblemsListPage';
import { ProblemsCreatePage } from '../pages/ProblemsCreatePage';
import { ProblemCategoryCreatePage } from '../pages/ProblemCategoryCreatePage';
import { ProblemPreviewPage } from '../pages/ProblemPreviewPage';
import { ROUTES } from '../lib/constants/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.PROBLEMS} element={<ProblemsListPage />} />
          <Route path={ROUTES.PROBLEMS_NEW} element={<ProblemsCreatePage />} />
          <Route path="/problems/:id" element={<ProblemPreviewPage />} />
          <Route path={ROUTES.PROBLEM_CATEGORY_NEW} element={<ProblemCategoryCreatePage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

