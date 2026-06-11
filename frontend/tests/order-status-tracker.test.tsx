import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

import OrderStatusTracker from "@/components/features/projects/order-status-tracker";

const mockTransitionProject = vi.fn();
const mockPush = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/api/endpoints", () => ({
  adminApi: {
    transitionProject: (...args: unknown[]) => mockTransitionProject(...args),
  },
}));

vi.mock("@/lib/stores/toast-store", () => ({
  useToastStore: () => mockPush,
}));

describe("OrderStatusTracker", () => {
  beforeEach(() => {
    mockTransitionProject.mockReset();
    mockPush.mockReset();
  });

  it("renders all 7 steps", () => {
    render(
      <OrderStatusTracker status="open" userRole="client" projectId={1} />,
    );
    expect(screen.getByText("statusOpen")).toBeInTheDocument();
    expect(screen.getByText("statusReviewing")).toBeInTheDocument();
    expect(screen.getByText("statusAgreed")).toBeInTheDocument();
    expect(screen.getByText("statusPaid")).toBeInTheDocument();
    expect(screen.getByText("statusInProgress")).toBeInTheDocument();
    expect(screen.getByText("statusDelivered")).toBeInTheDocument();
    expect(screen.getByText("statusCompleted")).toBeInTheDocument();
  });

  it("does not show action button for non-admin", () => {
    render(
      <OrderStatusTracker status="reviewing" userRole="client" projectId={1} />,
    );
    expect(screen.queryByText("actionMarkAgreed")).not.toBeInTheDocument();
  });

  it("shows action button for admin on current step", () => {
    render(
      <OrderStatusTracker status="reviewing" userRole="admin" projectId={1} />,
    );
    expect(screen.getByText("actionMarkAgreed")).toBeInTheDocument();
  });

  it("calls transitionProject on admin action click", async () => {
    mockTransitionProject.mockResolvedValue({});
    const onSuccess = vi.fn();
    render(
      <OrderStatusTracker
        status="open"
        userRole="admin"
        projectId={42}
        onTransitionSuccess={onSuccess}
      />,
    );
    fireEvent.click(screen.getByText("actionMarkReviewing"));
    await waitFor(() => {
      expect(mockTransitionProject).toHaveBeenCalledWith(42, "reviewing");
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows disputed banner when status is disputed", () => {
    render(
      <OrderStatusTracker status="disputed" userRole="client" projectId={1} />,
    );
    expect(screen.getByText("Disputed")).toBeInTheDocument();
  });

  it("shows error toast on transition failure", async () => {
    mockTransitionProject.mockRejectedValue(new Error("fail"));
    render(
      <OrderStatusTracker status="agreed" userRole="admin" projectId={1} />,
    );
    fireEvent.click(screen.getByText("actionMarkPaid"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("error", "transitionError");
    });
  });
});
