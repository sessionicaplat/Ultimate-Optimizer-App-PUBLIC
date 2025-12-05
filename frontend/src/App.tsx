import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import Layout from './components/Layout.tsx';
import ProductOptimizer from './pages/ProductOptimizer.tsx';
import ImageOptimization from './pages/ImageOptimization.tsx';
import OngoingImageOptimization from './pages/OngoingImageOptimization.tsx';
import CompletedImageOptimization from './pages/CompletedImageOptimization.tsx';
import ImageOptimizationJobDetails from './pages/ImageOptimizationJobDetails.tsx';
import OngoingQueue from './pages/OngoingQueue.tsx';
import JobDetails from './pages/JobDetails.tsx';
import CompletedJobs from './pages/CompletedJobs.tsx';
import BillingCredits from './pages/BillingCredits.tsx';
import TestCancellation from './pages/TestCancellation.tsx';
import BlogGenerator from './pages/BlogGenerator.tsx';
import OngoingBlogGeneration from './pages/OngoingBlogGeneration.tsx';
import ManageBlogs from './pages/ManageBlogs.tsx';
import BlogScheduler from './pages/BlogScheduler.tsx';
import Campaigns from './pages/Campaigns.tsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/optimizer" replace />} />
            <Route path="optimizer" element={<ProductOptimizer />} />
            <Route path="image-optimization" element={<ImageOptimization />} />
            <Route path="image-optimization/:jobId" element={<ImageOptimizationJobDetails />} />
            <Route path="ongoing-image-optimization" element={<OngoingImageOptimization />} />
            <Route path="completed-image-optimization" element={<CompletedImageOptimization />} />
            <Route path="queue" element={<OngoingQueue />} />
            <Route path="job/:jobId" element={<JobDetails />} />
            <Route path="completed" element={<CompletedJobs />} />
            <Route path="billing" element={<BillingCredits />} />
            <Route path="test-cancellation" element={<TestCancellation />} />
            <Route path="blog-generator" element={<BlogGenerator />} />
            <Route path="blog-generation/:id" element={<OngoingBlogGeneration />} />
            <Route path="blog-generations" element={<ManageBlogs />} />
            <Route path="blog-scheduler" element={<BlogScheduler />} />
            <Route path="campaigns" element={<Campaigns />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
