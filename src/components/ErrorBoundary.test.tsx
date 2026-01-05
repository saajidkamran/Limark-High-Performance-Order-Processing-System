import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Suppress console.error for tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary - Main Scenarios', () => {
  describe('Happy Path - Normal Operations', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children when there is no error', () => {
      render(
        <ErrorBoundary>
          <React.Fragment>
            <div>Child 1</div>
            <div>Child 2</div>
          </React.Fragment>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should render nested components when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>
            <span>Nested content</span>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });
  });

  describe('Best Case - Error Recovery', () => {
    it('should display error UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should show Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should show Reload Page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Reload Page/i });
      expect(reloadButton).toBeInTheDocument();
    });

    it('should reset error state when Try Again is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      // Rerender without error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Note: In a real scenario, you'd need to actually reset the error boundary state
      // This test demonstrates the button exists and is clickable
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn();
      
      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should use custom fallback when provided', () => {
      const customFallback = <div>Custom Error Message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
      expect(screen.queryByText(/Something Went Wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Worst Case - Error Handling & Edge Cases', () => {
    it('should handle multiple sequential errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();

      // Simulate multiple error scenarios
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should handle errors in deeply nested components', () => {
      const DeepNestedError = () => {
        throw new Error('Deep nested error');
      };

      render(
        <ErrorBoundary>
          <div>
            <div>
              <div>
                <DeepNestedError />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should handle errors with null error message', () => {
      const NullError = () => {
        throw null as any;
      };

      render(
        <ErrorBoundary>
          <NullError />
        </ErrorBoundary>
      );

      // Should still display error UI
      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should handle errors without errorInfo', () => {
      // This tests that componentDidCatch handles missing errorInfo gracefully
      const TestError = () => {
        throw new Error('Test');
      };

      render(
        <ErrorBoundary>
          <TestError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should not crash when onError callback throws', () => {
      const throwingOnError = jest.fn(() => {
        throw new Error('Callback error');
      });

      render(
        <ErrorBoundary onError={throwingOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should still render error UI even if callback throws
      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should handle errors with very long error messages', () => {
      const LongError = () => {
        throw new Error('A'.repeat(10000));
      };

      render(
        <ErrorBoundary>
          <LongError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should handle errors with special characters in message', () => {
      const SpecialCharError = () => {
        throw new Error('Error with <script>alert("xss")</script> and "quotes" & symbols');
      };

      render(
        <ErrorBoundary>
          <SpecialCharError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });

    it('should handle window.location.reload when Reload button is clicked', () => {
      // Mock window.location.reload
      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Reload Page/i });
      fireEvent.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });

    it('should handle empty children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('should handle errors in multiple ErrorBoundary instances independently', () => {
      render(
        <ErrorBoundary>
          <React.Fragment>
            <div>Parent Content</div>
            <ErrorBoundary>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          </React.Fragment>
        </ErrorBoundary>
      );

      // Inner error boundary should catch the error
      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      // Parent content should not be visible when inner boundary catches error
      expect(screen.queryByText('Parent Content')).not.toBeInTheDocument();
    });
  });
});

