/**
 * ProblemsCreatePage - page for creating new chess problems
 */

import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ProblemBuilder } from '../features/problems/ProblemBuilder';
import { useCreateProblem } from '../features/problems/hooks';
import { CreateCategoryDialog } from '../components/CreateCategoryDialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function ProblemsCreatePage() {
  const createProblemMutation = useCreateProblem();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const handleSubmit = async (data: Parameters<typeof createProblemMutation.mutate>[0]) => {
    createProblemMutation.mutate(data);
  };

  const handleCategoryCreated = () => {
    // Category created successfully, dialog will close automatically
    // You could add a toast notification here if needed
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ProblemBuilder
        onSubmit={handleSubmit}
        isSubmitting={createProblemMutation.isPending}
        error={
          createProblemMutation.isError
            ? createProblemMutation.error instanceof Error
              ? createProblemMutation.error.message
              : 'Failed to create problem'
            : null
        }
        onOpenCategoryDialog={() => setIsCategoryDialogOpen(true)}
      />
      <CreateCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
}

