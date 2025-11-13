"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Card, SectionTitle } from "@silvertrails/ui";
import { Loader2, RefreshCw, Plus } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useOrganisation } from "../../context/OrganisationContext";
import {
  listVouchers,
  createVoucher,
  updateVoucher,
  type Voucher,
  type VoucherCreatePayload,
  type VoucherUpdatePayload,
} from "../../services/points";
import { OrganisationRequiredCard } from "../../components/OrganisationRequiredCard";

type AlertState = { type: "success" | "error"; message: string } | null;

function VoucherForm({
  mode,
  submitting,
  initial,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  submitting: boolean;
  initial?: Voucher | null;
  onSubmit: (payload: VoucherCreatePayload | VoucherUpdatePayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [pointsCost, setPointsCost] = useState(
    initial?.points_cost !== undefined ? String(initial.points_cost) : ""
  );
  const [totalQuantity, setTotalQuantity] = useState(
    initial?.total_quantity !== null && initial?.total_quantity !== undefined
      ? String(initial.total_quantity)
      : ""
  );
  const [status, setStatus] = useState<Voucher["status"]>(
    initial?.status ?? "active"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "create") {
      setCode("");
      setStatus("active");
    } else if (initial) {
      setCode(initial.code);
      setStatus(initial.status);
    }
    setName(initial?.name ?? "");
    setPointsCost(
      initial?.points_cost !== undefined ? String(initial.points_cost) : ""
    );
    setTotalQuantity(
      initial?.total_quantity !== null && initial?.total_quantity !== undefined
        ? String(initial.total_quantity)
        : ""
    );
    setError(null);
  }, [initial, mode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    const pointsValue = Number(pointsCost);
    const quantityValue =
      totalQuantity.trim() === "" ? null : Number(totalQuantity);

    if (!trimmedName || !Number.isFinite(pointsValue) || pointsValue < 0) {
      setError("Provide a reward name and a point cost of 0 or greater.");
      return;
    }
    if (mode === "create" && !trimmedCode) {
      setError("Reward code is required.");
      return;
    }
    if (
      quantityValue !== null &&
      (!Number.isFinite(quantityValue) || quantityValue <= 0)
    ) {
      setError("Quantity must be a positive number or left blank.");
      return;
    }

    if (mode === "create") {
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        points_cost: pointsValue,
        total_quantity: quantityValue,
      });
    } else {
      await onSubmit({
        name: trimmedName,
        points_cost: pointsValue,
        total_quantity: quantityValue,
        status,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      {mode === "create" ? (
        <label className="flex flex-col text-sm text-gray-600">
          Code
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 uppercase"
            placeholder="E.g. GROCERY10"
          />
        </label>
      ) : null}
      <label className="flex flex-col text-sm text-gray-600">
        Name
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
          placeholder="Reward name"
        />
      </label>
      <label className="flex flex-col text-sm text-gray-600">
        Points cost
        <input
          type="number"
          min={0}
          value={pointsCost}
          onChange={(event) => setPointsCost(event.target.value)}
          className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </label>
      <label className="flex flex-col text-sm text-gray-600">
        Total quantity (optional)
        <input
          type="number"
          min={1}
          value={totalQuantity}
          onChange={(event) => setTotalQuantity(event.target.value)}
          className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
          placeholder="Leave blank for unlimited"
        />
      </label>
      {mode === "edit" ? (
        <label className="flex flex-col text-sm text-gray-600">
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Voucher["status"])
            }
            className="mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
      ) : null}
      {error ? (
        <p className="md:col-span-4 text-sm text-rose-600">{error}</p>
      ) : null}
      <div className="md:col-span-4 flex justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving
            </span>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function RewardsPage() {
  const { tokens, user } = useAuth();
  const accessToken = tokens?.access_token ?? null;
  const organiserOrgIds = user?.org_ids ?? [];
  const { organisationId: selectedOrgId, activeOrganisation } = useOrganisation();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    open: boolean;
    voucher: Voucher | null;
  }>({
    mode: "create",
    open: false,
    voucher: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = useCallback(async () => {
    if (!accessToken || !selectedOrgId) {
      setVouchers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listVouchers({ accessToken, orgId: selectedOrgId });
      setVouchers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load rewards for this organisation."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedOrgId]);

  useEffect(() => {
    void fetchVouchers();
  }, [fetchVouchers]);

  const handleCreate = useCallback(
    async (payload: VoucherCreatePayload) => {
      if (!accessToken || !selectedOrgId) {
        return;
      }
      setSubmitting(true);
      try {
        await createVoucher({
          accessToken,
          orgId: selectedOrgId,
          payload,
        });
        setAlert({
          type: "success",
          message: `Voucher "${payload.name}" created successfully.`,
        });
        setEditor({ mode: "create", open: false, voucher: null });
        await fetchVouchers();
      } catch (err) {
        setAlert({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unable to create voucher right now.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [accessToken, selectedOrgId, fetchVouchers]
  );

  const handleUpdate = useCallback(
    async (voucherId: string, payload: VoucherUpdatePayload) => {
      if (!accessToken) {
        return;
      }
      setSubmitting(true);
      try {
        await updateVoucher({ accessToken, voucherId, payload });
        setAlert({
          type: "success",
          message: "Voucher updated successfully.",
        });
        setEditor({ mode: "create", open: false, voucher: null });
        await fetchVouchers();
      } catch (err) {
        setAlert({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unable to update voucher right now.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [accessToken, fetchVouchers]
  );

  if (!accessToken) {
    return (
      <div className="p-4">
        <Card className="p-6 text-center text-gray-600">
          Sign in again to manage rewards.
        </Card>
      </div>
    );
  }

  if (organiserOrgIds.length === 0) {
    return <OrganisationRequiredCard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rewards</h1>
          <p className="text-sm text-gray-600">
            Create vouchers seniors can redeem with their points.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <p className="text-sm text-gray-600">
            {activeOrganisation
              ? `Organisation: ${activeOrganisation.name}`
              : "Select an organisation from the header to manage rewards."}
          </p>
          <Button
            variant="ghost"
            className="flex items-center gap-2 self-start sm:self-auto"
            onClick={() => void fetchVouchers()}
            disabled={loading || !selectedOrgId}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {alert ? (
        <Card
          className={`p-4 text-sm ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {alert.message}
        </Card>
      ) : null}

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="Reward catalogue" />
          <Button
            className="flex items-center gap-2"
            onClick={() =>
              setEditor((prev) => ({
                mode: "create",
                open: !prev.open || prev.mode !== "create",
                voucher: null,
              }))
            }
          >
            <Plus className="w-4 h-4" />
            {editor.open && editor.mode === "create"
              ? "Close form"
              : "New reward"}
          </Button>
        </div>
        {editor.open ? (
          <VoucherForm
            mode={editor.mode}
            submitting={submitting}
            initial={editor.voucher}
            onSubmit={(payload) =>
              editor.mode === "create"
                ? handleCreate(payload as VoucherCreatePayload)
                : handleUpdate(editor.voucher!.id, payload)
            }
            onCancel={() =>
              setEditor({ mode: "create", open: false, voucher: null })
            }
          />
        ) : null}

        {loading && vouchers.length === 0 ? (
          <Card className="p-4 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
            Loading rewards…
          </Card>
        ) : error ? (
          <Card className="p-4 border border-rose-200 bg-rose-50 text-rose-700">
            {error}
          </Card>
        ) : vouchers.length === 0 ? (
          <Card className="p-4 text-sm text-gray-600">
            No rewards configured yet. Create one to let seniors redeem their
            points.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((voucher) => {
              const exhausted =
                voucher.total_quantity !== null &&
                voucher.redeemed_count >= voucher.total_quantity;
              return (
                <Card
                  key={voucher.id}
                  className="p-4 border border-gray-200 bg-white flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        {voucher.code}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {voucher.name}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        voucher.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {voucher.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {voucher.points_cost === 0 ? (
                      <span className="font-semibold text-emerald-600">
                        Free reward
                      </span>
                    ) : (
                      <>
                        Costs{" "}
                        <span className="font-semibold">
                          {voucher.points_cost.toLocaleString()} pts
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    Remaining:{" "}
                    <span className="font-medium">
                      {voucher.total_quantity === null
                        ? "Unlimited"
                        : `${Math.max(
                            voucher.total_quantity - voucher.redeemed_count,
                            0
                          )} of ${voucher.total_quantity}`}
                    </span>
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setEditor({
                          mode: "edit",
                          open: true,
                          voucher,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        void handleUpdate(voucher.id, {
                          status:
                            voucher.status === "active"
                              ? "disabled"
                              : "active",
                        })
                      }
                    >
                      {voucher.status === "active" ? "Disable" : "Activate"}
                    </Button>
                  </div>
                  {exhausted ? (
                    <p className="text-xs text-amber-600">
                      Reward is fully redeemed.
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
