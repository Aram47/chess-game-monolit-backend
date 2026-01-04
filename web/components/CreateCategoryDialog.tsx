/**
 * CreateCategoryDialog - Dialog component for creating new problem categories
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreateProblemCategory } from '../features/problems/hooks';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCategoryDialogProps) {
  const createCategoryMutation = useCreateProblemCategory();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
      createCategoryMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle success
  useEffect(() => {
    if (createCategoryMutation.isSuccess && open) {
      const timer = setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [createCategoryMutation.isSuccess, open, onSuccess, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      return;
    }

    createCategoryMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const isFormValid = formData.name.trim() && formData.description.trim();
  const isSubmitting = createCategoryMutation.isPending;
  const error = createCategoryMutation.isError
    ? createCategoryMutation.error instanceof Error
      ? createCategoryMutation.error.message
      : 'Failed to create category'
    : null;
  const isSuccess = createCategoryMutation.isSuccess && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Problem Category</DialogTitle>
          <DialogDescription>
            Add a new category for chess problems. Categories help organize
            problems by theme or difficulty type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Category created successfully!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="category-name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                name="name"
                type="text"
                placeholder="e.g., Tactics, Endgames, Openings"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="category-description"
                name="description"
                placeholder="e.g., Problems focusing on tactical motifs like forks, pins, and skewers"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                rows={4}
                aria-required="true"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-isActive"
                checked={formData.isActive}
                onCheckedChange={handleCheckboxChange}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="category-isActive"
                className="text-sm font-normal cursor-pointer"
              >
                Category is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Category'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

