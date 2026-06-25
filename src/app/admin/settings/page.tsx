"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { Card, CardBody, Field, Input, Button, Spinner } from "@/components/ui";
import { SETTINGS_KEYS } from "@/lib/constants";
import { currentSolarYear } from "@/lib/afghan-calendar";

const KEYS = Object.values(SETTINGS_KEYS);

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const values = useQuery(api.settings.getMany, { keys: KEYS });
  const setSetting = useMutation(api.settings.set);

  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (values) {
      setForm({
        organizationName: String(values[SETTINGS_KEYS.organizationName] ?? "Mohmand Unity Group"),
        defaultContributionAmount: String(values[SETTINGS_KEYS.defaultContributionAmount] ?? 500),
        currencySymbol: String(values[SETTINGS_KEYS.currencySymbol] ?? "AFN"),
        currentSolarYear: String(values[SETTINGS_KEYS.currentSolarYear] ?? currentSolarYear()),
      });
    }
  }, [values]);

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        setSetting({ key: SETTINGS_KEYS.organizationName, value: form.organizationName }),
        setSetting({
          key: SETTINGS_KEYS.defaultContributionAmount,
          value: Number(form.defaultContributionAmount) || 0,
        }),
        setSetting({ key: SETTINGS_KEYS.currencySymbol, value: form.currencySymbol }),
        setSetting({ key: SETTINGS_KEYS.currentSolarYear, value: Number(form.currentSolarYear) || 0 }),
      ]);
      toast.success(t("common.save"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader title={t("admin.settings")} description="Organisation-wide configuration." />
      {values === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardBody className="space-y-4">
            <Field label="Organization name">
              <Input
                value={form.organizationName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Default monthly amount" hint="Per married member">
                <Input
                  type="number"
                  value={form.defaultContributionAmount ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, defaultContributionAmount: e.target.value }))}
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={form.currencySymbol ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, currencySymbol: e.target.value }))}
                />
              </Field>
              <Field label="Current solar year">
                <Input
                  type="number"
                  value={form.currentSolarYear ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, currentSolarYear: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} loading={saving}>
                {t("common.save")}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
